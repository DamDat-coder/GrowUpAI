"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const review_controller_1 = require("../controllers/review.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
router.post("/", auth_middleware_1.verifyToken, upload.array("images", 3), review_controller_1.createReview);
router.get("/product/:productId", review_controller_1.getProductReviews);
router.get("/", auth_middleware_1.verifyToken, auth_middleware_1.verifyAdmin, review_controller_1.getAllReviews);
router.put("/:id/status", auth_middleware_1.verifyToken, auth_middleware_1.verifyAdmin, review_controller_1.updateReviewStatus);
router.post("/:id/reply", auth_middleware_1.verifyToken, auth_middleware_1.verifyAdmin, review_controller_1.replyToReview);
exports.default = router;
