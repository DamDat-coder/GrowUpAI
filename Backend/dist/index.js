"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const envPath = path_1.default.resolve(__dirname, "../env");
dotenv_1.default.config({ path: envPath });
const PORT = process.env.PORT || 3000;
(0, db_1.default)()
    .then(() => {
    app_1.default.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
})
    .catch((err) => {
    console.error("❌ Kết nối MongoDB thất bại:", err);
    process.exit(1);
});
