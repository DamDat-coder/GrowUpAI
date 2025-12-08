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
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySmsOTP = exports.sendSmsOTP = void 0;
const vonage_1 = require("../config/vonage");
// Gửi OTP
const sendSmsOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res
                .status(400)
                .json({ success: false, message: "Vui lòng nhập số điện thoại." });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        vonage_1.otpMap.set(phone, otp);
        console.log(`📩 Gửi OTP ${otp} đến số: ${phone}`);
        console.log("Bắt đầu gửi SMS...");
        try {
            const toPhone = phone.startsWith("0")
                ? "+84" + phone.slice(1)
                : phone;
            const response = yield vonage_1.vonage.sms.send({
                to: toPhone,
                from: process.env.VONAGE_FROM || "Shop For Real",
                text: `Mã OTP Shop For Real của bạn là: ${otp}`,
            });
            console.log("Vonage response:", response);
        }
        catch (error) {
            console.error("Vonage send error:", error);
        }
        console.log("Kết thúc gửi SMS.");
        return res.json({ success: true, message: "Đã gửi OTP qua SMS." });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Gửi SMS OTP thất bại.",
            error: error.message || "Lỗi không xác định.",
        });
    }
});
exports.sendSmsOTP = sendSmsOTP;
// Xác minh OTP
const verifySmsOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            return res
                .status(400)
                .json({ success: false, message: "Thiếu số điện thoại hoặc mã OTP." });
        }
        const savedOTP = vonage_1.otpMap.get(phone);
        if (!savedOTP) {
            return res.status(400).json({
                success: false,
                message: "OTP không tồn tại hoặc đã hết hạn.",
            });
        }
        if (otp !== savedOTP) {
            return res
                .status(401)
                .json({ success: false, message: "Mã OTP không chính xác." });
        }
        vonage_1.otpMap.delete(phone);
        return res.json({ success: true, message: "Xác minh OTP thành công." });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi xác minh OTP.",
            error: error.message || "Lỗi không xác định.",
        });
    }
});
exports.verifySmsOTP = verifySmsOTP;
