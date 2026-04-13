# core/understand.py
import re

from core.engine import get_semantic_cache
from core.goals import AVAILABLE_GOALS
from state import add_new_task_example
import httpx
import json

UNDERSTAND_CACHE = {}


def understand(user_text, state):
    # Prompt yêu cầu Ollama phân loại Intent
    system_prompt = """
    Bạn là bộ phận phân loại ý định (Intent Classifier).
    Trả về kết quả dưới dạng JSON với key là "goal".
    Các goal bao gồm: {AVAILABLE_GOALS}.
    """

    url = "http://localhost:11434/api/generate"
    payload = {
        "model": "phi3",
        "prompt": f"{system_prompt}\nUser text: {user_text}",
        "stream": False,
        "format": "json",  # Bắt Ollama trả về JSON chuẩn
    }

    try:
        response = httpx.post(url, json=payload, timeout=10.0)
        result = response.json()
        # Parse JSON từ field 'response' của Ollama
        intent_data = json.loads(result["response"])
        return intent_data  # Trả về {"goal": "..."} cho Planner
    except Exception as e:
        print(f"Ollama Understand Error: {e}")
        # Nếu Ollama lỗi, fallback về giá trị mặc định để app không chết
        return {"goal": "general_chat"}
