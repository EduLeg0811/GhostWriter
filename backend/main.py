from __future__ import annotations

import json
import os
import re
import subprocess
import time
import uuid
import xml.etree.ElementTree as ET
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import quote
import zipfile

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, Response
from pydantic import BaseModel

load_dotenv()

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "server-data"
UPLOADS_DIR = DATA_DIR / "uploads"
META_DIR = DATA_DIR / "meta"
PYTHON_DIR = Path(__file__).resolve().parent / "python"


def resolve_biblio_file(filename: str) -> Path:
    preferred = ROOT_DIR / "backend" / "Files" / "Biblio" / filename
    if preferred.exists():
        return preferred
    return ROOT_DIR / "backend" / "Files" / filename

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
META_DIR.mkdir(parents=True, exist_ok=True)

PORT = int(os.getenv("PORT") or os.getenv("SERVER_PORT", "8787"))
openai_api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
pdf2docx_python_cmd = (os.getenv("PDF2DOCX_PYTHON_CMD") or "python").strip()
backend_python_cmd = (os.getenv("BACKEND_PYTHON_CMD") or pdf2docx_python_cmd or "python").strip()
file_retention_hours = int(os.getenv("FILE_RETENTION_HOURS") or "24")
file_retention_seconds = max(1, file_retention_hours) * 3600
LETTER_CLASS = "A-Za-zÀ-ÖØ-öø-ÿ"
KEEP_WORD_HYPHEN_PREFIXES = {
    "além",
    "ante",
    "anti",
    "arqui",
    "auto",
    "bem",
    "co",
    "contra",
    "ex",
    "extra",
    "hiper",
    "infra",
    "inter",
    "intra",
    "macro",
    "micro",
    "mini",
    "multi",
    "neo",
    "pós",
    "pre",
    "pró",
    "proto",
    "pseudo",
    "recém",
    "semi",
    "sobre",
    "sub",
    "super",
    "supra",
    "tele",
    "ultra",
    "vice",
}
INLINE_HYPHENATED_WORD_RE = re.compile(rf"\b([{LETTER_CLASS}]{{2,}})-([{LETTER_CLASS}]{{2,}})\b")
TRAILING_HYPHEN_FRAGMENT_RE = re.compile(rf"([{LETTER_CLASS}]{{2,}})-$")
LEADING_WORD_FRAGMENT_RE = re.compile(rf"^([{LETTER_CLASS}]{{2,}})")
RULE_ONLY_TEXT_RE = re.compile(r"^[\s\-\_=~\.·•]{8,}$")
VML_WIDTH_STYLE_RE = re.compile(r"(\bwidth:)([0-9]+(?:\.[0-9]+)?)(pt\b)")
NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS_WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main"
DOCX_XML_NAMESPACES = {
    "w": NS_W,
    "wp": NS_WP,
    "a": NS_A,
}
for prefix, namespace in DOCX_XML_NAMESPACES.items():
    ET.register_namespace(prefix, namespace)


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


class BiblioGeralRequest(BaseModel):
    author: str = ""
    title: str = ""
    year: str = ""
    extra: str = ""
    topK: int = 10


class BiblioExternaRequest(BaseModel):
    query: str = ""
    author: str = ""
    title: str = ""
    year: str = ""
    journal: str = ""
    publisher: str = ""
    identifier: str = ""
    extra: str = ""
    topK: int = 5


class LexicalSearchRequest(BaseModel):
    book: str
    term: str
    limit: int = 50


class LexicalVerbeteSearchRequest(BaseModel):
    author: str = ""
    title: str = ""
    area: str = ""
    text: str = ""
    limit: int = 50


class HighlightRequest(BaseModel):
    term: str


class CreateBlankFileRequest(BaseModel):
    title: str = "novo-documento.docx"


class SaveFileTextRequest(BaseModel):
    text: str = ""
    html: str = ""


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_gc() -> None:
    run_storage_gc()


def meta_path_for(file_id: str) -> Path:
    return META_DIR / f"{file_id}.json"


def read_meta(file_id: str) -> dict[str, Any]:
    p = meta_path_for(file_id)
    if not p.exists():
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado.")
    return json.loads(p.read_text(encoding="utf-8"))


