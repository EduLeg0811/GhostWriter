import re
import unicodedata
from bisect import bisect_left, bisect_right
from collections import Counter, defaultdict
from pathlib import Path
import pickle

import pandas as pd
import streamlit as st
from rapidfuzz import fuzz


BASE_DIR = Path(__file__).resolve().parent
LEXICAL_DIR = BASE_DIR / "Lexical"
INDEX_CACHE_PATH = BASE_DIR / ".lexical_index.pkl"
STOPWORDS = {
    "a",
    "as",
    "ao",
    "aos",
    "com",
    "da",
    "das",
    "de",
    "do",
    "dos",
    "e",
    "em",
    "na",
    "nas",
    "no",
    "nos",
    "o",
    "os",
    "ou",
    "para",
    "por",
    "que",
    "se",
    "sem",
    "um",
    "uma",
}
MAX_TOKENS_DOCUMENTO = 60
MAX_TOKENS_CONSULTA = 12
MAX_CANDIDATOS_GLOBAIS = 1200
SCORE_MINIMO_FALLBACK = 70


def normalizar(texto):
    texto = "" if texto is None else str(texto)
    texto = texto.lower()
    texto = unicodedata.normalize("NFD", texto)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    texto = re.sub(r"\s+", " ", texto)
    return texto.strip()


def tokenizar(texto, limite):
    tokens = []
    vistos = set()

    for token in re.findall(r"[a-z0-9]+", texto):
        if len(token) < 4 or token in STOPWORDS or token in vistos:
            continue
        vistos.add(token)
        tokens.append(token)
        if len(tokens) >= limite:
            break

    return tokens


def contar_alnum(texto):
    return sum(1 for char in texto if char.isalnum())


def extrair_trecho(entrada, trecho, n=200):
    pos = entrada["texto_norm"].find(trecho)
    if pos != -1:
        return entrada["texto"][pos : pos + n]
    return entrada["texto"][:n]


def pagina_valida(valor):
    if pd.isna(valor):
        return None
    try:
        return int(valor)
    except (TypeError, ValueError):
        try:
            return int(float(valor))
        except (TypeError, ValueError):
            return None


def criar_resultado_vazio():
    return {
        "pagina": None,
        "score": 0,
        "metodo": None,
        "arquivo_lexical": None,
        "titulo_lexical": None,
        "link_lexical": None,
        "paragrafo_lexical": "",
        "_arquivo": None,
        "_referencia_contexto": None,
    }


def criar_resultado(entrada, score, metodo, trecho_busca):
    return {
        "pagina": entrada["pagina"],
        "score": score,
        "metodo": metodo,
        "arquivo_lexical": entrada["arquivo"],
        "titulo_lexical": entrada["titulo"],
        "link_lexical": entrada["link"],
        "paragrafo_lexical": extrair_trecho(entrada, trecho_busca),
        "_arquivo": entrada["arquivo"],
        "_referencia_contexto": entrada["referencia_contexto"],
    }


def resultado_para_saida(paragrafo_entrada, resultado):
    return {
        "Paragrafo entrada": paragrafo_entrada,
        "Paragrafo correspondente encontrado": resultado["paragrafo_lexical"],
        "Livro": resultado["arquivo_lexical"],
        "Pagina": resultado["pagina"] if resultado["pagina"] is not None else "N/D",
        "Similaridade": round(float(resultado["score"]), 2),
        "Metodo": resultado["metodo"] or "sem_match",
    }


def coletar_manifesto_lexical():
    manifesto = []

    for caminho in sorted(LEXICAL_DIR.glob("*.xlsx")):
        stat = caminho.stat()
        manifesto.append(
            {
                "arquivo": caminho.name,
                "tamanho": stat.st_size,
                "mtime_ns": stat.st_mtime_ns,
            }
        )

    return manifesto


