# utils/helpers.py
import asyncio
import random
import os
import random
from dotenv import load_dotenv

load_dotenv()

def get_random_api_key():
    """
    Lấy ngẫu nhiên một API Key từ danh sách trong .env để tránh bị 429 liên tục.
    """
    keys_str = os.getenv("GEMINI_API_KEYS", "")
    print("keys_str: ",keys_str)
    # Chuyển chuỗi thành list và loại bỏ khoảng trắng dư thừa
    api_keys = [k.strip() for k in keys_str.split(",") if k.strip()]
    
    if not api_keys:
        # Fallback về key cũ nếu bạn chưa kịp update .env
        single_key = os.getenv("GEMINI_API_KEYS")
        if single_key:
            return single_key
        raise ValueError("❌ Không tìm thấy GEMINI_API_KEY nào trong file .env!")

    # Chọn ngẫu nhiên 1 key
    selected_key = random.choice(api_keys)
    
    print(f"Using API Key: {selected_key[:8]}***") 
    
    return selected_key
async def retry_with_backoff(fn, *args, retries=3, initial_delay=2, **kwargs):
    delay = initial_delay
    for i in range(retries):
        try:
            return await fn(*args, **kwargs)
        except Exception as e:
            if "429" in str(e) and i < retries - 1:
                # Tính toán thời gian chờ: 2^i + một chút nhiễu (jitter) để tránh dồn dập
                sleep_time = delay * (2 ** i) + random.uniform(0, 1)
                print(f"[429 Quota] Đang thử lại lần {i+1}/{retries} sau {sleep_time:.2f}s...")
                await asyncio.sleep(sleep_time)
            else:
                raise e # Nếu lỗi khác hoặc hết lượt retry thì "ngửa bài" luôn