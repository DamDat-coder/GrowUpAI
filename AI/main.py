# main.py
# GrowUp AI – Thinking-first version

import warnings
import sys
import io
import state

from tasks.calculator import Calculator
from tasks.data_handler import DataHandler
from core.executor import Executor
from core.tools import tool_web_search, tool_llm_reasoning, tool_calculator
from core.understand import understand
from core.planner import plan

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
# =====================
# Init components
# =====================
tools_registry = {
    "web_search": tool_web_search,
    "ask_llm": tool_llm_reasoning,
    "compute": tool_calculator,
    "ask_user_clarify": lambda x: "Yêu cầu người dùng cung cấp thêm thông tin."
}
executor = Executor(tools=tools_registry)

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

    problem = understand(user_text, state)
    if not problem:
        print("\nLỗi: Không thể giải mã ý định."); continue

    print(f"\n[AI UNDERSTAND] Goal: {problem['goal']} | Needs Search: {problem['requires_external_knowledge']}")

    execution_plan = plan(problem) 

    result_context = executor.run(execution_plan)

    print("\n[AI CONTEXT]")
    for action_name, output in result_context.items():
        print(f"[{action_name.upper()}]: {output}")
