# main.py
import warnings

# Import từ các module đã tách
from tasks.calculator import Calculator
from tasks.data_handler import DataHandler
from utils.nlp_tools import predict_intent, predict_action_with_file
from state import CURRENT_MODEL, ASK_MODEL_ACTION

# Cần đảm bảo util được import trong state.py (hoặc import trực tiếp ở đây)
# Giả sử util (util từ sentence_transformers) được import trong state.py hoặc trong các file cần dùng.

warnings.filterwarnings("ignore", category=UserWarning)

calculate = Calculator()
data_handler = DataHandler()


# Hàm router chính (giữ nguyên logic đã sửa đổi)
def do_task(predicted_label, input_text):
    # ===== CASE 1: TÍNH TOÁN =====
    if predicted_label == "calculation":
        print("Thực hiện việc tính toán")
        result = calculate.calculation(input_text)
        print(result)

    # ===== CASE 2: LÀM VIỆC VỚI FILE (Khởi tạo) =====
    elif predicted_label == "handle_file" and CURRENT_MODEL is None:
        # Nếu chưa có model thì hàm handle_file sẽ được gọi trong vòng lặp chính
        # Tuy nhiên, ta vẫn nên xử lý để tránh rơi vào đây
        print("Lỗi luồng: 'handle_file' nên được xử lý ở vòng lặp chính.")

    elif predicted_label == "handle_file":
        # Task file đã được phân loại action phụ và xử lý ở vòng lặp chính
        pass

    else:
        print("Không xác định được task.")


# ----- Vòng lặp tương tác với người dùng -----
print("Gõ 'exit' hoặc 'quit' để thoát.")
while True:
    print("-------------------------------------------------------")
    user_text = input("Xin chào, bạn cần giúp gì hôm nay: ").strip().lower()
    if user_text.lower() in ("exit", "quit"):
        print("Tạm biệt!")
        break
    if not user_text:
        continue

    predicted_label, similarity = predict_intent(user_text)

    # 1. Xử lý trường hợp "handle_file" lần đầu tiên (Chọn file)
    if predicted_label == "handle_file" and CURRENT_MODEL is None:
        print("💡 Cần chọn file trước khi thực hiện thao tác dữ liệu.")
        data_handler.load_and_train_model()
        continue

    print(f"Công việc cần làm: {predicted_label}")
    print(f"Độ tin cậy dự đoán: {similarity * 100:.2f}%")

    if similarity < 0.6:
        print("Câu này khá lạ, có thể tôi hiểu sai. Bạn có thể diễn đạt lại không?")
    else:
        # 2. Nếu đã có model, và intent là 'handle_file', thì chuyển sang phân loại hành động phụ
        if predicted_label == "handle_file":
            predicted_action, action_similarity = predict_action_with_file(user_text)

            print(
                f"-> Hành động phụ: {predicted_action} (Độ tin cậy: {action_similarity*100:.2f}%)"
            )

            # Xử lý Mục 3: Ngưỡng tin cậy
            if action_similarity >= 0.6:
                data_handler.route_task(predicted_action, user_text)
            else:
                print(
                    "Hành động với file không rõ ràng. Bạn có thể diễn đạt lại không?"
                )

        # 3. Các intent khác (calculation) chạy bình thường
        else:
            do_task(predicted_label, user_text)
