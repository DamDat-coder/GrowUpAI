# core/tools.py
from core.engine import get_rag_context
from duckduckgo_search import DDGS
from utils.gemini_teacher import ask_gemini_to_reason
import state  # Giả sử bạn dùng file state để lưu ngữ cảnh


def tool_web_search(user_input: str, context: dict):
    print(f"    [Tool] Đang tìm kiếm: {user_input}...")
    try:
        with DDGS() as ddgs:
            results = [r for r in ddgs.text(user_input, max_results=3)]
            return "\n".join([f"- {r['body']}" for r in results])
    except Exception as e:
        return f"Lỗi tìm kiếm: {e}"


def tool_rag_search(user_input: str, context: dict):
    """Tìm kiếm kiến thức nội bộ từ tài liệu đã upload."""
    print(f"    [Tool] Đang truy vấn tài liệu nội bộ cho: {user_input}...")
    rag_data = get_rag_context(user_input)
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
