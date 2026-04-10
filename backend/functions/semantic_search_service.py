from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import requests


SEMANTIC_DIR = Path(__file__).resolve().parents[1] / "Files" / "Semantic"
EMBEDDINGS_API_URL = "https://api.openai.com/v1/embeddings"


def _normalize_index_id(value: str) -> str:
    return (value or "").strip().lower()


def _index_dir(index_id: str) -> Path:
    path = SEMANTIC_DIR / _normalize_index_id(index_id)
    if not path.exists():
        raise FileNotFoundError(f"Indice semantico nao encontrado: {index_id}")
    return path


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _load_semantic_index(index_id: str) -> dict[str, Any]:
    base_dir = _index_dir(index_id)
    manifest_path = base_dir / "manifest.json"
    metadata_path = base_dir / "metadata.json"
    embeddings_path = base_dir / "embeddings.npy"

    if not manifest_path.exists() or not metadata_path.exists() or not embeddings_path.exists():
        raise FileNotFoundError(f"Arquivos do indice semantico incompletos: {base_dir}")

    manifest = _load_json(manifest_path)
    metadata = _load_json(metadata_path)
    embeddings = np.load(embeddings_path)

    if not isinstance(metadata, list):
        raise ValueError(f"Metadata invalida para o indice {index_id}")
    if len(metadata) != int(getattr(embeddings, "shape", [0])[0]):
        raise ValueError(f"Quantidade de embeddings inconsistente no indice {index_id}")

    return {
        "manifest": manifest,
        "metadata": metadata,
        "embeddings": embeddings,
    }


def list_semantic_indexes() -> list[dict[str, Any]]:
    if not SEMANTIC_DIR.exists():
        return []

    indexes: list[dict[str, Any]] = []
    for item in sorted(SEMANTIC_DIR.iterdir(), key=lambda path: path.name.lower()):
        if not item.is_dir():
            continue
        manifest_path = item / "manifest.json"
        if not manifest_path.exists():
            continue
        manifest = _load_json(manifest_path)
        indexes.append({
            "id": item.name,
            "label": str(manifest.get("index_label") or item.name).strip(),
            "sourceFile": str(manifest.get("source_file") or "").strip(),
            "sourceRows": int(manifest.get("source_rows") or 0),
            "model": str(manifest.get("model") or "").strip(),
            "dimensions": int(manifest.get("dimensions") or 0),
            "embeddingDtype": str(manifest.get("embedding_dtype") or "").strip(),
        })
    return indexes


def _get_semantic_query_vector(raw_query: str, api_key: str, model: str, cache: dict[str, np.ndarray] | None = None) -> np.ndarray:
    model_name = (model or "").strip() or "text-embedding-3-small"
    if cache is not None and model_name in cache:
        return cache[model_name]

    response = requests.post(
        EMBEDDINGS_API_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model_name,
            "input": raw_query,
        },
        timeout=60,
    )
    if not response.ok:
        raise RuntimeError(f"Falha ao gerar embedding da query: HTTP {response.status_code} {response.text}")

    payload = response.json()
    data = payload.get("data") or []
    if not data:
        raise RuntimeError("Resposta de embeddings vazia.")

    vector = np.asarray(data[0].get("embedding") or [], dtype=np.float32)
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm

    if cache is not None:
        cache[model_name] = vector
    return vector


def _score_matches(
    metadata: list[dict[str, Any]],
    embeddings: np.ndarray,
    query_vector: np.ndarray,
    index_id: str,
    index_label: str,
) -> list[dict[str, Any]]:
    matrix = embeddings.astype(np.float32, copy=False)
    if matrix.ndim != 2:
        raise ValueError(f"Embeddings invalidos no indice {index_id}")

    scores = matrix @ query_vector
    matches: list[dict[str, Any]] = []
    for position, row in enumerate(metadata):
        score = float(scores[position])
        match_metadata = row.get("metadata") if isinstance(row, dict) else {}
        matches.append({
            "book": str(row.get("book") or index_id).strip().upper(),
            "index_id": index_id,
            "index_label": index_label,
            "row": int(row.get("row") or 0),
            "text": str(row.get("text") or row.get("text_plain") or "").strip(),
            "metadata": match_metadata if isinstance(match_metadata, dict) else {},
            "score": score,
        })
    matches.sort(key=lambda item: item["score"], reverse=True)
    return matches


