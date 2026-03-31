"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = { userId: decoded.userId };
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuthMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // Nếu không có Token thì cho đi tiếp luôn, req.user sẽ là undefined
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next();
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Nếu token hợp lệ, gắn userId vào request
        req.user = { userId: decoded.userId };
        next();
    }
    catch (err) {
        // Kể cả token lỗi hoặc hết hạn, ta vẫn cho đi tiếp với tư cách là khách ẩn danh (Guest)
        // Hoặc nếu Đạt muốn gắt hơn: Token lởm thì báo lỗi, không có Token thì cho qua.
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
