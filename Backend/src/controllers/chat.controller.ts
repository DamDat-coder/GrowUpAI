import { Request, Response } from "express";
import * as ChatService from "../services/chat.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

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

    // Lấy userId từ token nếu có (MEMBER), hoặc từ body/query/localStorage truyền lên nếu là GUEST
    const currentUserId = req.user?.userId || (req.query.guestId as string);
    console.log("currentUserId: ",currentUserId);
    
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId required" });
    }

    // Ở tầng Service, bạn cần sửa hàm getMessages để check quyền sở hữu
    const history = await ChatService.getMessages(conversationId);

    // [BẢO MẬT] Kiểm tra xem tin nhắn trong cuộc hội thoại này có phải của User hiện tại không
    if (history.length > 0 && history[0]._id !== currentUserId) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Bạn không có quyền xem lịch sử này!",
        });
    }

    return res.json({ success: true, data: history });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
