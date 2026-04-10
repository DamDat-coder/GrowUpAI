import mongoose from "mongoose";
import { aiService } from "./ai.service";
import ChatMessage from "../models/chat.model";
import { createConversation } from "./conversation.service";
import Conversation from "../models/conversation.model";
type Sender = "user" | "assistant";

export const addMessage = async (params: {
  conversationId?: string | null;
  userId?: string | null;
  sender: Sender;
  message: string;
  callAI?: boolean;
}) => {
  const { conversationId, userId, sender, message, callAI = true } = params;

  let convId = conversationId ?? null;

  // Nếu conversationId có cung cấp nhưng không hợp lệ -> gán về null
  if (convId && !mongoose.Types.ObjectId.isValid(convId)) {
    convId = null;
  }

  // ================= TỐI ƯU Ở ĐOẠN NÀY =================
  if (!convId) {
    // Gọi thẳng hàm createConversation đã viết sẵn!
    // Truyền 'message' vào làm firstMessage để nó tự đẻ ra Title xịn
    const conv = await createConversation(userId ?? "anonymous", message);
    convId = conv._id.toString();
  } else {
    // Nếu convId hợp lệ nhưng lỡ không tồn tại trong DB (do lỗi gì đó)
    const exists = await Conversation.findById(convId);
    if (!exists) {
      const conv = await createConversation(userId ?? "anonymous", message);
      convId = conv._id.toString();
    }
  }
  // =====================================================

  // Toàn bộ phần tạo ChatMessage và gọi AI phía dưới bạn GIỮ NGUYÊN 100%
  const createdMessage = await ChatMessage.create({
    conversationId: convId,
    sender,
    message,
  });

  await Conversation.findByIdAndUpdate(convId, { updatedAt: new Date() });

  const result: {
    conversationId: string;
    message: typeof createdMessage;
    assistantMessage?: any;
  } = {
    conversationId: convId as string,
    message: createdMessage,
  };

  if (sender === "user" && callAI) {
    try {
      const reply = await aiService.generate(userId || "anonymous", message);
      const assistantMsg = await ChatMessage.create({
        conversationId: convId,
        sender: "assistant",
        message: reply,
      });

      await Conversation.findByIdAndUpdate(convId, { updatedAt: new Date() });
      result.assistantMessage = assistantMsg;
    } catch (err) {
      console.error("AI service error:", err);
    }
  }

  return result;
};

export const getMessages = async (conversationId: string) => {
  return await ChatMessage.find({ conversationId })
    .sort({ createdAt: 1 })
    .lean();
};