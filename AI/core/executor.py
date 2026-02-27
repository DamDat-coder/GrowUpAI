class Executor:
    def __init__(self, tools: dict):
        self.tools = tools

    def run(self, plan: dict):
        execution_context = {}
        execution_context["original_question"] = plan.get("original_question", "")
        print("⚙️ [EXECUTOR] Bắt đầu thực thi plan...")
        
        previous_output = None

        for i, step in enumerate(plan.get("steps", []), 1):
            action = step.get("action")

            # Nếu plan có input riêng → dùng nó
            if "input" in step:
                input_data = step["input"]
            else:
                # Nếu không có input → dùng output step trước
                input_data = previous_output

            print(f"  → Step {i}: {action}")
            
            if action in self.tools:
                result = self.tools[action](input_data, execution_context)
                execution_context[action] = result
                previous_output = result
            else:
                execution_context[action] = f"Error: Tool '{action}' không tồn tại."
                previous_output = None

        return execution_context