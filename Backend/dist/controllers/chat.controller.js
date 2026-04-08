"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNewMessagesForSync = exports.getHistory = exports.sendMessageToConversation = exports.sendMessage = void 0;
const ChatService = __importStar(require("../services/chat.service"));
const conversation_model_1 = __importDefault(require("../models/conversation.model"));
const chat_model_1 = __importDefault(require("../models/chat.model"));
/**
 * POST /api/chat
 * body: { conversationId?: string, message: string }
 * (optional) nếu route có authMiddleware thì req.user!.userId sẽ có giá trị
 */
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { conversationId, message } = req.body;
        const userId = (_c = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) !== null && _b !== void 0 ? _b : req.body.userId) !== null && _c !== void 0 ? _c : null; // nếu bạn muốn cho phép truyền userId ở body
        if (!message || typeof message !== "string") {
            return res
                .status(400)
                .json({ success: false, message: "Missing message" });
        }
        const result = yield ChatService.addMessage({
            conversationId,
            userId,
            sender: "user",
            message,
            callAI: true,
        });
        return res.status(201).json({ success: true, data: result });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.sendMessage = sendMessage;
/**
 * POST /api/chat/:conversationId
 * dùng khi FE muốn gọi theo route cũ
 */
const sendMessageToConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { conversationId } = req.params;
        const { message } = req.body;
        const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) !== null && _b !== void 0 ? _b : null;
        if (!message || typeof message !== "string") {
            return res
                .status(400)
                .json({ success: false, message: "Missing message" });
        }
        const result = yield ChatService.addMessage({
            conversationId,
            userId,
            sender: "user",
            message,
            callAI: true,
        });
        return res.status(201).json({ success: true, data: result });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.sendMessageToConversation = sendMessageToConversation;
/**
 * GET /api/chat/:conversationId
 */
const getHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { conversationId } = req.params;
        const currentUserId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || req.query.guestId;
        if (!conversationId) {
            return res.status(400).json({ message: "conversationId required" });
        }
        // 1. [BẢO MẬT] Tìm cuộc hội thoại này trong DB xem nó thuộc về ai
        const conversation = yield conversation_model_1.default.findById(conversationId);
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
        const history = yield ChatService.getMessages(conversationId);
        return res.json({ success: true, data: history });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.getHistory = getHistory;
const getNewMessagesForSync = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { since } = req.query;
        const query = { sender: { $in: ["user", "ai"] } };
        if (since && since !== "None" && since !== "undefined") {
            // Ép kiểu Date chính xác từ chuỗi ISO
            const sinceDate = new Date(since);
            if (!isNaN(sinceDate.getTime())) {
                query.createdAt = { $gt: sinceDate };
            }
        }
        const messages = yield chat_model_1.default.find(query)
            .sort({ createdAt: 1 }) // Quan trọng: Phải sort tăng dần để lấy tin nhắn cuối làm mốc
            .lean();
        return res.json({ success: true, data: messages });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "Sync error" });
    }
});
exports.getNewMessagesForSync = getNewMessagesForSync;
