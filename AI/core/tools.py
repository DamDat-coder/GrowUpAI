# core/tools.py
import os
import re
import types

from core.engine import get_rag_context
from ddgs import DDGS
from core.ingester import embed, add_interaction_to_db, is_garbage
from utils.gemini_teacher import ask_gemini_to_reason_stream
import state
from google import genai
from google.genai import types as genai_types

GLOBAL_TOOLS_REGISTRY = {}
api_key = os.getenv("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=api_key) if api_key else None


# 2. Định nghĩa Decorator
def register_tool(name):
    def decorator(func):
        GLOBAL_TOOLS_REGISTRY[name] = func
        return func

    return decorator


class LocalFile:
    def __init__(self, path):
        self.filename = os.path.basename(path)
        self.path = path

    def save(self, dest):
        import shutil

        shutil.copy(self.path, dest)


@register_tool("ingest_file")
def tool_ingest_file(user_input: str, context: dict):
    print(f"    [Tool] Đang xử lý yêu cầu nạp tài liệu...")

    match = re.search(r"([\w\d\-\.]+\.pdf)", user_input)

    if not match:
        return "Tôi không tìm thấy tên file .pdf nào trong yêu cầu của bạn."

    file_name = match.group(1)
    full_path = os.path.join(state.DATA_FOLDER, file_name)

    if os.path.exists(full_path):
        print(full_path)
        success = embed(full_path, is_path=True)
        return f"Đã học xong file '{file_name}' trong thư mục dữ liệu."
    else:
        return f"Không tìm thấy file '{file_name}' trong thư mục {state.DATA_FOLDER}. Bạn đã copy file vào đó chưa?"


@register_tool("rag_search")
def tool_rag_search(user_input: str, context: dict):
    print(f"    [Tool] Đang truy vấn tài liệu nội bộ cho: {user_input}...")

    is_deep = "phân tích" in user_input.lower() or "tóm tắt" in user_input.lower()
    k_value = 10 if is_deep else 4

    rag_data = get_rag_context(user_input, k=k_value)
    context["rag_result"] = rag_data
    return rag_data


@register_tool("web_search")
def tool_web_search(user_input: str, context: dict):
    print(f"    [Tool] Đang tìm kiếm: {user_input}...")
    try:
        with DDGS() as ddgs:
            results = [r for r in ddgs.text(user_input, max_results=3)]
            return "\n".join([f"- {r['body']}" for r in results])
    except Exception as e:
        return f"Lỗi tìm kiếm: {e}"


@register_tool("ask_llm")
async def tool_llm_reasoning(user_input: str, context: dict):
    web_data = context.get("web_search", "")
    rag_data = context.get("rag_result", "")
    original_question = context.get("original_question", user_input)

    combined_context = f"RAG: {rag_data}\nWEB: {web_data}"

    # Trả về generator để Executor yield ra ngoài FastAPI
    return ask_gemini_to_reason_stream(
        question=original_question,
        context_info=combined_context,
        history=state.CONVERSATION_HISTORY,
    )


@register_tool("compute")
def tool_calculator(expression: str):
    from tasks.calculator import Calculator

    calc = Calculator()
    return calc.calculate(expression)


@register_tool("rewrite_search_query")
def tool_rewrite_search_query(user_text: str, execution_context: dict) -> str:
    """
    Nâng cấp: Chuyển câu hỏi tự nhiên thành bộ từ khóa tìm kiếm (Search Queries).
    """
    if not gemini_client:
        return user_text

    system_instruction = (
        "Bạn là chuyên gia tối ưu hóa truy vấn tìm kiếm (SEO Search Expert).\n"
        "Nhiệm vụ: Chuyển câu hỏi dài dòng của người dùng thành một chuỗi từ khóa tìm kiếm ngắn gọn, hiệu quả.\n"
        "Quy tắc:\n"
        "1. Loại bỏ từ cảm thán, từ nối (là ai, cho hỏi, danh tính, đợt vừa rồi...).\n"
        "2. Giữ lại các thực thể (Tên người, chức vụ, địa danh, mốc thời gian).\n"
        "3. Nếu câu hỏi có mốc thời gian mơ hồ (vừa rồi), hãy thay bằng năm hiện tại (2026).\n"
        "4. Chỉ trả về chuỗi từ khóa, không giải thích."
    )

    prompt = f"Câu hỏi người dùng: '{user_text}'"

    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                temperature=0.2,  # Thấp để tránh sáng tạo quá đà
                system_instruction=system_instruction,
                max_output_tokens=100,
            ),
        )
        query = response.text.strip().replace('"', "")
        print(f"    [Rewrite Result]: {query}")
        return query
    except Exception as e:
        print(f"[Rewrite Error]: {e}")
        return user_text  # Fallback dùng text gốc


@register_tool("smart_intelligence")
def tool_smart_intelligence(user_input: str, context: dict):
    # 1. Thử hỏi bộ nhớ Local
    rag_data = get_rag_context(user_input)

    final_answer = None

    if rag_data != "DỮ LIỆU TRỐNG":
        print("    [Success] Tìm thấy kiến thức local, đang nhờ Gemini phân tích...")
        final_answer = ask_gemini_to_reason_stream(user_input, context_info=rag_data)

    # 2. Nếu RAG không có dữ liệu HOẶC Gemini không trả lời được từ RAG đó
    # Kiểm tra thêm: nếu final_answer chứa các câu từ chối của AI
    if (
        not final_answer
        or "không thể trả lời" in final_answer.lower()
        or "không có thông tin" in final_answer.lower()
    ):
        print("    [Fallback] Local không đủ thông tin, chuyển sang Web Search...")

        query = tool_rewrite_search_query(user_input, context)
        web_data = tool_web_search(query, context)
        final_answer = ask_gemini_to_reason_stream(user_input, context_info=web_data)

    # 3. Tự học (Chỉ học những thứ chất lượng)
    if final_answer and not is_garbage(
        final_answer
    ):  # Dùng hàm check rác đã nói ở trên
        add_interaction_to_db(user_input, final_answer)
    print("final_answer: ", final_answer)
    return final_answer
