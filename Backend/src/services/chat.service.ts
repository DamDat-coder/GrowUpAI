import mongoose from "mongoose";
import ChatMessage from "../models/chat.model";
import Conversation from "../models/conversation.model";
import { aiService } from "./ai.service"; // nếu bạn gọi AI ở đây

type Sender = "user" | "ai";

export const addMessage = async (
  params: {
    conversationId?: string | null;
    userId?: string | null;
    sender: Sender;
    message: string;
    callAI?: boolean; // nếu true thì sẽ gọi aiService.generate và lưu reply
  }
) => {
  const { conversationId, userId, sender, message, callAI = true } = params;

  let convId = conversationId ?? null;

  // Nếu conversationId có cung cấp nhưng không hợp lệ -> bỏ qua nó
  if (convId && !mongoose.Types.ObjectId.isValid(convId)) {
    convId = null;
  }

  // Nếu conversationId không tồn tại hoặc không tìm thấy trong DB -> tạo mới
  if (!convId) {
    const conv = await Conversation.create({
      userId: userId ?? null,
      title: "New Conversation",
    });
    convId = conv._id.toString();
  } else {
    // Nếu convId hợp lệ nhưng không tồn tại trong DB -> tạo mới với cùng id (không thể set _id trực tiếp nếu dùng create),
    // nên kiểm tra tồn tại:
    const exists = await Conversation.findById(convId);
    if (!exists) {
      const conv = await Conversation.create({
        userId: userId ?? null,
        title: "New Conversation",
      });
      convId = conv._id.toString();
    }
  }

  // Tạo message từ user (hoặc ai)
  const createdMessage = await ChatMessage.create({
    conversationId: convId,
    sender,
    message,
  });

  // Update conversation updatedAt (và có thể update title nếu muốn dựa vào first message)
  await Conversation.findByIdAndUpdate(convId, { updatedAt: new Date() });

  const result: {
    conversationId: string;
    message: typeof createdMessage;
    assistantMessage?: any;
  } = {
    conversationId: convId as string,
    message: createdMessage,
  };

  // Nếu là message từ user và cần gọi AI -> gọi aiService và lưu response
  if (sender === "user" && callAI) {
    try {
      const reply = await aiService.generate(message); // mình giả sử aiService trả về string
      const assistantMsg = await ChatMessage.create({
        conversationId: convId,
        sender: "ai",
        message: reply,
      });

      // update again
      await Conversation.findByIdAndUpdate(convId, { updatedAt: new Date() });

      result.assistantMessage = assistantMsg;
    } catch (err) {
      // nếu AI lỗi thì log/throw tuỳ bạn; ở đây ta sẽ not block và trả về created user message
      console.error("AI service error:", err);
    }
  }

  return result;
};

export const getMessages = async (conversationId: string) => {
  return await ChatMessage.find({ conversationId }).sort({ createdAt: 1 }).lean();
};
