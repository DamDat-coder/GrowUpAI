import { Request, Response } from "express";
import * as ChatService from "../services/chat.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import Conversation from "../models/conversation.model";
import ChatMessage from "../models/chat.model";

/**
 * POST /api/chat
 * body: { conversationId?: string, message: string }
 * (optional) nếu route có authMiddleware thì req.user!.userId sẽ có giá trị
 */
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { conversationId, message } = req.body;
    const userId = req.user?.userId ?? req.body.userId ?? null; // nếu bạn muốn cho phép truyền userId ở body

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Missing message" });
    }

    const result = await ChatService.addMessage({
      conversationId,
      userId,
      sender: "user",
      message,
      callAI: true,
    });

    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * POST /api/chat/:conversationId
 * dùng khi FE muốn gọi theo route cũ
 */
export const sendMessageToConversation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;
    const userId = req.user?.userId ?? null;

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Missing message" });
    }

    const result = await ChatService.addMessage({
      conversationId,
      userId,
      sender: "user",
      message,
      callAI: true,
    });

    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/chat/:conversationId
 */
export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user?.userId || (req.query.guestId as string);

    if (!conversationId) {
      return res.status(400).json({ message: "conversationId required" });
    }

    // 1. [BẢO MẬT] Tìm cuộc hội thoại này trong DB xem nó thuộc về ai
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy cuộc hội thoại!" });
    }

    // Kiểm tra quyền sở hữu
    if (conversation.userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem lịch sử này!",
      });
    }

    // 2. Nếu đúng chủ sở hữu thì mới đi bốc tin nhắn ra trả về
    const history = await ChatService.getMessages(conversationId);
    return res.json({ success: true, data: history });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export const getNewMessagesForSync = async (req: Request, res: Response) => {
  try {
    const { since } = req.query;
    const query: any = { sender: { $in: ["user", "assistant"] } };

    if (since && since !== "None" && since !== "undefined") {
      // Ép kiểu Date chính xác từ chuỗi ISO
      const sinceDate = new Date(since as string);
      if (!isNaN(sinceDate.getTime())) {
        query.createdAt = { $gt: sinceDate };
      }
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 }) // Quan trọng: Phải sort tăng dần để lấy tin nhắn cuối làm mốc
      .lean();

    return res.json({ success: true, data: messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Sync error" });
  }
};

export const syncAIResponse = async (req: Request, res: Response) => {
  try {
    const { userId, conversationId, userMessage, aiResponse } = req.body;

    // Ép buộc dùng đúng ID từ Python gửi sang (ID này lấy từ URL của FE)
    const targetConvId = conversationId;
    console.log("userId: ", userId);
    console.log("conversationId: ", targetConvId);
    console.log("userMessage: ", userMessage);
    console.log("aiResponse: ", aiResponse);
    // 1. Lưu tin nhắn User
    await ChatMessage.create({
      conversationId: targetConvId,
      sender: "user",
      message: userMessage,
    });

    // 2. Lưu tin nhắn AI
    await ChatMessage.create({
      conversationId: targetConvId,
      sender: "assistant", // Đảm bảo khớp Enum trong model của bạn
      message: aiResponse,
    });

    // 3. Cập nhật thời gian cho Conversation
    await Conversation.findByIdAndUpdate(targetConvId, {
      updatedAt: new Date(),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Sync Error:", err);
    return res.status(500).json({ success: false });
  }
};
