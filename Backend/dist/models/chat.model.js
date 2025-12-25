"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ChatMessageSchema = new mongoose_1.Schema({
    conversationId: { type: String, required: true },
    sender: { type: String, enum: ["user", "ai"], required: true },
    message: { type: String, required: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("ChatMessage", ChatMessageSchema);
