from typing import Optional, Protocol

from app.config import settings

TIMEOUT_SECS = 10


class TextProvider(Protocol):
    """Anything that can turn a prompt into text. Add a provider by implementing this."""

    name: str

    def generate(self, prompt: str, system: str) -> Optional[str]: ...


class GeminiProvider:
    name = "Gemini"

    def generate(self, prompt: str, system: str) -> Optional[str]:
        from google import genai
        from google.genai import types

        client = genai.Client(
            api_key=settings.gemini_api_key,
            http_options=types.HttpOptions(timeout=TIMEOUT_SECS * 1000),
        )
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(system_instruction=system),
        )
        return response.text


class GroqProvider:
    name = "Groq"

    def generate(self, prompt: str, system: str) -> Optional[str]:
        from groq import Groq

        completion = Groq(api_key=settings.groq_api_key).chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            timeout=TIMEOUT_SECS,
        )
        return completion.choices[0].message.content


DEFAULT_PROVIDERS: tuple[TextProvider, ...] = (GeminiProvider(), GroqProvider())
