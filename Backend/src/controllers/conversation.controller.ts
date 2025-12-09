import { Request, Response } from "express";
import * as ConversationService from "../services/conversation.service";

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

export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    console.log(userId);
    
    const list = await ConversationService.getConversations(userId);
    res.json(list);
  } catch {
    res.status(500).json({ error: "Cannot fetch conversations" });
  }
};
