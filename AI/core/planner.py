# core/planner.py


def plan(problem: dict) -> dict:
    goal = problem.get("goal", "general_chat")
    user_text = problem.get("text", "")
    source = problem.get("knowledge_source", "internal")

    # Mỗi kịch bản là một danh sách các steps
    STRATEGIES = {
        "upload_document": [{"action": "ingest_file", "input": user_text}],
        "information_seeking": [{"action": "smart_intelligence", "input": user_text}],
        "learning_explanation": [{"action": "smart_intelligence", "input": user_text}],
        "solve_numeric_problem": [{"action": "compute", "input": user_text}],
        "document_deep_analysis": [
            {"action": "rag_search", "input": f"Phân tích chuyên sâu về: {user_text}"},
            {
                "action": "ask_llm",
                "input": "Hãy đóng vai chuyên gia phân tích dữ liệu, đọc kỹ nội dung và trả lời chi tiết.",
            },
        ],
        "coding_task": [
            {
                "action": "ask_llm",
                "input": f"Bạn là chuyên gia Senior. Viết code sạch, tối ưu và giải thích từng bước. Đây là đoạn code cần bạn xem {user_text}",
            }
        ],
        "general_chat": [{"action": "ask_llm", "input": user_text}],
    }

    # Lấy steps dựa trên goal, mặc định là general_chat nếu không tìm thấy goal
    steps = STRATEGIES.get(goal, STRATEGIES["general_chat"])

    # Xử lý riêng trường hợp đặc biệt (nếu vẫn muốn dùng web_search riêng biệt)
    if goal == "web_search_required":
        steps = [
            {"action": "rewrite_search_query", "input": user_text},
            {"action": "web_search", "input": "context.search_query"},
            {
                "action": "ask_llm",
                "input": "Tổng hợp thông tin mới nhất từ kết quả tìm kiếm.",
            },
        ]

    if source == "external" or source == "hybrid":
        steps = [
            # Bước 1: Rewrite câu hỏi thành từ khóa
            {"action": "rewrite_search_query", "input": user_text},
            # Bước 2: Dùng kết quả của Bước 1 (lưu trong context) để Search
            {"action": "web_search", "input": "context.rewrite_search_query"},
            # Bước 3: Tổng hợp kết quả
            {
                "action": "ask_llm",
                "input": "Dựa trên kết quả tìm kiếm, hãy trả lời chính xác câu hỏi của người dùng.",
            },
        ]
        return {
            "goal": "web_search_required",
            "steps": steps,
            "text": user_text,
        }
    elif source == "hybrid":
        steps = [
            {"action": "rag_search", "input": user_text},
            {"action": "web_search", "input": user_text},
            {
                "action": "ask_llm",
                "input": "So sánh dữ liệu nội bộ và thông tin thực tế bên ngoài.",
            },
        ]
    else:
        # Mặc định lấy theo STRATEGIES hiện tại của Đạt
        steps = STRATEGIES.get(goal, STRATEGIES["general_chat"])

    return {
        "goal": goal,
        "steps": steps,
        "status": "planned",
        "source": source,
    }
