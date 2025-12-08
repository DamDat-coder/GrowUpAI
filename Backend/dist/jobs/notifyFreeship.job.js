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
const node_cron_1 = __importDefault(require("node-cron"));
const user_model_1 = __importDefault(require("../models/user.model"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
node_cron_1.default.schedule("0 9 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Bắt đầu kiểm tra wishlist để gửi gợi ý freeship...");
    try {
        const users = yield user_model_1.default.find().select("_id wishlist updatedAt");
        for (const user of users) {
            const hasWishlist = user.wishlist && user.wishlist.length > 0;
            if (!hasWishlist)
                continue;
            // Tính mốc 7 ngày trước
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            if (!user.updatedAt || user.updatedAt > sevenDaysAgo) {
                console.log(`User ${user._id} mới cập nhật wishlist, chưa đủ 7 ngày`);
                continue;
            }
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const alreadySent = yield notification_model_1.default.exists({
                userId: user._id,
                title: "Gợi ý mã miễn phí vận chuyển",
                createdAt: { $gte: todayStart },
            });
            if (alreadySent) {
                console.log(`Đã gửi thông báo cho user ${user._id} hôm nay, bỏ qua`);
                continue;
            }
            // Gửi thông báo
            yield notification_model_1.default.create({
                userId: user._id,
                title: "Gợi ý mã miễn phí vận chuyển",
                message: "Bạn có sản phẩm trong wishlist hơn 7 ngày. Sử dụng mã FREESHIP để được miễn phí vận chuyển!",
                type: "promotion",
                is_read: false,
            });
            console.log(`Đã gửi thông báo freeship cho user ${user._id}`);
        }
        console.log("Hoàn thành gửi thông báo freeship");
    }
    catch (error) {
        console.error("Lỗi khi gửi thông báo freeship:", error);
    }
}));
