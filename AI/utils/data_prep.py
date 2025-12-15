# utils/data_prep.py
import re
from state import COLUMN_MAP # Dùng COLUMN_MAP để tham chiếu

def extract_numbers(text):
    """Trích xuất tất cả số (số nguyên/số thập phân) từ chuỗi."""
    return re.findall(r"\d+\.?\d*", text)

def extract_feature_values(text, mapped_cols):
    """Trích xuất giá trị số cho các thuộc tính đã ánh xạ."""
    result = {}
    for col, kw in mapped_cols.items():
        # Tìm giá trị số theo sau keyword (kw)
        pattern = rf"{kw}\D*(\d+\.?\d*)" 
        m = re.search(pattern, text)
        if m:
            result[col] = float(m.group(1))
    return result

# Hàm extract_expression từ class Calculator cũ cũng nên được chuyển vào đây
def extract_expression_from_text(text):
    """Tách biểu thức toán học hoặc phương trình từ câu."""
    # Loại bỏ các từ khóa thừa
    text = re.sub(
        r"(tính|giải|biểu\s*thức|cho\s*tôi|hãy|giúp\s*tôi|hàm|phương\strình)\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )
    # Tìm chuỗi có chứa số, biến 'x', và toán tử
    match = re.search(r"([0-9xX\+\-\*/\^\=\(\)\s\.]+)", text)
    return match.group(1).strip() if match else ""