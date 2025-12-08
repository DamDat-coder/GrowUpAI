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
exports.replyToReview = exports.updateReviewStatus = exports.getAllReviews = exports.getProductReviews = exports.createReview = void 0;
const review_model_1 = __importDefault(require("../models/review.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_1 = require("cloudinary");
const spam_keywords_1 = require("../config/spam-keywords");
const mailer_1 = require("../utils/mailer");
// Tạo đánh giá sản phẩm
const createReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { productId, orderId, content, rating } = req.body;
        if (!userId || !productId || !orderId || !content || !rating) {
            return res
                .status(400)
                .json({ success: false, message: "Thiếu thông tin review." });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(productId) ||
            !mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            return res
                .status(400)
                .json({ success: false, message: "ID không hợp lệ." });
        }
        const order = yield order_model_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(orderId),
            userId,
            status: "delivered",
            "items.productId": new mongoose_1.default.Types.ObjectId(productId),
        });
        if (!order) {
            return res.status(403).json({
                success: false,
                message: "Bạn chỉ có thể đánh giá sản phẩm trong đơn hàng đã giao.",
            });
        }
        const existingReview = yield review_model_1.default.findOne({
            userId,
            productId,
            orderId,
        });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi.",
            });
        }
        const imageUrls = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const result = yield new Promise((resolve, reject) => {
                    const stream = cloudinary_1.v2.uploader.upload_stream({ resource_type: "image", folder: "reviews" }, (error, result) => {
                        if (error || !result)
                            return reject(error);
                        resolve(result);
                    });
                    stream.end(file.buffer);
                });
                imageUrls.push(result.secure_url);
            }
        }
        const isSpam = spam_keywords_1.SPAM_KEYWORDS.some((keyword) => content.toLowerCase().includes(keyword.toLowerCase()));
        let reviewStatus = isSpam ? "spam" : "approved";
        let spamWarningMessage = "";
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy người dùng." });
        }
        if (isSpam) {
            const existingSpamCount = yield review_model_1.default.countDocuments({
                userId,
                status: "spam",
            });
            const spamCountAfterThis = existingSpamCount + 1;
            if (spamCountAfterThis >= 3) {
                yield user_model_1.default.findByIdAndUpdate(userId, { is_active: false });
                yield (0, mailer_1.sendAccountBlockedEmail)(user.email, user.name || "Người dùng");
                spamWarningMessage =
                    "Tài khoản đã bị khóa vì có quá nhiều đánh giá spam.";
                const newReview = yield review_model_1.default.create({
                    userId,
                    productId,
                    orderId,
                    content,
                    rating,
                    status: reviewStatus,
                    images: imageUrls,
                    adminReply: null,
                });
                return res.status(403).json({
                    success: false,
                    message: "Tài khoản đã bị khóa vì spam",
                    errorCode: "ACCOUNT_BLOCKED",
                    accountBlocked: true,
                    data: newReview,
                });
            }
            else {
                yield (0, mailer_1.sendReviewWarningEmail)(user.email, user.name || "Người dùng");
                spamWarningMessage = `Đánh giá bị đánh dấu là spam. Đây là lần thứ ${spamCountAfterThis}. Nếu tiếp tục, tài khoản sẽ bị khóa.`;
            }
            // Trả về success: false khi đánh giá là spam
            const newReview = yield review_model_1.default.create({
                userId,
                productId,
                orderId,
                content,
                rating,
                status: reviewStatus,
                images: imageUrls,
                adminReply: null, // Explicitly set adminReply to null
            });
            return res.status(400).json({
                success: false,
                message: spamWarningMessage,
                errorCode: "REVIEW_SPAM",
                data: newReview,
            });
        }
        // Tạo đánh giá khi không phải spam
        const newReview = yield review_model_1.default.create({
            userId,
            productId,
            orderId,
            content,
            rating,
            status: reviewStatus,
            images: imageUrls,
            adminReply: null, // Explicitly set adminReply to null
        });
        return res.status(201).json({
            success: true,
            message: "Đã gửi đánh giá.",
            data: newReview,
        });
    }
    catch (error) {
        console.error("Lỗi tạo review:", error);
        return res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }
});
exports.createReview = createReview;
const getProductReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productId = req.params.productId;
        const reviews = yield review_model_1.default.find({
            productId,
            status: "approved",
        })
            .populate("userId", "name")
            .sort({ createdAt: -1 })
            .select("userId content rating images status createdAt adminReply"); // Thêm adminReply vào select
        res.status(200).json({ success: true, data: reviews });
    }
    catch (error) {
        console.error("Lỗi khi lấy đánh giá:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }
});
exports.getProductReviews = getProductReviews;
const getAllReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = "1", limit = "10", search, status } = req.query;
        const pageNum = Math.max(parseInt(page), 1);
        const limitNum = Math.max(parseInt(limit), 1);
        const skip = (pageNum - 1) * limitNum;
        const query = {};
        if (status && (status === "approved" || status === "spam")) {
            query.status = status;
        }
        if (search) {
            query.content = { $regex: search, $options: "i" };
        }
        const [reviews, total] = yield Promise.all([
            review_model_1.default.find(query)
                .populate("userId", "name email")
                .populate("productId", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            review_model_1.default.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: reviews,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error("Lỗi khi lấy tất cả đánh giá:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ.",
            error: error.message,
        });
    }
});
exports.getAllReviews = getAllReviews;
// Cập nhật trạng thái đánh giá
const updateReviewStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!["approved", "spam"].includes(status)) {
            return res
                .status(400)
                .json({ success: false, message: "Trạng thái không hợp lệ." });
        }
        const updated = yield review_model_1.default.findByIdAndUpdate(id, { status }, { new: true });
        if (!updated) {
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy đánh giá." });
        }
        res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái thành công.",
            data: updated,
        });
    }
    catch (error) {
        console.error("Lỗi khi cập nhật trạng thái đánh giá:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }
});
exports.updateReviewStatus = updateReviewStatus;
// Trả lời đánh giá (chỉ admin)
const replyToReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { content } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!adminId) {
            return res
                .status(401)
                .json({ success: false, message: "Chưa đăng nhập." });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, message: "ID đánh giá không hợp lệ." });
        }
        if (!content || content.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Nội dung trả lời không được để trống.",
            });
        }
        const review = yield review_model_1.default.findById(id)
            .populate("userId", "name") // Populate userId để lấy tên người dùng
            .populate("productId", "name"); // Populate productId để lấy tên sản phẩm
        if (!review) {
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy đánh giá." });
        }
        // Cập nhật trả lời của admin
        review.adminReply = {
            content: content.trim(),
            createdAt: new Date(),
        };
        yield review.save();
        // Populate lại để đảm bảo dữ liệu đầy đủ
        const updatedReview = yield review_model_1.default.findById(id)
            .populate("userId", "name")
            .populate("productId", "name");
        return res.status(200).json({
            success: true,
            message: "Trả lời đánh giá thành công.",
            data: updatedReview,
        });
    }
    catch (error) {
        console.error("Lỗi khi trả lời đánh giá:", error);
        return res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }
});
exports.replyToReview = replyToReview;
