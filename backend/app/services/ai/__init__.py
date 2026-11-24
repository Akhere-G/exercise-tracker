import json
import logging
from collections.abc import Sequence
from typing import Any

from app.exceptions import AIUnavailable
from app.services.ai.providers import DEFAULT_PROVIDERS, TextProvider

logger = logging.getLogger(__name__)


def generate_text(
    prompt: str,
    system: str,
    providers: Sequence[TextProvider] | None = None,
) -> str:
    """The first provider's answer, falling back to the next when one fails."""
    for provider in providers or DEFAULT_PROVIDERS:
        try:
            if text := provider.generate(prompt, system):
                return text
        except Exception as exc:
            logger.warning("%s request failed: %s", provider.name, type(exc).__name__)
    raise AIUnavailable()


def extract_json(raw: str | None) -> Any:
    """Parse a JSON reply, tolerating a Markdown code fence around it."""
    text = (raw or "").strip()
    if "```" in text:
        text = text.split("```")[1].strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()
    return json.loads(text)
