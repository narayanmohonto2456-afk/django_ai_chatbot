import json
import os

import requests


OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://localhost:11434"
)

OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "llama3.2:3b"
)


def generate_ai_response(messages):
    """
    Send conversation history to Ollama
    and return the complete assistant response.
    """

    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
    }

    response = requests.post(
        f"{OLLAMA_URL}/api/chat",
        json=payload,
        timeout=120,
    )

    response.raise_for_status()

    data = response.json()

    return data["message"]["content"]


def stream_ai_response(messages):
    """
    Stream an AI response from Ollama token-by-token.
    """

    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": True,
    }

    with requests.post(
        f"{OLLAMA_URL}/api/chat",
        json=payload,
        stream=True,
        timeout=120,
    ) as response:

        response.raise_for_status()

        for line in response.iter_lines(
            decode_unicode=True
        ):
            if not line:
                continue

            data = json.loads(line)

            if "error" in data:
                raise RuntimeError(
                    data["error"]
                )

            message = data.get(
                "message",
                {}
            )

            content = message.get(
                "content",
                ""
            )

            if content:
                yield content

            if data.get("done"):
                break