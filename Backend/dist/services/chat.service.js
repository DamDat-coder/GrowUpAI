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
const chat_model_1 = __importDefault(require("../models/chat.model"));
const conversation_model_1 = __importDefault(require("../models/conversation.model"));
const ai_service_1 = require("./ai.service"); // nếu bạn gọi AI ở đây
const addMessage = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId, userId, sender, message, callAI = true } = params;
    let convId = conversationId !== null && conversationId !== void 0 ? conversationId : null;
    // Nếu conversationId có cung cấp nhưng không hợp lệ -> bỏ qua nó
    if (convId && !mongoose_1.default.Types.ObjectId.isValid(convId)) {
        convId = null;
    }
    // Nếu conversationId không tồn tại hoặc không tìm thấy trong DB -> tạo mới
    if (!convId) {
        const conv = yield conversation_model_1.default.create({
            userId: userId !== null && userId !== void 0 ? userId : null,
            title: "New Conversation",
        });
        convId = conv._id.toString();
    }
    else {
        // Nếu convId hợp lệ nhưng không tồn tại trong DB -> tạo mới với cùng id (không thể set _id trực tiếp nếu dùng create),
        // nên kiểm tra tồn tại:
        const exists = yield conversation_model_1.default.findById(convId);
        if (!exists) {
            const conv = yield conversation_model_1.default.create({
                userId: userId !== null && userId !== void 0 ? userId : null,
                title: "New Conversation",
            });
            convId = conv._id.toString();
        }
    }
    // Tạo message từ user (hoặc ai)
    const createdMessage = yield chat_model_1.default.create({
        conversationId: convId,
        sender,
        message,
    });
    // Update conversation updatedAt (và có thể update title nếu muốn dựa vào first message)
    yield conversation_model_1.default.findByIdAndUpdate(convId, { updatedAt: new Date() });
    const result = {
        conversationId: convId,
        message: createdMessage,
    };
    // Nếu là message từ user và cần gọi AI -> gọi aiService và lưu response
    if (sender === "user" && callAI) {
        try {
            const reply = yield ai_service_1.aiService.generate(message); // mình giả sử aiService trả về string
            const assistantMsg = yield chat_model_1.default.create({
                conversationId: convId,
                sender: "ai",
                message: reply,
            });
            // update again
            yield conversation_model_1.default.findByIdAndUpdate(convId, { updatedAt: new Date() });
            result.assistantMessage = assistantMsg;
        }
        catch (err) {
            // nếu AI lỗi thì log/throw tuỳ bạn; ở đây ta sẽ not block và trả về created user message
            console.error("AI service error:", err);
        }
    }
    return result;
});
exports.addMessage = addMessage;
const getMessages = (conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield chat_model_1.default.find({ conversationId }).sort({ createdAt: 1 }).lean();
});
exports.getMessages = getMessages;
