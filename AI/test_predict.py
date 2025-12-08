import joblib
import pandas as pd
import json
import re

# Load column mapping
with open("./train/column_mapping.json", "r", encoding="utf-8") as f:
    COLUMN_MAP = json.load(f)

# Hàm map cột
def map_text_to_column(user_text):
    user_text = user_text.lower()
    matched = {}

    # Tạo list (col, keyword) và sort theo chiều dài keyword giảm dần
    keyword_list = []
    for col, keywords in COLUMN_MAP.items():
        for kw in keywords:
            keyword_list.append((col, kw))

    keyword_list.sort(key=lambda x: len(x[1]), reverse=True)

    used_spans = []  # để tránh overlap

    for col, kw in keyword_list:
        pos = user_text.find(kw)
        if pos != -1:
            # kiểm tra overlap để tránh match trong match
            overlap = False
            for s, e in used_spans:
                if s <= pos <= e:
                    overlap = True
                    break

            if not overlap:
                matched[col] = kw
                used_spans.append((pos, pos + len(kw)))

    return matched


# Extract giá trị
def extract_feature_values(text, mapped_cols):
    result = {}
    for col, kw in mapped_cols.items():
        pattern = rf"{kw}\D*(\d+\.?\d*)"
        m = re.search(pattern, text)
        if m:
            result[col] = float(m.group(1))
    return result


def predict_single(model_path, csv_path, user_text):
    print("🧪 TEST DỰ ĐOÁN\n")

    df = pd.read_csv(csv_path)
    model = joblib.load(model_path)

    # B1: Map keyword → column
    mapped = map_text_to_column(user_text)
    print("🔎 Cột map được:", mapped)

    if not mapped:
        return "❌ Không tìm thấy thuộc tính nào trong câu."

    # B2: lấy numeric values
    values = extract_feature_values(user_text, mapped)
    print("values: ",values)

    if not values:
        return "❌ Không tìm thấy giá trị số nào."

    # B3: fill input đầy đủ
    full_input = {}

    num_cols = df.select_dtypes(include=['number']).columns

    for col in num_cols:
        if col in values:
            full_input[col] = values[col]
        else:
            full_input[col] = df[col].median()

    print("📦 Input đưa vào model:", full_input)

    input_df = pd.DataFrame([full_input])

    # B4: predict
    prediction = model.predict(input_df)[0]
    print("Model expects:", model.feature_names_in_)
    return f"🎉 Kết quả dự đoán: {prediction}"


result = predict_single(
    "./models/iris_model.pkl",
    "./data/iris.csv",
    "Dự đoán bông hoa có chiều dài cánh hoa 5.1m và chiều rộng cánh hoa 3.2m"
)

print(result)
