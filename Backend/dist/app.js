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
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const conversation_routes_1 = __importDefault(require("./routes/conversation.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// BẮT BUỘC — dùng trước router
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
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
app.use("/api/users", user_routes_1.default);
app.use("/api/conversation", conversation_routes_1.default);
app.use("/api/chat", chat_routes_1.default);
exports.default = app;
