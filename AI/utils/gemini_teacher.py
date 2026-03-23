# core/gemini_teacher.py
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import json

from RAG.query import query as local_rag_query

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

# ... (Giữ nguyên hàm fallback và ask_gemini_to_understand) ...


def ask_gemini_to_reason(
    question: str,
    context_info: str = "",
    history: list = None,
    temperature: float = 0.3,
    max_tokens: int = 1000,
) -> str:
    if not client:
        return "[Lỗi] Không kết nối được Gemini."

    # --- BƯỚC MỚI: TỰ ĐỘNG LẤY DỮ LIỆU TỪ RAG NẾU CHƯA CÓ CONTEXT ---
    if not context_info:
        try:
            # Lấy dữ liệu thô từ hệ thống RAG cục bộ (Llama 3.1 đã xử lý sơ bộ)
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

    # Prompt nâng cấp để yêu cầu Gemini làm "Trọng tài" xử lý dữ liệu từ RAG
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
            model="gemini-1.5-flash",  # Hoặc gemini-2.0-flash-exp nếu bạn muốn tốc độ cao hơn
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
