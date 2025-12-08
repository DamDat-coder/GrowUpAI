"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const xss_clean_1 = __importDefault(require("xss-clean"));
const hpp_1 = __importDefault(require("hpp"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const news_routes_1 = __importDefault(require("./routes/news.routes"));
const coupon_routes_1 = __importDefault(require("./routes/coupon.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const payment_routers_1 = __importDefault(require("./routes/payment.routers"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
require("./jobs/cron");
const address_routes_1 = __importDefault(require("./routes/address.routes"));
require("./jobs/notifyFreeship.job");
dotenv_1.default.config();
const app = (0, express_1.default)();
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau."
});
app.use(limiter);
app.use((0, xss_clean_1.default)());
app.use((0, hpp_1.default)());
app.set("trust proxy", 1);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = ["http://localhost:3300"];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use("/api/users", user_routes_1.default);
app.use("/api/products", product_routes_1.default);
app.use("/api/news", news_routes_1.default);
app.use("/api/coupons", coupon_routes_1.default);
app.use("/api/categories", category_routes_1.default);
app.use("/api/orders", order_routes_1.default);
app.use("/api/payment", payment_routers_1.default);
app.use("/api/reviews", review_routes_1.default);
app.use("/api/notifications", notification_routes_1.default);
app.use("/api/address", address_routes_1.default);
app.use(error_middleware_1.errorHandler);
exports.default = app;
