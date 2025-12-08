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
exports.scheduleNewsPublishing = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const news_model_1 = __importDefault(require("../models/news.model"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const scheduleNewsPublishing = () => {
    node_cron_1.default.schedule("* * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
        const now = new Date();
        try {
            const scheduledNews = yield news_model_1.default.find({
                is_published: false,
                published_at: { $ne: null, $lte: now },
            });
            for (const news of scheduledNews) {
                news.is_published = true;
                yield news.save();
                const users = yield user_model_1.default.find({}).select("_id").lean();
                const notifications = users.map((user) => ({
                    userId: user._id,
                    title: "Tin tức mới từ Shop For Real!",
                    message: `Tin tức "${news.title}" đã được đăng, xem ngay nhé!`,
                    type: "news",
                    isRead: false,
                    link: `/posts/${news._id}`,
                }));
                yield notification_model_1.default.insertMany(notifications);
                console.log(`Tự động đăng bài: ${news.title}`);
            }
        }
        catch (err) {
            console.error("Lỗi khi đăng bài tự động:", err);
        }
    }));
};
exports.scheduleNewsPublishing = scheduleNewsPublishing;
