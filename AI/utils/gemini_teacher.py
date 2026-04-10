# ultis/gemini_teacher.py
import os
import types
from dotenv import load_dotenv
import json
from utils.helpers import get_random_api_key
from core.engine import get_rag_context as local_rag_query
from google import genai
from google.genai import types as genai_types

load_dotenv()
current_key = get_random_api_key()
gemini_client = genai.Client(api_key=current_key) if current_key else None


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
    if not gemini_client:
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
    raw_text = ""
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                temperature=0.3,
                system_instruction=prompt,
                stream=True,  # Kích hoạt streaming
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


async def ask_gemini_to_reason_stream(
    question: str,
    context_info: str,
    history: list = None,
    temperature: float = 0.3,
    max_tokens: int = 2000,
):

    if not gemini_client:
        yield "[Lỗi] Không kết nối được Gemini."
        return

    # 1. Xử lý Lịch sử (Y hệt bản thường)
    history_text = ""
    if history:
        history_text = "\n".join(
            [
                f"{'User' if m['role']=='user' else 'AI'}: {m['content'][:300]}"
                for m in history[-6:]
            ]
        )

    # 2. Định nghĩa System Instruction
    system_instruction = (
        "Bạn là GrowUp AI - Trợ lý đa năng chuyên nghiệp.\n"
        "Nếu trong câu hỏi có những thứ liên quan đến số liệu, thống kê, hãy tìm hiểu kỹ sau đó mới trả lời.\n"
        "1. Nếu trả lời về lập trình (Coding): Sử dụng Markdown chuẩn, giải thích rõ ràng.\n"
        "2. Nếu là phân tích tài liệu (Analysis): Trình bày có cấu trúc, luận điểm rõ ràng.\n"
        "3. Ngôn ngữ: Tiếng Việt, giọng điệu thân thiện nhưng chuyên nghiệp."
    )

    # 3. Tạo Prompt đầy đủ (Copy từ bản thường sang)
    prompt = f"""
Bạn là một trợ lý AI thông minh. Hãy sử dụng thông tin tham khảo để hiểu về chính sách, nhưng đối với các số liệu biến động hoặc tin tức mới nhất, hãy sử dụng kết quả từ công cụ tìm kiếm và kiến thức nền của bạn để bổ sung.

Lịch sử cuộc trò chuyện:
{history_text or "Không có lịch sử."}

Thông tin tham khảo:
{context_info}

Câu hỏi hiện tại: {question}

Yêu cầu:
1. Trả lời bằng tiếng Việt, giọng thân thiện.
2. Ưu tiên sử dụng "Thông tin tham khảo". 
3. Nếu không có trong context, hãy dùng kiến thức chung và nói rõ "Theo kiến thức chung...".
"""

    try:
        # 4. Gọi Stream API
        # Lưu ý: Dat đổi model thành "gemini-2.0-flash" nếu bản 2.5 báo lỗi quota nhé
        response = gemini_client.models.generate_content_stream(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
                system_instruction=system_instruction,
            ),
        )

        # 5. Yield từng chunk văn bản
        for chunk in response:
            if chunk.text:
                yield chunk.text

    except Exception as e:
        print(f"[Gemini Stream ERROR] {e}")
        yield f"[Lỗi Stream Gemini] {str(e)}"
