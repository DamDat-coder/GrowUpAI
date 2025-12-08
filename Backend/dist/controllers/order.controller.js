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
exports.calculateRevenue = exports.cancelOrder = exports.updateOrderStatus = exports.getOrderById = exports.getOrdersByUser = exports.getOrders = exports.createOrder = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const dayjs_1 = __importDefault(require("dayjs"));
const coupon_model_1 = __importDefault(require("../models/coupon.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const payment_model_1 = __importDefault(require("../models/payment.model"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const mailer_1 = require("../utils/mailer");
const generateTransactionCode_1 = require("../utils/generateTransactionCode");
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { paymentId, userId, items, shippingAddress, totalPrice, discountAmount, paymentMethod, shipping, email, couponCode, } = req.body;
        // Log toàn bộ body nhận được
        console.log("DEBUG: Request body in createOrder:", JSON.stringify(req.body, null, 2));
        // Kiểm tra dữ liệu đầu vào
        if (!userId ||
            !items ||
            !Array.isArray(items) ||
            !shippingAddress ||
            !shippingAddress.street ||
            !shippingAddress.ward ||
            !shippingAddress.province ||
            !shippingAddress.phone ||
            !totalPrice ||
            !paymentMethod) {
            console.error("DEBUG: Missing required fields:", {
                userId: !!userId,
                items: !!items,
                isArrayItems: Array.isArray(items),
                shippingAddress: !!shippingAddress,
                street: !!(shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.street),
                ward: !!(shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.ward),
                province: !!(shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.province),
                phone: !!(shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.phone),
                totalPrice: !!totalPrice,
                paymentMethod: !!paymentMethod,
            });
            return res
                .status(400)
                .json({ success: false, message: "Thiếu thông tin cần thiết." });
        }
        // Log items từ body
        console.log("DEBUG: items from body in createOrder:", JSON.stringify(items, null, 2));
        // Kiểm tra từng item
        for (const item of items) {
            if (!item.productId ||
                !item.name ||
                !item.image ||
                !item.price ||
                !item.color ||
                !item.size ||
                !item.quantity) {
                console.error("DEBUG: Invalid item in createOrder:", item);
                return res.status(400).json({
                    success: false,
                    message: "Thông tin sản phẩm không đầy đủ.",
                });
            }
        }
        // Kiểm tra Payment nếu không phải COD
        if (paymentMethod !== "cod" && paymentId) {
            const payment = yield payment_model_1.default.findById(paymentId);
            if (!payment || !payment.order_info || !payment.userId) {
                return res.status(400).json({
                    success: false,
                    message: "Thông tin thanh toán không hợp lệ.",
                });
            }
            if (payment.status !== "success") {
                return res
                    .status(400)
                    .json({ success: false, message: "Thanh toán chưa hoàn tất." });
            }
        }
        // Kiểm tra đơn hàng đã tồn tại (chỉ nếu có paymentId)
        if (paymentId) {
            const existed = yield order_model_1.default.findOne({ paymentId });
            if (existed) {
                return res.status(409).json({
                    success: false,
                    message: "Đơn hàng đã được tạo từ giao dịch này.",
                });
            }
        }
        // Chuyển đổi productId thành ObjectId
        const formattedItems = items.map((item) => ({
            productId: new mongoose_1.Types.ObjectId(item.productId),
            name: item.name,
            image: item.image,
            price: item.price,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
        }));
        const orderCode = yield (0, generateTransactionCode_1.generateUniqueTransactionCode)("4U");
        const order = yield order_model_1.default.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            shippingAddress,
            totalPrice,
            discountAmount: discountAmount || 0,
            shipping: shipping || 0,
            paymentMethod,
            items: formattedItems,
            paymentId: paymentId ? new mongoose_1.Types.ObjectId(paymentId) : null,
            orderCode,
            email: email || null,
            couponCode: couponCode || null,
        });
        if (couponCode) {
            yield coupon_model_1.default.updateOne({ code: couponCode }, { $inc: { usedCount: 1 } });
        }
        // Gửi thông báo cho user
        yield notification_model_1.default.create({
            userId,
            title: "Đơn hàng của bạn đã được tạo thành công!",
            message: `Đơn hàng #${order.orderCode} đã được xác nhận.`,
            type: "order",
            isRead: false,
            link: `/profile?tab=order/${order._id}`,
        });
        // Gửi thông báo cho admin
        const admins = yield user_model_1.default.find({ role: "admin" })
            .select("_id")
            .lean();
        const notis = admins.map((admin) => ({
            userId: admin._id,
            title: "Có đơn hàng mới!",
            message: `Đơn hàng #${order.orderCode} vừa được tạo.`,
            type: "order",
            isRead: false,
        }));
        yield notification_model_1.default.insertMany(notis);
        return res.status(201).json({
            success: true,
            message: "Tạo đơn hàng thành công.",
            data: order,
        });
    }
    catch (err) {
        console.error("Lỗi tạo đơn hàng:", err);
        return res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }
});
exports.createOrder = createOrder;
// Lấy tất cả đơn hàng (Admin)
const getOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = "1", limit = "10", search, status } = req.query;
        const pageNum = Math.max(parseInt(page), 1);
        const limitNum = Math.max(parseInt(limit), 1);
        const skip = (pageNum - 1) * limitNum;
        const query = {};
        if (status) {
            query.status = status;
        }
        if (search) {
            const users = yield user_model_1.default.find({
                name: { $regex: search, $options: "i" },
            }).select("_id");
            const userIds = users.map((user) => user._id);
            query.userId = { $in: userIds };
        }
        const [orders, total] = yield Promise.all([
            order_model_1.default.find(query)
                .populate("userId", "name email")
                .populate("paymentId", "amount status paymentMethod")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            order_model_1.default.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (err) {
        console.error("Lỗi khi lấy đơn hàng:", err);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ.",
            error: err.message,
        });
    }
});
exports.getOrders = getOrders;
// Lấy đơn hàng theo người dùng
const getOrdersByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        const orders = yield order_model_1.default.find({ userId })
            .populate("paymentId", "amount status paymentMethod")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    }
    catch (err) {
        res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }
});
exports.getOrdersByUser = getOrdersByUser;
// Lấy đơn hàng theo ID
const getOrderById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield order_model_1.default.findById(req.params.id)
            .populate("userId", "name email")
            .populate("paymentId", "amount status paymentMethod");
        if (!order) {
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy đơn hàng." });
        }
        res.status(200).json({ success: true, data: order });
    }
    catch (err) {
        res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }
});
exports.getOrderById = getOrderById;
// Cập nhật trạng thái đơn hàng
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = [
            "pending",
            "confirmed",
            "shipping",
            "delivered",
            "cancelled",
            "fake",
        ];
        if (!validStatuses.includes(status)) {
            return res
                .status(400)
                .json({ success: false, message: "Trạng thái không hợp lệ." });
        }
        if (!mongoose_2.default.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, message: "ID đơn hàng không hợp lệ." });
        }
        const order = yield order_model_1.default.findByIdAndUpdate(id, { status }, { new: true }).populate("userId", "name email");
        if (!order || !order.userId) {
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy đơn hàng." });
        }
        const user = order.userId;
        yield notification_model_1.default.create({
            userId: user._id,
            title: `Đơn hàng #${order._id} đã được cập nhật`,
            message: `Trạng thái đơn hàng của bạn hiện tại là: ${status}.`,
            type: "order",
            isRead: false,
            link: `/profile?tab=order/${order._id}`,
        });
        if (status === "fake") {
            const fakeOrderCount = yield order_model_1.default.countDocuments({
                userId: user._id,
                status: "fake",
            });
            if (fakeOrderCount === 1) {
                yield (0, mailer_1.sendOrderSpamWarningEmail)(user.email, user.name);
                yield notification_model_1.default.create({
                    userId: user._id,
                    title: "Cảnh báo hành vi giả mạo",
                    message: "Đơn hàng của bạn đã bị đánh dấu là giả mạo. Nếu tiếp tục, tài khoản có thể bị khóa.",
                    type: "warning",
                    isRead: false,
                    link: "/profile?tab=order",
                });
            }
            if (fakeOrderCount >= 3) {
                yield user_model_1.default.findByIdAndUpdate(user._id, { is_active: false });
                yield (0, mailer_1.sendAccountBlockedEmail)(user.email, user.name);
                yield notification_model_1.default.create({
                    userId: user._id,
                    title: "Tài khoản bị khóa",
                    message: "Tài khoản của bạn đã bị khóa vì có quá nhiều đơn hàng giả mạo.",
                    type: "lock",
                    isRead: false,
                    link: "/profile",
                });
            }
        }
        return res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái thành công.",
            data: order,
        });
    }
    catch (err) {
        console.error("Lỗi cập nhật đơn:", err);
        return res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }
});
exports.updateOrderStatus = updateOrderStatus;
// Huỷ đơn hàng (người dùng)
const cancelOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield order_model_1.default.findById(req.params.id);
        if (!order)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy đơn hàng." });
        if (order.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể huỷ đơn hàng đang chờ xử lý.",
            });
        }
        order.status = "cancelled";
        yield order.save();
        res.status(200).json({
            success: true,
            message: "Huỷ đơn hàng thành công.",
            data: order,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }
});
exports.cancelOrder = cancelOrder;
// Tính doanh thu
const calculateRevenue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { range = "today", from, to } = req.query;
        let startDate;
        let endDate;
        const now = (0, dayjs_1.default)();
        switch (range) {
            case "today":
                startDate = now.startOf("day").toDate();
                endDate = now.endOf("day").toDate();
                break;
            case "7days":
                startDate = now.subtract(7, "day").startOf("day").toDate();
                endDate = now.endOf("day").toDate();
                break;
            case "month":
                startDate = now.startOf("month").toDate();
                endDate = now.endOf("day").toDate();
                break;
            case "year":
                startDate = now.startOf("year").toDate();
                endDate = now.endOf("day").toDate();
                break;
            case "custom":
                if (from && to) {
                    startDate = new Date(from);
                    endDate = new Date(to);
                }
                else {
                    res.status(400).json({
                        status: "error",
                        message: "Phải truyền đủ 'from' và 'to' khi dùng kiểu custom",
                    });
                    return;
                }
                break;
            default:
                res.status(400).json({
                    status: "error",
                    message: "Giá trị 'range' không hợp lệ",
                });
                return;
        }
        const match = {
            $or: [{ status: "delivered" }, { status: "confirmed" }],
            createdAt: { $gte: startDate, $lte: endDate },
        };
        const result = yield order_model_1.default.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalPrice" },
                    totalShippingFee: { $sum: { $ifNull: ["$shippingFee", 0] } },
                    orderCount: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalRevenue: 1,
                    totalShippingFee: 1,
                    grandTotal: { $add: ["$totalRevenue", "$totalShippingFee"] },
                    orderCount: 1,
                },
            },
        ]);
        res.json({
            status: "success",
            data: result[0] || {
                totalRevenue: 0,
                totalShippingFee: 0,
                grandTotal: 0,
                orderCount: 0,
            },
        });
    }
    catch (error) {
        console.error("Error calculating total revenue:", error);
        res.status(500).json({
            status: "error",
            message: "Lỗi máy chủ khi tính tổng doanh thu",
        });
    }
});
exports.calculateRevenue = calculateRevenue;
