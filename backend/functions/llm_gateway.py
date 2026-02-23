from __future__ import annotations

from typing import Any

import requests

OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
OPENAI_VECTOR_SEARCH_URL = "https://api.openai.com/v1/vector_stores/{vector_store_id}/search"


def _extract_response_text(payload: dict[str, Any]) -> str:
    for item in payload.get("output", []):
        for block in item.get("content", []):
            if block.get("type") == "output_text":
                return str(block.get("text") or "").strip()
    return str(payload.get("output_text") or "").strip()


def _to_responses_input(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    converted: list[dict[str, Any]] = []
    for msg in messages:
        role = str(msg.get("role") or "user")
        content = str(msg.get("content") or "")
        # Usa content como string para compatibilidade entre papeis
        # (user/system/assistant) na Responses API.
        converted.append({"role": role, "content": content})
    return converted


def _is_gpt5_family(model: str) -> bool:
    m = (model or "").strip().lower()
    return m.startswith("gpt-5")


def search_vector_stores(
    api_key: str,
    vector_store_ids: list[str],
    query: str,
    max_num_results: int = 5,
    timeout: int = 60,
) -> list[str]:
    chunks: list[str] = []
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "OpenAI-Beta": "assistants=v2",
    }
    for store_id in vector_store_ids:
        sid = (store_id or "").strip()
        if not sid:
            continue
        upstream = requests.post(
            OPENAI_VECTOR_SEARCH_URL.format(vector_store_id=sid),
            headers=headers,
            json={"query": query, "max_num_results": max_num_results},
            timeout=timeout,
        )
        upstream.raise_for_status()
        data = upstream.json()
        for item in data.get("data", []):
            text = "\n".join((c.get("text") or "") for c in item.get("content", []))
            if text:
                chunks.append(text)
    return chunks


def execute_llm_request(
    *,
    api_key: str,
    model: str,
    messages: list[dict[str, Any]],
    system_prompt: str,
    temperature: float | None = None,
    max_output_tokens: int | None = None,
    gpt5_verbosity: str | None = None,
    gpt5_effort: str | None = None,
    tools: list[dict[str, Any]] | None = None,
    vector_store_ids: list[str] | None = None,
    rag_query: str | None = None,
    vector_max_results: int = 5,
    timeout: int = 60,
) -> dict[str, Any]:
    input_messages = _to_responses_input(messages)
    if not input_messages:
        input_messages = [{"role": "user", "content": ""}]

    first_is_system = input_messages and str(input_messages[0].get("role") or "").lower() in {"system", "developer"}
    base_system = (system_prompt or "").strip()
    if base_system:
        if first_is_system:
            previous = str(input_messages[0].get("content") or "")
            input_messages[0]["content"] = f"{base_system}\n\n{previous}" if previous else base_system
        else:
            input_messages.insert(0, {"role": "system", "content": base_system})

    chunks: list[str] = []
    clean_store_ids = [s.strip() for s in (vector_store_ids or []) if str(s or "").strip()]
    if clean_store_ids:
        query = (rag_query or "").strip()
        if not query:
            last_user = ""
            for m in reversed(messages):
                if str(m.get("role") or "") == "user":
                    last_user = str(m.get("content") or "").strip()
                    break
            query = last_user
        if query:
            chunks = search_vector_stores(
                api_key=api_key,
                vector_store_ids=clean_store_ids,
                query=query,
                max_num_results=vector_max_results,
                timeout=timeout,
            )
            if chunks:
                rag_text = "\n\n---\n\n".join(chunks)
                rag_block = {
                    "role": "system",
                    "content": f"Contexto de referencia (RAG):\n{rag_text}",
                }
                input_messages.insert(1 if first_is_system and base_system else 0, rag_block)

    request_json: dict[str, Any] = {
        "model": model,
        "input": input_messages,
    }
    if max_output_tokens is not None:
        request_json["max_output_tokens"] = max_output_tokens
    if tools:
        request_json["tools"] = tools

    if _is_gpt5_family(model):
        if gpt5_verbosity:
            request_json["text"] = {"verbosity": gpt5_verbosity}
        if gpt5_effort:
            request_json["reasoning"] = {"effort": gpt5_effort}
    elif temperature is not None:
        request_json["temperature"] = temperature

    upstream = requests.post(
        OPENAI_RESPONSES_URL,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        json=request_json,
        timeout=timeout,
    )
    upstream.raise_for_status()
    payload = upstream.json()
    return {
        "content": _extract_response_text(payload),
        "chunks": chunks,
        "raw": payload,
    }
