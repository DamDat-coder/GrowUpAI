// services/ai.service.ts
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const aiService = {
  generate: async (
    userId: string,
    input: string,
    conversationId: string,
  ): Promise<string> => {
    try {
      // 1. Gọi đúng port 8000 và đúng endpoint /api/v1/chat
      const res = await axios.post("http://localhost:8000/api/v1/chat", {
        user_id: userId, // Truyền userId để Python biết ai đang chat
        message: input,
        conversationId: conversationId,
      });

      // 2. FastAPI trả về object có key là 'response'
      return res.data.response;
    } catch (error) {
      console.error("Lỗi khi gọi sang FastAPI:", error);
      throw new Error("AI Service hiện không khả dụng.");
    }
  },
  generateTitle: async (firstMessage: string): Promise<string> => {
    try {
      const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const prompt = `Hãy tóm tắt nội dung sau đây thành một tiêu đề cực kỳ ngắn gọn (không quá 6 từ), không dùng dấu ngoặc kép.
      Nội dung: "${firstMessage}"`;

      const result = await model.generateContent(prompt);
      return result.response.text().trim() || "New Conversation";
    } catch (error) {
      console.error("Lỗi khi tạo Title:", error);
      return "New Conversation";
    }
  },
};
