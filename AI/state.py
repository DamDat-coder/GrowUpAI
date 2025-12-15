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
task_identification = pd.read_csv("./train/task_identification.csv")
TARGET_TASK_IDENTIFICATION = task_identification["label"]
EMBEDDINGS_TASK = SBERT_MODEL.encode(
    task_identification["text"], convert_to_tensor=True, normalize_embeddings=True
)

# Dữ liệu cho Action Classification (actions_with_file.csv)
action_with_file = pd.read_csv("./train/actions_with_file.csv")
TARGET_ACTION_WITH_FILE = action_with_file["label"]
EMBEDDINGS_ACTION = SBERT_MODEL.encode(
    action_with_file["text"], convert_to_tensor=True, normalize_embeddings=True
)
