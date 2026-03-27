# core/understand.py
import re

from core.goals import AVAILABLE_GOALS
from utils.nlp_tools import predict_intent
from utils.gemini_teacher import ask_gemini_to_understand
from state import add_new_task_example

UNDERSTAND_CACHE = {}


def understand(user_text: str, state) -> dict:
    if user_text in UNDERSTAND_CACHE:
        print("[DEBUG] Hit understand cache")
        return UNDERSTAND_CACHE[user_text].copy()

    intent, intent_conf = predict_intent(user_text)

    if ".pdf" in user_text.lower() or "đọc file" in user_text.lower():
        return {
            "goal": "upload_document",
            "text": user_text,
            "requires_external_knowledge": False,
        }
    elif intent_conf >= 0.75:
        result = {
            "text": user_text,
            "intent_signal": intent,
            "confidence": intent_conf,
            "goal": intent,
            "requires_external_knowledge": intent
            in ("information_seeking", "learning_explanation"),
            "debug": {"source": "intent_short_circuit"},
        }
        UNDERSTAND_CACHE[user_text] = result
        return result

    gemini_result = ask_gemini_to_understand(
        user_text=user_text,
        available_goals=AVAILABLE_GOALS,
        intent_signal=intent,
        history=state.CONVERSATION_HISTORY,
    )

    result = gemini_result or {
        "goal": "general_chat",
        "confidence": 0.0,
        "requires_external_knowledge": False,
    }

    result["text"] = user_text
    result["intent_signal"] = intent
    if "debug" not in result:
        result["debug"] = {"source": "gemini_reasoning"}

    if (
        result.get("debug", {}).get("source") == "gemini_reasoning"
        and result.get("confidence", 0) >= 0.65
        and result["goal"] != "unknown"
        and result["goal"] in AVAILABLE_GOALS
    ):
        add_new_task_example(user_text, result["goal"])

    UNDERSTAND_CACHE[user_text] = result
    return result
