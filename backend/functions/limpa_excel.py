# app.py

import streamlit as st
import pandas as pd
import re
from pathlib import Path

st.set_page_config(page_title="Limpeza Excel Avançada", layout="wide")

st.title("🧹 Limpeza Avançada de Texto em Excel")
st.markdown("Substituição de caracteres invisíveis, normalização e auditoria completa.")

uploaded_file = st.file_uploader("Selecione o arquivo Excel", type=["xlsx", "xls"])

if uploaded_file:

    df_dict = pd.read_excel(uploaded_file, sheet_name=None)

    # Contadores globais
    stats = {
        "NBSP": 0,
        "Outros espaços Unicode": 0,
        "Zero-width": 0,
        "Quebras de linha": 0,
        "Tabs": 0,
        "Espaços duplos": 0,
        "Hífens": 0,
        "Aspas": 0
    }

    def clean_text(txt):
        if pd.isna(txt):
            return txt

        txt = str(txt)

        # NBSP
        stats["NBSP"] += txt.count("\u00A0")
        txt = txt.replace("\u00A0", " ")

        # Outros espaços Unicode
        stats["Outros espaços Unicode"] += txt.count("\u2009") + txt.count("\u202F")
        txt = txt.replace("\u2009", " ").replace("\u202F", " ")

        # Zero-width
        stats["Zero-width"] += txt.count("\u200B") + txt.count("\uFEFF")
        txt = txt.replace("\u200B", "").replace("\uFEFF", "")

        # Quebras de linha
        stats["Quebras de linha"] += txt.count("\n") + txt.count("\r")
        txt = txt.replace("\n", " ").replace("\r", " ")

        # Tabs
        stats["Tabs"] += txt.count("\t")
        txt = txt.replace("\t", " ")

        # Hífens
        stats["Hífens"] += txt.count("–") + txt.count("—")
        txt = txt.replace("–", "-").replace("—", "-")

        # Aspas
        stats["Aspas"] += (
            txt.count("“") + txt.count("”") +
            txt.count("‘") + txt.count("’")
        )
        txt = txt.replace("“", '"').replace("”", '"')
        txt = txt.replace("‘", "'").replace("’", "'")

        # Espaços duplicados
        before = len(txt)
        txt = re.sub(r" {2,}", " ", txt)
        after = len(txt)
        stats["Espaços duplos"] += (before - after)

        # Trim
        txt = txt.strip()

        return txt

    # Processar todas as abas
    cleaned_sheets = {}

    with st.spinner("Processando arquivo..."):
        for sheet_name, df in df_dict.items():
            cleaned_df = df.applymap(clean_text)
            cleaned_sheets[sheet_name] = cleaned_df

    # Nome do arquivo
    original_name = Path(uploaded_file.name)
    output_name = original_name.stem + "_OK.xlsx"

    output_path = Path.cwd() / output_name

    # Salvar
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        for sheet_name, df in cleaned_sheets.items():
            df.to_excel(writer, sheet_name=sheet_name, index=False)

    st.success("Arquivo processado com sucesso!")

    # Mostrar estatísticas
    st.subheader("📊 Estatísticas de limpeza")

    col1, col2 = st.columns(2)

    items = list(stats.items())

    for i, (k, v) in enumerate(items):
        if i % 2 == 0:
            col1.metric(k, v)
        else:
            col2.metric(k, v)

    # Download
    with open(output_path, "rb") as f:
        st.download_button(
            "⬇️ Baixar arquivo limpo",
            f,
            file_name=output_name
        )

    st.caption(f"Arquivo salvo em: {output_path}")