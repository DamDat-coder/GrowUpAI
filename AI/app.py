# app.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import state

from core.understand import understand
from core.planner import plan
from core.executor import Executor
from core.tools import GLOBAL_TOOLS_REGISTRY  # Hoặc dict tools cũ của bạn

app = FastAPI(title="GrowUp AI API")

# BẮT BUỘC: Thêm CORS để Node.js hoặc React gọi sang không bị chặn
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

executor = Executor(tools=GLOBAL_TOOLS_REGISTRY)


class ChatRequest(BaseModel):
    user_id: str
    message: str


@app.post("/api/v1/chat")
async def chat_endpoint(request: ChatRequest):
    user_text = request.message.strip()

    if not user_text:
        raise HTTPException(status_code=400, detail="Tin nhắn không được để trống")

    try:
        # 1. Hiểu ý định
        problem = understand(user_text, state)

        # 2. Lập kế hoạch
        execution_plan = plan(problem)
        execution_plan["original_question"] = user_text

        # 3. Thực thi (RAG, Web Search...)
        result_context = executor.run(execution_plan)

        # 4. Lấy kết quả cuối cùng
        last_action = execution_plan["steps"][-1]["action"]
        final_answer = result_context.get(last_action)

        if "không đề cập" in final_answer or "không có thông tin" in final_answer or "không cung cấp thông tin chi tiết" in final_answer:
            # Ép Planner tạo lại một kế hoạch mới sử dụng Web Search
            print("user_text: ",user_text)
            new_plan = {"steps": [{"action": "web_search", "query": user_text}]}
            result_context = executor.run(new_plan)
            final_answer = result_context.get("web_search")

        return {
            "status": "success",
            "user_id": request.user_id,
            "response": final_answer,
        }

    except Exception as e:
        print(f"[Error]: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
