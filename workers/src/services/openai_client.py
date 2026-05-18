import os
from openai import OpenAI

_client: OpenAI | None = None


def get_openai() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


def chat(system_prompt: str, user_prompt: str, response_format: str = "json_object") -> str:
    """
    Wraps OpenAI chat completions for GPT-4o.
    When response_format='json_object', the system prompt must explicitly
    instruct the model to return JSON only (OpenAI enforces this).
    """
    client = get_openai()
    kwargs = {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
    }
    if response_format == "json_object":
        kwargs["response_format"] = {"type": "json_object"}

    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content or ""
