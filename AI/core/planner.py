# core/planner.py


def plan(problem: dict) -> dict:
    goal = problem["goal"]
    user_text = problem.get("text", "")
    requires_web = problem.get("requires_external_knowledge", False)

    steps = []

    # --- NHÓM 1: QUẢN LÝ DỮ LIỆU ---
    if goal == "upload_document":
        steps = [{"action": "ingest_file", "input": user_text}]

    # --- NHÓM 2: TRUY VẤN KIẾN THỨC (RAG + WEB) ---
    elif goal in ["information_seeking", "learning_explanation"]:
        # Nếu cần kiến thức bên ngoài (thời sự, giá cả...) -> Ưu tiên Web
        if requires_web:
            steps = [
                {"action": "rewrite_search_query", "input": user_text},
                {"action": "web_search"},
                {"action": "rag_search"},  # Vẫn tìm trong PDF nếu có
                {"action": "ask_llm"},
            ]
        else:
            # Chỉ tìm trong tài liệu nội bộ (PDF)
            steps = [
                {"action": "rag_search", "input": user_text},
                {"action": "ask_llm"},
            ]

    # --- NHÓM 3: CÔNG CỤ CHÍNH XÁC (Toán học) ---
    elif goal == "solve_numeric_problem":
        steps = [{"action": "compute", "input": user_text}]

    # --- NHÓM 4: CHAT TỰ NHIÊN ---
    elif goal == "general_chat":
        steps = [{"action": "ask_llm", "input": user_text}]

    # Plan A: DUYỆT WEB THÔNG MINH
    if goal == "web_search_required":
        steps = [
            {"action": "rewrite_search_query", "input": user_text},
            {"action": "web_search"},
            {
                "action": "ask_llm",
                "input": "Hãy tổng hợp thông tin mới nhất từ kết quả tìm kiếm và trả lời ngắn gọn, chính xác.",
            },
        ]
        return {"goal": goal, "steps": steps, "status": "planned"}

    # Plan B: PHÂN TÍCH SÂU TÀI LIỆU
    if goal == "document_deep_analysis":
        steps = [
            {"action": "rag_search", "input": f"Phân tích chuyên sâu về: {user_text}"},
            {
                "action": "ask_llm",
                "input": "Hãy đóng vai một chuyên gia phân tích dữ liệu, đọc kỹ nội dung và trả lời chi tiết.",
            },
        ]
        return {"goal": goal, "steps": steps, "status": "planned"}

    # --- MẶC ĐỊNH ---
    else:
        steps = [{"action": "ask_llm", "input": user_text}]

    return {"goal": goal, "steps": steps, "status": "planned"}
