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
exports.getConversations = exports.createConversation = void 0;
const conversation_model_1 = __importDefault(require("../models/conversation.model"));
const createConversation = (userId, title) => __awaiter(void 0, void 0, void 0, function* () {
    return yield conversation_model_1.default.create({
        userId,
        title: title !== null && title !== void 0 ? title : "New Conversation",
    });
});
exports.createConversation = createConversation;
const getConversations = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield conversation_model_1.default.find({ userId }).sort({ updatedAt: -1 });
});
exports.getConversations = getConversations;
