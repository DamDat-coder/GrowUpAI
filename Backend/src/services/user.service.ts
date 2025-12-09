import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import UserModel from "../models/user.model";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { googleClient } from "../config/google";

/**
 * Lấy user hiện tại
 */
export const getCurrentUserService = async (userId: string) => {
  const user = await UserModel.findById(userId)
    .select("email name googleId createdAt")
    .lean();

  if (!user) throw new Error("User not found");

  return user;
};

/**
 * Đăng ký người dùng
 */
export const registerUserService = async (email: string, password: string, name: string) => {
  const exists = await UserModel.findOne({ email });
  if (exists) throw new Error("Email already used");

  const hash = await bcrypt.hash(password, 10);
  const refreshToken = generateRefreshToken(email);

  const user = await UserModel.create({
    email,
    password: hash,
    name,
    refreshToken,
  });

  const accessToken = generateAccessToken(user._id.toString());

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, name: user.name },
  };
};

/**
 * Đăng nhập
 */
export const loginUserService = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new Error("Email does not exist");

  if (!user.password) throw new Error("This account uses Google login");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Wrong password");

  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());

  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, name: user.name },
  };
};

/**
 * Google Login
 */
export const googleLoginService = async (id_token: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new Error("Google login failed");

  const { email, name, sub: googleId } = payload;

  if (!email) throw new Error("Cannot get email from Google");

  let user = await UserModel.findOne({ email });

  if (!user) {
    user = await UserModel.create({
      email,
      name,
      googleId,
      password: null,
    });
  }

  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());

  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, name: user.name },
  };
};

/**
 * Refresh Token → Cấp lại Access Token mới
 */
export const refreshAccessTokenService = async (refreshToken: string) => {
  const decoded = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET!
  ) as JwtPayload;

  const user = await UserModel.findById(decoded.userId);

  if (!user || user.refreshToken !== refreshToken)
    throw new Error("Invalid refresh token");

  const newAccessToken = generateAccessToken(user._id.toString());
  return newAccessToken;
};

/**
 * Đăng xuất
 */
export const logoutUserService = async (refreshToken: string) => {
  const user = await UserModel.findOne({ refreshToken });

  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  return true;
};
