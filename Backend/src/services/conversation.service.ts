import Conversation from "../models/conversation.model";
import { aiService } from "./ai.service";

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
  return await Conversation.find({ userId }).sort({ updatedAt: -1 });
};
