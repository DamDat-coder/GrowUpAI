import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import state
import json
from sentence_transformers import util

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# Khởi tạo Client
client = genai.Client(api_key=api_key) if api_key else None


def fallback_understand(user_text):
    return {
        "goal": "information_seeking",
        "confidence": 0.3,
        "requires_external_knowledge": True,
        "explanation": "Fallback mode - default to information seeking",
    }


def ask_gemini_to_understand(
    user_text: str, available_goals: list, intent_signal: str | None = None
):
    print("user_text-gemini_teacher ", user_text)
    if not client:
        return fallback_understand(user_text)

    prompt = f"""
Bạn là một AI có nhiệm vụ HIỂU VẤN ĐỀ người dùng, không phải phân loại intent.

Câu người dùng:
\"{user_text}\"

Thông tin tham khảo (không bắt buộc đúng):
- Intent gợi ý từ hệ thống: {intent_signal}

Các goal hợp lệ:
{available_goals}

Hãy suy luận goal PHÙ HỢP NHẤT và trả về JSON:
{{
  "goal": "...",
  "confidence": 0.0,
  "requires_external_knowledge": true/false,
  "explanation": "giải thích ngắn gọn vì sao chọn goal này"
}}

Quy tắc:
- Chỉ chọn goal trong danh sách
- Nếu không chắc → goal = "unknown"
"""

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
            config={
                "temperature": 0,
                "response_mime_type": "application/json",
            },
        )
        return json.loads(response.text)

    except Exception as e:
        print(f"[Gemini ERROR] {e}")
        return fallback_understand(user_text)
