# core/understand.py
from core.goals import AVAILABLE_GOALS
from utils.nlp_tools import predict_intent
from utils.gemini_teacher import ask_gemini_to_understand

# Ánh xạ intent → goal (mềm, có thể thay đổi)
INTENT_TO_GOAL = {
    "calculation": "solve_numeric_problem",
    "handle_file": "analyze_data",
}


def understand(user_text: str, state) -> dict:
    intent, intent_conf = predict_intent(user_text)

    # 1. Khởi tạo một template chuẩn cho Context (vì nó luôn lấy từ state)
    current_context = {
        "current_file": state.CURRENT_FILE_NAME,
        "has_model": state.CURRENT_MODEL is not None,
    }

    # 2. Trường hợp SBERT tự tin (Short-circuit)
    if intent_conf >= 0.9:
        return {
            "text": user_text,
            "intent_signal": intent,
            "confidence": intent_conf,
            "goal": "information_seeking",  # Chỗ này bạn có thể logic hóa thêm
            "requires_external_knowledge": True,
            "context": current_context,
            "debug": {"source": "intent_short_circuit"},
        }

    # 3. Trường hợp nhờ Gemini tư duy
    result = ask_gemini_to_understand(
        user_text=user_text,
        available_goals=AVAILABLE_GOALS,
        intent_signal=intent,
    )

    # Đảm bảo result không phải None (phòng lỗi subscriptable trước đó)
    if not result:
        result = {
            "goal": "general_chat",
            "confidence": 0.0,
            "requires_external_knowledge": False,
        }

    # 4. MERGE (Hợp nhất): Bổ sung những phím còn thiếu vào result trước khi trả về
    result["context"] = current_context
    result["text"] = user_text
    result["intent_signal"] = intent

    # Nếu Gemini quên không trả về debug, ta tự thêm vào
    if "debug" not in result:
        result["debug"] = {"source": "gemini_reasoning"}

    return result
