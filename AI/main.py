# main.py
import warnings
import sys
import io
import state

from tasks.calculator import Calculator
from core.executor import Executor
from core.tools import (
    tool_rag_search,
    tool_llm_reasoning,
    tool_calculator,
    tool_rewrite_search_query,
    tool_ingest_file,
)
from core.understand import understand
from core.planner import plan

# Config IO
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8")
warnings.filterwarnings("ignore", category=UserWarning)


tools_registry = {
    "ask_llm": tool_llm_reasoning,
    "compute": tool_calculator,
    "rewrite_search_query": tool_rewrite_search_query,
    "rag_search": tool_rag_search,
    "ingest_file": tool_ingest_file,
    "ask_user_clarify": lambda x, ctx: "Vui lòng cung cấp thêm thông tin.",
}

executor = Executor(tools=tools_registry)

print("--- GrowUp AI: Ready ---")

while True:
    user_text = input("\nBạn cần giúp gì: ").strip()
    if user_text.lower() in ("exit", "quit"):
        break
    if not user_text:
        continue

    # 1. Hiểu ý định (Understand)
    problem = understand(user_text, state)

    # 2. Lập kế hoạch (Plan)
    execution_plan = plan(problem)
    execution_plan["original_question"] = user_text

    # 3. Thực thi (Execute)
    result_context = executor.run(execution_plan)

    # 4. Lấy câu trả lời cuối cùng (Thường là từ ask_llm)
    last_action = execution_plan["steps"][-1]["action"]
    final_answer = result_context.get(last_action)

    if final_answer:
        print(f"\n[AI]: {final_answer}")

        # Lưu History
        state.CONVERSATION_HISTORY.append({"role": "user", "content": user_text})
        state.CONVERSATION_HISTORY.append(
            {"role": "assistant", "content": str(final_answer)}
        )

    # Giới hạn History
    if len(state.CONVERSATION_HISTORY) > 20:
        state.CONVERSATION_HISTORY = state.CONVERSATION_HISTORY[-20:]
