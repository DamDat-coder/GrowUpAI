# core/planner.py

def plan(problem: dict) -> dict:
    goal = problem.get("goal", "general_chat")
    user_text = problem.get("text", "")
    
    # Định nghĩa các kịch bản thực thi (Execution Strategies)
    # Mỗi kịch bản là một danh sách các steps
    STRATEGIES = {
        "upload_document": [
            {"action": "ingest_file", "input": user_text}
        ],
        "information_seeking": [
            {"action": "smart_intelligence", "input": user_text}
        ],
        "learning_explanation": [
            {"action": "smart_intelligence", "input": user_text}
        ],
        "solve_numeric_problem": [
            {"action": "compute", "input": user_text}
        ],
        "document_deep_analysis": [
            {"action": "rag_search", "input": f"Phân tích chuyên sâu về: {user_text}"},
            {"action": "ask_llm", "input": "Hãy đóng vai chuyên gia phân tích dữ liệu, đọc kỹ nội dung và trả lời chi tiết."}
        ],
        "coding_task": [
            {"action": "ask_llm", "input": "Bạn là chuyên gia Senior. Viết code sạch, tối ưu và giải thích từng bước."}
        ],
        "general_chat": [
            {"action": "ask_llm", "input": user_text}
        ]
    }

    # Lấy steps dựa trên goal, mặc định là general_chat nếu không tìm thấy goal
    steps = STRATEGIES.get(goal, STRATEGIES["general_chat"])

    # Xử lý riêng trường hợp đặc biệt (nếu vẫn muốn dùng web_search riêng biệt)
    if goal == "web_search_required":
        steps = [
            {"action": "rewrite_search_query", "input": user_text},
            {"action": "web_search", "input": "context.search_query"},
            {"action": "ask_llm", "input": "Tổng hợp thông tin mới nhất từ kết quả tìm kiếm."}
        ]

    return {
        "goal": goal,
        "steps": steps,
        "status": "planned"
    }