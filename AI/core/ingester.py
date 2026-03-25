import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from core.database import get_vector_db
from werkzeug.utils import secure_filename

TEMP_FOLDER = os.getenv("TEMP_FOLDER", "./_temp")

def embed(file):
    try:
        if not os.path.exists(TEMP_FOLDER):
            os.makedirs(TEMP_FOLDER)

        filename = secure_filename(file.filename)
        file_path = os.path.join(TEMP_FOLDER, filename)
        file.save(file_path)

        # Sử dụng PyPDFLoader cho ổn định
        loader = PyPDFLoader(file_path)
        data = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=600, # Giảm kích thước chunk để CPU xử lý nhanh hơn
            chunk_overlap=100
        )
        chunks = text_splitter.split_documents(data)

        db = get_vector_db()
        db.add_documents(chunks)
        # Không cần db.persist() nữa

        os.remove(file_path)
        return True
    except Exception as e:
        print(f"Lỗi Embedding: {e}")
        return False