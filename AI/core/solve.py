from AI.tasks import calculator, data_handler


def solve(problem):
    goal = problem["goal"]

    if goal == "solve_numeric_problem":
        return calculator.solve(problem["text"])

    if goal == "analyze_data":
        return data_handler.handle(problem)

    if problem["requires_external_knowledge"]:
        print("Tôi cần tìm thêm thông tin...")
