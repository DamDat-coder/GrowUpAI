# state.py

import json
import os
import torch
import pandas as pd
from sentence_transformers import SentenceTransformer

# State về Model và Data
CURRENT_DF = None  # DataFrame đang làm việc
CURRENT_MODEL = None  # Model ML đã được huấn luyện/tải
CURRENT_FILE_NAME = None  # Tên file đang làm việc
MODEL_DIR = "./models"

CONVERSATION_HISTORY = []
os.makedirs(MODEL_DIR, exist_ok=True)

# State về Cấu hình và NLP
SBERT_MODEL = SentenceTransformer("keepitreal/vietnamese-sbert")

# Tải cấu hình ánh xạ cột
with open("./train/column_mapping.json", "r", encoding="utf-8") as f:
    COLUMN_MAP = json.load(f)

# Tải các câu hỏi gợi ý
with open("./train/prompts_model_actions.txt", "r", encoding="utf-8") as f:
    ASK_MODEL_ACTION = [line.strip() for line in f if line.strip()]

# Dữ liệu cho Intent Classification (task_identification.csv)
TASK_DF = pd.read_csv("./train/task_identification.csv")

TARGET_TASK_IDENTIFICATION = TASK_DF["label"]
EMBEDDINGS_TASK = SBERT_MODEL.encode(
    TASK_DF["text"].tolist(), convert_to_tensor=True, normalize_embeddings=True
)

# Dữ liệu cho Action Classification (actions_with_file.csv)
action_with_file = pd.read_csv("./train/actions_with_file.csv")
TARGET_ACTION_WITH_FILE = action_with_file["label"]
EMBEDDINGS_ACTION = SBERT_MODEL.encode(
    action_with_file["text"], convert_to_tensor=True, normalize_embeddings=True
)


def add_new_task_example(text: str, label: str) -> bool:
    """
    Thêm ví dụ mới vào task_identification.csv và cập nhật embeddings ngay lập tức.
    Trả về True nếu thêm thành công (không trùng).
    """
    global TASK_DF, EMBEDDINGS_TASK, TARGET_TASK_IDENTIFICATION

    # Kiểm tra trùng lặp (không phân biệt hoa thường, khoảng trắng)
    if any(TASK_DF["text"].str.strip().str.lower() == text.strip().lower()):
        print(f"[SELF-LEARN] Ví dụ đã tồn tại: {text[:80]}...")
        return False

    # Thêm vào DataFrame
    new_row = pd.DataFrame([{"text": text, "label": label}])
    TASK_DF = pd.concat([TASK_DF, new_row], ignore_index=True)

    # Encode chỉ câu mới (rất nhanh)
    new_emb = SBERT_MODEL.encode(
        [text], convert_to_tensor=True, normalize_embeddings=True
    )
    EMBEDDINGS_TASK = torch.cat([EMBEDDINGS_TASK, new_emb], dim=0)

    # Cập nhật target
    TARGET_TASK_IDENTIFICATION = TASK_DF["label"].reset_index(drop=True)

    # Lưu file CSV
    TASK_DF.to_csv("./train/task_identification.csv", index=False, encoding="utf-8")

    print(f"[SELF-LEARN] ĐÃ THÊM tự động: {text[:70]}... → {label}")
    return True
