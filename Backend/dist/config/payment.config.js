"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vnpay = exports.ZALO_PAY = void 0;
const vnpay_1 = require("vnpay");
exports.ZALO_PAY = {
    appId: Number(process.env.ZALOPAY_APP_ID),
    key1: process.env.ZALOPAY_KEY1,
    key2: process.env.ZALOPAY_KEY2,
    endpoint: process.env.ZALOPAY_ENDPOINT,
    callbackUrl: process.env.ZALOPAY_CALLBACK_URL,
    returnUrl: process.env.ZALOPAY_RETURN_URL,
    clientRedirect: process.env.ZALOPAY_CLIENT_REDIRECT,
};
exports.vnpay = new vnpay_1.VNPay({
    tmnCode: process.env.VNPAY_TMNCODE,
    secureSecret: process.env.VNPAY_HASH_SECRET,
    vnpayHost: "https://sandbox.vnpayment.vn",
    testMode: true,
    hashAlgorithm: vnpay_1.HashAlgorithm.SHA512,
    loggerFn: () => { },
});
