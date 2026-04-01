import { Router } from "express";
import {
  createConversation,
  getConversations,
} from "../controllers/conversation.controller";
import { optionalAuthMiddleware } from "../middlewares/auth.middleware";
const router = Router();

router.post("/", createConversation);
router.get("/", optionalAuthMiddleware, getConversations);

export default router;
