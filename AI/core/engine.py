import os
from dotenv import load_dotenv
from core.database import get_vector_db

load_dotenv()


def get_rag_context(user_query: str, k: int = 4):
    try:
        db = get_vector_db()
        # Lấy kèm điểm số để kiểm tra độ liên quan thực tế
        docs_and_scores = db.similarity_search_with_score(user_query, k=k)

        relevant_docs = [doc for doc, score in docs_and_scores if score < 0.6]
        if not relevant_docs:
            return "DỮ LIỆU TRỐNG"

        context = "\n---\n".join([doc.page_content for doc in relevant_docs])
        return context
    except Exception as e:
        print(f"[RAG Error]: {e}")
        return "DỮ LIỆU TRỐNG"
