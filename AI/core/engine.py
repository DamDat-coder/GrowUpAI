import os
from dotenv import load_dotenv
from core.database import get_vector_db

load_dotenv()


def get_rag_context(user_query: str, k) -> str:
    """
    Hàm này chỉ làm nhiệm vụ: Tìm trong ChromaDB những đoạn text
    liên quan nhất đến câu hỏi và trả về chuỗi văn bản gộp.
    """
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