def write_meta(file_id: str, meta: dict[str, Any]) -> None:
    meta_path_for(file_id).write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


def safe_unlink(path: Path) -> None:
    try:
        if path.exists():
            path.unlink()
    except OSError:
        pass


def run_storage_gc(retention_seconds: int = file_retention_seconds) -> None:
    now = time.time()
    referenced_uploads: set[str] = set()

    for meta_file in META_DIR.glob("*.json"):
        expired = False
        try:
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
        except Exception:
            meta = {}
            expired = True

        if not expired and (now - meta_file.stat().st_mtime) > retention_seconds:
            expired = True

        stored_name = str(meta.get("storedName") or "").strip()
        source_stored_name = str(meta.get("sourceStoredName") or "").strip()

        if expired:
            if stored_name:
                safe_unlink(UPLOADS_DIR / stored_name)
            if source_stored_name:
                safe_unlink(UPLOADS_DIR / source_stored_name)
            safe_unlink(meta_file)
            continue

        if stored_name:
            referenced_uploads.add(stored_name)
        if source_stored_name:
            referenced_uploads.add(source_stored_name)

    for upload_file in UPLOADS_DIR.glob("*"):
        if upload_file.name in referenced_uploads:
            continue
        if (now - upload_file.stat().st_mtime) > retention_seconds:
            safe_unlink(upload_file)


def require_openai_key() -> None:
    if not openai_api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY nao configurada no servidor.")


def decode_xml_text(text: str) -> str:
    return text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")\
        .replace("&quot;", '"').replace("&apos;", "'")


