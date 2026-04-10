import chromadb
import os
from dotenv import load_dotenv

load_dotenv()

# 1. Kết nối tới thư mục lưu trữ database của bạn
# Đảm bảo đường dẫn này khớp với cấu hình trong dự án của bạn
db_path = r"C:\AI Engineer Intern\Project\AI\chroma_db" 
client = chromadb.PersistentClient(path=db_path)

collection = client.get_collection(name="growup-ai-docs")

# 3. Tìm và xóa dựa trên nội dung "rác"
# Cách này sẽ xóa tất cả các bản ghi có chứa cụm từ lỗi
try:
    collection.delete(
        where_document={"$contains": "AI bận rồi"}
    )
    print("--- [Success] Đã dọn dẹp sạch các bản ghi lỗi 'AI bận rồi' ---")
    
    # Kiểm tra lại số lượng bản ghi còn lại
    print(f"Số lượng bản ghi còn lại: {collection.count()}")
    
except Exception as e:
    print(f"Lỗi khi xóa: {e}")