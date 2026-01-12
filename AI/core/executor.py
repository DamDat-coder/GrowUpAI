# core/executor.py

class Executor:
    def __init__(self, tools: dict):
        self.tools = tools

    def run(self, plan: dict):
        execution_context = {}
        print("⚙️ [EXECUTOR] Bắt đầu thực thi plan...")

        for i, step in enumerate(plan.get("steps", []), 1):
            action = step.get("action")
            # Lấy input từ plan, nếu không có thì lấy text gốc của user
            input_data = step.get("input", "") 

            print(f"  → Step {i}: {action} ('{input_data}')")

            if action in self.tools:
                # Thực thi tool
                result = self.tools[action](input_data)
                execution_context[action] = result
            else:
                execution_context[action] = f"Error: Tool '{action}' không tồn tại."

        return execution_context