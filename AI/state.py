# state.py
import json
import os
import pandas as pd
from sentence_transformers import SentenceTransformer
import torch

# --- Quản lý folder Data ---
DATA_FOLDER = "./data"

# --- Quản lý Context & History ---
CONVERSATION_HISTORY = []
CURRENT_FILE_NAME = None
CURRENT_DF = None

LAST_SYNC_TIMESTAMP = None
# --- NLP & Intent Mapping ---
SBERT_MODEL = SentenceTransformer("keepitreal/vietnamese-sbert")

# Load dữ liệu nhận diện Task (Intent)
TASK_DF = pd.read_csv("./train/task_identification.csv")
TARGET_TASK_IDENTIFICATION = TASK_DF["label"]
# Pre-compute embeddings để search SBERT cho nhanh
EMBEDDINGS_TASK = SBERT_MODEL.encode(
    TASK_DF["text"].tolist(), convert_to_tensor=True, normalize_embeddings=True
)


MODEL_DIR = "./models"
os.makedirs(MODEL_DIR, exist_ok=True)

with open("./train/column_mapping.json", "r", encoding="utf-8") as f:
    COLUMN_MAP = json.load(f)


def clear_history():
    global CONVERSATION_HISTORY
    CONVERSATION_HISTORY = []


def reload_intent_model():
    """Nạp lại CSV và tính lại Embeddings khi có thay đổi."""
    global TASK_DF, TARGET_TASK_IDENTIFICATION, EMBEDDINGS_TASK
    print("[SYSTEM] Đang cập nhật bộ nhớ Intent...")
    TASK_DF = pd.read_csv("./train/task_identification.csv")
    TARGET_TASK_IDENTIFICATION = TASK_DF["label"]
    EMBEDDINGS_TASK = SBERT_MODEL.encode(
        TASK_DF["text"].tolist(), convert_to_tensor=True, normalize_embeddings=True
    )
    print(f"[SYSTEM] Đã cập nhật xong! Tổng số mẫu: {len(TASK_DF)}")


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
