# utils/learning_handler.py
import pandas as pd
import state
import os

def learn_new_intent(text, label):
    """Lưu câu nói mới và label vào bộ nhớ, sau đó cập nhật Embeddings trong RAM."""
    csv_path = "./train/task_identification.csv"
    
    # 1. Ghi vào file CSV
    clean_text = text.replace("\n", " ").strip()
    
    new_entry = pd.DataFrame([[clean_text, label]], columns=["text", "label"])
    # Nếu file chưa có thì ghi cả header, nếu có rồi thì chỉ append
    file_exists = os.path.isfile(csv_path)
    new_entry.to_csv(csv_path, mode='a', index=False, header=not file_exists, encoding='utf-8',errors='replace')
    
    print(f"--- [LEARNING] Đã ghi nhận: '{text}' -> nhóm {label} ---")

    # 2. Cập nhật bộ nhớ RAM (Hot Update)
    updated_df = pd.read_csv(csv_path)
    state.TARGET_TASK_IDENTIFICATION = updated_df["label"]
    
    # Encode lại toàn bộ kiến thức mới
    print("--- [LEARNING] Đang cập nhật bộ não điện tử... ---")
    state.EMBEDDINGS_TASK = state.SBERT_MODEL.encode(
        updated_df["text"].tolist(), 
        convert_to_tensor=True, 
        normalize_embeddings=True
    )
    print("Xong! Tôi đã thông minh hơn một chút rồi đấy.")