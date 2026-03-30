from __future__ import annotations

import copy
import hashlib
import html
import re
import time
import unicodedata
from functools import lru_cache
from typing import Any, Callable
from urllib.parse import quote

import requests
from bs4 import BeautifulSoup

USER_AGENT = "GhostWriterDictLookup/1.0 (+online dictionary integration)"
REQUEST_TIMEOUT = 12
SOURCE_SCORES = {
    "Aulete": 1.00,
    "Michaelis": 0.96,
    "Priberam": 0.92,
    "Wiktionary": 0.76,
    "Dicio": 0.66,
}
GRAMMAR_LABEL_RE = re.compile(
    r"^(?:s\.?\s*f\.?|s\.?\s*m\.?|sf\.?|sm\.?|adj\.?|adv\.?|v\.?|vtd\.?|vti\.?|vi\.?|pron\.?|prep\.?)$",
    re.I,
)
UPPERCASE_BLOCK_RE = r"[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{3,}(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{3,})*"


def strip_html(value: str | None) -> str:
    if not value:
        return ""
    unescaped = html.unescape(value)
    if "<" in unescaped and ">" in unescaped:
        return BeautifulSoup(unescaped, "html.parser").get_text(" ", strip=True)
    return unescaped


def clean_text(value: str | None) -> str:
    normalized = strip_html(value)
    if not normalized:
        return ""
    normalized = unicodedata.normalize("NFKC", normalized)
    normalized = re.sub(r"\[[^\]]+\]", " ", normalized)
    normalized = re.sub(r"\(\s*editar\s*\)", " ", normalized, flags=re.I)
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.strip(" -\n\t\r")


def strip_accents(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value)
    without_marks = "".join(char for char in decomposed if unicodedata.category(char) != "Mn")
    return clean_text(without_marks)


def dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        cleaned = clean_text(value)
        if not cleaned:
            continue
        key = cleaned.casefold()
        if key in seen:
            continue
        seen.add(key)
        result.append(cleaned)
    return result


def normalize_uppercase_block(block: str) -> str:
    parts = [clean_text(part).lower() for part in block.split() if clean_text(part)]
    return ", ".join(parts)


def is_uppercase_gloss(value: str) -> bool:
    candidate = clean_text(value)
    if not candidate:
        return False
    if len(candidate.split()) > 4:
        return False
    letters = [char for char in candidate if char.isalpha()]
    if not letters:
        return False
    return candidate == candidate.upper()


