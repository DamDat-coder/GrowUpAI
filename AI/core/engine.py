import os
from dotenv import load_dotenv
from core.database import get_vector_db

load_dotenv()


def get_rag_context(user_query: str, k) -> str:
    print("Đã sử dụng hàm get_rag_context")
    try:
        db = get_vector_db()
        docs = db.similarity_search(user_query, k=k)
        if not docs:
            return "Không tìm thấy tài liệu liên quan trong DB."

        # Gộp các nội dung lại
        context = "\n---\n".join([doc.page_content for doc in docs])
        return context
    except Exception as e:
        print(f"[RAG Engine Error]: {e}")
        return ""
