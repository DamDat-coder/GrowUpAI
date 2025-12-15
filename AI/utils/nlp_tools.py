# utils/nlp_tools.py
import torch
from sentence_transformers import util
from state import (
    SBERT_MODEL,
    EMBEDDINGS_TASK,
    TARGET_TASK_IDENTIFICATION,
    EMBEDDINGS_ACTION,
    TARGET_ACTION_WITH_FILE,
    COLUMN_MAP,
)


# ... (Hàm predict_intent) ...
def predict_intent(user_text):
    """Phân loại intent chính (calculation, handle_file)."""
    user_emb = SBERT_MODEL.encode(
        user_text, convert_to_tensor=True, normalize_embeddings=True
    )
    # util.cos_sim được sử dụng
    cosine_scores = util.cos_sim(user_emb, EMBEDDINGS_TASK)[0]
    best_idx = torch.argmax(cosine_scores).item()
    best_label = TARGET_TASK_IDENTIFICATION[best_idx]
    best_score = cosine_scores[best_idx].item()
    return best_label, best_score


def predict_action_with_file(user_input):
    """Phân loại action phụ khi đang làm việc với file."""
    user_emb = SBERT_MODEL.encode(
        user_input, convert_to_tensor=True, normalize_embeddings=True
    )
    cosine_scores = util.cos_sim(user_emb, EMBEDDINGS_ACTION)[0]
    best_idx = torch.argmax(cosine_scores).item()
    best_label = TARGET_ACTION_WITH_FILE[best_idx]
    best_score = cosine_scores[best_idx].item()
    return best_label, best_score


def map_text_to_column(user_text):
    """Ánh xạ văn bản người dùng thành tên cột."""
    user_text = user_text.lower()
    matched = {}

    for col_name, keywords in COLUMN_MAP.items():
        for kw in keywords:
            if kw in user_text:
                matched[col_name] = kw
                break

    return matched
