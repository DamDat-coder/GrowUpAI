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
exports.logoutUser = exports.refreshAccessToken = exports.googleLogin = exports.loginUser = exports.registerUser = exports.getCurrentUser = void 0;
const user_service_1 = require("../services/user.service");
const getCurrentUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield (0, user_service_1.getCurrentUserService)(req.user.userId);
        res.json({ success: true, user });
    }
    catch (err) {
        next(err);
    }
});
exports.getCurrentUser = getCurrentUser;
const registerUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res
                .status(400)
                .json({ success: false, message: "Thiếu thông tin!" });
        }
        if (!email.includes("@")) {
            return res
                .status(400)
                .json({ success: false, message: "Email không hợp lệ!" });
        }
        if (password.length < 6) {
            return res
                .status(400)
                .json({ success: false, message: "Mật khẩu phải có ít nhất 6 ký tự!" });
        }
        const data = yield (0, user_service_1.registerUserService)(email, password, name);
        res.status(201).json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
});
exports.registerUser = registerUser;
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res
                .status(400)
                .json({ success: false, message: "Vui lòng nhập email và mật khẩu!" });
        const data = yield (0, user_service_1.loginUserService)(email, password);
        res.json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
});
exports.loginUser = loginUser;
const googleLogin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_token } = req.body;
        const data = yield (0, user_service_1.googleLoginService)(id_token);
        res.json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
});
exports.googleLogin = googleLogin;
const refreshAccessToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newAccessToken = yield (0, user_service_1.refreshAccessTokenService)(req.body.refreshToken);
        res.json({ success: true, accessToken: newAccessToken });
    }
    catch (err) {
        next(err);
    }
});
exports.refreshAccessToken = refreshAccessToken;
const logoutUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, user_service_1.logoutUserService)(req.body.refreshToken);
        res.json({ success: true, message: "Logged out" });
    }
    catch (err) {
        next(err);
    }
});
exports.logoutUser = logoutUser;
