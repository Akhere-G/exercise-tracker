def test_exercise_paging_is_bounded(client, auth_headers):
    assert client.get("/api/exercises?page=0", headers=auth_headers).status_code == 422
