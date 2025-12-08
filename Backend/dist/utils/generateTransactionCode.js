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
exports.generateUniqueTransactionCode = generateUniqueTransactionCode;
const payment_model_1 = __importDefault(require("../models/payment.model"));
function generateShortCode(length = 6) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function generateUniqueTransactionCode(prefix_1) {
    return __awaiter(this, arguments, void 0, function* (prefix, maxTries = 10) {
        const minuteCode = new Date().getMinutes().toString().padStart(2, "0");
        for (let i = 0; i < maxTries; i++) {
            const code = `${prefix}-${generateShortCode(6)}${minuteCode}`;
            const exists = yield payment_model_1.default.findOne({ transaction_code: code });
            if (!exists)
                return code;
        }
        throw new Error("Không thể tạo transaction_code duy nhất!");
    });
}
