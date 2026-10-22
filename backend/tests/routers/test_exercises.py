import pytest


@pytest.mark.parametrize("query", ["page=0", "page=-1", "limit=0", "limit=101"])
def test_exercise_paging_is_bounded(client, auth_headers, query):
    assert client.get(f"/api/exercises?{query}", headers=auth_headers).status_code == 422
