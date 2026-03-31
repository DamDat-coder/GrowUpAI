import { Router } from "express";
import {
  sendMessage,
  getHistory,
  sendMessageToConversation,
} from "../controllers/chat.controller";
import { optionalAuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Option 1: POST without conversationId -> BE tạo mới conversation nếu cần
router.post("/",optionalAuthMiddleware, sendMessage);

// Option 2: POST with conversationId param (backward-compatible)
router.post("/:conversationId",optionalAuthMiddleware, sendMessageToConversation);

router.get("/:conversationId", getHistory);

export default router;
