# tasks/calculator.py
import sympy as sp
import re
from utils.data_prep import extract_expression_from_text # Import hàm đã tách

class Calculator:
    def __init__(self):
        pass

    def check_equation(self, text):
        """Kiểm tra xem câu có yêu cầu tính toán không."""
        # Logic kiểm tra giữ nguyên
        if any(
            keyword in text.lower() for keyword in ["tính", "giải", "bao nhiêu"]
        ) or re.search(r"[0-9xX\+\-\*/\^=]", text):
            return True
        else:
            return False

    def calculation(self, text: str):
        """Thực hiện tính toán hoặc giải phương trình."""
        if not self.check_equation(text):
            return "Không phát hiện yêu cầu tính toán trong câu này."

        # Sử dụng hàm đã tách
        expr = extract_expression_from_text(text) 
        try:
            x = sp.Symbol("x")
            
            # ... (Logic xử lý so sánh, bằng mấy, phương trình, tính biểu thức giữ nguyên) ...
            
            # --- 3. Trường hợp có dạng “có bằng ... không” ---
            match_compare = re.search(
                r"(.+?)\s*có\s*bằng\s*([0-9xX\+\-\*/\^=\s\.]+)", text
            )
            if match_compare:
                left = match_compare.group(1)
                right = match_compare.group(2)
                left_val = sp.simplify(left)
                right_val = sp.simplify(right)
                if left_val == right_val:
                    return f"Đúng, hai vế bằng nhau ({left_val} = {right_val})."
                else:
                    return f"Sai, {left_val} ≠ {right_val}."

            # --- 4. Nếu là câu hỏi “bằng mấy” ---
            if any(kw in text for kw in ["bằng mấy", "bằng bao nhiêu", "bao nhiêu"]):
                expr = re.sub(r"bằng\s*mấy|bằng\s*bao\s*nhiêu|bao\s*nhiêu", "", expr)
                result = sp.simplify(expr)
                return f"Kết quả là: {result}"

            # --- 5. Nếu có dấu '=' → phương trình ---
            if "=" in expr:
                left, right = expr.split("=")
                equation = sp.Eq(sp.sympify(left), sp.sympify(right))
                solutions = sp.solve(equation, x)
                if not solutions:
                    return "Phương trình này vô nghiệm."
                return f"Nghiệm của phương trình là: {solutions}"

            # --- 6. Mặc định: tính giá trị biểu thức ---
            result = sp.simplify(expr)
            return f"Kết quả là: {result}"

        except Exception:
            return f"Mình không hiểu biểu thức này: {expr}"