def encode_xml_text(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")\
        .replace('"', "&quot;").replace("'", "&apos;")


def ensure_run_highlight(run_xml: str, color: str = "yellow") -> str:
    highlight_tag = f'<w:highlight w:val="{color}"/>'
    if re.search(r"<w:highlight\b[^>]*/>", run_xml):
        return run_xml
    if "<w:rPr>" in run_xml:
        return run_xml.replace("<w:rPr>", f"<w:rPr>{highlight_tag}", 1)
    return re.sub(r"<w:r(\s[^>]*)?>", lambda m: f"{m.group(0)}<w:rPr>{highlight_tag}</w:rPr>", run_xml, count=1)


def should_merge_syllable_hyphen(left_fragment: str, right_fragment: str) -> bool:
    left = left_fragment.lower()
    right = right_fragment.lower()
    if left in KEEP_WORD_HYPHEN_PREFIXES:
        return False
    if len(right) <= 2:
        return False
    return True


def normalize_inline_hyphenation(text: str) -> tuple[str, int]:
    changes = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal changes
        left_fragment, right_fragment = match.group(1), match.group(2)
        if not should_merge_syllable_hyphen(left_fragment, right_fragment):
            return match.group(0)
        changes += 1
        return f"{left_fragment}{right_fragment}"

    return INLINE_HYPHENATED_WORD_RE.sub(repl, text), changes


def normalize_rule_like_paragraphs(xml_root: ET.Element) -> int:
    removed = 0
    paragraph_tag = f"{{{NS_W}}}p"
    for parent in xml_root.iter():
        for node in list(parent):
            if node.tag != paragraph_tag:
                continue
            paragraph_text = "".join((t.text or "") for t in node.findall(".//w:t", DOCX_XML_NAMESPACES)).strip()
            if paragraph_text and RULE_ONLY_TEXT_RE.fullmatch(paragraph_text):
                parent.remove(node)
                removed += 1
    return removed


def normalize_cross_run_hyphenation(xml_root: ET.Element) -> int:
    fixes = 0
    for paragraph in xml_root.findall(".//w:p", DOCX_XML_NAMESPACES):
        text_nodes = paragraph.findall(".//w:t", DOCX_XML_NAMESPACES)
        if len(text_nodes) < 2:
            continue
        for index in range(len(text_nodes) - 1):
            current_node = text_nodes[index]
            next_node = text_nodes[index + 1]
            current_text = current_node.text or ""
            next_text = next_node.text or ""
            if not current_text.endswith("-") or not next_text:
                continue
            if not next_text[0].isalpha() or not next_text[0].islower():
                continue
            left_match = TRAILING_HYPHEN_FRAGMENT_RE.search(current_text)
            right_match = LEADING_WORD_FRAGMENT_RE.match(next_text)
            if not left_match or not right_match:
                continue
            left_fragment = left_match.group(1)
            right_fragment = right_match.group(1)
            if not should_merge_syllable_hyphen(left_fragment, right_fragment):
                continue
            current_node.text = current_text[:-1]
            fixes += 1
    return fixes


def get_max_content_width_twips(document_root: ET.Element) -> int:
    section = document_root.find(".//w:body/w:sectPr", DOCX_XML_NAMESPACES)
    if section is None:
        section = document_root.find(".//w:sectPr", DOCX_XML_NAMESPACES)
    default_width_twips = 9360
    if section is None:
        return default_width_twips

    page_size = section.find("w:pgSz", DOCX_XML_NAMESPACES)
    page_margin = section.find("w:pgMar", DOCX_XML_NAMESPACES)
    page_width = int(page_size.attrib.get(f"{{{NS_W}}}w", "12240")) if page_size is not None else 12240
    margin_left = int(page_margin.attrib.get(f"{{{NS_W}}}left", "1440")) if page_margin is not None else 1440
    margin_right = int(page_margin.attrib.get(f"{{{NS_W}}}right", "1440")) if page_margin is not None else 1440
    return max(3600, page_width - margin_left - margin_right)


def parse_docx_numeric(raw_value: str | None) -> int | None:
    if raw_value is None:
        return None
    text = raw_value.strip()
    if not text:
        return None
    try:
        return int(round(float(text)))
    except ValueError:
        return None


def clamp_table_grid_columns(table_node: ET.Element, max_content_width_twips: int) -> int:
    grid = table_node.find("w:tblGrid", DOCX_XML_NAMESPACES)
    if grid is None:
        return 0
    columns = grid.findall("w:gridCol", DOCX_XML_NAMESPACES)
    if not columns:
        return 0

    parsed_widths: list[int] = []
    for col in columns:
        width = parse_docx_numeric(col.attrib.get(f"{{{NS_W}}}w"))
        parsed_widths.append(width if width is not None and width > 0 else 1)

    total_width = sum(parsed_widths)
    if total_width <= 0:
        return 0

    scale = max_content_width_twips / total_width
    updated = [max(1, int(round(width * scale))) for width in parsed_widths]
    diff = max_content_width_twips - sum(updated)
    if updated:
        updated[-1] = max(1, updated[-1] + diff)

    changes = 0
    for col, width in zip(columns, updated):
        old_raw = col.attrib.get(f"{{{NS_W}}}w")
        old_value = parse_docx_numeric(old_raw)
        if old_value != width:
            col.attrib[f"{{{NS_W}}}w"] = str(width)
            changes += 1
    return changes


def clamp_table_cell_widths(table_node: ET.Element, max_content_width_twips: int) -> int:
    cells = table_node.findall(".//w:tcPr/w:tcW", DOCX_XML_NAMESPACES)
    if not cells:
        return 0
    parsed_cells: list[tuple[ET.Element, int]] = []
    for cell in cells:
        width_type = cell.attrib.get(f"{{{NS_W}}}type", "")
        if width_type not in {"dxa", "", "nil"}:
            continue
        width_value = parse_docx_numeric(cell.attrib.get(f"{{{NS_W}}}w"))
        if width_value is None:
            continue
        parsed_cells.append((cell, max(1, width_value)))

    if not parsed_cells:
        return 0

    total_width = sum(width for _, width in parsed_cells)
    if total_width <= 0:
        return 0

    scale = max_content_width_twips / total_width
    updated = [max(1, int(round(width * scale))) for _, width in parsed_cells]
    diff = max_content_width_twips - sum(updated)
    updated[-1] = max(1, updated[-1] + diff)

    changes = 0
    for (cell, _), width in zip(parsed_cells, updated):
        old_value = parse_docx_numeric(cell.attrib.get(f"{{{NS_W}}}w"))
        if old_value != width:
            cell.attrib[f"{{{NS_W}}}w"] = str(width)
            cell.attrib[f"{{{NS_W}}}type"] = "dxa"
            changes += 1
    return changes


def force_table_width_to_page(table_node: ET.Element, max_content_width_twips: int) -> int:
    tbl_pr = table_node.find("w:tblPr", DOCX_XML_NAMESPACES)
    if tbl_pr is None:
        tbl_pr = ET.SubElement(table_node, f"{{{NS_W}}}tblPr")

    changes = 0

    tbl_width = tbl_pr.find("w:tblW", DOCX_XML_NAMESPACES)
    if tbl_width is None:
        tbl_width = ET.SubElement(tbl_pr, f"{{{NS_W}}}tblW")
    old_type = tbl_width.attrib.get(f"{{{NS_W}}}type")
    old_width = parse_docx_numeric(tbl_width.attrib.get(f"{{{NS_W}}}w"))
    if old_type != "dxa" or old_width != max_content_width_twips:
        tbl_width.attrib[f"{{{NS_W}}}type"] = "dxa"
        tbl_width.attrib[f"{{{NS_W}}}w"] = str(max_content_width_twips)
        changes += 1

    tbl_indent = tbl_pr.find("w:tblInd", DOCX_XML_NAMESPACES)
    if tbl_indent is not None:
        indent_type = tbl_indent.attrib.get(f"{{{NS_W}}}type", "dxa")
        indent_width = parse_docx_numeric(tbl_indent.attrib.get(f"{{{NS_W}}}w")) or 0
        if indent_type != "dxa" or indent_width != 0:
            tbl_indent.attrib[f"{{{NS_W}}}type"] = "dxa"
            tbl_indent.attrib[f"{{{NS_W}}}w"] = "0"
            changes += 1

    return changes


def clamp_layout_overflow(xml_root: ET.Element, max_content_width_twips: int) -> int:
    changes = 0
    max_content_width_emu = max_content_width_twips * 635

    for width_node in (
        xml_root.findall(".//w:tblW", DOCX_XML_NAMESPACES)
        + xml_root.findall(".//w:tcW", DOCX_XML_NAMESPACES)
        + xml_root.findall(".//w:tblInd", DOCX_XML_NAMESPACES)
    ):
        width_type = width_node.attrib.get(f"{{{NS_W}}}type", "")
        width_value = parse_docx_numeric(width_node.attrib.get(f"{{{NS_W}}}w"))
        if width_value is None:
            continue
        if width_type in {"dxa", "", "nil"} and width_value > max_content_width_twips:
            width_node.attrib[f"{{{NS_W}}}w"] = str(max_content_width_twips)
            width_node.attrib[f"{{{NS_W}}}type"] = "dxa"
            changes += 1
            continue
        if width_type == "pct" and width_value > 5000:
            width_node.attrib[f"{{{NS_W}}}w"] = "5000"
            changes += 1

    for extent_node in xml_root.findall(".//wp:extent", DOCX_XML_NAMESPACES) + xml_root.findall(".//a:ext", DOCX_XML_NAMESPACES):
        raw_cx = extent_node.attrib.get("cx")
        if raw_cx is None:
            continue
        try:
            cx_value = int(raw_cx)
        except ValueError:
            continue
        if cx_value > max_content_width_emu:
            extent_node.attrib["cx"] = str(max_content_width_emu)
            changes += 1

    for table_node in xml_root.findall(".//w:tbl", DOCX_XML_NAMESPACES):
        changes += force_table_width_to_page(table_node, max_content_width_twips)
        changes += clamp_table_grid_columns(table_node, max_content_width_twips)
        changes += clamp_table_cell_widths(table_node, max_content_width_twips)

    return changes


def clamp_vml_width_styles(xml_text: str, max_content_width_twips: int) -> tuple[str, int]:
    changes = 0
    max_width_points = max_content_width_twips / 20

    def replace_width(match: re.Match[str]) -> str:
        nonlocal changes
        width_points = float(match.group(2))
        if width_points <= max_width_points:
            return match.group(0)
        changes += 1
        return f"{match.group(1)}{max_width_points:.2f}{match.group(3)}"

    return VML_WIDTH_STYLE_RE.sub(replace_width, xml_text), changes


def cleanup_converted_pdf_docx(docx_path: Path) -> None:
    with zipfile.ZipFile(docx_path, "r") as zin:
        files = {name: zin.read(name) for name in zin.namelist()}

    document_xml = files.get("word/document.xml")
    if not document_xml:
        return

    document_root = ET.fromstring(document_xml)
    max_content_width_twips = get_max_content_width_twips(document_root)

    xml_parts = ["word/document.xml"]
    xml_parts.extend(name for name in files.keys() if re.fullmatch(r"word/(header|footer)\d+\.xml", name))

    for part_name in xml_parts:
        part_content = files.get(part_name)
        if not part_content:
            continue
        try:
            root = ET.fromstring(part_content)
        except ET.ParseError:
            continue

        changed = False
        for text_node in root.findall(".//w:t", DOCX_XML_NAMESPACES):
            original_text = text_node.text
            if not original_text:
                continue
            normalized_text, text_changes = normalize_inline_hyphenation(original_text)
            if text_changes:
                text_node.text = normalized_text
                changed = True

        if normalize_cross_run_hyphenation(root) > 0:
            changed = True

        if normalize_rule_like_paragraphs(root) > 0:
            changed = True

        if clamp_layout_overflow(root, max_content_width_twips) > 0:
            changed = True

        if not changed:
            continue

        serialized_xml = ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")
        serialized_xml, style_changes = clamp_vml_width_styles(serialized_xml, max_content_width_twips)
        if style_changes > 0:
            changed = True
        if changed:
            files[part_name] = serialized_xml.encode("utf-8")

    with zipfile.ZipFile(docx_path, "w") as zout:
        for name, content in files.items():
            zout.writestr(name, content)


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
    cleanup_converted_pdf_docx(docx_path)


def run_python_json_script(script_path: Path, args: list[str]) -> dict[str, Any]:
    proc = subprocess.run([backend_python_cmd, str(script_path), *args], capture_output=True, text=True)
    if proc.returncode != 0:
        stdout_text = (proc.stdout or "").strip()
        if stdout_text:
            try:
                parsed = json.loads(stdout_text)
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                pass
        details = proc.stderr.strip() or stdout_text or f"processo finalizado com codigo {proc.returncode}"
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


def create_docx_bytes_from_text(raw_text: str) -> bytes:
    text = (raw_text or "").replace("\r\n", "\n")
    lines = text.split("\n") if text else [""]
    paragraph_xml_parts: list[str] = []
    for line in lines:
        if line == "":
            paragraph_xml_parts.append("<w:p/>")
            continue
        encoded_line = encode_xml_text(line)
        paragraph_xml_parts.append(f"<w:p><w:r><w:t xml:space=\"preserve\">{encoded_line}</w:t></w:r></w:p>")

    paragraphs_xml = "\n    ".join(paragraph_xml_parts)
    document = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {paragraphs_xml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>"""

    docx_bytes = create_blank_docx_bytes()
    files: dict[str, bytes] = {}
    with zipfile.ZipFile(BytesIO(docx_bytes), "r") as zin:
        files = {name: zin.read(name) for name in zin.namelist()}
    files["word/document.xml"] = document.encode("utf-8")

    output = BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as zout:
        for name, content in files.items():
            zout.writestr(name, content)
    return output.getvalue()


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


@app.get("/api/health")
def api_health() -> dict[str, Any]:
    return {"ok": True, "openaiConfigured": bool(openai_api_key)}


@app.post("/api/macros/insert-ref-book")
def api_insert_ref_book(payload: InsertRefBookRequest) -> dict[str, Any]:
    book = payload.book.strip()
    if not book:
        raise HTTPException(status_code=400, detail="Parametro 'book' e obrigatorio.")
    script_path = PYTHON_DIR / "insert_ref_book.py"
    result = run_python_json_script(script_path, [book])
    if not result.get("ok"):
        message = str(result.get("error") or "Falha ao executar macro1 no Python.")
        if "Livro nao identificado" in message or "Titulo nao encontrado" in message or "Parametro" in message:
            raise HTTPException(status_code=400, detail=message)
        raise HTTPException(status_code=500, detail=message)
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


@app.post("/api/apps/biblio-geral")
def api_biblio_geral(payload: BiblioGeralRequest) -> dict[str, Any]:
    author = (payload.author or "").strip()
    title = (payload.title or "").strip()
    year = (payload.year or "").strip()
    extra = (payload.extra or "").strip()
    if not any([author, title, year, extra]):
        raise HTTPException(status_code=400, detail="Informe ao menos um campo: author, title, year ou extra.")

    top_k = max(1, min(int(payload.topK or 10), 20))
    excel_path = resolve_biblio_file("Refs.xlsx")
    if not excel_path.exists():
        raise HTTPException(status_code=500, detail="Base bibliografica Refs.xlsx nao encontrada.")

    try:
        from backend.functions.biblio_matcher import search_bibliography
    except Exception:
        from functions.biblio_matcher import search_bibliography

    try:
        matches = search_bibliography(str(excel_path), author=author, title=title, year=year, extra=extra, top_k=top_k)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Falha ao executar Bibliografia Autores: {exc}")

    refs = [str(item.get("ref") or "").strip() for item in matches if str(item.get("ref") or "").strip()]
    markdown = "\n".join(f"**{idx}.** {ref}" for idx, ref in enumerate(refs, start=1))
    return {
        "ok": True,
        "result": {
            "query": {"author": author, "title": title, "year": year, "extra": extra},
            "matches": refs,
            "markdown": markdown,
        },
    }


@app.post("/api/apps/biblio-externa")
def api_biblio_externa(payload: BiblioExternaRequest) -> dict[str, Any]:
    require_openai_key()
    query = (payload.query or "").strip()
    author = (payload.author or "").strip()
    title = (payload.title or "").strip()
    year = (payload.year or "").strip()
    journal = (payload.journal or "").strip()
    publisher = (payload.publisher or "").strip()
    identifier = (payload.identifier or "").strip()
    extra = (payload.extra or "").strip()

    if not query:
        parts = [
            author and f"author: {author}",
            title and f"title: {title}",
            year and f"year: {year}",
            journal and f"journal: {journal}",
            publisher and f"publisher: {publisher}",
            identifier and f"doi/isbn: {identifier}",
            extra and f"extra: {extra}",
        ]
        query = " | ".join([p for p in parts if p])

    if not query:
        raise HTTPException(status_code=400, detail="Informe ao menos um campo de busca da bibliografia externa.")

    try:
        from backend.functions.biblio_openAI import BibliografiaService
    except Exception:
        from functions.biblio_openAI import BibliografiaService

    try:
        service = BibliografiaService(api_key=openai_api_key)
        result = service.gerar_com_validacao(
            query,
            criterios={
                "author": author,
                "title": title,
                "year": year,
                "journal": journal,
                "publisher": publisher,
                "identifier": identifier,
                "extra": extra,
            },
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Falha ao executar Bibliografia Externa: {exc}")

    referencias = result.get("matches") if isinstance(result, dict) else None
    if isinstance(referencias, list):
        matches = [str(item).strip() for item in referencias if str(item).strip()]
    else:
        matches = []
    referencia = str(result.get("referencia") or "").strip()
    score = result.get("score") if isinstance(result, dict) else None
    if not matches and referencia:
        matches = [referencia]
    markdown = "\n".join(f"**{idx}.** {ref}" for idx, ref in enumerate(matches, start=1))
    return {
        "ok": True,
        "result": {
            "query": query,
            "matches": matches,
            "markdown": markdown,
            "score": score,
        },
    }


@app.post("/api/apps/random-pensata")
def api_random_pensata() -> dict[str, Any]:
    script_path = PYTHON_DIR / "random_pensata.py"
    result = run_python_json_script(script_path, [])
    if not result.get("ok"):
        raise HTTPException(status_code=500, detail=result.get("error") or "Falha ao executar Pensata do Dia.")
    return result


@app.get("/api/apps/lexical/books")
def api_lexical_books() -> dict[str, Any]:
    try:
        from backend.functions.lexical_search_service import list_lexical_books
    except Exception:
        from functions.lexical_search_service import list_lexical_books
    return {"ok": True, "result": {"books": list_lexical_books()}}


@app.post("/api/apps/lexical/search")
def api_lexical_search(payload: LexicalSearchRequest) -> dict[str, Any]:
    book = (payload.book or "").strip()
    term = (payload.term or "").strip()
    if not book:
        raise HTTPException(status_code=400, detail="Parametro 'book' e obrigatorio.")
    if not term:
        raise HTTPException(status_code=400, detail="Parametro 'term' e obrigatorio.")
    limit = max(1, min(int(payload.limit or 50), 200))

    try:
        from backend.functions.lexical_search_service import search_lexical_book_with_total
    except Exception:
        from functions.lexical_search_service import search_lexical_book_with_total

    try:
        total, matches = search_lexical_book_with_total(book=book, term=term, limit=limit)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Falha ao executar busca lexical: {exc}")

    return {
        "ok": True,
        "result": {
            "book": book,
            "term": term,
            "total": total,
            "matches": matches,
        },
    }


@app.post("/api/apps/lexical/verbetes/search")
def api_lexical_verbete_search(payload: LexicalVerbeteSearchRequest) -> dict[str, Any]:
    author = (payload.author or "").strip()
    title = (payload.title or "").strip()
    area = (payload.area or "").strip()
    text = (payload.text or "").strip()
    if not author and not title and not area and not text:
        raise HTTPException(status_code=400, detail="Informe ao menos um campo de busca.")
    limit = max(1, min(int(payload.limit or 50), 200))

    try:
        from backend.functions.lexical_search_service import search_lexical_verbetes_with_total
    except Exception:
        from functions.lexical_search_service import search_lexical_verbetes_with_total

    try:
        total, matches = search_lexical_verbetes_with_total(
            author=author,
            title=title,
            area=area,
            text=text,
            limit=limit,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Falha ao executar busca em verbetes: {exc}")

    return {
        "ok": True,
        "result": {
            "query": {
                "author": author,
                "title": title,
                "area": area,
                "text": text,
            },
            "total": total,
            "matches": matches,
        },
    }


@app.post("/api/files/upload")
async def api_files_upload(file: UploadFile = File(...)) -> dict[str, Any]:
    run_storage_gc()

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
            safe_unlink(full_path)
            metadata.update({"originalName": f"{Path(file.filename or 'document').stem}.docx", "storedName": converted_name, "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "size": converted_path.stat().st_size, "ext": "docx", "convertedFromPdf": True, "sourceExt": "pdf"})
        except Exception as exc:
            metadata.update({"convertedFromPdf": False, "sourceExt": "pdf", "conversionError": str(exc)})

    write_meta(file_id, metadata)
    return metadata


@app.post("/api/files/create-blank")
def api_files_create_blank(payload: CreateBlankFileRequest) -> dict[str, Any]:
    run_storage_gc()

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
    ext = (meta.get("ext") or "").lower()
    saved_text = str(meta.get("editorText") or "")
    if ext == "docx" and saved_text:
        generated_docx = create_docx_bytes_from_text(saved_text)
        return Response(content=generated_docx, media_type=meta.get("mimeType") or "application/octet-stream", headers=headers)
    return Response(content=full_path.read_bytes(), media_type=meta.get("mimeType") or "application/octet-stream", headers=headers)


@app.get("/api/files/{file_id}/text")
def api_file_text(file_id: str) -> JSONResponse:
    meta = read_meta(file_id)
    full_path = UPLOADS_DIR / meta["storedName"]
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado.")
    ext = (meta.get("ext") or "").lower()

    saved_text = str(meta.get("editorText") or "")
    saved_html = str(meta.get("editorHtml") or "")
    if saved_text or saved_html:
        text = saved_text
        html = saved_html
    else:
        text = full_path.read_text(encoding="utf-8", errors="ignore") if ext in {"txt", "md"} else (extract_text_from_docx(full_path) if ext == "docx" else "")
        html = ""
    return JSONResponse(content={"id": meta["id"], "ext": meta.get("ext", ""), "text": text, "html": html, "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())}, headers={"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate", "Pragma": "no-cache", "Expires": "0"})


@app.put("/api/files/{file_id}/text")
def api_file_save_text(file_id: str, payload: SaveFileTextRequest) -> dict[str, Any]:
    meta = read_meta(file_id)
    text = (payload.text or "").replace("\r\n", "\n")
    html = (payload.html or "").strip()
    meta["editorText"] = text
    meta["editorHtml"] = html
    meta["editorUpdatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
    write_meta(file_id, meta)
    return {"ok": True, "id": file_id, "updatedAt": meta["editorUpdatedAt"]}


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
