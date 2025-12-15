# tasks/data_handler.py
import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier

# Import trạng thái và utils cần thiết
# Lưu ý: Class DataHandler sẽ KHÔNG trực tiếp sử dụng global state, 
# thay vào đó, nó sẽ sử dụng các thuộc tính (attributes) của chính nó 
# để lưu trữ DF và Model. Tuy nhiên, vì chúng ta vẫn đang dùng CLI và global state 
# để quản lý luồng, chúng ta sẽ giữ lại việc cập nhật state trong phương thức khởi tạo
# (nhưng về lâu dài, nên loại bỏ global state).

# Tạm thời vẫn import state và utils
from state import CURRENT_DF, CURRENT_MODEL, CURRENT_FILE_NAME, MODEL_DIR 
from utils.nlp_tools import map_text_to_column
from utils.data_prep import extract_feature_values


class DataHandler:
    """
    Quản lý luồng làm việc với file dữ liệu, huấn luyện mô hình 
    và thực hiện các tác vụ liên quan (dự đoán, thao tác dữ liệu).
    """

    def __init__(self):
        # Không cần các thuộc tính nội bộ vì chúng ta đang dùng global state 
        # để tương thích với luồng main.py hiện tại.
        pass

    def load_and_train_model(self):
        """Tải và huấn luyện mô hình, thiết lập trạng thái global."""
        # --- (Logic giữ nguyên) ---
        
        # Để DataHandler có thể hoạt động độc lập hơn, ta cần truyền file_name vào, 
        # nhưng để giữ nguyên luồng CLI, ta vẫn dùng input() ở đây.

        files = os.listdir("./data")
        print("Hiện tại tôi có các dataset như sau:")
        for i, f in enumerate(files, start=1):
            print(f"{i}. {f}")

        file_name = input("Bạn cần tôi làm việc với dataset nào?: ").strip()
        file_path = f"./data/{file_name}"

        if not os.path.exists(file_path):
            print("File không tồn tại.")
            return

        print(f"Đang mở file {file_name}...")
        df = pd.read_csv(file_path)
        print(f"Đọc thành công: {df.shape[0]} dòng, {df.shape[1]} cột.")

        # Lưu trạng thái vào state (Duy trì tính đồng bộ với main.py)
        CURRENT_DF = df
        CURRENT_FILE_NAME = file_name
        
        # Kiểm tra dữ liệu số và Huấn luyện/Tải Model
        num_df = df.select_dtypes(include=["int64", "float64"]).dropna()
        if num_df.shape[1] < 2:
            print("Không có đủ dữ liệu số để huấn luyện (cần ít nhất 2 cột).")
            CURRENT_MODEL = None
            return

        X = num_df.iloc[:, :-1]
        y = num_df.iloc[:, -1]
        model_name = f"{os.path.splitext(file_name)[0]}_model.pkl"
        model_path = os.path.join(MODEL_DIR, model_name)
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
        
        CURRENT_MODEL = model
        print(f"\n✅ Đã tải/huấn luyện thành công mô hình cho file: {file_name}.")
        print("Bây giờ bạn có thể yêu cầu thao tác (ví dụ: 'dự đoán', 'vẽ biểu đồ').")
        return

    def predict(self, user_input):
        """Thực hiện dự đoán dựa trên trạng thái hiện tại (CURRENT_MODEL, CURRENT_DF)."""
        # 1. Kiểm tra trạng thái
        if CURRENT_MODEL is None or CURRENT_DF is None:
            print("Lỗi: Chưa có mô hình hoặc dataset nào được tải. Vui lòng chạy lại 'load_and_train_model' trước.")
            return
            
        df = CURRENT_DF
        model = CURRENT_MODEL
            
        # 2. Map feature theo keyword
        mapped = map_text_to_column(user_input)

        if not mapped:
            print("Tôi không tìm thấy thuộc tính nào trong câu của bạn.")
            return

        # 3. Trích xuất giá trị
        values = extract_feature_values(user_input, mapped)

        if not values:
            print("Tôi tìm thấy tên thuộc tính nhưng không thấy giá trị số.")
            return

        # 4. Tạo input cho model (Sử dụng median cho các feature bị thiếu)
        full_input = {}
        feature_cols = df.select_dtypes(include=["int64", "float64"]).columns[:-1]

        for col in feature_cols:
            if col in values:
                full_input[col] = values[col]
            else:
                full_input[col] = df[col].median() 

        input_df = pd.DataFrame([full_input])

        # 5. Dự đoán
        prediction = model.predict(input_df)[0]
        print(f"Kết quả dự đoán: {prediction}")
        
    def route_task(self, predicted_label, handle_file_input):
        """Router cho các tác vụ làm việc với file."""
        # ===== CASE 1: DỰ ĐOÁN =====
        if predicted_label == "predict":
            print("Thực hiện dự đoán")
            self.predict(handle_file_input) # Gọi phương thức nội bộ
            return

        # ===== CASE 2: VẼ SUY NGHĨ (Mind Drawing) =====
        elif predicted_label == "mind_drawing":
            print("Vẽ sơ đồ suy nghĩ / giải thích pipeline")
            print("Chức năng 'vẽ suy nghĩ' đang được triển khai...")
            return

        # ===== CASE 3: VẼ SƠ ĐỒ (Draw Diagram) =====
        elif predicted_label == "draw_diagram":
            print("Vẽ biểu đồ / sơ đồ dữ liệu")
            print("Chức năng vẽ sơ đồ đang được triển khai...")
            return

        # ===== CASE 4: THAO TÁC DỮ LIỆU (Add/Delete/Edit) =====
        elif predicted_label in ["add_data", "del_data", "edit_data"]:
            print(f"Thực hiện thao tác dữ liệu: {predicted_label}")
            print("Chức năng thao tác dữ liệu đang được triển khai...")
            return

        # ===== CASE MẶC ĐỊNH =====
        else:
            print("Nhãn không xác định cho task handle_file")
            return