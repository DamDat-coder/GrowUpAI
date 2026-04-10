import datetime
import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from core.database import get_vector_db
from werkzeug.utils import secure_filename

TEMP_FOLDER = os.getenv("TEMP_FOLDER", "./_temp")


# core/ingester.py
def embed(file_obj, is_path=False):
    try:
        if is_path:
            file_path = file_obj
        else:
            if not os.path.exists(TEMP_FOLDER):
                os.makedirs(TEMP_FOLDER)
            filename = secure_filename(file_obj.filename)
            file_path = os.path.join(TEMP_FOLDER, filename)
            file_obj.save(file_path)

        if not os.path.exists(file_path):
            print(f"Lỗi: Không tìm thấy file tại {file_path}")
            return False

        # TIẾN HÀNH ĐỌC VÀ EMBED
        loader = PyPDFLoader(file_path)
        data = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=600, chunk_overlap=100
        )
        chunks = text_splitter.split_documents(data)

        db = get_vector_db()
        db.add_documents(chunks)

        print(f"Thành công: Đã nạp {len(chunks)} đoạn văn từ {file_path}")
        return True

    except Exception as e:
        print(f"Lỗi Embedding: {e}")
        return False


def add_interaction_to_db(
    question: str, answer: str, source_type: str = "semantic_cache"
):
    """
    Hàm duy nhất quản lý việc nạp kiến thức từ hội thoại vào DB.
    source_type: 'semantic_cache' hoặc 'gemini_learning'
    """
    # 1. HÀNG RÀO CHẶN RÁC (Cực kỳ quan trọng)
    is_garbage(answer)

    try:
        db = get_vector_db()

        # 2. CHUẨN HÓA DỮ LIỆU
        # Với Semantic Cache: Text chính là câu hỏi (để tìm kiếm tương tự câu hỏi)
        # Với Learning: Ta lưu cả cặp Q&A vào document
        content = f"Câu hỏi: {question}\nTrả lời: {answer}"

        metadata = {
            "answer": answer,  # Lưu câu trả lời vào metadata để get_semantic_cache lấy ra nhanh
            "source": source_type,
            "timestamp": datetime.datetime.now().isoformat(),
        }

        # 3. NẠP VÀO DB
        db.add_texts(
            texts=[question.lower()], metadatas=[metadata]  # Vector hóa câu hỏi
        )
        print(f"[{source_type.upper()}] Đã nạp kiến thức mới thành công.")
        return True

    except Exception as e:
        print(f"[{source_type.upper()} ERROR]: {e}")
        return False


def is_garbage(text):
    """Hàng rào chặn rác trước khi nạp vào DB"""
    negative_keywords = [
        "ai bận rồi",
        "lỗi hệ thống",
        "không tìm thấy",
        "typeerror",
        "exception",
    ]
    if any(kw in text.lower() for kw in negative_keywords):
        return True
    if len(text.strip()) < 10:  # Câu trả lời quá ngắn thường không giá trị
        return True
    return False
