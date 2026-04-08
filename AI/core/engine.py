import os
from dotenv import load_dotenv
from core.database import get_vector_db
import datetime
import state
import requests

load_dotenv()


def save_to_semantic_cache(question: str, answer: str):
    try:
        db = get_vector_db()  # Hoặc một collection riêng chuyên biệt
        # Ta lưu Câu hỏi vào Vector, và Câu trả lời vào Metadata hoặc Document
        db.add_texts(
            texts=[question.lower()],
            metadatas=[
                {"answer": answer, "timestamp": datetime.datetime.now().isoformat()}
            ],
        )
        print(f"    [Cache] Đã lưu câu hỏi vào bộ nhớ Semantic.")
    except Exception as e:
        print(f"[Cache Save Error]: {e}")


# Hàm truy vấn Semantic Cache (Gọi ngay đầu luồng chat_endpoint)
def get_semantic_cache(user_query: str, threshold: float = 0.15):
    try:
        db = get_vector_db()
        # Tìm câu hỏi tương tự nhất
        results = db.similarity_search_with_score(user_query.lower(), k=1)

        if results:
            doc, score = results[0]
            # Score càng nhỏ càng giống (ChromaDB dùng L2 distance)
            if score < threshold:
                print(
                    f"    [Cache Hit] Tìm thấy câu trả lời tương tự (Score: {score:.4f})"
                )
                return doc.metadata.get("answer")
        return None
    except Exception as e:
        print(f"[Cache Query Error]: {e}")
        return None


def get_last_sync_time():
    try:
        with open(state.LAST_SYNC_FILE, "r") as f:
            return f.read().strip()
    except:
        return None


def save_last_sync_time(timestamp):
    with open(state.LAST_SYNC_FILE, "w") as f:
        f.write(timestamp)


def sync_from_mongodb():
    since = get_last_sync_time()
    url = f"http://localhost:3000/api/chat/sync/internal"
    if since:
        url += f"?since={since}"

    try:
        response = requests.get(url).json()
        if not response.get("success") or not response.get("data"):
            return

        messages = response["data"]

        for i in range(len(messages) - 1):
            curr = messages[i]
            nxt = messages[i + 1]

            if curr["sender"] == "user" and nxt["sender"] == "ai":
                # Dùng ID của tin nhắn AI làm ID trong ChromaDB để tránh trùng
                msg_id = str(nxt["_id"])

                db = get_vector_db()
                db.add_texts(
                    ids=[msg_id],  # <--- THÊM DÒNG NÀY ĐỂ FIX LỖI 3
                    texts=[curr["message"].lower()],
                    metadatas=[
                        {"answer": nxt["message"], "timestamp": nxt["createdAt"]}
                    ],
                )

        if messages:
            # Lấy timestamp của tin nhắn cuối cùng làm mốc cho lần sau
            new_last_sync = messages[-1]["createdAt"]
            save_last_sync_time(new_last_sync)
            print(f"    [Sync] Đã cập nhật mốc sync mới: {new_last_sync}")

    except Exception as e:
        print(f"[Sync Error]: {e}")


def get_rag_context(user_query: str, k: int = 4):
    try:
        db = get_vector_db()
        # Lấy kèm điểm số để kiểm tra độ liên quan thực tế
        docs_and_scores = db.similarity_search_with_score(user_query, k=k)

        relevant_docs = [doc for doc, score in docs_and_scores if score < 0.8]
        if not relevant_docs:
            return "DỮ LIỆU TRỐNG"

        context = "\n---\n".join([doc.page_content for doc in relevant_docs])
        return context
    except Exception as e:
        print(f"[RAG Error]: {e}")
        return "DỮ LIỆU TRỐNG"