def construir_indice_lexical():
    entradas = []
    arquivos_indexados = {}
    indice_tokens = defaultdict(list)

    for caminho in sorted(LEXICAL_DIR.glob("*.xlsx")):
        df = pd.read_excel(
            caminho,
            usecols=lambda coluna: str(coluna).strip().lower() in {"text", "pagina", "title", "link"},
        )
        colunas = {str(coluna).strip().lower(): coluna for coluna in df.columns}
        coluna_texto = colunas.get("text")

        if coluna_texto is None:
            continue

        coluna_pagina = colunas.get("pagina")
        coluna_titulo = colunas.get("title")
        coluna_link = colunas.get("link")
        entradas_arquivo = []

        for ordem, row in enumerate(df.itertuples(index=False), start=1):
            texto = getattr(row, coluna_texto)
            if pd.isna(texto):
                continue

            texto = str(texto).strip()
            if not texto:
                continue

            texto_norm = normalizar(texto)
            pagina = pagina_valida(getattr(row, coluna_pagina)) if coluna_pagina else None
            titulo = str(getattr(row, coluna_titulo)).strip() if coluna_titulo and not pd.isna(getattr(row, coluna_titulo)) else None
            link = str(getattr(row, coluna_link)).strip() if coluna_link and not pd.isna(getattr(row, coluna_link)) else None
            referencia_contexto = pagina if pagina is not None else ordem
            entrada = {
                "arquivo": caminho.stem,
                "pagina": pagina,
                "titulo": titulo,
                "link": link,
                "texto": texto,
                "texto_norm": texto_norm,
                "tokens": set(tokenizar(texto_norm, MAX_TOKENS_DOCUMENTO)),
                "alnum_len": contar_alnum(texto_norm),
                "ordem": ordem,
                "referencia_contexto": referencia_contexto,
            }
            indice_entrada = len(entradas)
            entradas.append(entrada)
            entradas_arquivo.append(entrada)

            for token in entrada["tokens"]:
                indice_tokens[token].append(indice_entrada)

        arquivos_indexados[caminho.stem] = {
            "entradas": entradas_arquivo,
            "referencias": [entrada["referencia_contexto"] for entrada in entradas_arquivo],
        }

    return {
        "entradas": entradas,
        "arquivos": arquivos_indexados,
        "indice_tokens": {token: tuple(indices) for token, indices in indice_tokens.items()},
        "arquivos_disponiveis": sorted(arquivos_indexados),
    }


def carregar_indice_cacheado(manifesto_atual):
    if not INDEX_CACHE_PATH.exists():
        return None

    try:
        with INDEX_CACHE_PATH.open("rb") as arquivo_cache:
            payload = pickle.load(arquivo_cache)
    except (OSError, pickle.PickleError, EOFError, AttributeError, ValueError):
        return None

    if payload.get("manifesto") != manifesto_atual:
        return None

    indice = payload.get("indice")
    if not isinstance(indice, dict):
        return None

    indice["origem_indice"] = "cache_disco"
    return indice


def salvar_indice_cacheado(manifesto_atual, indice):
    payload = {
        "manifesto": manifesto_atual,
        "indice": {
            "entradas": indice["entradas"],
            "arquivos": indice["arquivos"],
            "indice_tokens": indice["indice_tokens"],
            "arquivos_disponiveis": indice["arquivos_disponiveis"],
        },
    }

    with INDEX_CACHE_PATH.open("wb") as arquivo_cache:
        pickle.dump(payload, arquivo_cache, protocol=pickle.HIGHEST_PROTOCOL)


@st.cache_resource(show_spinner=False)
def carregar_indice_lexical():
    if not LEXICAL_DIR.exists():
        raise FileNotFoundError(f"Pasta Lexical nao encontrada em {LEXICAL_DIR}")

    manifesto_atual = coletar_manifesto_lexical()
    indice_cacheado = carregar_indice_cacheado(manifesto_atual)
    if indice_cacheado is not None:
        return indice_cacheado

    indice = construir_indice_lexical()
    salvar_indice_cacheado(manifesto_atual, indice)
    indice["origem_indice"] = "reindexado"
    return indice


def selecionar_janela_entradas(indice_lexical, ultimo_resultado, paginas_antes, paginas_depois):
    if ultimo_resultado is None:
        return indice_lexical["entradas"]

    arquivo = ultimo_resultado["_arquivo"]
    referencia_base = ultimo_resultado["_referencia_contexto"]
    dados_arquivo = indice_lexical["arquivos"].get(arquivo)
    if not dados_arquivo or referencia_base is None:
        return indice_lexical["entradas"]

    inicio = referencia_base - paginas_antes
    fim = referencia_base + paginas_depois
    referencias = dados_arquivo["referencias"]
    indice_inicio = bisect_left(referencias, inicio)
    indice_fim = bisect_right(referencias, fim)

    janela = dados_arquivo["entradas"][indice_inicio:indice_fim]
    return janela or dados_arquivo["entradas"]


