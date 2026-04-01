import { Request, Response } from "express";
import * as ConversationService from "../services/conversation.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export const createConversation = async (req: Request, res: Response) => {
  try {
    const { userId, title } = req.body;
    const conversation = await ConversationService.createConversation(
      userId,
      title
    );
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: "Cannot create conversation" });
  }
};

export const getConversations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId as string;
    console.log(userId);
    
    const list = await ConversationService.getConversations(userId);
    res.json(list);
  } catch {
    res.status(500).json({ error: "Cannot fetch conversations" });
  }
};
