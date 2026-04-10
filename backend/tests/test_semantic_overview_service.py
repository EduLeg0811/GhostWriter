import unittest
from unittest.mock import patch

import numpy as np

from Build_Vector_Index.semantic_search_service import search_semantic_overview_with_total


class SemanticOverviewServiceTests(unittest.TestCase):
    @patch("Build_Vector_Index.semantic_search_service.list_semantic_indexes")
    @patch("Build_Vector_Index.semantic_search_service._load_semantic_index")
    @patch("Build_Vector_Index.semantic_search_service._get_semantic_query_vector")
    def test_semantic_overview_orders_globally_and_groups_by_index(
        self,
        mock_get_query_vector,
        mock_load_index,
        mock_list_indexes,
    ) -> None:
        mock_list_indexes.return_value = [
            {"id": "alpha", "label": "Alpha", "model": "m1"},
            {"id": "beta", "label": "Beta", "model": "m2"},
        ]
        mock_get_query_vector.side_effect = [
            np.array([1.0, 0.0], dtype=np.float32),
            np.array([1.0, 0.0], dtype=np.float32),
        ]
        mock_load_index.side_effect = [
            {
                "manifest": {"index_label": "Alpha", "model": "m1"},
                "metadata": [
                    {"row": 1, "text": "alpha-1", "metadata": {"title": "A1"}},
                    {"row": 2, "text": "alpha-2", "metadata": {"title": "A2"}},
                ],
                "embeddings": np.array([[0.92, 0.0], [0.51, 0.0]], dtype=np.float32),
            },
            {
                "manifest": {"index_label": "Beta", "model": "m2"},
                "metadata": [
                    {"row": 10, "text": "beta-1", "metadata": {"title": "B1"}},
                    {"row": 11, "text": "beta-2", "metadata": {"title": "B2"}},
                ],
                "embeddings": np.array([[0.88, 0.0], [0.77, 0.0]], dtype=np.float32),
            },
        ]

        total, groups = search_semantic_overview_with_total("cosmoetica", limit=3, api_key="key")

        self.assertEqual(total, 3)
        self.assertEqual([group["indexId"] for group in groups], ["alpha", "beta"])
        self.assertEqual(groups[0]["matches"][0]["text"], "alpha-1")
        self.assertEqual(groups[1]["matches"][0]["text"], "beta-1")
        self.assertEqual(groups[1]["matches"][1]["text"], "beta-2")
        self.assertEqual(groups[0]["totalFound"], 1)
        self.assertEqual(groups[1]["totalFound"], 2)

    @patch("Build_Vector_Index.semantic_search_service.list_semantic_indexes")
    @patch("Build_Vector_Index.semantic_search_service._load_semantic_index")
    @patch("Build_Vector_Index.semantic_search_service._get_semantic_query_vector")
    def test_semantic_overview_reuses_query_vector_per_model(
        self,
        mock_get_query_vector,
        mock_load_index,
        mock_list_indexes,
    ) -> None:
        mock_list_indexes.return_value = [
            {"id": "alpha", "label": "Alpha", "model": "shared"},
            {"id": "beta", "label": "Beta", "model": "shared"},
        ]
        mock_get_query_vector.side_effect = lambda raw_query, api_key, model, cache=None: cache.setdefault(
            model,
            np.array([1.0, 0.0], dtype=np.float32),
        )
        mock_load_index.side_effect = [
            {
                "manifest": {"index_label": "Alpha", "model": "shared"},
                "metadata": [{"row": 1, "text": "alpha", "metadata": {"title": "A"}}],
                "embeddings": np.array([[0.9, 0.0]], dtype=np.float32),
            },
            {
                "manifest": {"index_label": "Beta", "model": "shared"},
                "metadata": [{"row": 2, "text": "beta", "metadata": {"title": "B"}}],
                "embeddings": np.array([[0.8, 0.0]], dtype=np.float32),
            },
        ]

        total, groups = search_semantic_overview_with_total("holopensene", limit=2, api_key="key")

        self.assertEqual(total, 2)
        self.assertEqual(len(groups), 2)
        self.assertEqual(mock_get_query_vector.call_count, 2)
        first_cache = mock_get_query_vector.call_args_list[0].kwargs["cache"]
        second_cache = mock_get_query_vector.call_args_list[1].kwargs["cache"]
        self.assertIs(first_cache, second_cache)
        self.assertIn("shared", first_cache)

    @patch("Build_Vector_Index.semantic_search_service.list_semantic_indexes")
    @patch("Build_Vector_Index.semantic_search_service._load_semantic_index")
    @patch("Build_Vector_Index.semantic_search_service._get_semantic_query_vector")
    def test_semantic_overview_skips_invalid_indexes(
        self,
        mock_get_query_vector,
        mock_load_index,
        mock_list_indexes,
    ) -> None:
        mock_list_indexes.return_value = [
            {"id": "broken", "label": "Broken", "model": "m1"},
            {"id": "valid", "label": "Valid", "model": "m1"},
        ]
        mock_get_query_vector.return_value = np.array([1.0, 0.0], dtype=np.float32)
        mock_load_index.side_effect = [
            ValueError("old metadata"),
            {
                "manifest": {"index_label": "Valid", "model": "m1"},
                "metadata": [{"row": 3, "text": "valid", "metadata": {"title": "V"}}],
                "embeddings": np.array([[0.85, 0.0]], dtype=np.float32),
            },
        ]

        total, groups = search_semantic_overview_with_total("recin", limit=5, api_key="key")

        self.assertEqual(total, 1)
        self.assertEqual(len(groups), 1)
        self.assertEqual(groups[0]["indexId"], "valid")

    @patch("Build_Vector_Index.semantic_search_service.list_semantic_indexes")
    def test_semantic_overview_returns_empty_when_no_indexes(self, mock_list_indexes) -> None:
        mock_list_indexes.return_value = []

        total, groups = search_semantic_overview_with_total("recin", limit=5, api_key="key")

        self.assertEqual(total, 0)
        self.assertEqual(groups, [])


if __name__ == "__main__":
    unittest.main()
