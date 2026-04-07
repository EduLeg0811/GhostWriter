import re
import unicodedata
from difflib import SequenceMatcher

import pandas as pd
import streamlit as st


# =========================
# Normalização / utilitários
# =========================
_WORD_RE = re.compile(r"[a-z0-9]+")

def normalize_text(s: str) -> str:
    if s is None:
        return ""
    s = str(s).strip().lower()
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = re.sub(r"[^a-z0-9]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def tokenize(s: str) -> list[str]:
    s = normalize_text(s)
    return _WORD_RE.findall(s)

def seq_ratio(a: str, b: str) -> float:
    a = normalize_text(a)
    b = normalize_text(b)
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()

def whole_word_overlap_score(query: str, candidate: str) -> float:
    qt = tokenize(query)
    ct = set(tokenize(candidate))
    if not qt:
        return 0.0
    hit = sum(1 for t in qt if t in ct)
    return hit / len(qt)

def soft_partial_token_score(query: str, candidate: str) -> float:
    qt = tokenize(query)
    c = normalize_text(candidate)
    if not qt or not c:
        return 0.0
    hit = 0
    for t in qt:
        if t and (t in c):
            hit += 1
    return hit / len(qt)

def year_score(q_year: str, c_year) -> float:
    q = normalize_text(q_year)
    q = re.sub(r"[^0-9]", "", q)
    if not q:
        return 0.0
    try:
        qv = int(q)
    except ValueError:
        return 0.0

    try:
        if pd.isna(c_year):
            return 0.0
        cv = int(float(c_year))
    except Exception:
        return 0.0

    if qv == cv:
        return 1.0
    if abs(qv - cv) == 1:
        return 0.6
    return 0.0


# =========================
# Heurística de match (core)
# =========================
def field_score(query: str, candidate: str) -> float:
    if not query or not str(query).strip():
        return 0.0

    s_seq = seq_ratio(query, candidate)
    s_whole = whole_word_overlap_score(query, candidate)
    s_part = soft_partial_token_score(query, candidate)

    combined = max(
        s_seq,
        0.70 * s_whole + 0.30 * s_seq,
        0.55 * s_whole + 0.25 * s_seq + 0.20 * s_part
    )
    return float(max(0.0, min(1.0, combined)))

def total_score(q_author: str, q_title: str, q_year: str, q_extra: str, row: pd.Series) -> float:
    W_TITLE = 0.52
    W_AUTHOR = 0.30
    W_YEAR = 0.13
    W_EXTRA = 0.05

    s_title = field_score(q_title, row.get("titulo", ""))
    s_author = field_score(q_author, row.get("autor", ""))
    s_year = year_score(q_year, row.get("ano", None))
    s_extra = field_score(q_extra, row.get("extra", ""))

    active = []
    if str(q_title).strip():
        active.append((W_TITLE, s_title))
    if str(q_author).strip():
        active.append((W_AUTHOR, s_author))
    if str(q_year).strip():
        active.append((W_YEAR, s_year))
    if str(q_extra).strip():
        active.append((W_EXTRA, s_extra))

    if not active:
        return 0.0

    wsum = sum(w for w, _ in active)
    return float(sum((w / wsum) * s for w, s in active))


REQUIRED_COLS = ["autor", "titulo", "tipo", "extra", "ano", "ref"]

@st.cache_data(show_spinner=False)
def load_excel_from_bytes(file_bytes: bytes) -> pd.DataFrame:
    df = pd.read_excel(file_bytes)
    df.columns = [str(c).strip().lower() for c in df.columns]

    missing = [c for c in REQUIRED_COLS if c not in df.columns]
    if missing:
        raise ValueError(f"Colunas ausentes: {missing}. Esperado: {REQUIRED_COLS}")

    for c in ["autor", "titulo", "tipo", "extra", "ref"]:
        df[c] = df[c].fillna("").astype(str)

    return df


# =========================
# UI Streamlit (sempre visível)
# =========================
st.set_page_config(page_title="Matcher Bibliográfico", layout="centered")

st.title("Matcher Bibliográfico")
st.caption("Carregue o Excel, pesquise e obtenha os 10 melhores matches (coluna `ref`) em Markdown.")

uploaded = st.file_uploader("Planilha Excel (.xlsx) com colunas autor, titulo, tipo, extra, ano, ref", type=["xlsx"])

df = None
load_error = None

if uploaded is not None:
    try:
        df = load_excel_from_bytes(uploaded.getvalue())
    except Exception as e:
        load_error = str(e)

with st.expander("Diagnóstico", expanded=False):
    st.write("Arquivo carregado:", uploaded.name if uploaded is not None else "nenhum")
    if load_error:
        st.error(load_error)
    if df is not None:
        st.write("Linhas:", len(df))
        st.write("Colunas:", list(df.columns))
        st.dataframe(df.head(5), use_container_width=True)

st.divider()

col1, col2 = st.columns(2)
with col1:
    q_author = st.text_input("Autor")
    q_year = st.text_input("Ano")
with col2:
    q_title = st.text_input("Título")
    q_extra = st.text_input("Extra")

has_any_input = any(s.strip() for s in [q_author, q_title, q_year, q_extra])

search_disabled = (df is None) or (not has_any_input) or (load_error is not None)
do_search = st.button("Pesquisar", type="primary", disabled=search_disabled)

if df is None and uploaded is None:
    st.info("Envie a planilha Excel para habilitar a pesquisa.")
elif load_error:
    st.warning("Corrija o problema do Excel (veja em Diagnóstico) para habilitar a pesquisa.")
elif not has_any_input:
    st.info("Preencha pelo menos 1 campo para habilitar a pesquisa.")
elif do_search:
    with st.spinner("Calculando matches..."):
        scores = []
        for idx, row in df.iterrows():
            sc = total_score(q_author, q_title, q_year, q_extra, row)
            if sc > 0:
                scores.append((sc, idx))
        scores.sort(reverse=True, key=lambda x: x[0])
        top = scores[:10]

    st.subheader("Top 10 resultados")
    if not top:
        st.info("Nenhum match relevante encontrado.")
    else:
        for rank, (sc, idx) in enumerate(top, start=1):
            ref_md = df.at[idx, "ref"]
            st.markdown(f"**{rank}.** (score: `{sc:.3f}`)")
            st.markdown(ref_md)  # renderiza Markdown
            st.markdown("---")
