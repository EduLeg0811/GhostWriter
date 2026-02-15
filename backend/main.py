from __future__ import annotations

import json
import os
import re
import subprocess
import time
import uuid
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import quote
import zipfile

import jwt
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse, Response
from pydantic import BaseModel

load_dotenv()

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "server-data"
UPLOADS_DIR = DATA_DIR / "uploads"
META_DIR = DATA_DIR / "meta"
PYTHON_DIR = Path(__file__).resolve().parent / "python"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
META_DIR.mkdir(parents=True, exist_ok=True)

PORT = int(os.getenv("SERVER_PORT", "8787"))
backend_onlyoffice_url = (os.getenv("BACKEND_ONLYOFFICE_URL") or os.getenv("BACKEND_PUBLIC_URL") or f"http://host.docker.internal:{PORT}").rstrip("/")
backend_browser_url = (os.getenv("BACKEND_BROWSER_URL") or f"http://localhost:{PORT}").rstrip("/")
plugin_public_url = (os.getenv("ONLYOFFICE_PLUGIN_PUBLIC_URL") or backend_browser_url).rstrip("/")
onlyoffice_server_url = (os.getenv("ONLYOFFICE_DOCUMENT_SERVER_URL") or "").rstrip("/")
onlyoffice_jwt_secret = (os.getenv("ONLYOFFICE_JWT_SECRET") or "").strip()
openai_api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
pdf2docx_python_cmd = (os.getenv("PDF2DOCX_PYTHON_CMD") or "python").strip()
backend_python_cmd = (os.getenv("BACKEND_PYTHON_CMD") or pdf2docx_python_cmd or "python").strip()
PLUGIN_GUID = "asc.{D9F53D71-CA6A-4A77-8BE0-0DA9675B5C16}"


class VectorSearchRequest(BaseModel):
    vectorStoreId: str
    query: str
    maxNumResults: int = 5


class ChatRequest(BaseModel):
    messages: list[dict[str, Any]]
    model: str = "gpt-4.1-mini"
    temperature: float = 0.7


class InsertRefBookRequest(BaseModel):
    book: str


class InsertRefVerbeteRequest(BaseModel):
    titles: str


class HighlightRequest(BaseModel):
    term: str


class CreateBlankFileRequest(BaseModel):
    title: str = "novo-documento.docx"


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def meta_path_for(file_id: str) -> Path:
    return META_DIR / f"{file_id}.json"


def read_meta(file_id: str) -> dict[str, Any]:
    p = meta_path_for(file_id)
    if not p.exists():
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado.")
    return json.loads(p.read_text(encoding="utf-8"))


def write_meta(file_id: str, meta: dict[str, Any]) -> None:
    meta_path_for(file_id).write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


def require_openai_key() -> None:
    if not openai_api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY nao configurada no servidor.")


def decode_xml_text(text: str) -> str:
    return text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")\
        .replace("&quot;", '"').replace("&apos;", "'")


def ensure_run_highlight(run_xml: str, color: str = "yellow") -> str:
    highlight_tag = f'<w:highlight w:val="{color}"/>'
    if re.search(r"<w:highlight\b[^>]*/>", run_xml):
        return run_xml
    if "<w:rPr>" in run_xml:
        return run_xml.replace("<w:rPr>", f"<w:rPr>{highlight_tag}", 1)
    return re.sub(r"<w:r(\s[^>]*)?>", lambda m: f"{m.group(0)}<w:rPr>{highlight_tag}</w:rPr>", run_xml, count=1)


def run_pdf_to_docx(pdf_path: Path, docx_path: Path) -> None:
    py_code = "\n".join([
        "import sys",
        "from pdf2docx import Converter",
        "pdf_path = sys.argv[1]",
        "docx_path = sys.argv[2]",
        "cv = Converter(pdf_path)",
        "try:",
        "    cv.convert(docx_path)",
        "finally:",
        "    cv.close()",
    ])
    proc = subprocess.run([pdf2docx_python_cmd, "-c", py_code, str(pdf_path), str(docx_path)], capture_output=True, text=True)
    if proc.returncode != 0:
        details = proc.stderr.strip() or f"processo finalizado com codigo {proc.returncode}"
        raise RuntimeError(f"Falha na conversao PDF->DOCX: {details}")


def run_python_json_script(script_path: Path, args: list[str]) -> dict[str, Any]:
    proc = subprocess.run([backend_python_cmd, str(script_path), *args], capture_output=True, text=True)
    if proc.returncode != 0:
        details = proc.stderr.strip() or proc.stdout.strip() or f"processo finalizado com codigo {proc.returncode}"
        raise RuntimeError(f"Falha na execucao Python: {details}")
    return json.loads(proc.stdout)


