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
exports.markNotificationAsRead = exports.getMyNotifications = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
// Lấy thông báo của người dùng hiện tại
const getMyNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const notifications = yield notification_model_1.default.find({
            $or: [{ userId }, { userId: null }],
        })
            .sort({ createdAt: -1 })
            .limit(100);
        res.status(200).json({ success: true, data: notifications });
    }
    catch (error) {
        console.error("Lỗi lấy thông báo:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }
});
exports.getMyNotifications = getMyNotifications;
// Đánh dấu là đã đọc
const markNotificationAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const notificationId = req.params.id;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const updated = yield notification_model_1.default.findOneAndUpdate({
            _id: notificationId,
            $or: [
                { userId: userId },
                { userId: null },
            ],
        }, { is_read: true }, { new: true });
        if (!updated) {
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy thông báo." });
        }
        res
            .status(200)
            .json({
            success: true,
            message: "Đã đánh dấu là đã đọc.",
            data: updated,
        });
    }
    catch (error) {
        console.error("Lỗi đánh dấu đọc:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }
});
exports.markNotificationAsRead = markNotificationAsRead;
