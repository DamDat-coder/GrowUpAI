# core/tools.py
from duckduckgo_search import DDGS
import state # Giả sử bạn dùng file state để lưu ngữ cảnh

def tool_web_search(query: str):
    """Tìm kiếm thông tin thực tế từ internet."""
    print(f"    [Tool] Đang tìm kiếm: {query}...")
    try:
        with DDGS() as ddgs:
            results = [r for r in ddgs.text(query, max_results=3)]
            return "\n".join([f"- {r['body']}" for r in results])
    except Exception as e:
        return f"Lỗi tìm kiếm: {e}"

def tool_llm_reasoning(prompt: str):
    """Dùng Gemini để tổng hợp thông tin hoặc giải thích."""
    # Gọi hàm gemini bạn đã viết ở gemini_teacher
    from utils.gemini_teacher import ask_gemini_to_understand # Hoặc hàm tương đương
    # Ở đây tôi giả lập kết quả trả về từ Gemini
    return f"Kết quả xử lý từ LLM cho yêu cầu: {prompt}"

def tool_calculator(expression: str):
    """Thực thi tính toán số học."""
    # Bạn có thể gọi class Calculator() hiện tại của bạn ở đây
    from tasks.calculator import Calculator
    calc = Calculator()
    return calc.calculate(expression) # Giả sử hàm là calculate