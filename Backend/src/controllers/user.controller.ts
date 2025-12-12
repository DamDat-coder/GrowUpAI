import { Request, Response, NextFunction } from "express";
import {
  getCurrentUserService,
  registerUserService,
  loginUserService,
  googleLoginService,
  refreshAccessTokenService,
  logoutUserService,
} from "../services/user.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await getCurrentUserService(req.user!.userId);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    const data = await registerUserService(email, password, name);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập email và mật khẩu!" });

    const data = await loginUserService(email, password);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id_token } = req.body;
    const data = await googleLoginService(id_token);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newAccessToken = await refreshAccessTokenService(
      req.body.refreshToken
    );
    res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
};

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await logoutUserService(req.body.refreshToken);
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
};
