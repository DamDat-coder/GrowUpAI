import Conversation from "../models/conversation.model";
import { aiService } from "./ai.service";
import ChatMessage from "../models/chat.model";

export const createConversation = async (
  userId: string,
  firstMessage?: string,
) => {
  let title = "New Conversation";

  // Nếu có tin nhắn đầu tiên, nhờ Gemini đặt tên hộ
  if (firstMessage) {
    title = await aiService.generateTitle(firstMessage);
  }

  return await Conversation.create({
    userId,
    title,
  });
};

export const getConversations = async (userId: string) => {
  // Chỉ lấy những cái chưa bị xóa mềm
  return await Conversation.find({ userId, isDeleted: false }).sort({
    updatedAt: -1,
  });
};
export const getConversationById = async (id: string) => {
  return await Conversation.findById(id);
};
export const deleteConversation = async (id: string) => {
  return await Conversation.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
};

export const renameConversation = async (id: string, newTitle: string) => {
  return await Conversation.findByIdAndUpdate(
    id,
    { title: newTitle },
    { new: true }, // Trả về object sau khi đã update
  );
};
