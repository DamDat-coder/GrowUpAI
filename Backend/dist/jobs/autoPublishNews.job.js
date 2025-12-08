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
exports.autoPublishNews = void 0;
const news_model_1 = __importDefault(require("../models/news.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const autoPublishNews = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        now.setHours(now.getHours() + 7);
        const newsToPublish = yield news_model_1.default
            .find({ is_published: false, published_at: { $lte: now } })
            .select("title _id")
            .lean();
        if (newsToPublish.length === 0) {
            return;
        }
        const newsIds = newsToPublish.map((news) => news._id);
        const result = yield news_model_1.default.updateMany({ _id: { $in: newsIds } }, { $set: { is_published: true } });
        console.log("[AutoPublish] Đã đăng", result.modifiedCount, "bài:", newsToPublish.map((news) => news.title).join(", "));
        // Gửi thông báo
        setImmediate(() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const users = yield user_model_1.default.find({}).select("_id").lean();
                const notifications = newsToPublish.flatMap((news) => users.map((user) => ({
                    userId: user._id,
                    title: "Tin tức mới từ Shop For Real",
                    message: `Tin tức "${news.title}" vừa được đăng, xem ngay nhé!`,
                    type: "news",
                    isRead: false,
                    link: `/posts/${news._id}`,
                })));
                yield notification_model_1.default.insertMany(notifications);
                console.log(`[AutoPublish] Đã gửi ${notifications.length} thông báo.`);
            }
            catch (notifyErr) {
                console.error("[AutoPublish] Gửi thông báo thất bại:", notifyErr);
            }
        }));
    }
    catch (error) {
        console.error("[AutoPublish] Lỗi khi tự động đăng tin tức:", error);
    }
});
exports.autoPublishNews = autoPublishNews;
