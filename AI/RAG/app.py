# app.py
from fastapi import FastAPI, UploadFile, File, Form
from embed import embed
from query import query
import uvicorn

app = FastAPI()

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    success = embed(file)
    if success:
        return {"status": "success", "message": f"File {file.filename} has been indexed."}
    return {"status": "error", "message": "Failed to embed document."}

@app.post("/chat")
async def chat_with_rag(question: str = Form(...)):
    # Gọi hàm query từ hệ thống RAG của bạn
    answer = query(question)
    return {"question": question, "answer": answer}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)