def create_blank_docx_bytes() -> bytes:
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>"""
    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>"""
    document = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p/>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>"""
    core = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Novo Documento</dc:title>
  <dc:creator>Parapreceptor</dc:creator>
</cp:coreProperties>"""
    app = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Parapreceptor</Application>
</Properties>"""

    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types)
        zf.writestr("_rels/.rels", rels)
        zf.writestr("word/document.xml", document)
        zf.writestr("docProps/core.xml", core)
        zf.writestr("docProps/app.xml", app)
    return buffer.getvalue()


def extract_text_from_docx(path: Path) -> str:
    import zipfile

    with zipfile.ZipFile(path, "r") as zf:
        if "word/document.xml" not in zf.namelist():
            return ""
        xml = zf.read("word/document.xml").decode("utf-8", errors="ignore")
    text = re.sub(r"<w:tab\b[^>]*/>", "\t", xml)
    text = re.sub(r"<w:br\b[^>]*/>", "\n", text)
    text = re.sub(r"</w:p>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    return decode_xml_text(text)


def highlight_term_in_docx(docx_path: Path, term: str, color: str = "yellow") -> tuple[bool, int]:
    import zipfile

    term_regex = re.compile(re.escape(term), re.IGNORECASE)
    matches = 0

    with zipfile.ZipFile(docx_path, "r") as zin:
        files = {name: zin.read(name) for name in zin.namelist()}

    xml = files["word/document.xml"].decode("utf-8", errors="ignore")

    def repl_run(m: re.Match[str]) -> str:
        nonlocal matches
        run_xml = m.group(0)
        text_nodes = re.findall(r"<w:t\b[^>]*>([\s\S]*?)</w:t>", run_xml)
        run_has_match = False
        for node in text_nodes:
            found = term_regex.findall(decode_xml_text(node or ""))
            if found:
                matches += len(found)
                run_has_match = True
        return ensure_run_highlight(run_xml, color) if run_has_match else run_xml

    xml = re.sub(r"<w:r\b[\s\S]*?</w:r>", repl_run, xml)
    files["word/document.xml"] = xml.encode("utf-8")

    with zipfile.ZipFile(docx_path, "w") as zout:
        for name, content in files.items():
            zout.writestr(name, content)

    return True, matches


@app.get("/onlyoffice-plugin/config.json")
def onlyoffice_plugin_config() -> dict[str, Any]:
    base_url = f"{plugin_public_url}/onlyoffice-plugin/"
    return {"name": "Parapreceptor Bridge", "guid": PLUGIN_GUID, "baseUrl": base_url, "variations": [{"description": "Bridge", "url": "plugin.html", "icons": [], "isViewer": False, "EditorsSupport": ["word"], "isVisual": False, "isModal": False, "isInsideMode": False, "initDataType": "none", "initData": ""}]}


@app.get("/onlyoffice-plugin/plugin.html")
def onlyoffice_plugin_html() -> HTMLResponse:
    html = f"""<!doctype html><html><head><meta charset=\"utf-8\" /><title>Parapreceptor Bridge</title><script src=\"{onlyoffice_server_url}/sdkjs-plugins/v1/plugins.js\"></script></head><body><script src=\"{plugin_public_url}/onlyoffice-plugin/plugin.js\"></script></body></html>"""
    return HTMLResponse(content=html)


@app.get("/onlyoffice-plugin/plugin.js")
def onlyoffice_plugin_js() -> Response:
    js = (ROOT_DIR / "server" / "plugin.template.js").read_text(encoding="utf-8") if (ROOT_DIR / "server" / "plugin.template.js").exists() else "(function(){})();"
    return Response(content=js, media_type="application/javascript; charset=utf-8")


@app.get("/onlyoffice-plugin/translations/langs.json")
def onlyoffice_langs() -> list[str]:
    return ["pt-BR", "en"]


@app.get("/onlyoffice-plugin/translations/pt-BR.json")
def onlyoffice_pt() -> dict[str, Any]:
    return {}


@app.get("/onlyoffice-plugin/translations/en.json")
def onlyoffice_en() -> dict[str, Any]:
    return {}


@app.get("/api/health")
def api_health() -> dict[str, Any]:
    return {"ok": True, "onlyofficeConfigured": bool(onlyoffice_server_url), "openaiConfigured": bool(openai_api_key)}


@app.post("/api/macros/insert-ref-book")
def api_insert_ref_book(payload: InsertRefBookRequest) -> dict[str, Any]:
    book = payload.book.strip()
    if not book:
        raise HTTPException(status_code=400, detail="Parametro 'book' e obrigatorio.")
    script_path = PYTHON_DIR / "insert_ref_book.py"
    result = run_python_json_script(script_path, [book])
    if not result.get("ok"):
        raise HTTPException(status_code=500, detail=result.get("error") or "Falha ao executar macro1 no Python.")
    return result


