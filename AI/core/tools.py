# core/tools.py
from ddgs import DDGS

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

# core/tools.py


def tool_llm_reasoning(user_input: str, context: dict):
    print("    [Tool] Đang tổng hợp bằng LLM (Gemini)...")

    # Lấy thông tin cần thiết từ context (do executor truyền vào)
    search_result = context.get("web_search", "")
    original_question = context.get("original_question", user_input)
    
    # Chuẩn bị context_info để đưa vào prompt
    context_info = ""
    if search_result:
        context_info = f"Kết quả tìm kiếm từ web:\n{search_result}\n\n"
    
    # Gọi hàm Gemini reasoning
    final_answer = ask_gemini_to_reason(
        question=original_question,
        context_info=context_info,
        temperature=0.3,           # thấp để bám sát thông tin
        max_tokens=1000
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

    print("[DEBUG remove_patterns]: ",query)

    query = query.strip()

    # Optional: nếu có từ thời gian → thêm statistics
    if "6 tháng" in query or "gần đây" in query:
        query += " statistics report"

    print(f"    [Rewrite Result]: {query}")

    # Lưu riêng vào context để step sau dùng
    context["search_query"] = query

    return query
