# core/tools.py
from http import client
import os
import re
import types

from core.engine import get_rag_context
from ddgs import DDGS
from core.ingester import embed, learn_from_chat
from utils.gemini_teacher import ask_gemini_to_reason
import state

GLOBAL_TOOLS_REGISTRY = {}


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
def tool_llm_reasoning(user_input: str, context: dict):
    print("    [Tool] Gemini đang suy luận tổng hợp...")

    web_data = context.get("web_search", "")
    rag_data = context.get("rag_result", "")
    original_question = context.get("original_question", user_input)

    combined_context = f"""
    DỮ LIỆU TỪ TÀI LIỆU NỘI BỘ (RAG):
    {rag_data}
    
    DỮ LIỆU TỪ INTERNET (WEB):
    {web_data}
    """

    final_answer = ask_gemini_to_reason(
        question=original_question,
        context_info=combined_context,
        history=state.CONVERSATION_HISTORY,
    )
    return final_answer


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
    if not client:
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
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2, # Thấp để tránh sáng tạo quá đà
                system_instruction=system_instruction,
                max_output_tokens=100,
            ),
        )
        query = response.text.strip().replace('"', '')
        print(f"    [Rewrite Result]: {query}")
        return query
    except Exception as e:
        print(f"[Rewrite Error]: {e}")
        return user_text # Fallback dùng text gốc

@register_tool("smart_intelligence")
def tool_smart_intelligence(user_input: str, context: dict):
    # 1. Thử hỏi bộ nhớ Local (RAG)
    rag_data = get_rag_context(user_input)

    if rag_data != "DỮ LIỆU TRỐNG":
        print("    [Success] Trả lời từ bộ nhớ local.")
        return ask_gemini_to_reason(user_input, context_info=rag_data)

    # 2. Nếu local không biết -> Web Search
    print("    [Fallback] Đang tìm kiếm trên Internet...")

    query = tool_rewrite_search_query(user_input, context)
    web_data = tool_web_search(query, context)

    # 3. Gemini tổng hợp
    final_answer = ask_gemini_to_reason(user_input, context_info=web_data)

    # 4. Tự học
    if final_answer and "không tìm thấy" not in final_answer.lower():
        learn_from_chat(user_input, final_answer)

    return final_answer
