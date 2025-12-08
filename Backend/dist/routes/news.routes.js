"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const news_controller_1 = require("../controllers/news.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = express_1.default.Router();
router.get("/all", news_controller_1.getAllNews);
router.post("/", auth_middleware_1.verifyToken, upload_middleware_1.upload.array("images", 10), news_controller_1.createNews);
router.put("/:id", auth_middleware_1.verifyToken, upload_middleware_1.upload.array("images", 10), news_controller_1.updateNews);
router.delete("/:id", auth_middleware_1.verifyToken, auth_middleware_1.verifyAdmin, news_controller_1.deleteNews);
router.get("/", news_controller_1.getNewsList);
router.get("/:id", news_controller_1.getNewsDetail);
exports.default = router;
