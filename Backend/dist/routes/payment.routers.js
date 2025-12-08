"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// VNPay
router.post("/create-vnpay-payment", auth_middleware_1.verifyToken, payment_controller_1.createVNPayPayment);
router.get("/check-payment-vnpay", payment_controller_1.checkVNPayReturn);
// ZaloPay
router.post("/create-zalopay-payment", auth_middleware_1.verifyToken, payment_controller_1.createZaloPayPayment);
router.post("/zalopay-callback", payment_controller_1.checkZaloPayReturn);
router.get("/zalopay-return", payment_controller_1.redirectZaloPayReturn);
exports.default = router;
