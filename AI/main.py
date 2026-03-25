# main.py
import warnings
import sys
import io
import state

from tasks.calculator import Calculator
from core.executor import Executor
from core.tools import (
    tool_web_search,
    tool_llm_reasoning,
    tool_calculator,
    tool_rewrite_search_query,
)
from core.understand import understand
from core.planner import plan
from core.engine import get_rag_context # Sử dụng hàm retrieval mới

# Config IO
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8")
warnings.filterwarnings("ignore", category=UserWarning)

# --- Khởi tạo Tools ---
def tool_rag_search(user_question, context):
    """Tìm trong database PDF và trả về context."""
    print(f"\n[RAG] Đang lục tìm tài liệu nội bộ...")
    context_data = get_rag_context(user_question)
    context["rag_result"] = context_data # Lưu vào context chung
    return context_data

tools_registry = {
    "web_search": tool_web_search,
    "ask_llm": tool_llm_reasoning,
    "compute": tool_calculator,
    "rewrite_search_query": tool_rewrite_search_query,
    "rag_search": tool_rag_search, # Tích hợp sâu RAG
    "ask_user_clarify": lambda x, ctx: "Vui lòng cung cấp thêm thông tin.",
}

executor = Executor(tools=tools_registry)

print("--- GrowUp AI: Ready ---")

while True:
    user_text = input("\nBạn cần giúp gì: ").strip()
    if user_text.lower() in ("exit", "quit"): break
    if not user_text: continue

    # 1. Hiểu ý định (Understand)
    problem = understand(user_text, state)
    
    # 2. Lập kế hoạch (Plan)
    execution_plan = plan(problem)
    execution_plan["original_question"] = user_text

    # 3. Thực thi (Execute)
    result_context = executor.run(execution_plan)

    # 4. Lấy câu trả lời cuối cùng (Thường là từ ask_llm)
    final_answer = result_context.get("ask_llm") or result_context.get("compute")

    if final_answer:
        print(f"\n[AI]: {final_answer}")
        
        # Lưu History
        state.CONVERSATION_HISTORY.append({"role": "user", "content": user_text})
        state.CONVERSATION_HISTORY.append({"role": "assistant", "content": str(final_answer)})

    # Giới hạn History
    if len(state.CONVERSATION_HISTORY) > 20:
        state.CONVERSATION_HISTORY = state.CONVERSATION_HISTORY[-20:]