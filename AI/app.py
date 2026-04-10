# app.py
import asyncio

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from core.engine import get_semantic_cache
from fastapi.responses import StreamingResponse
import json
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
    conversationId: str


@app.post("/api/v1/chat")
async def chat_endpoint(request: ChatRequest):
    user_text = request.message.strip()

    cached_answer = get_semantic_cache(user_text)
    if cached_answer:
        return {"status": "success", "response": cached_answer, "source": "cache"}

    try:
        # Chạy understand async
        problem = await asyncio.to_thread(understand, user_text, state)
        execution_plan = plan(problem)
        execution_plan["text"] = user_text
        execution_plan["user_id"] = request.user_id
        execution_plan["conversationId"] = request.conversationId

        async def generate():
            # Chạy executor dưới dạng generator
            async for chunk in executor.run_and_stream(execution_plan):
                if chunk:
                    # Định dạng SSE (Server-Sent Events)
                    yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
