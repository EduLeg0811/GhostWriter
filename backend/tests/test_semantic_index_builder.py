import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
import openpyxl  # type: ignore

from backend.functions.semantic_index_builder import rebuild_semantic_index


class SemanticIndexBuilderTests(unittest.TestCase):
    def _write_manifest(self, index_dir: Path, payload: dict) -> None:
        (index_dir / "manifest.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    def _write_metadata(self, index_dir: Path, payload: list[dict]) -> None:
        (index_dir / "metadata.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    def _write_source_xlsx(self, path: Path) -> None:
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        sheet.title = "Sheet1"
        sheet.append(["text", "title", "author"])
        sheet.append(["Texto de origem para rebuild semantico.", "Titulo 1", "Autor A"])
        workbook.save(path)
        workbook.close()

    @patch("backend.functions.semantic_index_builder._embed_rows")
    def test_rebuild_uses_source_file_when_available(self, mock_embed_rows) -> None:
        mock_embed_rows.return_value = np.asarray([[1.0, 0.0]], dtype=np.float32)

        with tempfile.TemporaryDirectory() as tmp_dir:
            index_dir = Path(tmp_dir) / "alpha"
            index_dir.mkdir(parents=True, exist_ok=True)
            source_path = Path(tmp_dir) / "source.xlsx"
            self._write_source_xlsx(source_path)
            self._write_manifest(index_dir, {
                "index_label": "ALPHA",
                "source_file": str(source_path),
                "sheet_name": "Sheet1",
                "text_column": "text",
                "metadata_columns": ["title", "author"],
                "model": "text-embedding-3-small",
            })
            self._write_metadata(index_dir, [{"row": 2, "text": "Snapshot antigo", "text_plain": "Snapshot antigo", "metadata": {"title": "Old"}}])

            result = rebuild_semantic_index(index_dir, api_key="key")

            self.assertEqual(result["rebuild_basis"], "source_file")
            self.assertIsNone(result["warning"])
            rebuilt_manifest = json.loads((index_dir / "manifest.json").read_text(encoding="utf-8"))
            rebuilt_metadata = json.loads((index_dir / "metadata.json").read_text(encoding="utf-8"))
            self.assertEqual(rebuilt_manifest["rebuild_basis"], "source_file")
            self.assertEqual(rebuilt_metadata[0]["text_plain"], "Texto de origem para rebuild semantico.")
            self.assertEqual(rebuilt_metadata[0]["metadata"]["title"], "Titulo 1")

    @patch("backend.functions.semantic_index_builder._embed_rows")
    def test_rebuild_accepts_repo_relative_source_file(self, mock_embed_rows) -> None:
        mock_embed_rows.return_value = np.asarray([[1.0, 0.0]], dtype=np.float32)

        with tempfile.TemporaryDirectory(dir=str(Path.cwd())) as tmp_dir:
            tmp_path = Path(tmp_dir)
            index_dir = tmp_path / "gamma"
            index_dir.mkdir(parents=True, exist_ok=True)
            source_path = tmp_path / "source.xlsx"
            self._write_source_xlsx(source_path)
            relative_source = source_path.relative_to(Path.cwd())
            self._write_manifest(index_dir, {
                "index_label": "GAMMA",
                "source_file": str(relative_source).replace("\\", "/"),
                "sheet_name": "Sheet1",
                "text_column": "text",
                "metadata_columns": ["title", "author"],
                "model": "text-embedding-3-small",
            })
            self._write_metadata(index_dir, [{"row": 2, "text": "Snapshot antigo", "text_plain": "Snapshot antigo", "metadata": {"title": "Old"}}])

            result = rebuild_semantic_index(index_dir, api_key="key")

            self.assertEqual(result["rebuild_basis"], "source_file")
            rebuilt_metadata = json.loads((index_dir / "metadata.json").read_text(encoding="utf-8"))
            self.assertEqual(rebuilt_metadata[0]["text_plain"], "Texto de origem para rebuild semantico.")

    @patch("backend.functions.semantic_index_builder._embed_rows")
    def test_rebuild_falls_back_to_metadata_snapshot_when_source_file_is_missing(self, mock_embed_rows) -> None:
        mock_embed_rows.return_value = np.asarray([[1.0, 0.0]], dtype=np.float32)

        with tempfile.TemporaryDirectory() as tmp_dir:
            index_dir = Path(tmp_dir) / "beta"
            index_dir.mkdir(parents=True, exist_ok=True)
            missing_source = Path(tmp_dir) / "missing.xlsx"
            self._write_manifest(index_dir, {
                "index_label": "BETA",
                "source_file": str(missing_source),
                "sheet_name": "Sheet1",
                "text_column": "text",
                "metadata_columns": ["title"],
                "model": "text-embedding-3-small",
            })
            self._write_metadata(index_dir, [{"row": 5, "text": "Snapshot atual", "text_plain": "Snapshot atual", "metadata": {"title": "Keep"}}])

            result = rebuild_semantic_index(index_dir, api_key="key")

            self.assertEqual(result["rebuild_basis"], "metadata_snapshot")
            self.assertIn("metadata.json", result["warning"])
            rebuilt_manifest = json.loads((index_dir / "manifest.json").read_text(encoding="utf-8"))
            self.assertEqual(rebuilt_manifest["rebuild_basis"], "metadata_snapshot")


if __name__ == "__main__":
    unittest.main()
