from sentence_transformers import SentenceTransformer, util
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline, FeatureUnion
from sklearn.base import BaseEstimator, TransformerMixin
from nlpaug.augmenter.word import RandomWordAug
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier

import joblib
import os
import torch
import torch.nn as nn

import pandas as pd
import sympy as sp

import re
import warnings
import random
import json

warnings.filterwarnings("ignore", category=UserWarning)


MODEL_DIR = "./models"
os.makedirs(MODEL_DIR, exist_ok=True)

with open("./train/column_mapping.json", "r", encoding="utf-8") as f:
    COLUMN_MAP = json.load(f)

def map_text_to_column(user_text):
    user_text = user_text.lower()
    matched = {}

    for col_name, keywords in COLUMN_MAP.items():
        for kw in keywords:
            if kw in user_text:
                matched[col_name] = kw
                break

    return matched


with open("./train/prompts_model_actions.txt", "r", encoding="utf-8") as f:
    ASK_MODEL_ACTION = [line.strip() for line in f if line.strip()]

# ----- Nhận diện task (mở rộng dataset của bạn) -----
task_identification = pd.read_csv("./train/task_identification.csv")

feature_task_identification = task_identification["text"]
target_task_identification = task_identification["label"]

model = SentenceTransformer("keepitreal/vietnamese-sbert")

embeddings = model.encode(
    feature_task_identification, convert_to_tensor=True, normalize_embeddings=True
)


def predict_intent(use_text):
    user_emb = model.encode(
        user_text, convert_to_tensor=True, normalize_embeddings=True
    )
    cosine_scores = util.cos_sim(user_emb, embeddings)[0]
    best_idx = torch.argmax(cosine_scores).item()
    best_label = target_task_identification[best_idx]
    best_score = cosine_scores[best_idx].item()
    return best_label, best_score


class Calculator:
    def __init__(self):
        pass

    # --- Tính toán biểu thức ---
    def extract_expression(self, text):
        text = re.sub(
            r"(tính|giải|biểu\s*thức|cho\s*tôi|hãy|giúp\s*tôi|hàm|phương\strình)\s*",
            "",
            text,
            flags=re.IGNORECASE,
        )
        match = re.search(r"([0-9xX\+\-\*/\^\=\(\)\s\.]+)", text)
        return match.group(1).strip() if match else ""

    def check_equation(self, text):
        if any(
            keyword in text.lower() for keyword in ["tính", "giải", "bao nhiêu"]
        ) or re.search(r"[0-9xX\+\-\*/\^=]", text):
            return True
        else:
            return False

    def calculation(self, text: str):
        # --- 1. Kiểm tra xem người dùng có yêu cầu tính toán không ---
        if not self.check_equation(text):
            return "Không phát hiện yêu cầu tính toán trong câu này."

        # --- 2. Tách biểu thức hoặc phương trình từ text ---
        expr = self.extract_expression(text)
        try:
            x = sp.Symbol("x")

            # --- 3. Trường hợp có dạng “có bằng ... không” ---
            match_compare = re.search(
                r"(.+?)\s*có\s*bằng\s*([0-9xX\+\-\*/\^=\s\.]+)", text
            )
            if match_compare:
                left = match_compare.group(1)
                right = match_compare.group(2)
                left_val = sp.simplify(left)
                right_val = sp.simplify(right)
                if left_val == right_val:
                    return f"Đúng, hai vế bằng nhau ({left_val} = {right_val})."
                else:
                    return f"Sai, {left_val} ≠ {right_val}."

            # --- 4. Nếu là câu hỏi “bằng mấy” ---
            if any(kw in text for kw in ["bằng mấy", "bằng bao nhiêu", "bao nhiêu"]):
                expr = re.sub(r"bằng\s*mấy|bằng\s*bao\s*nhiêu|bao\s*nhiêu", "", expr)
                result = sp.simplify(expr)
                return f"Kết quả là: {result}"

            # --- 5. Nếu có dấu '=' → phương trình ---
            if "=" in expr:
                left, right = expr.split("=")
                equation = sp.Eq(sp.sympify(left), sp.sympify(right))
                solutions = sp.solve(equation, x)
                if not solutions:
                    return "Phương trình này vô nghiệm."
                return f"Nghiệm của phương trình là: {solutions}"

            # --- 6. Mặc định: tính giá trị biểu thức ---
            result = sp.simplify(expr)
            return f"Kết quả là: {result}"

        except Exception:
            return f"Mình không hiểu biểu thức này: {expr}"


