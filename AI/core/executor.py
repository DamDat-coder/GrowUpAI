import asyncio
from typing import Any, AsyncGenerator

from utils.helpers import retry_with_backoff
from utils.gemini_teacher import ask_gemini_to_reason_stream, ask_gemini_to_understand
from core.ingester import add_interaction_to_db
import requests
import httpx


class Executor:
    def __init__(self, tools=None):
        # Lưu trữ registry các tool
        self.tools = tools or {}
        # Context nội bộ lưu kết quả giữa các bước
        self.context_memory = {
            "rewrite_search_query": "",
            "search_results": "",
            "rag_data": "",
        }

    async def _execute_tool(self, action_name, input_data):
        """
        Hàm bổ trợ để gọi tool từ registry
        """
        if action_name in self.tools:
            tool_func = self.tools[action_name]
            # Kiểm tra nếu là hàm async thì await, nếu không thì gọi thường
            if asyncio.iscoroutinefunction(tool_func):
                return await tool_func(input_data, {})
            else:
                return tool_func(input_data, {})
        else:
            print(f"  [Warning] Tool '{action_name}' không tồn tại trong registry.")
            return None

    async def run_and_stream(self, execution_plan: dict):
        steps = execution_plan.get("steps", [])
        user_text = execution_plan.get("text", "")
        # Lấy userId từ plan (truyền từ app.py sang)
        user_id = execution_plan.get("user_id", "anonymous")
        conv_id = execution_plan.get("conversationId")  # Lấy convId nếu có
        print("conv_id: ",conv_id)
        full_response = ""

        for i, step in enumerate(steps):
            action = step.get("action")
            # ... (giữ nguyên phần tool execution) ...

            # 3. Chỉ YIELD ở bước cuối cùng
            if action == "ask_llm" or action == "smart_intelligence":
                combined_context = self._build_final_context()
                async for chunk in ask_gemini_to_reason_stream(
                    user_text, combined_context, history=[]
                ):
                    if chunk:
                        full_response += chunk
                        yield chunk
                print(f"DEBUG SYNC: Sending to Node.js with ConvID: {conv_id}")
                # --- ĐÃ XONG STREAM, BẮT ĐẦU SYNC (Dùng httpx để không bị treo) ---
                async with httpx.AsyncClient() as client:
                    try:
                        print(f"   [Sync] Đang gửi dữ liệu sang Node.js...")
                        await client.post(
                            "http://localhost:3000/api/chat/sync/internal",
                            json={
                                "userId": user_id,
                                "userMessage": user_text,  # Lời của User
                                "aiResponse": full_response,  # Lời của AI
                                "conversationId": str(conv_id),
                            },
                            timeout=5.0,
                        )
                    except Exception as e:
                        print(f"⚠️ [Sync Failed] Không thể kết nối Node.js: {e}")

        # 4. Lưu vào DB nội bộ của Python (nếu cần)
        if full_response:
            add_interaction_to_db(user_text, full_response)

    def _resolve_input(self, input_str: str, original_query: str) -> str:
        if not isinstance(input_str, str):
            return input_str

        mapping = {
            "context.rewrite_search_query": self.context_memory["rewrite_search_query"],
            "__SEARCH_QUERY__": self.context_memory["rewrite_search_query"],
            "context.search_results": self.context_memory["search_results"],
            "context.rag_data": self.context_memory["rag_data"],
        }
        return mapping.get(input_str, input_str)

    def _build_final_context(self) -> str:
        ctx = []
        if self.context_memory["rag_data"]:
            ctx.append(f"Local Data: {self.context_memory['rag_data']}")
        if self.context_memory["search_results"]:
            ctx.append(f"Web Data: {self.context_memory['search_results']}")
        return "\n\n".join(ctx) if ctx else "Không có dữ liệu bổ sung."
