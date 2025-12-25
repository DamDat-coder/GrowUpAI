"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Option 1: POST without conversationId -> BE tạo mới conversation nếu cần
router.post("/", auth_middleware_1.authMiddleware, chat_controller_1.sendMessage);
// Option 2: POST with conversationId param (backward-compatible)
router.post("/:conversationId", auth_middleware_1.authMiddleware, chat_controller_1.sendMessageToConversation);
router.get("/:conversationId", auth_middleware_1.authMiddleware, chat_controller_1.getHistory);
exports.default = router;