def search_semantic_index(index_id: str, query: str, limit: int, api_key: str) -> tuple[int, list[dict[str, Any]]]:
    normalized_index_id = _normalize_index_id(index_id)
    loaded = _load_semantic_index(normalized_index_id)
    manifest = loaded["manifest"]
    model = str(manifest.get("model") or "").strip()
    index_label = str(manifest.get("index_label") or normalized_index_id).strip()
    query_vector = _get_semantic_query_vector(query, api_key=api_key, model=model)
    ranked = _score_matches(loaded["metadata"], loaded["embeddings"], query_vector, normalized_index_id, index_label)
    return len(ranked), ranked[:limit]


def search_semantic_overview_with_total(
    term: str,
    limit: int,
    api_key: str,
    progress_callback: Any | None = None,
) -> tuple[int, list[dict[str, Any]]]:
    indexes = list_semantic_indexes()
    if not indexes:
        return 0, []

    query_cache: dict[str, np.ndarray] = {}
    collected: list[dict[str, Any]] = []

    for position, index_meta in enumerate(indexes, start=1):
        index_id = _normalize_index_id(str(index_meta.get("id") or ""))
        index_label = str(index_meta.get("label") or index_id).strip()
        try:
            if progress_callback:
                progress_callback({
                    "currentIndexPosition": position,
                    "totalIndexes": len(indexes),
                    "currentIndexId": index_id,
                    "currentIndexLabel": index_label,
                    "message": f"Processando base {index_label}.",
                    "event": {
                        "stage": "index_started",
                        "indexId": index_id,
                        "indexLabel": index_label,
                        "position": position,
                        "totalIndexes": len(indexes),
                    },
                })

            loaded = _load_semantic_index(index_id)
            manifest = loaded["manifest"]
            query_vector = _get_semantic_query_vector(
                term,
                api_key=api_key,
                model=str(manifest.get("model") or "").strip(),
                cache=query_cache,
            )
            ranked = _score_matches(loaded["metadata"], loaded["embeddings"], query_vector, index_id, index_label)
            top_matches = ranked[:limit]
            collected.extend(top_matches)
            collected.sort(key=lambda item: item["score"], reverse=True)
            collected = collected[:limit]

            if progress_callback:
                progress_callback({
                    "processedIndexes": position,
                    "currentMatches": len(top_matches),
                    "totalMatchesAccumulated": len(collected),
                    "topScore": collected[0]["score"] if collected else None,
                    "message": f"Processando base {index_label}.",
                    "event": {
                        "stage": "index_completed" if top_matches else "index_skipped",
                        "indexId": index_id,
                        "indexLabel": index_label,
                        "position": position,
                        "totalIndexes": len(indexes),
                        "matchesFound": len(top_matches),
                        "totalMatchesAccumulated": len(collected),
                        "topScore": collected[0]["score"] if collected else None,
                    },
                })
        except Exception as exc:
            if progress_callback:
                progress_callback({
                    "processedIndexes": position,
                    "message": f"Falha ao processar base {index_label}.",
                    "event": {
                        "stage": "error",
                        "indexId": index_id,
                        "indexLabel": index_label,
                        "position": position,
                        "totalIndexes": len(indexes),
                        "note": str(exc),
                    },
                })
            continue

    if not collected:
        return 0, []

    grouped: dict[str, dict[str, Any]] = {}
    for match in collected:
        group = grouped.setdefault(match["index_id"], {
            "indexId": match["index_id"],
            "indexLabel": match["index_label"],
            "totalFound": 0,
            "shownCount": 0,
            "matches": [],
        })
        group["totalFound"] += 1
        group["matches"].append(match)

    groups = list(grouped.values())
    for group in groups:
        group["shownCount"] = len(group["matches"])

    groups.sort(key=lambda item: max((match["score"] for match in item["matches"]), default=0.0), reverse=True)
    return len(collected), groups
