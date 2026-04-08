class Executor:
    def __init__(self, tools: dict):
        self.tools = tools

    def run(self, plan: dict):
        # Khởi tạo context với câu hỏi gốc
        execution_context = {
            "original_question": plan.get("text", ""),
            "search_query": None, 
            "rag_data": None
        }
        
        print("[EXECUTOR] Bắt đầu thực thi plan...")
        previous_output = None

        for i, step in enumerate(plan.get("steps", []), 1):
            action = step.get("action")
            input_data = step.get("input")

            # --- PHẦN FIX LỖI NONE Ở ĐÂY ---
            # Nếu input là "context.abc", ta bốc giá trị từ execution_context["abc"]
            if isinstance(input_data, str) and input_data.startswith("context."):
                context_key = input_data.replace("context.", "")
                # Lấy giá trị từ context, nếu chưa có thì dùng câu hỏi gốc (fallback)
                input_data = execution_context.get(context_key) or execution_context["original_question"]
            
            # Nếu không có input và cũng không phải context mapping, dùng output của bước trước
            elif input_data is None:
                input_data = previous_output
            # -------------------------------

            print(f"  → Step {i}: {action} | Input: {input_data[:50]}...")

            if action in self.tools:
                # Thực thi tool
                result = self.tools[action](input_data, execution_context)
                
                # Lưu kết quả vào context theo tên action để các bước sau có thể gọi "context.action_name"
                execution_context[action] = result
                previous_output = result
            else:
                execution_context[action] = f"Error: Tool '{action}' không tồn tại."
                previous_output = None

        return execution_context