"use strict";
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
exports.getMessages = exports.addMessage = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ai_service_1 = require("./ai.service");
const chat_model_1 = __importDefault(require("../models/chat.model"));
const conversation_service_1 = require("./conversation.service");
const conversation_model_1 = __importDefault(require("../models/conversation.model"));
const addMessage = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId, userId, sender, message, callAI = true } = params;
    let convId = conversationId !== null && conversationId !== void 0 ? conversationId : null;
    // Nếu conversationId có cung cấp nhưng không hợp lệ -> gán về null
    if (convId && !mongoose_1.default.Types.ObjectId.isValid(convId)) {
        convId = null;
    }
    // ================= TỐI ƯU Ở ĐOẠN NÀY =================
    if (!convId) {
        // Gọi thẳng hàm createConversation đã viết sẵn!
        // Truyền 'message' vào làm firstMessage để nó tự đẻ ra Title xịn
        const conv = yield (0, conversation_service_1.createConversation)(userId !== null && userId !== void 0 ? userId : "anonymous", message);
        convId = conv._id.toString();
    }
    else {
        // Nếu convId hợp lệ nhưng lỡ không tồn tại trong DB (do lỗi gì đó)
        const exists = yield conversation_model_1.default.findById(convId);
        if (!exists) {
            const conv = yield (0, conversation_service_1.createConversation)(userId !== null && userId !== void 0 ? userId : "anonymous", message);
            convId = conv._id.toString();
        }
    }
    // =====================================================
    // Toàn bộ phần tạo ChatMessage và gọi AI phía dưới bạn GIỮ NGUYÊN 100%
    const createdMessage = yield chat_model_1.default.create({
        conversationId: convId,
        sender,
        message,
    });
    yield conversation_model_1.default.findByIdAndUpdate(convId, { updatedAt: new Date() });
    const result = {
        conversationId: convId,
        message: createdMessage,
    };
    if (sender === "user" && callAI) {
        try {
            const reply = yield ai_service_1.aiService.generate(userId || "anonymous", message, conversationId);
            const assistantMsg = yield chat_model_1.default.create({
                conversationId: convId,
                sender: "assistant",
                message: reply,
            });
            yield conversation_model_1.default.findByIdAndUpdate(convId, { updatedAt: new Date() });
            result.assistantMessage = assistantMsg;
        }
        catch (err) {
            console.error("AI service error:", err);
        }
    }
    return result;
});
exports.addMessage = addMessage;
const getMessages = (conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield chat_model_1.default.find({ conversationId })
        .sort({ createdAt: 1 })
        .lean();
});
exports.getMessages = getMessages;
