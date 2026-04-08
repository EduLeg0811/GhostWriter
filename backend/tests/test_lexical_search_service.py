import unittest

from backend.functions.lexical_search_service import search_lexical_book_with_total, search_lexical_overview_with_total


class LexicalSearchServiceTests(unittest.TestCase):
    def test_book_search_includes_pagina_field(self) -> None:
        total, matches = search_lexical_book_with_total("LO", "abdicacoes", 3)

        self.assertGreaterEqual(total, 1)
        self.assertGreaterEqual(len(matches), 1)
        self.assertIn("pagina", matches[0])
        self.assertEqual(matches[0]["pagina"], "41")

    def test_lexical_overview_groups_dynamic_files_and_uses_fallback_label(self) -> None:
        total, groups = search_lexical_overview_with_total("abdicacoes", 3)

        self.assertGreaterEqual(total, 2)
        self.assertGreaterEqual(len(groups), 2)

        group_codes = {group["bookCode"] for group in groups}
        self.assertIn("LO", group_codes)
        self.assertIn("QUEST", group_codes)

        lo_group = next(group for group in groups if group["bookCode"] == "LO")
        quest_group = next(group for group in groups if group["bookCode"] == "QUEST")

        self.assertEqual(lo_group["bookLabel"], "Lexico de Ortopensatas")
        self.assertEqual(lo_group["matches"][0]["pagina"], "41")
        self.assertEqual(quest_group["bookLabel"], "QUEST")
        self.assertEqual(quest_group["fileStem"], "QUEST")
        self.assertGreaterEqual(quest_group["totalFound"], 1)


if __name__ == "__main__":
    unittest.main()
