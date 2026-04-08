# ultis/gemini_teacher.py
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
        Bạn là AI phân tích ý định. Hãy xác định nguồn tri thức phù hợp nhất cho câu hỏi.

        Lịch sử: {history_text}
        Câu hỏi: "{user_text}"
        Goals: {available_goals}

        PHÂN LOẠI KNOWLEDGE_SOURCE:
        1. "internal": Hỏi về tài liệu của nội bộ, dự án GrowUp AI, code nội bộ, file PDF đã upload.
        2. "external": Hỏi về tin tức thời sự, giá xăng dầu hôm nay, kiến thức phổ thông, sự kiện 2024-2026.
        3. "hybrid": Cần cả tài liệu nội bộ và tra cứu thêm bên ngoài.

        Trả về đúng JSON:
        {{
          "goal": "...",
          "confidence": 0.0-1.0,
          "requires_external_knowledge": true/false,
          "knowledge_source": "internal" | "external" | "hybrid",
          "explanation": "tại sao chọn nguồn này"
        }}
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
        raw_text = response.text.strip()

        # 1. Xóa Markdown code blocks nếu có
        clean_json = raw_text.replace("```json", "").replace("```", "").strip()

        return json.loads(clean_json)
    except Exception as e:
        print(f"[Gemini Understand ERROR] {e} | Raw: {raw_text[:100]}")
        # Trả về mặc định để không dừng hệ thống
        return {
            "goal": "general_chat",
            "knowledge_source": "external",
            "confidence": 0.1,
        }

    except Exception as e:
        print(f"[Gemini Understand ERROR] {e}")
        return fallback_understand(user_text)


def ask_gemini_to_reason(
    question: str,
    context_info: str = "",
    history: list = None,
    temperature: float = 0.3,
    max_tokens: int = 2000,
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
    system_instruction = (
        "Bạn là GrowUp AI - Trợ lý đa năng chuyên nghiệp.\n"
        "Nếu trong câu hỏi có những thứ liên quan đến số liệu, thống kê, ... hãy tìm hiểu kỹ sau đó mới trả lời.\n"
        "Nếu câu hỏi mang tính thời sự (giá cả hôm nay, tin tức 24h qua) mà trong Context không có số liệu cụ thể, BẮT BUỘC phải chọn tool web_search thay vì rag.\n"
        "1. Nếu trả lời về lập trình (Coding): Sử dụng Markdown chuẩn, giải thích rõ ràng.\n"
        "2. Nếu là phân tích tài liệu (Analysis): Trình bày có cấu trúc, luận điểm rõ ràng.\n"
        "3. Nếu trả lời về các số liệu: Tìm kiếm từ các nguồn uy tín và có liên quan\n"
        "4. Ngôn ngữ: Tiếng Việt, giọng điệu thân thiện nhưng chuyên nghiệp."
    )
    prompt = f"""
Bạn là một trợ lý AI thông minh. Hãy sử dụng thông tin tham khảo để hiểu về chính sách, nhưng đối với các số liệu biến động hoặc tin tức mới nhất, hãy sử dụng kết quả từ công cụ tìm kiếm và kiến thức nền của bạn để bổ sung. Tuyệt đối không trả lời 'Tôi không biết' nếu vấn đề đó có thể tìm kiếm được trên internet.

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
                system_instruction=system_instruction,
            ),
        )
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini Reasoning ERROR] {e}")
        return f"[Lỗi Gemini] {str(e)}"
