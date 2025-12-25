# main.py
# GrowUp AI – Thinking-first version

import warnings
import sys
import io
import state

from tasks.calculator import Calculator
from tasks.data_handler import DataHandler
from core.understand import understand

# =====================
# IO & Warning config
# =====================
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8")
warnings.filterwarnings("ignore", category=UserWarning)

# =====================
# Init components
# =====================
calculator = Calculator()
data_handler = DataHandler()

print("Gõ 'exit' hoặc 'quit' để thoát.")

while True:
    print("-------------------------------------------------------")
    user_text = input("Xin chào, bạn cần giúp gì hôm nay: ").strip()

    if user_text.lower() in ("exit", "quit"):
        print("Tạm biệt!")
        break

    if not user_text:
        continue

    if user_text.lower() in ["đóng file", "thoát file", "dừng làm việc với file"]:
        data_handler.close_file()
        continue

    # =====================
    # UNDERSTAND
    # =====================
    problem = understand(user_text, state)

    print("\n[AI UNDERSTAND]")
    print(f"- Goal: {problem['goal']}")
    print(f"- Confidence: {problem['confidence']:.2f}")
    print(f"- Needs external knowledge: {problem['requires_external_knowledge']}")
    print(f"- Context: {problem['context']}")
    print(f"- Debug: {problem['debug']}")

    # =====================
    # 🚧 TẠM THỜI EXECUTE (CHƯA PHẢI PLANNER)
    # =====================
    if problem["goal"] == "solve_numeric_problem":
        result = calculator.calculation(user_text)
        print("\n👉 Kết quả:", result)

    elif problem["goal"] == "analyze_data":
        if state.CURRENT_MODEL is None:
            data_handler.load_and_train_model()
        else:
            print("👉 Dataset đã sẵn sàng, chờ planner quyết định bước tiếp theo.")

    else:
        print("\n🤔 Tôi hiểu yêu cầu, nhưng chưa biết nên làm gì tiếp.")
