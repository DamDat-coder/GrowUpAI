# utils/data_prep.py
import re
from state import COLUMN_MAP

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

def extract_expression_from_text(text):
    text = re.sub(
        r"(tính|giải|biểu\s*thức|cho\s*tôi|hãy|giúp\s*tôi|hàm|phương\strình)\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )
    match = re.search(r"([0-9xX\+\-\*/\^\=\(\)\s\.]+)", text)
    return match.group(1).strip() if match else ""