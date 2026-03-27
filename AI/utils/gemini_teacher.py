# core/gemini_teacher.py
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import json

from core.engine import get_rag_context as local_rag_query

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None


def fallback_understand(user_text):
    return {
        "goal": "information_seeking",
        "confidence": 0.3,
        "requires_external_knowledge": True,
        "explanation": "Fallback mode",
    }


def ask_gemini_to_understand(
    user_text: str,
    available_goals: list,
    intent_signal: str | None = None,
    history: list = None,
):
    if not client:
        return fallback_understand(user_text)

    history_text = ""
    if history:
        history_text = "\n".join(
            [
                f"- {'User' if msg['role']=='user' else 'AI'}: {msg['content'][:200]}"
                for msg in history[-4:]
            ]
        )

    prompt = f"""
Bạn là AI hiểu vấn đề người dùng.
Lịch sử cuộc trò chuyện gần đây:
{history_text or "Chưa có lịch sử."}

Câu hỏi hiện tại: "{user_text}"


Intent gợi ý: {intent_signal or "Không có"}


Các goal hợp lệ: {available_goals}


Trả về đúng JSON:
{{
  "goal": "...",
  "confidence": 0.0-1.0,
  "requires_external_knowledge": true/false,
  "explanation": "lý do ngắn gọn"
}}
Chỉ chọn goal trong danh sách. Nếu không chắc thì goal = "general_chat".



"""

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0,
                max_output_tokens=500,
                response_mime_type="application/json",
            ),
        )
        return json.loads(response.text)

    except Exception as e:
        print(f"[Gemini Understand ERROR] {e}")
        return fallback_understand(user_text)


def ask_gemini_to_reason(
    question: str,
    context_info: str = "",
    history: list = None,
    temperature: float = 0.3,
    max_tokens: int = 1000,
) -> str:
    if not client:
        return "[Lỗi] Không kết nối được Gemini."

    if not context_info:
        try:
            context_info = local_rag_query(question)
            print(f"[RAG Context] Đã tìm thấy dữ liệu liên quan từ tài liệu nội bộ.")
        except Exception as e:
            print(f"[RAG Error] Không thể lấy dữ liệu: {e}")
            context_info = "Không tìm thấy thông tin bổ sung trong tài liệu nội bộ."

    history_text = ""
    if history:
        history_text = "\n".join(
            [
                f"{'User' if m['role']=='user' else 'AI'}: {m['content'][:300]}"
                for m in history[-6:]
            ]
        )

    prompt = f"""
Bạn là một trợ lý AI thông minh. Nhiệm vụ của bạn là trả lời câu hỏi dựa trên Lịch sử và Thông tin tham khảo dưới đây.

Lịch sử cuộc trò chuyện:
{history_text or "Không có lịch sử."}

Thông tin tham khảo (Từ tài liệu RAG nội bộ):
{context_info}

Câu hỏi hiện tại: {question}

Yêu cầu:
1. Trả lời bằng tiếng Việt, giọng thân thiện, chuyên nghiệp.
2. Ưu tiên sử dụng "Thông tin tham khảo" để trả lời. 
3. Nếu "Thông tin tham khảo" không có câu trả lời, hãy dùng kiến thức chung của bạn nhưng phải nói rõ là "Theo kiến thức chung...".
4. Tuyệt đối không bịa đặt thông tin nếu cả hai nguồn đều không có.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini Reasoning ERROR] {e}")
        return f"[Lỗi Gemini] {str(e)}"
