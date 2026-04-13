import { Router } from "express";
import {
  createConversation,
  deleteConversation,
  getConversations,
  renameConversation,
} from "../controllers/conversation.controller";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../middlewares/auth.middleware";
const router = Router();

router.post("/", createConversation);
router.get("/", optionalAuthMiddleware, getConversations);
router.patch("/rename", authMiddleware, renameConversation);
router.delete("/", authMiddleware, deleteConversation);

export default router;
