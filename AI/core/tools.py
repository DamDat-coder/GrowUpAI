# core/tools.py
import os
import re

from core.engine import get_rag_context
from duckduckgo_search import DDGS
from core.ingester import embed
from utils.gemini_teacher import ask_gemini_to_reason
import state


class LocalFile:
    def __init__(self, path):
        self.filename = os.path.basename(path)
        self.path = path

    def save(self, dest):
        import shutil

        shutil.copy(self.path, dest)


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


def tool_rag_search(user_input: str, context: dict):
    print(f"    [Tool] Đang truy vấn tài liệu nội bộ cho: {user_input}...")

    is_deep = "phân tích" in user_input.lower() or "tóm tắt" in user_input.lower()
    k_value = 10 if is_deep else 4

    rag_data = get_rag_context(user_input, k=k_value)
    context["rag_result"] = rag_data
    return rag_data


def tool_web_search(user_input: str, context: dict):
    print(f"    [Tool] Đang tìm kiếm: {user_input}...")
    try:
        with DDGS() as ddgs:
            results = [r for r in ddgs.text(user_input, max_results=3)]
            return "\n".join([f"- {r['body']}" for r in results])
    except Exception as e:
        return f"Lỗi tìm kiếm: {e}"


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


def tool_calculator(expression: str):
    from tasks.calculator import Calculator

    calc = Calculator()
    return calc.calculate(expression)


def tool_rewrite_search_query(user_text: str, context: dict):
    print("    [Tool] Đang rewrite search query...")

    if not user_text:
        return "No input provided"

    remove_patterns = [
        "tôi muốn bạn",
        "hãy",
        "giúp tôi",
        "cho tôi",
        "làm ơn",
        "tôi cần bạn",
    ]

    query = user_text.lower()

    for p in remove_patterns:
        query = query.replace(p, "")

    print("[DEBUG remove_patterns]: ", query)

    query = query.strip()

    if "6 tháng" in query or "gần đây" in query:
        query += " statistics report"

    print(f"    [Rewrite Result]: {query}")

    context["search_query"] = query

    return query
