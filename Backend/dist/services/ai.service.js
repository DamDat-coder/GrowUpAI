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
exports.aiService = void 0;
// services/ai.service.ts
const axios_1 = __importDefault(require("axios"));
exports.aiService = {
    generate: (userId, input) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // 1. Gọi đúng port 8000 và đúng endpoint /api/v1/chat
            const res = yield axios_1.default.post("http://localhost:8000/api/v1/chat", {
                user_id: userId, // Truyền userId để Python biết ai đang chat
                message: input
            });
            // 2. FastAPI trả về object có key là 'response'
            return res.data.response;
        }
        catch (error) {
            console.error("Lỗi khi gọi sang FastAPI:", error);
            throw new Error("AI Service hiện không khả dụng.");
        }
    })
};
