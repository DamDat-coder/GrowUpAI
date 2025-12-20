# tasks/data_handler.py
import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
import state

from utils.nlp_tools import map_text_to_column
from utils.data_prep import extract_feature_values


class DataHandler:
    def __init__(self):
        pass

    def load_and_train_model(self):
        print("--- [DEBUG] Gọi hàm: DataHandler.load_and_train_model() ---")

        files = os.listdir("./data")
        print("Hiện tại tôi có các dataset như sau:")
        for i, f in enumerate(files, start=1):
            print(f"{i}. {f}")

        file_name = input("Bạn cần tôi làm việc với dataset nào?: ").strip()

        state.CURRENT_FILE_NAME = file_name
        df = pd.read_csv(f"./data/{file_name}")
        state.CURRENT_DF = df

        file_path = f"./data/{file_name}"

        if not os.path.exists(file_path):
            print("File không tồn tại.")
            return

        print(f"Đã kết nối với {file_name}. (Gõ 'đóng file' để thoát chế độ này)")
        print(f"Đang mở file {file_name}...")
        df = pd.read_csv(file_path)
        print(f"Đọc thành công: {df.shape[0]} dòng, {df.shape[1]} cột.")

        CURRENT_DF = df
        CURRENT_FILE_NAME = file_name

        num_df = df.select_dtypes(include=["int64", "float64"]).dropna()
        if num_df.shape[1] < 2:
            print("Không có đủ dữ liệu số để huấn luyện (cần ít nhất 2 cột).")
            CURRENT_MODEL = None
            return

        X = num_df.iloc[:, :-1]
        y = num_df.iloc[:, -1]
        model_name = f"{os.path.splitext(file_name)[0]}_model.pkl"
        model_path = os.path.join(state.MODEL_DIR, model_name)
        model = None

        if os.path.exists(model_path):
            model = joblib.load(model_path)
            print(f"Đã phát hiện mô hình cũ. Tải lại để sử dụng...")
        else:
            print("Chưa có mô hình. Tiến hành huấn luyện mới...")
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3)
            model = (
                RandomForestClassifier()
                if len(y.unique()) < 10
                else RandomForestRegressor()
            )
            model.fit(X_train, y_train)
            score = model.score(X_test, y_test)
            print(f"Huấn luyện xong với độ chính xác: {score:.2f}")
            joblib.dump(model, model_path)

        state.CURRENT_MODEL = model
        CURRENT_MODEL = model
        print(f"\n✅ Đã tải/huấn luyện thành công mô hình cho file: {file_name}.")
        print("Bây giờ bạn có thể yêu cầu thao tác (ví dụ: 'dự đoán', 'vẽ biểu đồ').")
        return

    def predict(self, user_input):
        if state.CURRENT_MODEL is None or state.CURRENT_DF is None:
            print(
                "Lỗi: Chưa có mô hình hoặc dataset nào được tải. Vui lòng chạy lại 'load_and_train_model' trước."
            )
            return

        df = state.CURRENT_DF
        model = state.CURRENT_MODEL

        mapped = map_text_to_column(user_input)
        if not mapped:
            print("Tôi không tìm thấy thuộc tính nào trong câu của bạn.")
            return
        if mapped:
            print(f"--- [DEBUG] Predict: Thuộc tính ánh xạ: {mapped} ---")
        values = extract_feature_values(user_input, mapped)
        if values:
            print(f"--- [DEBUG] Predict: Giá trị trích xuất: {values} ---")
        if not values:
            print("Tôi tìm thấy tên thuộc tính nhưng không thấy giá trị số.")
            return

        full_input = {}
        feature_cols = df.select_dtypes(include=["int64", "float64"]).columns[:-1]

        for col in feature_cols:
            if col in values:
                full_input[col] = values[col]
            else:
                full_input[col] = df[col].median()

        input_df = pd.DataFrame([full_input])
        prediction = model.predict(input_df)[0]
        print(f"Kết quả dự đoán: {prediction}")

    def route_task(self, predicted_label, handle_file_input):
        if predicted_label == "predict":
            print("Thực hiện dự đoán")
            self.predict(handle_file_input)
            return

        elif predicted_label == "mind_drawing":
            print("Vẽ sơ đồ suy nghĩ / giải thích pipeline")
            print("Chức năng 'vẽ suy nghĩ' đang được triển khai...")
            return

        elif predicted_label == "draw_diagram":
            print("Vẽ biểu đồ / sơ đồ dữ liệu")
            print("Chức năng vẽ sơ đồ đang được triển khai...")
            return

        elif predicted_label in ["add_data", "del_data", "edit_data"]:
            print(f"Thực hiện thao tác dữ liệu: {predicted_label}")
            print("Chức năng thao tác dữ liệu đang được triển khai...")
            return

        else:
            print("Nhãn không xác định cho task handle_file")
            return

    def close_file(self):
        state.CURRENT_MODEL = None
        state.CURRENT_DF = None
        state.CURRENT_FILE_NAME = None
        print("Đã đóng file. Bạn có thể yêu cầu các tác vụ khác (như tính toán).")
