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
exports.redirectZaloPayReturn = exports.checkZaloPayReturn = exports.createZaloPayPayment = exports.checkVNPayReturn = exports.createVNPayPayment = void 0;
const vnpay_1 = require("vnpay");
const moment_1 = __importDefault(require("moment"));
const payment_model_1 = __importDefault(require("../models/payment.model"));
const mongoose_1 = require("mongoose");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const payment_config_1 = require("../config/payment.config");
const generateTransactionCode_1 = require("../utils/generateTransactionCode");
// VNPay - Tạo thanh toán
const createVNPayPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { totalPrice, userId, orderInfo, discountAmount = 0 } = req.body;
        if (!totalPrice || !userId || !orderInfo) {
            return res.status(400).json({ message: "Thiếu thông tin!" });
        }
        const transactionCode = yield (0, generateTransactionCode_1.generateUniqueTransactionCode)("4U");
        const payment = yield payment_model_1.default.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            amount: totalPrice,
            discount_amount: discountAmount,
            status: "pending",
            transaction_code: transactionCode,
            transaction_data: {},
            transaction_summary: {},
            order_info: Object.assign(Object.assign({}, orderInfo), { paymentMethod: "vnpay" }),
            gateway: "vnpay",
        });
        const paymentUrl = yield payment_config_1.vnpay.buildPaymentUrl({
            vnp_Amount: totalPrice,
            vnp_IpAddr: req.ip || "127.0.0.1",
            vnp_TxnRef: transactionCode,
            vnp_OrderInfo: `Thanh toán đơn hàng ${transactionCode}|userId:${userId}`,
            vnp_OrderType: vnpay_1.ProductCode.Other,
            vnp_ReturnUrl: `https://api.styleforyou.online/payment/check-payment-vnpay`,
            vnp_Locale: vnpay_1.VnpLocale.VN,
            vnp_CreateDate: Number((0, moment_1.default)().format("YYYYMMDDHHmmss")),
            vnp_ExpireDate: Number((0, moment_1.default)().add(30, "minutes").format("YYYYMMDDHHmmss")),
        });
        return res.status(200).json({ paymentUrl, paymentId: payment._id });
    }
    catch (error) {
        return res.status(500).json({ message: "Không tạo được URL VNPay", error });
    }
});
exports.createVNPayPayment = createVNPayPayment;
// VNPay - Callback xử lý thanh toán
const checkVNPayReturn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const queryParams = req.query;
        const isValid = payment_config_1.vnpay.verifyReturnUrl(queryParams);
        if (!isValid)
            return res.status(400).json({ message: "Chữ ký không hợp lệ!" });
        const { vnp_TxnRef, vnp_ResponseCode, vnp_PayDate, vnp_BankCode, vnp_TransactionNo, } = queryParams;
        const payment = yield payment_model_1.default.findOne({ transaction_code: vnp_TxnRef });
        if (!payment)
            return res.status(404).json({ message: "Không tìm thấy giao dịch!" });
        payment.status = vnp_ResponseCode === "00" ? "success" : "failed";
        payment.paid_at = vnp_PayDate
            ? (0, moment_1.default)(vnp_PayDate, "YYYYMMDDHHmmss").toDate()
            : new Date();
        payment.transaction_data = queryParams;
        payment.transaction_summary = {
            gatewayTransactionId: vnp_TransactionNo === null || vnp_TransactionNo === void 0 ? void 0 : vnp_TransactionNo.toString(),
            bankCode: vnp_BankCode,
            amount: payment.amount,
        };
        yield payment.save();
        const redirect = vnp_ResponseCode === "00" ? "success" : "fail";
        return res.redirect(`https://styleforyou.online/payment/${redirect}?orderId=${vnp_TxnRef}`);
    }
    catch (error) {
        return res.status(500).json({ message: "Callback VNPay lỗi!", error });
    }
});
exports.checkVNPayReturn = checkVNPayReturn;
// ZaloPay - Tạo thanh toán
const createZaloPayPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { totalPrice, userId, orderInfo, discountAmount = 0 } = req.body;
        console.log("Request Body:", {
            totalPrice,
            userId,
            orderInfo,
            discountAmount,
        });
        if (!totalPrice || !userId || !orderInfo) {
            console.error("Thiếu thông tin thanh toán:", {
                totalPrice,
                userId,
                orderInfo,
            });
            return res.status(400).json({ message: "Thiếu thông tin thanh toán!" });
        }
        const datePrefix = (0, moment_1.default)().format("YYMMDD");
        const randomSuffix = Math.floor(Math.random() * 1000000);
        const transactionCode = `${datePrefix}_${randomSuffix}`;
        console.log("Generated transactionCode:", transactionCode);
        const app_time = Date.now();
        console.log("App Time:", app_time);
        const embedData = {
            redirecturl: `https://api.styleforyou.online/payment/zalopay-return`,
            userId,
        };
        console.log("Embed Data:", embedData);
        const itemList = orderInfo.items.map((item) => {
            return {
                itemid: item.productId,
                itemquantity: item.quantity,
                itemcolor: item.color,
                itemsize: item.size,
            };
        });
        console.log("Item List:", itemList);
        const order = {
            app_id: payment_config_1.ZALO_PAY.appId,
            app_trans_id: transactionCode,
            app_user: `user_${userId.slice(-4)}`,
            app_time,
            amount: totalPrice,
            item: JSON.stringify(itemList),
            embed_data: JSON.stringify(embedData),
            description: `Thanh toán đơn hàng ${transactionCode}`,
            bank_code: "",
            callback_url: payment_config_1.ZALO_PAY.callbackUrl,
        };
        console.log("Order Data:", order);
        const data = [
            payment_config_1.ZALO_PAY.appId,
            transactionCode,
            order.app_user,
            totalPrice,
            app_time,
            order.embed_data,
            order.item,
        ].join("|");
        console.log("HMAC Data:", data);
        console.log("HMAC Key:", payment_config_1.ZALO_PAY.key1);
        order.mac = crypto_1.default
            .createHmac("sha256", payment_config_1.ZALO_PAY.key1)
            .update(data)
            .digest("hex");
        console.log("Computed HMAC:", order.mac);
        const zalopayRes = yield axios_1.default.post(payment_config_1.ZALO_PAY.endpoint, null, {
            params: order,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        console.log("ZaloPay Response:", JSON.stringify(zalopayRes.data, null, 2));
        if (zalopayRes.data.return_code !== 1) {
            console.error("ZaloPay từ chối giao dịch:", zalopayRes.data);
            return res.status(400).json({
                message: "ZaloPay từ chối giao dịch!",
                error: zalopayRes.data,
            });
        }
        const payment = yield payment_model_1.default.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            amount: totalPrice,
            discount_amount: discountAmount,
            status: "pending",
            transaction_code: transactionCode,
            transaction_data: order,
            transaction_summary: {},
            order_info: Object.assign(Object.assign({}, orderInfo), { paymentMethod: "zalopay" }),
            gateway: "zalopay",
        });
        console.log("Created Payment:", JSON.stringify(payment, null, 2));
        return res.status(200).json({
            paymentUrl: zalopayRes.data.order_url,
            paymentId: payment._id,
        });
    }
    catch (error) {
        console.error("Lỗi trong createZaloPayPayment:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error);
        return res.status(500).json({
            message: "Không tạo được thanh toán ZaloPay",
            error: ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error,
        });
    }
});
exports.createZaloPayPayment = createZaloPayPayment;
// ZaloPay - Callback xử lý thanh toán
const checkZaloPayReturn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data, mac } = req.body;
        console.log("ZaloPay Callback Raw Data:", JSON.stringify(req.body, null, 2));
        const computedMac = crypto_1.default
            .createHmac("sha256", payment_config_1.ZALO_PAY.key2)
            .update(data)
            .digest("hex");
        if (computedMac !== mac) {
            console.error("Chữ ký không hợp lệ:", { data, mac, computedMac });
            return res
                .status(400)
                .json({ return_code: -1, return_message: "Chữ ký không hợp lệ" });
        }
        let result;
        try {
            result = JSON.parse(data);
            console.log("ZaloPay Callback Parsed Result:", JSON.stringify(result, null, 2));
        }
        catch (parseError) {
            console.error("Lỗi parse JSON:", parseError, "Data:", data);
            return res
                .status(400)
                .json({
                return_code: -1,
                return_message: "Dữ liệu callback không hợp lệ",
            });
        }
        const { app_trans_id, return_code, return_message, zp_trans_id, bank_code, discount_amount, amount, server_time, } = result;
        const payment = yield payment_model_1.default.findOne({ transaction_code: app_trans_id });
        if (!payment) {
            console.error(`Không tìm thấy giao dịch với app_trans_id: ${app_trans_id}`);
            return res
                .status(404)
                .json({ return_code: -1, return_message: "Không tìm thấy giao dịch" });
        }
        if (payment.status !== "pending") {
            console.log(`Giao dịch đã xử lý, trạng thái hiện tại: ${payment.status}`);
            return res
                .status(200)
                .json({ return_code: 1, return_message: "Đã xử lý" });
        }
        // Xử lý trường hợp return_code undefined
        if (return_code === undefined) {
            console.warn("Callback thiếu return_code, giả định dựa trên zp_trans_id:", result);
            if (zp_trans_id) {
                // Giả định giao dịch thành công nếu có zp_trans_id
                payment.status = "success";
            }
            else {
                payment.status = "failed";
                console.error("Giao dịch thất bại do thiếu zp_trans_id:", result);
            }
        }
        else if (return_code === 1) {
            payment.status = "success";
        }
        else if (return_code === 2) {
            payment.status = "canceled";
        }
        else {
            payment.status = "failed";
            console.error(`Giao dịch thất bại với return_code: ${return_code}, Message: ${return_message}`);
        }
        payment.paid_at = server_time ? new Date(Number(server_time)) : new Date();
        payment.transaction_data = result;
        payment.transaction_summary = {
            gatewayTransactionId: zp_trans_id === null || zp_trans_id === void 0 ? void 0 : zp_trans_id.toString(),
            bankCode: bank_code,
            amount: amount,
        };
        if (discount_amount) {
            payment.discount_amount = Number(discount_amount);
        }
        yield payment.save();
        console.log("Payment updated:", JSON.stringify(payment, null, 2));
        return res
            .status(200)
            .json({ return_code: 1, return_message: "Giao dịch thành công" });
    }
    catch (error) {
        console.error("Lỗi trong checkZaloPayReturn:", error);
        return res
            .status(500)
            .json({ return_code: -1, return_message: "Lỗi server", error });
    }
});
exports.checkZaloPayReturn = checkZaloPayReturn;
// Redirect người dùng về frontend sau khi thanh toán
const redirectZaloPayReturn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { apptransid, status } = req.query;
    try {
        // Kiểm tra trạng thái giao dịch trong database
        const payment = yield payment_model_1.default.findOne({ transaction_code: apptransid });
        if (!payment) {
            return res.status(404).json({ message: "Không tìm thấy giao dịch" });
        }
        // Nếu giao dịch vẫn đang ở trạng thái pending, chờ một khoảng thời gian
        if (payment.status === "pending") {
            let attempts = 0;
            const maxAttempts = 5;
            const delay = 1000; // 1 giây
            while (attempts < maxAttempts) {
                yield new Promise((resolve) => setTimeout(resolve, delay));
                const updatedPayment = yield payment_model_1.default.findOne({
                    transaction_code: apptransid,
                });
                // Kiểm tra nếu updatedPayment không null
                if (updatedPayment && updatedPayment.status !== "pending") {
                    // Giao dịch đã được cập nhật
                    const redirect = updatedPayment.status === "success" ? "success" : "fail";
                    const redirectUrl = `https://styleforyou.online/payment/${redirect}?orderId=${apptransid}`;
                    return res.redirect(redirectUrl);
                }
                attempts++;
            }
            // Nếu hết số lần thử mà vẫn pending, redirect về trang pending
            return res.redirect(`https://styleforyou.online/payment/pending?orderId=${apptransid}`);
        }
        // Nếu giao dịch đã được xử lý
        const redirect = payment.status === "success" ? "success" : "fail";
        const redirectUrl = `https://styleforyou.online/payment/${redirect}?orderId=${apptransid}`;
        return res.redirect(redirectUrl);
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: "Lỗi khi kiểm tra trạng thái giao dịch", error });
    }
});
exports.redirectZaloPayReturn = redirectZaloPayReturn;