def cleanup_definition_text(value: str) -> str:
    cleaned = clean_text(value)
    if not cleaned:
        return ""

    cleaned = re.sub(r"^(?:\d+\.\s*)+", "", cleaned)
    cleaned = re.sub(r"^(?:ca\.\s*)+", "", cleaned, flags=re.I)
    if GRAMMAR_LABEL_RE.match(cleaned):
        return ""

    cleaned = re.sub(
        rf"({UPPERCASE_BLOCK_RE})\s*:\s*",
        lambda match: f" Sinonimos: {normalize_uppercase_block(match.group(1))}. ",
        cleaned,
    )
    cleaned = re.sub(
        rf"\s+({UPPERCASE_BLOCK_RE})$",
        lambda match: f". Sinonimo: {normalize_uppercase_block(match.group(1))}.",
        cleaned,
    )

    cleaned = re.sub(r"\s+\.\s*", ". ", cleaned)
    cleaned = re.sub(r"\s+,", ",", cleaned)
    cleaned = re.sub(r"\s+:", ":", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    cleaned = cleaned.strip(" .")
    if not cleaned:
        return ""
    return cleaned[0].upper() + cleaned[1:]


def split_senses(value: str) -> list[str]:
    cleaned = clean_text(value)
    if not cleaned:
        return []

    numbered = re.split(r"(?=(?:^|\s)\d+\.)", cleaned)
    pieces = [clean_text(piece) for piece in numbered if clean_text(piece)]
    if len(pieces) > 1:
        return pieces

    semi_split = [clean_text(piece) for piece in re.split(r"\s*;\s+", cleaned) if clean_text(piece)]
    if len(semi_split) > 1:
        return semi_split

    return [cleaned]


def normalize_definitions(definitions: list[str]) -> list[str]:
    normalized: list[str] = []
    for definition in definitions:
        for piece in split_senses(definition):
            cleaned = cleanup_definition_text(piece)
            if not cleaned:
                continue
            if is_uppercase_gloss(cleaned):
                if normalized:
                    normalized[-1] = f"{normalized[-1]}. Sinonimo: {cleaned.lower()}."
                continue
            if cleaned.lower().startswith("sinonimos:") or cleaned.lower().startswith("sinonimo:"):
                if normalized:
                    normalized[-1] = f"{normalized[-1]} {cleaned}"
                continue
            normalized.append(cleaned)
    return dedupe(normalized)


def stage_quality_score(source: str, definition_count: int, synonym_count: int, has_etymology: bool) -> float:
    base = SOURCE_SCORES.get(source, 0.5) * 100
    richness = min(definition_count, 10) * 2.2 + min(synonym_count, 8) * 0.8
    etymology_bonus = 3.0 if has_etymology else 0.0
    return round(base + richness + etymology_bonus, 2)


@lru_cache(maxsize=512)
def fetch_html_cached(url: str) -> tuple[str, str]:
    response = requests.get(
        url,
        headers={"User-Agent": USER_AGENT, "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.6"},
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.text, str(response.url)


def fetch_html(url: str) -> tuple[str, str, bool]:
    before = fetch_html_cached.cache_info()
    html_text, final_url = fetch_html_cached(url)
    after = fetch_html_cached.cache_info()
    return html_text, final_url, after.hits > before.hits


def build_stage(
    source: str,
    started_at: float,
    *,
    ok: bool,
    url: str | None = None,
    definitions: list[str] | None = None,
    synonyms: list[str] | None = None,
    etymology: str | None = None,
    examples: list[str] | None = None,
    error: str | None = None,
    query_term: str | None = None,
    retry_without_accents: bool = False,
) -> dict[str, Any]:
    definitions = normalize_definitions(definitions or [])
    synonyms = dedupe(synonyms or [])
    examples = dedupe(examples or [])
    etymology = clean_text(etymology) or None
    elapsed_ms = round((time.perf_counter() - started_at) * 1000, 1)
    quality_score = stage_quality_score(source, len(definitions), len(synonyms), bool(etymology))
    return {
        "source": source,
        "ok": ok and bool(definitions),
        "url": url,
        "elapsed_ms": elapsed_ms,
        "quality_score": quality_score,
        "definitions": definitions,
        "synonyms": synonyms,
        "examples": examples,
        "etymology": etymology,
        "query_term": query_term,
        "retry_without_accents": retry_without_accents,
        "error": None if ok and definitions else (error or "nenhuma definicao extraida"),
    }


def extract_examples_from_text(text: str) -> list[str]:
    return re.findall(r"[“\"]([^”\"]{12,180})[”\"]", text)


def fetch_aulete(word: str) -> dict[str, Any]:
    started_at = time.perf_counter()
    url = f"https://www.aulete.com.br/{quote(word)}"
    try:
        html_text, final_url, _ = fetch_html(url)
        soup = BeautifulSoup(html_text, "html.parser")
        paragraphs = [clean_text(node.get_text(" ", strip=True)) for node in soup.select("p")]
        definitions = [
            text for text in paragraphs
            if re.match(r"^\d+\.", text) or text.startswith("sf.") or text.startswith("sm.")
        ]
        etymology = next(
            (text for text in paragraphs if "Do lat." in text or "Do gr." in text or "Etim" in text),
            None,
        )
        return build_stage(
            "Aulete",
            started_at,
            ok=bool(definitions),
            url=final_url,
            definitions=definitions[:10],
            etymology=etymology,
            examples=extract_examples_from_text(" ".join(definitions[:4])),
            query_term=word,
        )
    except Exception as exc:
        return build_stage("Aulete", started_at, ok=False, url=url, error=str(exc), query_term=word)


def fetch_dicio(word: str) -> dict[str, Any]:
    started_at = time.perf_counter()
    url = f"https://www.dicio.com.br/{quote(word)}/"
    try:
        html_text, final_url, _ = fetch_html(url)
        soup = BeautifulSoup(html_text, "html.parser")
        definitions = [clean_text(node.get_text(" ", strip=True)) for node in soup.select("p.significado")]
        examples = [clean_text(node.get_text(" ", strip=True)) for node in soup.select("q, cite, em")]

        synonyms: list[str] = []
        for node in soup.select("p.adicional.sinonimos"):
            text = clean_text(node.get_text(" ", strip=True))
            if ":" in text:
                text = text.split(":", 1)[1]
            synonyms.extend(piece.strip() for piece in text.split(",") if piece.strip())

        etymology_node = soup.find(string=re.compile(r"Etimologia", re.I))
        etymology = None
        if etymology_node and getattr(etymology_node, "parent", None):
            etymology = clean_text(etymology_node.parent.get_text(" ", strip=True))

        return build_stage(
            "Dicio",
            started_at,
            ok=bool(definitions),
            url=final_url,
            definitions=definitions,
            synonyms=synonyms,
            etymology=etymology,
            examples=examples,
            query_term=word,
        )
    except Exception as exc:
        return build_stage("Dicio", started_at, ok=False, url=url, error=str(exc), query_term=word)


def fetch_wiktionary(word: str) -> dict[str, Any]:
    started_at = time.perf_counter()
    url = f"https://pt.wiktionary.org/wiki/{quote(word)}"
    try:
        html_text, final_url, _ = fetch_html(url)
        soup = BeautifulSoup(html_text, "html.parser")
        content = soup.select_one("#mw-content-text")
        if content is None:
            raise ValueError("conteudo principal nao encontrado")

        definitions: list[str] = []
        examples: list[str] = []
        for item in content.select("ol > li"):
            text = clean_text(item.get_text(" ", strip=True))
            if len(text) < 20:
                continue
            definitions.append(text)
            for nested in item.select("ul li"):
                example = clean_text(nested.get_text(" ", strip=True))
                if example:
                    examples.append(example)

        etymology = None
        etymology_marker = content.find(string=re.compile(r"Etimologia", re.I))
        if etymology_marker:
            section = etymology_marker.find_parent(["h2", "h3", "h4"])
            cursor = section.find_next_sibling() if section else None
            snippets: list[str] = []
            while cursor and cursor.name not in {"h2", "h3", "h4"}:
                text = clean_text(cursor.get_text(" ", strip=True))
                if text:
                    snippets.append(text)
                cursor = cursor.find_next_sibling()
            etymology = " ".join(snippets[:2])

        return build_stage(
            "Wiktionary",
            started_at,
            ok=bool(definitions),
            url=final_url,
            definitions=definitions[:10],
            etymology=etymology,
            examples=examples[:5],
            query_term=word,
        )
    except Exception as exc:
        return build_stage("Wiktionary", started_at, ok=False, url=url, error=str(exc), query_term=word)


def fetch_priberam(word: str) -> dict[str, Any]:
    started_at = time.perf_counter()
    url = f"https://dicionario.priberam.org/{quote(word)}"
    try:
        html_text, final_url, _ = fetch_html(url)
        soup = BeautifulSoup(html_text, "html.parser")
        paragraphs = [clean_text(node.get_text(" ", strip=True)) for node in soup.select("p")]

        definitions: list[str] = []
        examples: list[str] = []
        etymology = None
        collecting = False

        for text in paragraphs:
            lowered = text.casefold()
            if lowered.startswith(("nome ", "substantivo ", "adjetivo ", "verbo ")):
                collecting = True
                continue
            if "etimologia" in lowered:
                etymology = text
            if collecting and re.match(r"^\d+\.", text):
                definitions.append(text)
            elif collecting and text and len(text) > 30 and not definitions:
                definitions.append(text)
            if "exemplo" in lowered or "ex.:" in lowered:
                examples.append(text)

        return build_stage(
            "Priberam",
            started_at,
            ok=bool(definitions),
            url=final_url,
            definitions=definitions[:10],
            etymology=etymology,
            examples=examples[:4],
            query_term=word,
        )
    except Exception as exc:
        return build_stage("Priberam", started_at, ok=False, url=url, error=str(exc), query_term=word)


def fetch_michaelis(word: str) -> dict[str, Any]:
    started_at = time.perf_counter()
    url = f"https://michaelis.uol.com.br/busca?r=0&f=0&t=0&palavra={quote(word)}"
    try:
        html_text, final_url, _ = fetch_html(url)
        soup = BeautifulSoup(html_text, "html.parser")
        entry = soup.select_one("div.verbete")
        if entry is None:
            raise ValueError("verbete principal nao encontrado")

        definitions: list[str] = []
        examples: list[str] = []
        synonyms: list[str] = []

        for node in entry.select("acn"):
            number = clean_text(node.get_text(" ", strip=True))
            parts: list[str] = []
            sibling = node.next_sibling
            while sibling:
                sibling_name = getattr(sibling, "name", None)
                if sibling_name == "acn":
                    break
                if sibling_name == "abt":
                    sample = clean_text(sibling.get_text(" ", strip=True))
                    if sample:
                        examples.append(sample)
                if sibling_name and hasattr(sibling, "get_text"):
                    text = clean_text(sibling.get_text(" ", strip=True))
                else:
                    text = clean_text(str(sibling))
                if text:
                    parts.append(text)
                sibling = sibling.next_sibling

            definition = clean_text(f"{number}. {' '.join(parts)}")
            definition = re.sub(r"\s+\.\s+", ". ", definition)
            if definition:
                definitions.append(definition)

        related = soup.select_one(".col-md-4, .col-lg-4")
        if related:
            related_text = clean_text(related.get_text(" ", strip=True))
            related_text = related_text.replace("Veja também", "").replace("Veja tambem", "")
            synonyms.extend(piece for piece in re.split(r"[,\s]+", related_text) if len(piece) > 2)

        return build_stage(
            "Michaelis",
            started_at,
            ok=bool(definitions),
            url=final_url,
            definitions=definitions[:10],
            synonyms=synonyms[:10],
            examples=examples[:4],
            query_term=word,
        )
    except Exception as exc:
        return build_stage("Michaelis", started_at, ok=False, url=url, error=str(exc), query_term=word)


def fetch_with_accent_fallback(source_fetcher: Callable[[str], dict[str, Any]], word: str) -> dict[str, Any]:
    primary = copy.deepcopy(source_fetcher(word))
    accentless = strip_accents(word)

    if accentless == word:
        primary["query_term"] = word
        primary["retry_without_accents"] = False
        return primary

    if primary["ok"] and primary["definitions"]:
        primary["query_term"] = word
        primary["retry_without_accents"] = False
        return primary

    retry = copy.deepcopy(source_fetcher(accentless))
    retry["query_term"] = accentless
    retry["retry_without_accents"] = True
    retry["error"] = retry["error"] or primary["error"]
    if retry["ok"] and retry["definitions"]:
        return retry

    primary["query_term"] = word
    primary["retry_without_accents"] = True
    return primary


def rank_results(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(
        results,
        key=lambda item: (
            item["ok"],
            item["quality_score"],
            len(item["definitions"]),
        ),
        reverse=True,
    )


def build_summary(results: list[dict[str, Any]]) -> dict[str, Any]:
    working = [result for result in results if result["ok"]]
    definitions: list[str] = []
    synonyms: list[str] = []
    examples: list[str] = []
    etymology = None

    for result in working:
        definitions.extend(result["definitions"])
        synonyms.extend(result["synonyms"])
        examples.extend(result["examples"])
        if not etymology and result["etymology"]:
            etymology = result["etymology"]

    return {
        "definitions": dedupe(definitions),
        "synonyms": dedupe(synonyms),
        "examples": dedupe(examples),
        "etymology": etymology,
    }


def search_online_dictionaries(term: str) -> dict[str, Any]:
    normalized_term = clean_text(term)
    if not normalized_term:
        raise ValueError("Parametro 'term' e obrigatorio.")
    if len(normalized_term) > 80:
        raise ValueError("Parametro 'term' deve ter no maximo 80 caracteres.")

    started_at = time.perf_counter()
    results = rank_results([
        fetch_with_accent_fallback(fetch_aulete, normalized_term),
        fetch_with_accent_fallback(fetch_michaelis, normalized_term),
        fetch_with_accent_fallback(fetch_priberam, normalized_term),
        fetch_with_accent_fallback(fetch_wiktionary, normalized_term),
        fetch_with_accent_fallback(fetch_dicio, normalized_term),
    ])
    summary = build_summary(results)
    sources_ok = sum(1 for result in results if result["ok"])

    return {
        "term": normalized_term,
        "sources_total": len(results),
        "sources_ok": sources_ok,
        "sources_failed": len(results) - sources_ok,
        "elapsed_ms": round((time.perf_counter() - started_at) * 1000, 1),
        "summary": summary,
        "results": results,
        "request_id": hashlib.blake2b(normalized_term.encode("utf-8"), digest_size=8).hexdigest(),
    }
