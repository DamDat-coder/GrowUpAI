// services/ai.service.ts
import axios from "axios";

export const aiService = {
  generate: async (userId: string, input: string): Promise<string> => {
    try {
      // 1. Gọi đúng port 8000 và đúng endpoint /api/v1/chat
      const res = await axios.post("http://localhost:8000/api/v1/chat", {
        user_id: userId, // Truyền userId để Python biết ai đang chat
        message: input
      });

      // 2. FastAPI trả về object có key là 'response'
      return res.data.response;
    } catch (error) {
      console.error("Lỗi khi gọi sang FastAPI:", error);
      throw new Error("AI Service hiện không khả dụng.");
    }
  }
};