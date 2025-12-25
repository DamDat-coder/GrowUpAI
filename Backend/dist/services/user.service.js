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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutUserService = exports.refreshAccessTokenService = exports.googleLoginService = exports.loginUserService = exports.registerUserService = exports.getCurrentUserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const jwt_1 = require("../utils/jwt");
const google_1 = require("../config/google");
/**
 * Lấy user hiện tại
 */
const getCurrentUserService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const userObject = yield user_model_1.default.findById(userId)
        .select("_id email name googleId createdAt")
        .lean();
    if (!userObject)
        throw new Error("Không tìm thấy người dùng");
    const { _id } = userObject, rest = __rest(userObject, ["_id"]);
    const user = Object.assign({ id: _id.toString() }, rest);
    return user;
});
exports.getCurrentUserService = getCurrentUserService;
/**
 * Đăng ký người dùng
 */
const registerUserService = (email, password, name) => __awaiter(void 0, void 0, void 0, function* () {
    const exists = yield user_model_1.default.findOne({ email });
    if (exists)
        throw new Error("Email đã tồn tại!");
    const hash = yield bcryptjs_1.default.hash(password, 10);
    const refreshToken = (0, jwt_1.generateRefreshToken)(email);
    const user = yield user_model_1.default.create({
        email,
        password: hash,
        name,
        refreshToken,
    });
    const accessToken = (0, jwt_1.generateAccessToken)(user._id.toString());
    return {
        accessToken,
        refreshToken,
        user: { id: user._id, email: user.email, name: user.name },
    };
});
exports.registerUserService = registerUserService;
/**
 * Đăng nhập
 */
const loginUserService = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ email });
    if (!user)
        throw new Error("Email không tồn tại");
    if (!user.password)
        throw new Error("Tài khoản này được đăng nhập với Google");
    const isMatch = yield bcryptjs_1.default.compare(password, user.password);
    if (!isMatch)
        throw new Error("Sai mật khẩu");
    const accessToken = (0, jwt_1.generateAccessToken)(user._id.toString());
    const refreshToken = (0, jwt_1.generateRefreshToken)(user._id.toString());
    user.refreshToken = refreshToken;
    yield user.save();
    return {
        accessToken,
        refreshToken,
        user: { id: user._id, email: user.email, name: user.name },
    };
});
exports.loginUserService = loginUserService;
/**
 * Google Login
 */
const googleLoginService = (id_token) => __awaiter(void 0, void 0, void 0, function* () {
    const ticket = yield google_1.googleClient.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload)
        throw new Error("Đăng nhập Google thất bại");
    const { email, name, sub: googleId } = payload;
    if (!email)
        throw new Error("Không thể lấy email từ Google");
    let user = yield user_model_1.default.findOne({ email });
    if (!user) {
        user = yield user_model_1.default.create({
            email,
            name,
            googleId,
            password: null,
        });
    }
    const accessToken = (0, jwt_1.generateAccessToken)(user._id.toString());
    const refreshToken = (0, jwt_1.generateRefreshToken)(user._id.toString());
    user.refreshToken = refreshToken;
    yield user.save();
    return {
        accessToken,
        refreshToken,
        user: { id: user._id, email: user.email, name: user.name },
    };
});
exports.googleLoginService = googleLoginService;
/**
 * Refresh Token → Cấp lại Access Token mới
 */
const refreshAccessTokenService = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = yield user_model_1.default.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken)
        throw new Error("Token không hợp lệ");
    const newAccessToken = (0, jwt_1.generateAccessToken)(user._id.toString());
    return newAccessToken;
});
exports.refreshAccessTokenService = refreshAccessTokenService;
/**
 * Đăng xuất
 */
const logoutUserService = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ refreshToken });
    if (user) {
        user.refreshToken = null;
        yield user.save();
    }
    return true;
});
exports.logoutUserService = logoutUserService;
