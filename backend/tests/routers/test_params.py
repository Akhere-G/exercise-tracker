import pytest
from fastapi import HTTPException

from app.routers.params import parse_id_list


def test_parses_a_comma_separated_list_and_skips_blanks():
    assert parse_id_list("1, 2,,3", "ids") == [1, 2, 3]
    assert parse_id_list("", "ids") == []


def test_a_non_integer_names_the_parameter_in_a_422():
    with pytest.raises(HTTPException) as caught:
        parse_id_list("1,abc", "exerciseIds")

    assert caught.value.status_code == 422
    assert "exerciseIds" in caught.value.detail
