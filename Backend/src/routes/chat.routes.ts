import { Router } from "express";
import {
  sendMessage,
  getHistory,
  sendMessageToConversation,
  getNewMessagesForSync,
  syncAIResponse
} from "../controllers/chat.controller";
import {
  optionalAuthMiddleware,
  authMiddleware,
} from "../middlewares/auth.middleware";

const router = Router();

// Option 1: POST without conversationId -> BE tạo mới conversation nếu cần
router.post("/", optionalAuthMiddleware, sendMessage);

// Option 2: POST with conversationId param (backward-compatible)
router.post(
  "/:conversationId",
  optionalAuthMiddleware,
  sendMessageToConversation,
);

router.get("/:conversationId", authMiddleware, getHistory);
// router.get("/sync/internal", getNewMessagesForSync);
router.post("/sync/internal", syncAIResponse);
export default router;
