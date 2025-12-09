import Conversation from "../models/conversation.model";

export const createConversation = async (userId: string, title?: string) => {
  return await Conversation.create({
    userId,
    title: title ?? "New Conversation",
  });
};

export const getConversations = async (userId: string) => {
  return await Conversation.find({ userId }).sort({ updatedAt: -1 });
};
