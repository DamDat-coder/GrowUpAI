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

def learn_from_chat(question, answer):
    negative_keywords = ["không tìm thấy", "không có thông tin", "không tìm thấy bất kỳ", "không thể cung cấp"]
    
    # Chỉ lưu nếu Gemini thực sự trả lời được cái gì đó hữu ích
    if any(kw in answer.lower() for kw in negative_keywords):
        print("[LEARNING] Bỏ qua không lưu vì câu trả lời không có nội dung hữu ích.")
        return False
    try:
        db = get_vector_db()
        # Tạo một 'Document' giả lập từ nội dung chat
        content = f"Câu hỏi: {question}\nTrả lời: {answer}"
        metadata = {"source": "gemini_learning", "type": "qa_pair"}
        
        doc = Document(page_content=content, metadata=metadata)
        
        # Đẩy vào ChromaDB
        db.add_documents([doc])
        print(f"[LEARNING] Đã lưu kiến thức mới vào bộ nhớ local.")
        return True
    except Exception as e:
        print(f"[LEARNING ERROR] Không thể lưu kiến thức: {e}")
        return False