import { Request, Response } from "express";
import * as ConversationService from "../services/conversation.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export const createConversation = async (req: Request, res: Response) => {
  try {
    const { userId, title } = req.body;
    const conversation = await ConversationService.createConversation(
      userId,
      title,
    );
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: "Cannot create conversation" });
  }
};

export const getConversations = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId as string;
    console.log(userId);

    const list = await ConversationService.getConversations(userId);
    res.json(list);
  } catch {
    res.status(500).json({ error: "Cannot fetch conversations" });
  }
};

// Sửa tên Conversation
export const renameConversation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { conversationId, newTitle } = req.body;
    console.log("conversationId: ", conversationId);
    console.log("newTitle: ", newTitle);

    if (!conversationId || !newTitle) {
      return res.status(400).json({ error: "Thiếu ID hoặc tiêu đề mới" });
    }

    const updated = await ConversationService.renameConversation(
      conversationId,
      newTitle,
    );

    if (!updated) {
      return res.status(404).json({ error: "Không tìm thấy cuộc hội thoại" });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi đổi tên hội thoại" });
  }
};

export const deleteConversation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    // 1. Lấy ID từ body hoặc params (tùy bạn thiết kế, ở đây mình dùng body theo code bạn gửi)
    const { conversationId } = req.body;
    const userId = req.user?.userId;

    // 2. Tìm DUY NHẤT một cuộc hội thoại theo ID
    // Giả sử bạn có hàm getConversationById trong service
    const conv = await ConversationService.getConversationById(conversationId);

    // 3. Kiểm tra tồn tại và đúng chủ sở hữu
    if (!conv) {
      return res.status(404).json({ error: "Không tìm thấy cuộc hội thoại" });
    }

    if (conv.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền xóa cuộc hội thoại này" });
    }

    // 4. Gọi service để soft delete
    await ConversationService.deleteConversation(conversationId);

    res.json({ success: true, message: "Đã chuyển vào thùng rác thành công" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Lỗi khi xóa hội thoại" });
  }
};