# --- Làm việc với file ---
def handle_file():
    files = os.listdir("./data")
    print("Hiện tại tôi có các dataset như sau:")
    for i, f in enumerate(files, start=1):
        print(f"{i}. {f}")

    # --- Chọn file ---
    file_name = input("Bạn cần tôi làm việc với dataset nào?: ").strip()
    file_path = f"./data/{file_name}"

    if not os.path.exists(file_path):
        print("File không tồn tại.")
        return

    print(f"Đang mở file {file_name}...")
    df = pd.read_csv(file_path)
    print(f"Đọc thành công: {df.shape[0]} dòng, {df.shape[1]} cột.")

    # --- Kiểm tra dữ liệu số ---
    num_df = df.select_dtypes(include=["int64", "float64"]).dropna()
    if num_df.shape[1] < 2:
        print("Không có đủ dữ liệu số để huấn luyện (cần ít nhất 2 cột).")
        return

    # --- Tự động chọn target ---
    X = num_df.iloc[:, :-1]
    y = num_df.iloc[:, -1]

    # --- Tên model để lưu ---
    model_name = f"{os.path.splitext(file_name)[0]}_model.pkl"
    model_path = os.path.join(MODEL_DIR, model_name)

    # --- Kiểm tra nếu model đã tồn tại ---
    if os.path.exists(model_path):
        print(f"Đã phát hiện mô hình cũ ({model_name}). Tải lại để sử dụng...")
        model = joblib.load(model_path)
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
        print(f"Mô hình đã được lưu tại: {model_path}")

    action_with_file = pd.read_csv("./train/actions_with_file.csv")
    feature_action_with_file = action_with_file["text"]
    target_action_with_file = action_with_file["label"]

    model = SentenceTransformer("keepitreal/vietnamese-sbert")
    embeddings = model.encode(
        feature_action_with_file, convert_to_tensor=True, normalize_embeddings=True
    )

    def predict_action_with_file(user_input):
        user_emb = model.encode(
            user_input, convert_to_tensor=True, normalize_embeddings=True
        )
        cosine_scores = util.cos_sim(user_emb, embeddings)[0]
        best_idx = torch.argmax(cosine_scores).item()
        best_label = target_action_with_file[best_idx]
        best_score = cosine_scores[best_idx].item()
        return best_label, best_score

    while True:
        user_input = input(
            random.choice(ASK_MODEL_ACTION) + " (gõ 'exit' để thoát): "
        ).strip().lower()

        if user_input.lower() in ["exit", "quit"]:
            print("Thoát dự đoán.")
            break

        try:

            predicted_label_action_with_file, similarity_action_with_file = (
                predict_action_with_file(user_input)
            )

            print(f"Công việc cần làm: {predicted_label_action_with_file}")
            print(f"Độ tin cậy dự đoán: {similarity_action_with_file * 100:.2f}%")

            if similarity < 0.6:
                print(
                    "Câu này khá lạ, có thể tôi hiểu sai. Bạn có thể diễn đạt lại không?"
                )
            else:
                do_handle_file_task(predicted_label_action_with_file, user_input)

        except Exception as e:
            print(f"Lỗi khi dự đoán: {e}")

def map_text_to_column(user_text):
    user_text = user_text.lower()
    matched = {}

    for col_name, keywords in COLUMN_MAP.items():
        for kw in keywords:
            if kw in user_text:
                matched[col_name] = kw
                break

    return matched

def extract_numbers(text):
    return re.findall(r"\d+\.?\d*", text)

def extract_feature_values(text, mapped_cols):
    result = {}
    for col, kw in mapped_cols.items():
        pattern = rf"{kw}\D*(\d+\.?\d*)"
        m = re.search(pattern, text)
        if m:
            result[col] = float(m.group(1))
    return result


def handle_file_predict(user_input, model, df):
    # 1. Map feature theo keyword
    mapped = map_text_to_column(user_input)

    if not mapped:
        print("Tôi không tìm thấy thuộc tính nào trong câu của bạn.")
        return

    values = extract_feature_values(user_input, mapped)

    if not values:
        print("Tôi tìm thấy tên thuộc tính nhưng không thấy giá trị số.")
        return

    full_input = {}
    for col in df.columns[:-1]:
        if col in values:
            full_input[col] = values[col]
        else:
            full_input[col] = df[col].median()

    input_df = pd.DataFrame([full_input])

    # 4. Dự đoán
    prediction = model.predict(input_df)[0]
    print(f"Kết quả dự đoán: {prediction}")

    

# ----- Vòng lặp tương tác với người dùng -----
def do_task(predicted_label, input):
    # ===== CASE 1: TÍNH TOÁN =====
    calculate = Calculator()
    if predicted_label == "calculation":
        print("Thực hiện việc tính toán")
        result = calculate.calculation(input)
        print(result)

    # ===== CASE 1: LÀM VIỆC VỚI FILE =====
    elif predicted_label == "handle_file":
        print("Thực hiện việc làm việc với file")
        handle_file()


# ----- Vòng lặp tương tác với file -----
def do_handle_file_task(predicted_label, handle_file_input):
    # ===== CASE 1: DỰ ĐOÁN =====
    if predicted_label == "predict":
        print("Thực hiện dự đoán")
        print("Tính năng dự đoán đang được triển khai...")
        handle_file_predict(handle_file_input)
        return

    # ===== CASE 2: VẼ SUY NGHĨ =====
    elif predicted_label == "mind_drawing":
        print("Vẽ sơ đồ suy nghĩ / giải thích pipeline")
        print("Chức năng 'vẽ suy nghĩ' đang được triển khai...")
        return

    # ===== CASE 3: VẼ SƠ ĐỒ =====
    elif predicted_label == "draw_diagram":
        print("Vẽ biểu đồ / sơ đồ dữ liệu")
        print("Chức năng vẽ sơ đồ đang được triển khai...")
        return

    # ===== CASE 4: THAO TÁC DỮ LIỆU =====
    elif predicted_label in ["add_data", "del_data", "edit_data"]:
        print(f"Thực hiện thao tác dữ liệu: {predicted_label}")

        if predicted_label == "add_data":
            print("Thêm dữ liệu vào dataset")
        elif predicted_label == "del_data":
            print("Xóa dữ liệu khỏi dataset")
        elif predicted_label == "edit_data":
            print("Chỉnh sửa dữ liệu trong dataset")

        return

    # ===== CASE MẶC ĐỊNH =====
    else:
        print("Nhãn không xác định cho task handle_file")
        return


# ----- Thao tác với người dùng -----
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

    print(f"Công việc cần làm: {predicted_label}")
    print(f"Độ tin cậy dự đoán: {similarity * 100:.2f}%")

    if similarity < 0.6:
        print("Câu này khá lạ, có thể tôi hiểu sai. Bạn có thể diễn đạt lại không?")
    else:
        do_task(predicted_label, user_text)
