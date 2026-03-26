import os
from dotenv import load_dotenv
from core.database import get_vector_db

load_dotenv()


def get_rag_context(user_query: str) -> str:
    """
    Hàm này chỉ làm nhiệm vụ: Tìm trong ChromaDB những đoạn text
    liên quan nhất đến câu hỏi và trả về chuỗi văn bản gộp.
    """
    print("Đã sử dụng hàm get_rag_context")
    try:
        db = get_vector_db()
        print("db trong try: ", db)
        # Tìm kiếm 3-5 đoạn văn bản có điểm tương đồng cao nhất
        # k=4 là con số tối ưu để không bị quá dài (tràn token)
        docs = db.similarity_search(user_query, k=4)
        print("docs: ", docs)
        if not docs:
            return "Không tìm thấy tài liệu liên quan trong DB."

        # Gộp các nội dung lại
        context = "\n---\n".join([doc.page_content for doc in docs])
        print("context: ", context)
        return context
    except Exception as e:
        print(f"[RAG Engine Error]: {e}")
        return ""
