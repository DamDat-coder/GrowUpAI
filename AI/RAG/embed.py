# Thu thập dữ liệu
import os
from langchain_community.document_loaders import UnstructuredPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from get_vector_db import get_vector_db
from werkzeug.utils import secure_filename

TEMP_FOLDER = os.getenv("TEMP_FOLDER", "./_temp")


def embed(file):
    try:
        # 1. Lưu file tạm thời
        filename = secure_filename(file.filename)
        file_path = os.path.join(TEMP_FOLDER, filename)
        file.save(file_path)

        # 2. Load nội dung PDF
        loader = UnstructuredPDFLoader(file_path)
        data = loader.load()

        # 3. Cắt nhỏ văn bản (Chunking)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=750, chunk_overlap=100
        )
        chunks = text_splitter.split_documents(data)

        # 4. Lưu vào Vector DB
        db = get_vector_db()
        db.add_documents(chunks)

        # 5. Xóa file tạm sau khi xong
        os.remove(file_path)
        return True
    except Exception as e:
        print(f"Error during embedding: {e}")
        return False
