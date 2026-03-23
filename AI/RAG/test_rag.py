import os
import time
from query import query
from embed import embed


# Giả lập class File để khớp với hàm embed của bạn
class MockFile:
    def __init__(self, path):
        self.filename = os.path.basename(path)
        self.path = path

    def save(self, destination):
        import shutil

        shutil.copy(self.path, destination)


def run_test():
    # --- CẤU HÌNH TEST ---
    pdf_file_path = "./data/DamQuocDat-WebProgaming-CV.docx.pdf"  # Đảm bảo bạn có file này trong thư mục
    cau_hoi = "Nội dung chính của tài liệu này là gì?"  # Thay bằng câu hỏi liên quan đến file của bạn

    # BƯỚC 1: KIỂM TRA FILE ĐẦU VÀO
    if not os.path.exists(pdf_file_path):
        print(f"❌ Lỗi: Không tìm thấy file '{pdf_file_path}'.")
        print("👉 Hãy copy 1 file PDF vào thư mục này và đổi tên thành 'test.pdf'.")
        return

    # BƯỚC 2: THỬ NGHIỆM THÊM DỮ LIỆU (EMBED)
    print(f"\n--- Bước 1: Đang nạp dữ liệu từ {pdf_file_path} ---")
    start_embed = time.time()
    success = embed(MockFile(pdf_file_path))

    if success:
        print(f"✅ Embed thành công! (Mất {round(time.time() - start_embed, 2)}s)")
    else:
        print("❌ Embed thất bại. Kiểm tra lại kết nối Ollama hoặc thư viện PDF.")
        return

    # BƯỚC 3: THỬ NGHIỆM TRUY VẤN (QUERY)
    print(f"\n--- Bước 2: Đang hỏi AI: '{cau_hoi}' ---")
    print("(Đang sử dụng MultiQueryRetriever để tìm kiếm ngữ cảnh...)")

    try:
        start_query = time.time()
        answer = query(cau_hoi)
        print("\n--- ✨ CÂU TRẢ LỜI TỪ AI ---")
        print(answer)
        print(f"\n---------------------------")
        print(f"⏱️ Tổng thời gian xử lý câu hỏi: {round(time.time() - start_query, 2)}s")
    except Exception as e:
        print(f"❌ Lỗi khi truy vấn: {e}")


if __name__ == "__main__":
    run_test()
