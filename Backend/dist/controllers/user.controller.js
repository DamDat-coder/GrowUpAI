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
exports.updatePassword = exports.resetPassword = exports.forgotPassword = exports.getWishlist = exports.removeFromWishlist = exports.addToWishlist = exports.setDefaultAddress = exports.deleteAddress = exports.updateAddress = exports.addAddress = exports.toggleUserStatus = exports.updateUserInfo = exports.getUserById = exports.getAllUsers = exports.logoutUser = exports.refreshAccessToken = exports.loginUser = exports.registerUser = exports.getCurrentUser = exports.googleLogin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const jwt_1 = require("../utils/jwt");
const google_1 = require("../config/google");
const mailer_1 = require("../utils/mailer");
const resetTokenStore_1 = require("../utils/resetTokenStore");
const mailer_2 = require("../utils/mailer");
// Đăng nhập bằng Google
const googleLogin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_token } = req.body;
        if (!id_token)
            return res
                .status(400)
                .json({ success: false, message: "Thiếu id_token" });
        const ticket = yield google_1.googleClient.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload)
            return res
                .status(401)
                .json({ success: false, message: "Xác thực Google thất bại" });
        const { email, name, sub: googleId } = payload;
        if (!email)
            return res
                .status(400)
                .json({ success: false, message: "Không lấy được email từ Google" });
        let user = yield user_model_1.default.findOne({ email });
        if (!user) {
            user = yield user_model_1.default.create({
                email,
                name,
                googleId,
                password: "",
                refreshToken: "",
            });
        }
        if (!user.is_active) {
            return res
                .status(403)
                .json({ success: false, message: "Tài khoản đã bị khóa." });
        }
        const accessToken = (0, jwt_1.generateAccessToken)(user._id.toString(), user.role);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user._id.toString());
        user.refreshToken = refreshToken;
        yield user.save();
        res.status(200).json({
            success: true,
            message: "Đăng nhập Google thành công",
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.googleLogin = googleLogin;
// Lấy thông tin người dùng hiện tại
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res
                .status(401)
                .json({ message: "Không xác thực được người dùng" });
        const currentUser = yield user_model_1.default.findById(userId)
            .select("name email role wishlist addresses phone is_active")
            .populate("wishlist", "name slug image variants.price")
            .lean();
        if (!currentUser) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }
        res.status(200).json({ user: currentUser });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
    }
});
exports.getCurrentUser = getCurrentUser;
// Đăng ký
const registerUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name, phone } = req.body;
        const existingUser = yield user_model_1.default.findOne({ email });
        if (existingUser)
            return res
                .status(400)
                .json({ success: false, message: "Email đã tồn tại." });
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const refreshToken = (0, jwt_1.generateRefreshToken)(email);
        const newUser = yield user_model_1.default.create({
            email,
            password: hashedPassword,
            name,
            phone,
            refreshToken,
        });
        const accessToken = (0, jwt_1.generateAccessToken)(newUser._id.toString(), newUser.role);
        res.status(201).json({
            success: true,
            message: "Đăng ký thành công.",
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: newUser._id,
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role,
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.registerUser = registerUser;
// Đăng nhập
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.time("LOGIN");
        const { email, password } = req.body;
        const user = yield user_model_1.default.findOne({ email });
        if (!user)
            return res
                .status(400)
                .json({ success: false, message: "Email không tồn tại." });
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch)
            return res.status(401).json({ success: false, message: "Mật khẩu sai." });
        if (!user.is_active)
            return res
                .status(403)
                .json({ success: false, message: "Tài khoản đã bị khóa." });
        const accessToken = (0, jwt_1.generateAccessToken)(user._id.toString(), user.role);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user._id.toString());
        yield user_model_1.default.updateOne({ _id: user._id }, { refreshToken });
        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công.",
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.loginUser = loginUser;
// Làm mới accessToken
const refreshAccessToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken)
            return res
                .status(401)
                .json({ success: false, message: "Thiếu refresh token." });
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = yield user_model_1.default.findById(decoded.userId);
        if (!user || user.refreshToken !== refreshToken)
            return res
                .status(403)
                .json({ success: false, message: "Refresh token không hợp lệ." });
        const newAccessToken = (0, jwt_1.generateAccessToken)(user._id.toString(), user.role);
        res.status(200).json({ success: true, accessToken: newAccessToken });
    }
    catch (err) {
        next(err);
    }
});
exports.refreshAccessToken = refreshAccessToken;
// Đăng xuất
const logoutUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.body;
        const user = yield user_model_1.default.findOne({ refreshToken });
        if (user) {
            user.refreshToken = null;
            yield user.save();
        }
        res.status(200).json({ success: true, message: "Đăng xuất thành công." });
    }
    catch (err) {
        next(err);
    }
});
exports.logoutUser = logoutUser;
// Lấy tất cả người dùng
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search, role, is_block } = req.query;
        const filter = {};
        if (search) {
            const keyword = search.toString();
            filter.$or = [
                { name: { $regex: keyword, $options: "i" } },
                { email: { $regex: keyword, $options: "i" } },
            ];
        }
        if (role) {
            filter.role = role;
        }
        if (typeof is_block !== "undefined") {
            if (is_block === "true")
                filter.is_block = true;
            else if (is_block === "false")
                filter.is_block = false;
            else {
                return res.status(400).json({
                    success: false,
                    message: "Giá trị 'is_block' phải là 'true' hoặc 'false'.",
                });
            }
        }
        const total = yield user_model_1.default.countDocuments(filter);
        const users = yield user_model_1.default.find(filter)
            .select("name email phone role is_active createdAt")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();
        return res.status(200).json({
            success: true,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            data: users,
        });
    }
    catch (err) {
        console.error("Lỗi khi lấy danh sách người dùng:", err);
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ.",
        });
    }
});
exports.getAllUsers = getAllUsers;
// Lấy người dùng theo ID
const getUserById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findById(req.params.id)
            .select("name email role phone is_active addresses wishlist")
            .populate("wishlist", "name slug image variants.price")
            .lean();
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy người dùng." });
        res.status(200).json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
});
exports.getUserById = getUserById;
// Cập nhật thông tin người dùng
const updateUserInfo = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, phone, role } = req.body;
        const updates = {};
        if (name)
            updates.name = name;
        if (phone)
            updates.phone = phone;
        if (role && ["user", "admin"].includes(role))
            updates.role = role;
        const user = yield user_model_1.default.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        }).select("-password");
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy người dùng." });
        res
            .status(200)
            .json({ success: true, message: "Cập nhật thành công.", data: user });
    }
    catch (err) {
        next(err);
    }
});
exports.updateUserInfo = updateUserInfo;
// Khoá/mở khoá
const toggleUserStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        if (typeof is_active !== "boolean") {
            return res
                .status(400)
                .json({ success: false, message: "`is_active` phải là boolean." });
        }
        const user = yield user_model_1.default.findById(id);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy người dùng." });
        }
        if (user.role === "admin" && !is_active) {
            return res
                .status(403)
                .json({ success: false, message: "Không thể khoá tài khoản admin." });
        }
        user.is_active = is_active;
        yield user.save();
        if (!is_active) {
            yield (0, mailer_1.sendAccountBlockedEmail)(user.email, user.name);
        }
        else {
            yield (0, mailer_2.sendAccountUnlockedEmail)(user.email, user.name);
        }
        const _a = user.toObject(), { password } = _a, userData = __rest(_a, ["password"]);
        res.status(200).json({
            success: true,
            message: is_active ? "Đã mở khoá tài khoản." : "Đã khoá tài khoản.",
            data: userData,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.toggleUserStatus = toggleUserStatus;
// Thêm địa chỉ
const addAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { street, ward, province, is_default } = req.body;
        const user = yield user_model_1.default.findById(req.params.id);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy người dùng." });
        }
        const isDuplicate = user.addresses.some((addr) => addr.street === street &&
            addr.ward === ward &&
            addr.province === province);
        if (isDuplicate) {
            return res.status(400).json({
                success: false,
                message: "Địa chỉ đã tồn tại.",
            });
        }
        if (is_default) {
            user.addresses.forEach((addr) => (addr.is_default = false));
        }
        user.addresses.push({
            street,
            ward,
            province,
            is_default: !!is_default,
        });
        yield user.save();
        res.status(201).json({
            success: true,
            message: "Thêm địa chỉ thành công.",
            data: user.addresses,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.addAddress = addAddress;
// Cập nhật địa chỉ
const updateAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { street, ward, province, is_default } = req.body;
        const user = yield user_model_1.default.findById(req.params.id);
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy người dùng." });
        const address = user.addresses.id(req.params.addressId);
        if (!address)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy địa chỉ." });
        if (is_default) {
            user.addresses.forEach((addr) => (addr.is_default = false));
        }
        address.street = street !== null && street !== void 0 ? street : address.street;
        address.ward = ward !== null && ward !== void 0 ? ward : address.ward;
        address.province = province !== null && province !== void 0 ? province : address.province;
        address.is_default = is_default !== null && is_default !== void 0 ? is_default : address.is_default;
        yield user.save();
        res.status(200).json({
            success: true,
            message: "Cập nhật địa chỉ thành công.",
            data: user.addresses,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.updateAddress = updateAddress;
// Xoá địa chỉ
const deleteAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findById(req.params.id);
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy người dùng." });
        const address = user.addresses.id(req.params.addressId);
        if (!address)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy địa chỉ." });
        address.deleteOne();
        yield user.save();
        res.status(200).json({
            success: true,
            message: "Xoá địa chỉ thành công.",
            data: user.addresses,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.deleteAddress = deleteAddress;
// Đặt địa chỉ mặc định
const setDefaultAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findById(req.params.id);
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy người dùng." });
        const address = user.addresses.id(req.params.addressId);
        if (!address)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy địa chỉ." });
        user.addresses.forEach((addr) => (addr.is_default = false));
        address.is_default = true;
        yield user.save();
        res.status(200).json({
            success: true,
            message: "Cập nhật mặc định thành công.",
            data: user.addresses,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.setDefaultAddress = setDefaultAddress;
// Thêm sản phẩm vào danh sách yêu thích
const addToWishlist = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findById(req.params.id);
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy người dùng." });
        const productId = req.body.productId;
        if (!productId)
            return res
                .status(400)
                .json({ success: false, message: "Thiếu productId." });
        if (user.wishlist.includes(productId)) {
            return res.status(400).json({
                success: false,
                message: "Sản phẩm đã tồn tại trong danh sách yêu thích.",
            });
        }
        user.wishlist.push(productId);
        yield user.save();
        res.status(200).json({
            success: true,
            message: "Đã thêm vào danh sách yêu thích.",
            data: user.wishlist,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.addToWishlist = addToWishlist;
// Xoá sản phẩm khỏi danh sách yêu thích
const removeFromWishlist = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findById(req.params.id);
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy người dùng." });
        const productId = req.params.productId;
        user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
        yield user.save();
        res.status(200).json({
            success: true,
            message: "Đã xoá khỏi danh sách yêu thích.",
            data: user.wishlist,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.removeFromWishlist = removeFromWishlist;
// Lấy danh sách yêu thích của người dùng
const getWishlist = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findById(req.params.id)
            .select("wishlist")
            .populate("wishlist", "name slug image variants.price")
            .lean();
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy người dùng." });
        res.status(200).json({ success: true, data: user.wishlist });
    }
    catch (err) {
        next(err);
    }
});
exports.getWishlist = getWishlist;
// Gửi email quên mật khẩu
const forgotPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield user_model_1.default.findOne({ email });
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy email." });
        const token = crypto_1.default.randomBytes(32).toString("hex");
        const expiresAt = Date.now() + 15 * 60 * 1000; // 15 phút
        resetTokenStore_1.resetTokens.set(token, { email, expiresAt, userId: user._id.toString() });
        const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;
        yield (0, mailer_1.sendResetPasswordEmail)(email, resetLink);
        res.status(200).json({ success: true, message: "Đã gửi email khôi phục." });
    }
    catch (err) {
        next(err);
    }
});
exports.forgotPassword = forgotPassword;
// Đặt lại mật khẩu mới
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.params;
        const { password } = req.body;
        if (!password) {
            return res
                .status(400)
                .json({ success: false, message: "Mật khẩu không được để trống" });
        }
        const tokenData = resetTokenStore_1.resetTokens.get(token);
        if (!tokenData || tokenData.expiresAt < new Date().getTime()) {
            return res.status(400).json({
                success: false,
                message: "Token không hợp lệ hoặc đã hết hạn.",
            });
        }
        const user = yield user_model_1.default.findById(tokenData.userId);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy người dùng." });
        }
        user.password = yield bcryptjs_1.default.hash(password, 10);
        yield user.save();
        resetTokenStore_1.resetTokens.delete(token);
        return res
            .status(200)
            .json({ success: true, message: "Mật khẩu đã được đặt lại thành công." });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Đã xảy ra lỗi." });
    }
});
exports.resetPassword = resetPassword;
const updatePassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.",
            });
        }
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng.",
            });
        }
        const isMatch = yield bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Mật khẩu hiện tại không chính xác.",
            });
        }
        user.password = yield bcryptjs_1.default.hash(newPassword, 10);
        yield user.save();
        res.status(200).json({
            success: true,
            message: "Cập nhật mật khẩu thành công.",
        });
    }
    catch (err) {
        next(err);
    }
});
exports.updatePassword = updatePassword;
