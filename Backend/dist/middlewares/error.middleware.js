"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({
        success: false,
        message: err.message || "Đã xảy ra lỗi máy chủ.",
    });
};
exports.errorHandler = errorHandler;
