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
exports.sendAccountUnlockedEmail = exports.sendAccountBlockedEmail = exports.sendOrderSpamWarningEmail = exports.sendReviewWarningEmail = exports.sendResetPasswordEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Khởi tạo transporter chung
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
// Gửi email đặt lại mật khẩu
const sendResetPasswordEmail = (to, resetLink) => __awaiter(void 0, void 0, void 0, function* () {
    const mailOptions = {
        from: `"Shop For Real" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Khôi phục mật khẩu - Shop For Real",
        html: `
      <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="text-align: center; color: #111827;">Shop For Real</h2>
        <h3 style="text-align: center; color: #111827;">Đặt lại mật khẩu</h3>
        <p style="font-size: 16px;">Xin chào,</p>
        <p style="font-size: 16px;">Bạn đã yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới để tiếp tục:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetLink}" style="background-color: #111827; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            Đặt lại mật khẩu
          </a>
        </div>
        <p style="font-size: 13px; color: #6b7280; text-align: center;">
          Liên kết này chỉ có hiệu lực trong 15 phút. Nếu không phải bạn, hãy bỏ qua.
        </p>
      </div>
    `,
    };
    yield transporter.sendMail(mailOptions);
});
exports.sendResetPasswordEmail = sendResetPasswordEmail;
// Gửi email cảnh báo spam review
const sendReviewWarningEmail = (to, name) => __awaiter(void 0, void 0, void 0, function* () {
    const mailOptions = {
        from: `"Shop For Real" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Cảnh báo spam đánh giá - Shop For Real",
        html: `
      <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #fbbf24; border-radius: 8px;">
        <h2 style="text-align: center; color: #b45309;">⚠️ Cảnh báo</h2>
        <p>Xin chào ${name},</p>
        <p>Bạn đã có 2 đánh giá bị đánh dấu là spam. Nếu tiếp tục, tài khoản sẽ bị khóa.</p>
        <p style="font-size: 14px; color: #6b7280;">Hãy đảm bảo các đánh giá phản ánh đúng trải nghiệm của bạn.</p>
        <hr style="margin-top: 24px; border-top: 1px solid #fcd34d;" />
        <p style="font-size: 13px; color: #9ca3af; text-align: center;">Shop For Real - Hệ thống cảnh báo tự động.</p>
      </div>
    `,
    };
    yield transporter.sendMail(mailOptions);
});
exports.sendReviewWarningEmail = sendReviewWarningEmail;
// Gửi email cảnh báo bom hàng
const sendOrderSpamWarningEmail = (to, name) => __awaiter(void 0, void 0, void 0, function* () {
    const mailOptions = {
        from: `"Shop For Real" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Cảnh báo bom hàng - Shop For Real",
        html: `
      <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #facc15; border-radius: 8px;">
        <h2 style="text-align: center; color: #ca8a04;">🚨 Cảnh báo bom hàng</h2>
        <p>Xin chào ${name},</p>
        <p>Hệ thống phát hiện bạn có hành vi đặt hàng nhưng không nhận hàng nhiều lần. Vui lòng xác nhận đơn hàng trong tương lai để tránh bị khóa tài khoản.</p>
        <p style="font-size: 13px; color: #9ca3af; text-align: center;">Shop For Real - Tôn trọng người bán hàng là tôn trọng chính bạn.</p>
      </div>
    `,
    };
    yield transporter.sendMail(mailOptions);
});
exports.sendOrderSpamWarningEmail = sendOrderSpamWarningEmail;
// Gửi email tài khoản bị khóa
const sendAccountBlockedEmail = (to, name) => __awaiter(void 0, void 0, void 0, function* () {
    const mailOptions = {
        from: `"Shop For Real" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Tài khoản bị khóa - Shop For Real",
        html: `
      <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ef4444; border-radius: 8px;">
        <h2 style="text-align: center; color: #b91c1c;">🚫 Tài khoản bị khóa</h2>
        <p>Xin chào ${name},</p>
        <p>Tài khoản của bạn đã bị khóa do có nhiều hành vi vi phạm quy định.</p>
        <p style="font-size: 14px; color: #6b7280;">Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ bộ phận hỗ trợ.</p>
        <hr style="margin: 24px 0; border-top: 1px solid #f87171;" />
        <p style="font-size: 13px; color: #9ca3af; text-align: center;">Shop For Real - Đảm bảo môi trường an toàn cho cộng đồng.</p>
      </div>
    `,
    };
    yield transporter.sendMail(mailOptions);
});
exports.sendAccountBlockedEmail = sendAccountBlockedEmail;
const sendAccountUnlockedEmail = (to, name) => __awaiter(void 0, void 0, void 0, function* () {
    const mailOptions = {
        from: `"Shop For Real" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Tài khoản của bạn đã được mở khóa - Shop For Real",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="text-align: center; color: #111827;">Shop For Real</h2>
        <p>Xin chào ${name || ""},</p>
        <p>Tài khoản của bạn đã được mở khóa và có thể sử dụng lại bình thường.</p>
        <p>Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi.</p>
      </div>
    `,
    };
    yield transporter.sendMail(mailOptions);
});
exports.sendAccountUnlockedEmail = sendAccountUnlockedEmail;