@app.post("/api/apps/insert-ref-verbete")
def api_insert_ref_verbete(payload: InsertRefVerbeteRequest) -> dict[str, Any]:
    titles = payload.titles.strip()
    if not titles:
        raise HTTPException(status_code=400, detail="Parametro 'titles' e obrigatorio.")
    script_path = PYTHON_DIR / "insert_ref_verbete.py"
    result = run_python_json_script(script_path, [titles])
    if not result.get("ok"):
        raise HTTPException(status_code=500, detail=result.get("error") or "Falha ao executar App2 no Python.")
    return result


@app.post("/api/files/upload")
async def api_files_upload(file: UploadFile = File(...)) -> dict[str, Any]:
    file_id = str(uuid.uuid4())
    ext = Path(file.filename or "").suffix.lower().replace(".", "")
    stored_name = f"{file_id}.{ext}" if ext else file_id
    full_path = UPLOADS_DIR / stored_name
    content = await file.read()
    full_path.write_bytes(content)

    metadata: dict[str, Any] = {"id": file_id, "originalName": file.filename, "storedName": stored_name, "mimeType": file.content_type or "application/octet-stream", "size": len(content), "ext": ext, "createdAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())}

    if ext == "pdf":
        converted_name = f"{file_id}.docx"
        converted_path = UPLOADS_DIR / converted_name
        try:
            run_pdf_to_docx(full_path, converted_path)
            metadata.update({"originalName": f"{Path(file.filename or 'document').stem}.docx", "storedName": converted_name, "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "size": converted_path.stat().st_size, "ext": "docx", "convertedFromPdf": True, "sourceExt": "pdf", "sourceStoredName": stored_name})
        except Exception as exc:
            metadata.update({"convertedFromPdf": False, "sourceExt": "pdf", "conversionError": str(exc)})

    write_meta(file_id, metadata)
    return metadata


@app.post("/api/files/create-blank")
def api_files_create_blank(payload: CreateBlankFileRequest) -> dict[str, Any]:
    file_id = str(uuid.uuid4())
    stored_name = f"{file_id}.docx"
    full_path = UPLOADS_DIR / stored_name
    docx_bytes = create_blank_docx_bytes()
    full_path.write_bytes(docx_bytes)

    title = (payload.title or "").strip() or "novo-documento.docx"
    if not title.lower().endswith(".docx"):
        title = f"{title}.docx"

    metadata: dict[str, Any] = {
        "id": file_id,
        "originalName": title,
        "storedName": stored_name,
        "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "size": len(docx_bytes),
        "ext": "docx",
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
        "createdBlank": True,
    }

    write_meta(file_id, metadata)
    return metadata


@app.get("/api/files/{file_id}/content")
def api_file_content(file_id: str) -> Response:
    meta = read_meta(file_id)
    full_path = UPLOADS_DIR / meta["storedName"]
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado.")
    headers = {"Content-Disposition": f"inline; filename=\"{quote(meta.get('originalName') or '')}\""}
    return Response(content=full_path.read_bytes(), media_type=meta.get("mimeType") or "application/octet-stream", headers=headers)


@app.get("/api/files/{file_id}/text")
def api_file_text(file_id: str) -> JSONResponse:
    meta = read_meta(file_id)
    full_path = UPLOADS_DIR / meta["storedName"]
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado.")
    ext = (meta.get("ext") or "").lower()
    text = full_path.read_text(encoding="utf-8", errors="ignore") if ext in {"txt", "md"} else (extract_text_from_docx(full_path) if ext == "docx" else "")
    return JSONResponse(content={"id": meta["id"], "ext": meta.get("ext", ""), "text": text, "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())}, headers={"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate", "Pragma": "no-cache", "Expires": "0"})


@app.post("/api/files/{file_id}/highlight")
def api_file_highlight(file_id: str, payload: HighlightRequest) -> dict[str, Any]:
    meta = read_meta(file_id)
    if (meta.get("ext") or "").lower() != "docx":
        raise HTTPException(status_code=400, detail="Highlight suportado apenas para DOCX.")
    term = payload.term.strip()
    if not term:
        raise HTTPException(status_code=400, detail="Termo obrigatorio.")
    full_path = UPLOADS_DIR / meta["storedName"]
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado.")
    updated, matches = highlight_term_in_docx(full_path, term, "yellow")
    return {"ok": True, "updated": updated, "matches": matches, "term": term, "color": "yellow"}


@app.get("/api/onlyoffice/config/{file_id}")
def api_onlyoffice_config(file_id: str) -> dict[str, Any]:
    if not onlyoffice_server_url:
        raise HTTPException(status_code=500, detail="ONLYOFFICE_DOCUMENT_SERVER_URL nao configurada.")
    meta = read_meta(file_id)
    document_url = f"{backend_onlyoffice_url}/api/files/{meta['id']}/content"
    callback_url = f"{backend_onlyoffice_url}/api/onlyoffice/callback/{meta['id']}"
    config = {"documentType": "word", "document": {"title": meta.get("originalName"), "url": document_url, "fileType": meta.get("ext") or "docx", "key": f"{meta['id']}-{int(time.time() * 1000)}"}, "editorConfig": {"mode": "edit", "lang": "pt-BR", "callbackUrl": callback_url, "customization": {"autosave": True, "forcesave": True}, "plugins": {"autostart": [PLUGIN_GUID], "pluginsData": [f"{plugin_public_url}/onlyoffice-plugin/config.json"]}}}
    meta["lastDocumentKey"] = config["document"]["key"]
    write_meta(meta["id"], meta)
    token = jwt.encode(config, onlyoffice_jwt_secret, algorithm="HS256") if onlyoffice_jwt_secret else ""
    return {"documentServerUrl": onlyoffice_server_url, "config": config, "token": token, "file": meta}


@app.post("/api/onlyoffice/forcesave/{file_id}")
def api_onlyoffice_forcesave(file_id: str) -> dict[str, Any]:
    if not onlyoffice_server_url:
        raise HTTPException(status_code=500, detail="ONLYOFFICE_DOCUMENT_SERVER_URL nao configurada.")
    meta = read_meta(file_id)
    key = str(meta.get("lastDocumentKey") or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="Documento sem key ativa para force-save.")
    command: dict[str, Any] = {"c": "forcesave", "key": key}
    headers = {"Content-Type": "application/json"}
    payload: dict[str, Any] = dict(command)
    if onlyoffice_jwt_secret:
        command_token = jwt.encode(command, onlyoffice_jwt_secret, algorithm="HS256")
        headers["Authorization"] = f"Bearer {command_token}"
        payload = {**command, "token": command_token}
    upstream = requests.post(f"{onlyoffice_server_url}/coauthoring/CommandService.ashx", headers=headers, json=payload, timeout=30)
    if not upstream.ok:
        raise HTTPException(status_code=upstream.status_code, detail=f"Force-save HTTP {upstream.status_code}: {upstream.text}")
    try:
        data = upstream.json()
    except Exception:
        data = {"raw": upstream.text}
    return {"ok": True, "response": data}


@app.post("/api/onlyoffice/callback/{file_id}")
def api_onlyoffice_callback(file_id: str, body: dict[str, Any]) -> dict[str, Any]:
    status = int(body.get("status") or 0)
    if status not in {2, 3, 6, 7} or not body.get("url"):
        return {"error": 0}
    meta = read_meta(file_id)
    full_path = UPLOADS_DIR / meta["storedName"]
    response = requests.get(body["url"], timeout=60)
    if not response.ok:
        return {"error": 1, "message": "Falha ao baixar arquivo atualizado."}
    full_path.write_bytes(response.content)
    meta["lastSavedAt"] = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
    write_meta(meta["id"], meta)
    return {"error": 0}


@app.post("/api/ai/chat")
def api_ai_chat(payload: ChatRequest) -> dict[str, Any]:
    require_openai_key()
    if not payload.messages:
        raise HTTPException(status_code=400, detail="messages invalido.")
    upstream = requests.post("https://api.openai.com/v1/chat/completions", headers={"Content-Type": "application/json", "Authorization": f"Bearer {openai_api_key}"}, json={"model": payload.model, "messages": payload.messages, "temperature": payload.temperature}, timeout=60)
    if not upstream.ok:
        raise HTTPException(status_code=upstream.status_code, detail=upstream.text)
    data = upstream.json()
    return {"content": (data.get("choices") or [{}])[0].get("message", {}).get("content", "")}


@app.post("/api/ai/vector-search")
def api_ai_vector_search(payload: VectorSearchRequest) -> dict[str, Any]:
    require_openai_key()
    if not payload.vectorStoreId or not payload.query:
        raise HTTPException(status_code=400, detail="vectorStoreId e query sao obrigatorios.")
    upstream = requests.post(f"https://api.openai.com/v1/vector_stores/{payload.vectorStoreId}/search", headers={"Content-Type": "application/json", "Authorization": f"Bearer {openai_api_key}", "OpenAI-Beta": "assistants=v2"}, json={"query": payload.query, "max_num_results": payload.maxNumResults}, timeout=60)
    if not upstream.ok:
        raise HTTPException(status_code=upstream.status_code, detail=upstream.text)
    data = upstream.json()
    chunks = []
    for item in data.get("data", []):
        text = "\n".join((c.get("text") or "") for c in item.get("content", []))
        if text:
            chunks.append(text)
    return {"chunks": chunks}


@app.get("/")
def root() -> PlainTextResponse:
    return PlainTextResponse("Parapreceptor FastAPI backend")
