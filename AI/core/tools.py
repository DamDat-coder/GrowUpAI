# core/tools.py
import os
import re

from core.engine import get_rag_context
from duckduckgo_search import DDGS
from core.ingester import embed
from utils.gemini_teacher import ask_gemini_to_reason
import state


class LocalFile:  # Lớp giả lập để khớp với hàm embed của bạn
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
    # Tự động nối đường dẫn vào folder data
    full_path = os.path.join(state.DATA_FOLDER, file_name)

    if os.path.exists(full_path):
        print(full_path)
        success = embed(full_path, is_path=True)
        return f"Đã học xong file '{file_name}' trong thư mục dữ liệu."
    else:
        return f"Không tìm thấy file '{file_name}' trong thư mục {state.DATA_FOLDER}. Bạn đã copy file vào đó chưa?"


def tool_rag_search(user_input: str, context: dict):
    """Tìm kiếm kiến thức nội bộ từ tài liệu đã upload."""
    print(f"    [Tool] Đang truy vấn tài liệu nội bộ cho: {user_input}...")

    is_deep = "phân tích" in user_input.lower() or "tóm tắt" in user_input.lower()
    k_value = 10 if is_deep else 4

    rag_data = get_rag_context(user_input, k=k_value)
    # Lưu vào context để step sau (ask_llm) có thể lấy dùng
    context["rag_result"] = rag_data
    return rag_data


def tool_llm_reasoning(user_input: str, context: dict):
    """Gemini tổng hợp thông tin từ tất cả các nguồn (Web, RAG, History)."""
    print("    [Tool] Gemini đang suy luận tổng hợp...")

    # Thu thập dữ liệu từ các bước trước đó trong Plan
    web_data = context.get("web_search", "")
    rag_data = context.get("rag_result", "")
    original_question = context.get("original_question", user_input)

    # Tạo một Context tổng hợp cực mạnh cho Gemini
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
    """Thực thi tính toán số học."""
    # Bạn có thể gọi class Calculator() hiện tại của bạn ở đây
    from tasks.calculator import Calculator

    calc = Calculator()
    return calc.calculate(expression)  # Giả sử hàm là calculate


def tool_rewrite_search_query(user_text: str, context: dict):
    """
    Rewrite câu người dùng thành search query tối ưu.
    """
    print("    [Tool] Đang rewrite search query...")

    if not user_text:
        return "No input provided"

    # --- Rule-based version (ổn định trước) ---
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

    # Optional: nếu có từ thời gian → thêm statistics
    if "6 tháng" in query or "gần đây" in query:
        query += " statistics report"

    print(f"    [Rewrite Result]: {query}")

    # Lưu riêng vào context để step sau dùng
    context["search_query"] = query

    return query
