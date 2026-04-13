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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversation = exports.renameConversation = exports.getConversations = exports.createConversation = void 0;
const ConversationService = __importStar(require("../services/conversation.service"));
const createConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, title } = req.body;
        const conversation = yield ConversationService.createConversation(userId, title);
        res.json(conversation);
    }
    catch (err) {
        res.status(500).json({ error: "Cannot create conversation" });
    }
});
exports.createConversation = createConversation;
const getConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        console.log(userId);
        const list = yield ConversationService.getConversations(userId);
        res.json(list);
    }
    catch (_b) {
        res.status(500).json({ error: "Cannot fetch conversations" });
    }
});
exports.getConversations = getConversations;
// Sửa tên Conversation
const renameConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { conversationId, newTitle } = req.body;
        console.log("conversationId: ", conversationId);
        console.log("newTitle: ", newTitle);
        if (!conversationId || !newTitle) {
            return res.status(400).json({ error: "Thiếu ID hoặc tiêu đề mới" });
        }
        const updated = yield ConversationService.renameConversation(conversationId, newTitle);
        if (!updated) {
            return res.status(404).json({ error: "Không tìm thấy cuộc hội thoại" });
        }
        res.json({ success: true, data: updated });
    }
    catch (err) {
        res.status(500).json({ error: "Lỗi khi đổi tên hội thoại" });
    }
});
exports.renameConversation = renameConversation;
const deleteConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 1. Lấy ID từ body hoặc params (tùy bạn thiết kế, ở đây mình dùng body theo code bạn gửi)
        const { conversationId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        // 2. Tìm DUY NHẤT một cuộc hội thoại theo ID
        // Giả sử bạn có hàm getConversationById trong service
        const conv = yield ConversationService.getConversationById(conversationId);
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
        yield ConversationService.deleteConversation(conversationId);
        res.json({ success: true, message: "Đã chuyển vào thùng rác thành công" });
    }
    catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ error: "Lỗi khi xóa hội thoại" });
    }
});
exports.deleteConversation = deleteConversation;
