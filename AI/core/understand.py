# core/understand.py

from utils.nlp_tools import predict_intent
from utils.gemini_teacher import ask_gemini_to_understand


# Ánh xạ intent → goal (mềm, có thể thay đổi)
INTENT_TO_GOAL = {
    "calculation": "solve_numeric_problem",
    "handle_file": "analyze_data",
}


def understand(user_text: str, state) -> dict:
    """
    Chuyển câu người dùng thành 'Problem Representation'
    """
    # =========================
    # 1. Dự đoán intent (chỉ là tín hiệu)
    # =========================
    intent, confidence = predict_intent(user_text)

    # =========================
    # 2. Suy ra GOAL
    # =========================
    if confidence >= 0.6 and intent in INTENT_TO_GOAL:
        goal = INTENT_TO_GOAL[intent]
        source = "intent_model"
    else:
        # Intent không chắc → hỏi Gemini
        print("--- [UNDERSTAND] Intent không rõ, hỏi AI suy luận... ---")
        result = ask_gemini_to_understand(user_text)

        if result and "label" in result:
            # Lưu ý: ta KHÔNG dùng label làm task
            goal = INTENT_TO_GOAL.get(
                result["label"],
                "information_seeking"
            )
            source = "llm_inference"
        else:
            goal = "information_seeking"
            source = "fallback"

    # =========================
    # 3. Phát hiện thiếu tri thức
    # =========================
    requires_external_knowledge = goal in [
        "information_seeking",
    ]

    # =========================
    # 4. Trả về Problem Object
    # =========================
    problem = {
        "text": user_text,
        "intent_signal": intent,
        "confidence": confidence,
        "goal": goal,
        "requires_external_knowledge": requires_external_knowledge,
        "context": {
            "current_file": state.CURRENT_FILE_NAME,
            "has_model": state.CURRENT_MODEL is not None,
        },
        "debug": {
            "goal_source": source,
        },
    }

    return problem
