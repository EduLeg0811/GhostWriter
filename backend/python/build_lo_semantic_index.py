from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.functions.semantic_search_service import DEFAULT_BATCH_SIZE
from backend.functions.semantic_search_service import DEFAULT_EMBEDDING_DTYPE
from backend.functions.semantic_search_service import DEFAULT_EMBEDDING_MODEL
from backend.functions.semantic_search_service import build_semantic_index

load_dotenv(ROOT_DIR / ".env")

SOURCE_XLSX = ROOT_DIR / "backend" / "Files" / "Lexical" / "LO.xlsx"
TARGET_DIR = ROOT_DIR / "backend" / "Files" / "Semantic" / "LO"


def main() -> None:
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY nao configurada. Defina a chave antes de gerar o indice semantico.")

    model = (os.getenv("OPENAI_EMBEDDING_MODEL") or DEFAULT_EMBEDDING_MODEL).strip() or DEFAULT_EMBEDDING_MODEL
    embedding_dtype = (os.getenv("OPENAI_EMBEDDING_DTYPE") or DEFAULT_EMBEDDING_DTYPE).strip() or DEFAULT_EMBEDDING_DTYPE
    result = build_semantic_index(
        source_xlsx=SOURCE_XLSX,
        output_dir=TARGET_DIR,
        sheet_name=None,
        text_column="text",
        api_key=api_key,
        model=model,
        batch_size=DEFAULT_BATCH_SIZE,
        embedding_dtype=embedding_dtype,
        index_label="LO",
        progress_callback=lambda batch_index, total_batches, message: print(f"[{batch_index}/{total_batches}] {message}"),
    )

    print(f"Indice semantico gerado com sucesso em: {result['output_dir']}")
    print(f"Pensatas indexadas: {result['rows']}")
    print(f"Dimensoes: {result['dimensions']}")
    print(f"Modelo: {result['model']}")
    print(f"Tipo: {result['embedding_dtype']}")


if __name__ == "__main__":
    main()