def match_inicio(trecho_inicio, entradas):
    if not trecho_inicio:
        return criar_resultado_vazio()

    for entrada in entradas:
        if trecho_inicio in entrada["texto_norm"]:
            return criar_resultado(entrada, 100, "inicio", trecho_inicio)

    return criar_resultado_vazio()


def candidato_fuzzy_valido(entrada, tokens_consulta, tamanho_consulta):
    if entrada["alnum_len"] < max(8, min(24, tamanho_consulta // 4)):
        return False

    if not tokens_consulta:
        return True

    return bool(entrada["tokens"] & tokens_consulta)


def match_fuzzy_refinado(trecho_fuzzy, entradas, tokens_consulta):
    if not trecho_fuzzy:
        return criar_resultado_vazio()

    melhor_entrada = None
    melhor_score = 0
    tamanho_consulta = contar_alnum(trecho_fuzzy)

    for entrada in entradas:
        if not candidato_fuzzy_valido(entrada, tokens_consulta, tamanho_consulta):
            continue

        score = fuzz.partial_ratio(
            trecho_fuzzy,
            entrada["texto_norm"],
            score_cutoff=melhor_score,
        )
        if score > melhor_score:
            melhor_score = score
            melhor_entrada = entrada

    if melhor_entrada is None:
        return criar_resultado_vazio()

    return criar_resultado(melhor_entrada, melhor_score, "fuzzy_refinado", trecho_fuzzy)


def selecionar_candidatos_globais(trecho_fuzzy, indice_lexical):
    contagem_indices = Counter()

    for token in tokenizar(trecho_fuzzy, MAX_TOKENS_CONSULTA):
        for indice_entrada in indice_lexical["indice_tokens"].get(token, ()):
            contagem_indices[indice_entrada] += 1

    if not contagem_indices:
        return indice_lexical["entradas"]

    indices_ordenados = sorted(
        contagem_indices,
        key=lambda indice_entrada: (
            -contagem_indices[indice_entrada],
            abs(len(indice_lexical["entradas"][indice_entrada]["texto_norm"]) - len(trecho_fuzzy)),
        ),
    )
    return [indice_lexical["entradas"][indice] for indice in indices_ordenados[:MAX_CANDIDATOS_GLOBAIS]]


def separar_paragrafos(texto):
    blocos = re.split(r"\n\s*\n+", texto.strip())
    paragrafos = []

    for bloco in blocos:
        linhas = [linha.strip() for linha in bloco.splitlines() if linha.strip()]
        if not linhas:
            continue
        paragrafos.append(" ".join(linhas))

    return paragrafos


def encontrar(texto_original, indice_lexical, entradas_contexto, score_minimo_fallback):
    texto_original = str(texto_original)
    if not texto_original.strip():
        return criar_resultado_vazio()

    trecho_inicio = normalizar(texto_original[:120])
    trecho_fuzzy = normalizar(texto_original[:200])
    tokens_consulta = set(tokenizar(trecho_fuzzy, MAX_TOKENS_CONSULTA))

    resultado = match_inicio(trecho_inicio, entradas_contexto)
    if resultado["_arquivo"] is None:
        if entradas_contexto is indice_lexical["entradas"]:
            candidatos_globais = selecionar_candidatos_globais(trecho_fuzzy, indice_lexical)
            resultado = match_fuzzy_refinado(trecho_fuzzy, candidatos_globais, tokens_consulta)
        else:
            resultado = match_fuzzy_refinado(trecho_fuzzy, entradas_contexto, tokens_consulta)

    usa_contexto = entradas_contexto is not indice_lexical["entradas"]
    if not usa_contexto and resultado["_arquivo"] is not None:
        return resultado

    if resultado["_arquivo"] is None or (usa_contexto and resultado["score"] < score_minimo_fallback):
        candidatos_globais = selecionar_candidatos_globais(trecho_fuzzy, indice_lexical)
        resultado_global = match_inicio(trecho_inicio, candidatos_globais)

        if resultado_global["_arquivo"] is None:
            resultado_global = match_fuzzy_refinado(trecho_fuzzy, candidatos_globais, tokens_consulta)

        if resultado["_arquivo"] is None or resultado_global["score"] > resultado["score"]:
            return resultado_global

    return resultado


def processar_paragrafos(
    paragrafos,
    indice_lexical,
    cache_resultados,
    ultimo_resultado,
    paginas_antes,
    paginas_depois,
    score_minimo_fallback,
):
    resultados = []
    ultimo_resultado_lote = ultimo_resultado

    for texto_original in paragrafos:
        texto_original = str(texto_original)

        if texto_original in cache_resultados:
            resultado = cache_resultados[texto_original]
        else:
            entradas_contexto = selecionar_janela_entradas(
                indice_lexical,
                ultimo_resultado_lote,
                paginas_antes,
                paginas_depois,
            )
            resultado = encontrar(
                texto_original,
                indice_lexical,
                entradas_contexto,
                score_minimo_fallback,
            )
            cache_resultados[texto_original] = resultado

        resultados.append(resultado_para_saida(texto_original, resultado))

        if resultado["_arquivo"] is not None:
            ultimo_resultado_lote = resultado

    return pd.DataFrame(resultados), ultimo_resultado_lote


def main():
    st.title("Lookup Citations -> Lexical")
    st.markdown(
        """
        <style>
        .stApp {
            background: linear-gradient(180deg, #f5f2ea 0%, #f8f7f4 100%);
        }
        div[data-testid="stVerticalBlock"] div[data-testid="stDataFrame"] {
            background: #ffffff;
            border: 1px solid #e6dfd2;
            border-radius: 16px;
            padding: 0.5rem;
        }
        div[data-testid="stTextArea"] textarea {
            background: #fffdf8;
            border: 1px solid #ddd3c2;
            border-radius: 14px;
            min-height: 320px;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

    if not LEXICAL_DIR.exists():
        st.error(f"Pasta Lexical nao encontrada: {LEXICAL_DIR}")
        return

    indice_lexical = carregar_indice_lexical()
    st.caption(
        f"Base Lexical carregada com {len(indice_lexical['arquivos_disponiveis'])} arquivos e "
        f"{len(indice_lexical['entradas'])} trechos indexados. "
        f"Origem do indice: {indice_lexical.get('origem_indice', 'memoria')}."
    )
    st.markdown(
        "Cole o texto abaixo. O app separa os parágrafos por linhas em branco e busca cada um deles na base `Lexical`."
    )
    texto_entrada = st.text_area(
        "Texto de entrada",
        placeholder="Cole aqui vários parágrafos separados por uma linha em branco.",
    )
    paginas_antes = st.number_input("Janela antes", min_value=0, max_value=50, value=2, step=1)
    paginas_depois = st.number_input("Janela depois", min_value=0, max_value=50, value=3, step=1)

    if not st.button("Processar"):
        return

    paragrafos = separar_paragrafos(texto_entrada)
    if not paragrafos:
        st.warning("Informe ao menos um paragrafo separado por linhas em branco.")
        return

    total = len(paragrafos)
    cache_resultados = {}
    ultimo_resultado = None
    prog = st.progress(0)
    status = st.empty()
    status.info(f"Processando {total} paragrafos...")
    df_result, ultimo_resultado = processar_paragrafos(
        paragrafos,
        indice_lexical,
        cache_resultados,
        ultimo_resultado,
        paginas_antes,
        paginas_depois,
        SCORE_MINIMO_FALLBACK,
    )
    prog.progress(1.0)
    status.success("Processamento concluido.")

    st.dataframe(
        df_result,
        use_container_width=True,
        hide_index=True,
        column_config={
            "Paragrafo entrada": st.column_config.TextColumn("Paragrafo entrada", width="large"),
            "Paragrafo correspondente encontrado": st.column_config.TextColumn(
                "Paragrafo correspondente encontrado",
                width="large",
            ),
            "Livro": st.column_config.TextColumn("Livro", width="small"),
            "Pagina": st.column_config.TextColumn("Pagina", width="small"),
            "Similaridade": st.column_config.ProgressColumn(
                "Similaridade",
                format="%.1f",
                min_value=0,
                max_value=100,
                width="small",
            ),
            "Metodo": st.column_config.TextColumn("Metodo", width="small"),
        },
    )


if __name__ == "__main__":
    main()
