import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import state
import json
from sentence_transformers import util

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# Khởi tạo Client
client = genai.Client(api_key=api_key) if api_key else None


def fallback_classify(text):
    """
    Khi Gemini không khả dụng, dùng SBERT so sánh ngữ nghĩa của câu
    với danh sách các Label hiện có để chọn ra cái gần nhất.
    """
    print("--- [FALLBACK] Đang sử dụng SBERT để tự dự đoán nhãn... ---")
    # 1. Lấy danh sách nhãn duy nhất hiện có (ví dụ: ['calculation', 'handle_file'])
    labels = list(set(state.TARGET_TASK_IDENTIFICATION.tolist()))

    if not labels:
        return {"label": "general_chat", "reason": "Chưa có nhãn nào trong hệ thống"}

    # 2. Encode các nhãn và câu text
    label_embeddings = state.SBERT_MODEL.encode(labels, convert_to_tensor=True)
    text_embedding = state.SBERT_MODEL.encode(text, convert_to_tensor=True)

    # 3. So sánh độ tương đồng (Cosine Similarity)
    hits = util.semantic_search(text_embedding, label_embeddings, top_k=1)

    # 4. Lấy nhãn có điểm cao nhất
    best_label_idx = hits[0][0]["corpus_id"]
    best_label = labels[best_label_idx]

    return {
        "label": best_label,
        "reason": f"Dự đoán dựa trên độ tương đồng ngữ nghĩa với nhóm '{best_label}'",
    }


def ask_gemini_to_classify(text):
    existing_labels = list(set(state.TARGET_TASK_IDENTIFICATION.tolist()))

    # Cải thiện prompt để kết quả chính xác hơn
    prompt = f"""
    Bạn là chuyên gia phân loại Intent.
    Danh sách nhãn hiện có: {existing_labels}.
    
    Nhiệm vụ: Phân loại câu: "{text}"
    Trả về định dạng JSON:
    {{
      "label": "tên_label",
      "reason": "giải thích ngắn"
    }}
    Lưu ý: Nếu không thuộc nhãn cũ, hãy tạo nhãn mới ngắn gọn bằng tiếng Anh.
    """
    # clean_text = text.replace("```json", "").replace("```", "").strip()
    if client:
        try:
            # Sử dụng alias 'gemini-flash-latest' để tự động tìm bản khả dụng
            response = client.models.generate_content(
                model="gemini-flash-latest", 
                contents=prompt,
                config={
                    "temperature": 0,
                    "response_mime_type": "application/json",
                },
            )
            return json.loads(response.text)

        except Exception as e:
            # Kiểm tra nếu lỗi do hết hạn mức (Quota)
            if "429" in str(e) or "limit" in str(e).lower():
                print(f"--- [Hệ thống] Gemini hết lượt dùng (Limit 0). Chuyển sang SBERT... ---")
            else:
                print(f"--- [Hệ thống] Gemini lỗi khác: {e} ---")

    return fallback_classify(text)