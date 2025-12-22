# main.py
# GrowUp AI

import warnings
import state

# Import từ các module đã tách
from tasks.calculator import Calculator
from tasks.data_handler import DataHandler
from utils.nlp_tools import predict_intent, predict_action_with_file
from utils.learning_handler import learn_new_intent
from utils.gemini_teacher import ask_gemini_to_classify
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
# Cần đảm bảo util được import trong state.py (hoặc import trực tiếp ở đây)
# Giả sử util (util từ sentence_transformers) được import trong state.py hoặc trong các file cần dùng.

warnings.filterwarnings("ignore", category=UserWarning)

calculate = Calculator()
data_handler = DataHandler()
last_unknown_query = None


# Hàm router chính (giữ nguyên logic đã sửa đổi)
def do_task(predicted_label, input_text):
    if predicted_label == "calculation":
        print("Thực hiện việc tính toán")
        result = calculate.calculation(input_text)
        print(result)

    elif predicted_label == "handle_file" and state.CURRENT_MODEL is None:
        print("Lỗi luồng: 'handle_file' nên được xử lý ở vòng lặp chính.")

    elif predicted_label == "handle_file":
        pass

    else:
        print("Không xác định được task.")


print("Gõ 'exit' hoặc 'quit' để thoát.")
while True:
    print("-------------------------------------------------------")

    user_text = input("Xin chào, bạn cần giúp gì hôm nay: ").strip().lower()
    if user_text.lower() in ("exit", "quit"):
        print("Tạm biệt!")
        break
    if not user_text:
        continue
    if user_text in ["đóng file", "thoát file", "dừng làm việc với file"]:
        data_handler.close_file()
        continue
    if state.CURRENT_MODEL is not None:
        predicted_action, action_similarity = predict_action_with_file(user_text)

        if action_similarity >= 0.6:
            data_handler.route_task(predicted_action, user_text)
        else:
            p_label, p_sim = predict_intent(user_text)
            if p_label == "calculation" and p_sim >= 0.6:
                do_task(p_label, user_text)
            else:
                print(
                    "Tôi không rõ bạn muốn làm gì với file này. (Gõ 'đóng file' nếu muốn làm việc khác)"
                )
    else:
        predicted_label, similarity = predict_intent(user_text)

        # 1. Xử lý trường hợp "handle_file" lần đầu tiên (Chọn file)
        if predicted_label == "handle_file" and state.CURRENT_MODEL is None:
            data_handler.load_and_train_model()

        print(f"Công việc cần làm: {predicted_label}")
        print(f"Độ tin cậy dự đoán: {similarity * 100:.2f}%")
        if similarity < 0.6:
            print("--- [Hệ thống đang suy nghĩ...] ---")

            # Nhờ Gemini (Thầy giáo) giải đáp ngầm
            result = ask_gemini_to_classify(user_text)

            if result:
                new_label = result["label"]
                reason = result["reason"]

                print(
                    f"AI: À, tôi hiểu rồi. Đây là yêu cầu về '{new_label}' ({reason})."
                )

                # Âm thầm học ngay lập tức
                learn_new_intent(user_text, new_label)

                # Sau khi học xong, chúng ta chạy tiếp logic cho label này
                predicted_label = new_label
            else:
                print("AI: Xin lỗi, câu này khó quá tôi chưa xử lý được.")
            continue
        else:
            if predicted_label == "handle_file":
                user_text_after_handle_file = input("Vậy bạn muốn làm gì với file này?")
                predicted_action, action_similarity = predict_action_with_file(
                    user_text_after_handle_file
                )
                print(
                    f"-> Hành động phụ: {predicted_action} (Độ tin cậy: {action_similarity*100:.2f}%)"
                )

                print(
                    f"-> Hành động phụ: {predicted_action} (Độ tin cậy: {action_similarity*100:.2f}%)"
                )

                if action_similarity >= 0.6:
                    data_handler.route_task(
                        predicted_action, user_text_after_handle_file
                    )
                else:
                    print(
                        "Hành động với file không rõ ràng. Bạn có thể diễn đạt lại không?"
                    )

            else:
                do_task(predicted_label, user_text)
