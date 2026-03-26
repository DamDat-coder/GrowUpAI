import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from core.database import get_vector_db
from werkzeug.utils import secure_filename

TEMP_FOLDER = os.getenv("TEMP_FOLDER", "./_temp")


# core/ingester.py
def embed(file_obj, is_path=False):
    try:
        # KIỂM TRA ĐƯỜNG DẪN FILE
        if is_path:
            # Nếu là đường dẫn, file_path chính là file_obj (kiểu string)
            file_path = file_obj
        else:
            # Nếu là object file từ Web, mới dùng .filename
            if not os.path.exists(TEMP_FOLDER):
                os.makedirs(TEMP_FOLDER)
            filename = secure_filename(file_obj.filename)
            file_path = os.path.join(TEMP_FOLDER, filename)
            file_obj.save(file_path)

        # Kiểm tra thực tế file có tồn tại trên ổ cứng không
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
        print(f"Lỗi Embedding: {e}")  # Đây là dòng in ra lỗi 'str' của bạn
        return False
