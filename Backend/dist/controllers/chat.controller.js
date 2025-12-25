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
exports.getHistory = exports.sendMessageToConversation = exports.sendMessage = void 0;
const ChatService = __importStar(require("../services/chat.service"));
/**
 * POST /api/chat
 * body: { conversationId?: string, message: string }
 * (optional) nếu route có authMiddleware thì req.user!.userId sẽ có giá trị
 */
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { conversationId, message } = req.body;
        const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) !== null && _b !== void 0 ? _b : ((_c = req.body.userId) !== null && _c !== void 0 ? _c : null); // nếu bạn muốn cho phép truyền userId ở body
        if (!message || typeof message !== "string") {
            return res.status(400).json({ success: false, message: "Missing message" });
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
            return res.status(400).json({ success: false, message: "Missing message" });
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
    try {
        const { conversationId } = req.params;
        if (!conversationId) {
            return res.status(400).json({ message: "conversationId required" });
        }
        const history = yield ChatService.getMessages(conversationId);
        return res.json({ success: true, data: history });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.getHistory = getHistory;
