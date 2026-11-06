import pytest
from app.exceptions import AIUnavailable
from app.services import ai


class Stub:
    def __init__(self, name, reply=None, error=None):
        self.name = name
        self.reply = reply
        self.error = error
        self.calls = 0

    def generate(self, prompt, system):
        self.calls += 1
        if self.error:
            raise self.error
        return self.reply


def test_generate_text_uses_the_first_provider_that_answers():
    first, second = Stub("a", "one"), Stub("b", "two")

    assert ai.generate_text("p", "s", [first, second]) == "one"
    assert second.calls == 0


def test_generate_text_falls_back_when_a_provider_fails_or_is_empty():
    failing, empty, working = Stub("a", error=RuntimeError()), Stub("b", ""), Stub("c", "ok")

    assert ai.generate_text("p", "s", [failing, empty, working]) == "ok"


def test_generate_text_raises_when_every_provider_fails():
    with pytest.raises(AIUnavailable):
        ai.generate_text("p", "s", [Stub("a", error=RuntimeError()), Stub("b", None)])


@pytest.mark.parametrize(
    "raw",
    ['{"a": 1}', '```json\n{"a": 1}\n```', '```\n{"a": 1}\n```'],
)
def test_extract_json_handles_code_fences(raw):
    assert ai.extract_json(raw) == {"a": 1}


def test_extract_json_rejects_prose():
    with pytest.raises(ValueError):
        ai.extract_json("Sure! Here you go")
