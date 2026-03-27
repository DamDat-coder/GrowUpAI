# tasks/calculator.py
import sympy as sp
import re
from utils.data_prep import extract_expression_from_text


class Calculator:
    def __init__(self):
        pass

    def check_equation(self, text):
        if any(
            keyword in text.lower() for keyword in ["tính", "giải", "bao nhiêu"]
        ) or re.search(r"[0-9xX\+\-\*/\^=]", text):
            return True
        else:
            return False

    def calculation(self, text: str):
        if not self.check_equation(text):
            return "Không phát hiện yêu cầu tính toán trong câu này."

        expr = extract_expression_from_text(text)
        try:
            x = sp.Symbol("x")

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

            if any(kw in text for kw in ["bằng mấy", "bằng bao nhiêu", "bao nhiêu"]):
                expr = re.sub(r"bằng\s*mấy|bằng\s*bao\s*nhiêu|bao\s*nhiêu", "", expr)
                result = sp.simplify(expr)
                return result

            if "=" in expr:
                left, right = expr.split("=")
                equation = sp.Eq(sp.sympify(left), sp.sympify(right))
                solutions = sp.solve(equation, x)
                if not solutions:
                    return "Phương trình này vô nghiệm."
                return f"Nghiệm của phương trình là: {solutions}"

            result = sp.simplify(expr)
            return result

        except Exception:
            return f"Mình không hiểu biểu thức này: {expr}"
