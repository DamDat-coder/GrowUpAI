# core/planner.py


def plan(problem: dict) -> dict:
    goal = problem["goal"]
    needs_knowledge = problem["requires_external_knowledge"]
    user_text = problem.get("text", "")

    steps = []

    # 1. Giải toán
    if goal == "solve_numeric_problem":
        steps = [{"action": "compute", "input": user_text}]

    # 2. Phân tích dữ liệu
    elif goal == "analyze_data":
        steps = [
            {"action": "ask_llm", "input": f"Hướng dẫn cách xử lý file: {user_text}"}
        ]

    # 3. Tìm kiếm thông tin (Web Search)
    elif goal == "learning_explanation" or goal == "information_seeking":
        steps = [
            {"action": "rag_search", "input": user_text},  # Lấy data từ PDF
            {"action": "ask_llm"},  # Gemini tổng hợp kết quả từ RAG
        ]

    # 4. Trò chuyện phím
    elif goal == "general_chat":
        steps = [{"action": "ask_llm", "input": user_text}]

    # 5. Mặc định nếu không hiểu
    else:
        steps = [
            {
                "action": "ask_user_clarify",
                "input": "Tôi chưa rõ ý bạn, bạn có thể nói chi tiết hơn không?",
            }
        ]

    return {"goal": goal, "steps": steps, "status": "planned"}
