import unittest

from fastapi.testclient import TestClient

from backend.functions.lookup_citations_service import (
    SCORE_MINIMO_FALLBACK,
    carregar_indice_lexical,
    coletar_manifesto_lexical,
    encontrar,
    lookup_citations,
    processar_paragrafos,
    separar_paragrafos,
)
from backend.main import app


class LookupCitationsServiceTests(unittest.TestCase):
    def test_separar_paragrafos_unifica_linhas_e_divide_por_linhas_em_branco(self) -> None:
        texto = "Primeira linha\nsegunda linha\n\nTerceira linha\n\n\nQuarta"

        paragrafos = separar_paragrafos(texto)

        self.assertEqual(paragrafos, ["Primeira linha segunda linha", "Terceira linha", "Quarta"])

    def test_lookup_citations_retains_known_match_with_page(self) -> None:
        trecho = (
            "Abdicações. As abdicações cosmoéticas, quando vividas com discernimento, "
            "podem qualificar a evolução consciencial."
        )

        result = lookup_citations(trecho)

        self.assertEqual(result["total"], 1)
        self.assertEqual(result["paragraphs"], [trecho])
        self.assertGreaterEqual(len(result["results"]), 1)
        self.assertNotEqual(result["results"][0]["book"], "N/D")
        self.assertNotEqual(result["results"][0]["page"], "N/D")

    def test_lookup_citations_returns_reference_fields(self) -> None:
        trecho = (
            "Abdicações. As abdicações cosmoéticas, quando vividas com discernimento, "
            "podem qualificar a evolução consciencial."
        )

        result = lookup_citations(trecho)
        item = result["results"][0]

        self.assertIn("matchedRow", item)
        self.assertIn("matchedReference", item)

    def test_lookup_citations_returns_full_cell_text_as_matched_paragraph(self) -> None:
        trecho = (
            "AbdicaÃ§Ãµes. As abdicaÃ§Ãµes cosmoÃ©ticas, quando vividas com discernimento, "
            "podem qualificar a evoluÃ§Ã£o consciencial."
        )

        result = lookup_citations(trecho)
        item = result["results"][0]
        indice_lexical = carregar_indice_lexical()
        entrada_esperada = next(
            entrada
            for entrada in indice_lexical["entradas"]
            if entrada["arquivo"] == item["book"] and entrada["ordem"] == item["matchedRow"]
        )

        self.assertEqual(item["matchedParagraph"], entrada_esperada["texto"])
        self.assertEqual(item["matchedParagraph"], item["matchedParagraph"].strip())

    def test_encontrar_uses_global_fallback_when_context_window_has_no_match(self) -> None:
        indice_lexical = carregar_indice_lexical()
        entradas = indice_lexical["entradas"]
        self.assertGreater(len(entradas), 10)
        texto = entradas[-1]["texto"]
        entradas_contexto = entradas[:3]

        result = encontrar(texto, indice_lexical, entradas_contexto, SCORE_MINIMO_FALLBACK)

        self.assertIsNotNone(result["_arquivo"])
        self.assertGreater(result["score"], 0)

    def test_process_cache_keeps_manifest_stable(self) -> None:
        manifesto = coletar_manifesto_lexical()
        indice_a = carregar_indice_lexical()
        indice_b = carregar_indice_lexical()

        self.assertEqual(manifesto, coletar_manifesto_lexical())
        self.assertIs(indice_a, indice_b)

    def test_processar_paragrafos_returns_dataframe_with_expected_columns(self) -> None:
        indice_lexical = carregar_indice_lexical()
        trecho = (
            "Abdicações. As abdicações cosmoéticas, quando vividas com discernimento, "
            "podem qualificar a evolução consciencial."
        )

        dataframe, _ = processar_paragrafos(
            [trecho],
            indice_lexical,
            {},
            None,
            2,
            3,
            SCORE_MINIMO_FALLBACK,
        )

        self.assertIn("Livro", dataframe.columns)
        self.assertIn("Pagina", dataframe.columns)
        self.assertIn("Similaridade", dataframe.columns)
        self.assertEqual(len(dataframe), 1)


class LookupCitationsApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_lookup_citations_endpoint_returns_400_for_empty_text(self) -> None:
        response = self.client.post(
            "/api/apps/lexical/citations/lookup",
            json={"text": "   ", "paginasAntes": 2, "paginasDepois": 3},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Parametro 'text' e obrigatorio.", response.text)


if __name__ == "__main__":
    unittest.main()
