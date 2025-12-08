import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import UserModel from "../models/user.model";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { googleClient } from "../config/google";

// Đăng nhập bằng Google
export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id_token } = req.body;
    if (!id_token)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu id_token" });

    const ticket = await googleClient.verifyIdToken({
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

    let user = await UserModel.findOne({ email });

    if (!user) {
      user = await UserModel.create({
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

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;
    await user.save();

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
  } catch (err) {
    next(err);
  }
};

// Lấy thông tin người dùng hiện tại
export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId)
      return res
        .status(401)
        .json({ message: "Không xác thực được người dùng" });

    const currentUser = await UserModel.findById(userId)
      .select("name email role wishlist addresses phone is_active")
      .populate("wishlist", "name slug image variants.price")
      .lean();

    if (!currentUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.status(200).json({ user: currentUser });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Đăng ký
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name, phone } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser)
      return res
        .status(400)
        .json({ success: false, message: "Email đã tồn tại." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const refreshToken = generateRefreshToken(email);

    const newUser = await UserModel.create({
      email,
      password: hashedPassword,
      name,
      phone,
      refreshToken,
    });

    const accessToken = generateAccessToken(
      newUser._id.toString(),
      newUser.role
    );

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
  } catch (err) {
    next(err);
  }
};

// Đăng nhập
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.time("LOGIN");

    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Email không tồn tại." });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Mật khẩu sai." });
    if (!user.is_active)
      return res
        .status(403)
        .json({ success: false, message: "Tài khoản đã bị khóa." });
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    await UserModel.updateOne({ _id: user._id }, { refreshToken });

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
  } catch (err) {
    next(err);
  }
};

// Làm mới accessToken
export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res
        .status(401)
        .json({ success: false, message: "Thiếu refresh token." });

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as JwtPayload;
    const user = await UserModel.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken)
      return res
        .status(403)
        .json({ success: false, message: "Refresh token không hợp lệ." });

    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
};

// Đăng xuất
export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;
    const user = await UserModel.findOne({ refreshToken });

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.status(200).json({ success: true, message: "Đăng xuất thành công." });
  } catch (err) {
    next(err);
  }
};

// Lấy tất cả người dùng
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const { search, role, is_block } = req.query;
    const filter: Record<string, any> = {};

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
      if (is_block === "true") filter.is_block = true;
      else if (is_block === "false") filter.is_block = false;
      else {
        return res.status(400).json({
          success: false,
          message: "Giá trị 'is_block' phải là 'true' hoặc 'false'.",
        });
      }
    }

    const total = await UserModel.countDocuments(filter);
    const users = await UserModel.find(filter)
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
  } catch (err) {
    console.error("Lỗi khi lấy danh sách người dùng:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ.",
    });
  }
};

// Lấy người dùng theo ID
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await UserModel.findById(req.params.id)
      .select("name email role phone is_active addresses wishlist")
      .populate("wishlist", "name slug image variants.price")
      .lean();

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng." });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// Cập nhật thông tin người dùng
export const updateUserInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, phone, role } = req.body;
    const updates: any = {};

    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (role && ["user", "admin"].includes(role)) updates.role = role;

    const user = await UserModel.findByIdAndUpdate(req.params.id, updates, {
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
  } catch (err) {
    next(err);
  }
};


// Thêm địa chỉ
export const addAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { street, ward, province, is_default } = req.body;

    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng." });
    }

    const isDuplicate = user.addresses.some(
      (addr) =>
        addr.street === street &&
        addr.ward === ward &&
        addr.province === province
    );

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
    await user.save();

    res.status(201).json({
      success: true,
      message: "Thêm địa chỉ thành công.",
      data: user.addresses,
    });
  } catch (err) {
    next(err);
  }
};

// Cập nhật địa chỉ
export const updateAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { street, ward, province, is_default } = req.body;
    const user = await UserModel.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng." });

    const address = user.addresses.id(req.params.addressId as string);
    if (!address)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy địa chỉ." });

    if (is_default) {
      user.addresses.forEach((addr) => (addr.is_default = false));
    }

    address.street = street ?? address.street;
    address.ward = ward ?? address.ward;
    address.province = province ?? address.province;
    address.is_default = is_default ?? address.is_default;

    await user.save();
    res.status(200).json({
      success: true,
      message: "Cập nhật địa chỉ thành công.",
      data: user.addresses,
    });
  } catch (err) {
    next(err);
  }
};

// Xoá địa chỉ
export const deleteAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng." });

    const address = user.addresses.id(req.params.addressId as string);
    if (!address)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy địa chỉ." });

    address.deleteOne();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Xoá địa chỉ thành công.",
      data: user.addresses,
    });
  } catch (err) {
    next(err);
  }
};

// Đặt địa chỉ mặc định
export const setDefaultAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng." });

    const address = user.addresses.id(req.params.addressId as string);
    if (!address)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy địa chỉ." });

    user.addresses.forEach((addr) => (addr.is_default = false));
    address.is_default = true;

    await user.save();
    res.status(200).json({
      success: true,
      message: "Cập nhật mặc định thành công.",
      data: user.addresses,
    });
  } catch (err) {
    next(err);
  }
};

// Thêm sản phẩm vào danh sách yêu thích
export const addToWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await UserModel.findById(req.params.id);
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
    await user.save();

    res.status(200).json({
      success: true,
      message: "Đã thêm vào danh sách yêu thích.",
      data: user.wishlist,
    });
  } catch (err) {
    next(err);
  }
};

// Xoá sản phẩm khỏi danh sách yêu thích
export const removeFromWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng." });

    const productId = req.params.productId;
    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Đã xoá khỏi danh sách yêu thích.",
      data: user.wishlist,
    });
  } catch (err) {
    next(err);
  }
};

// Lấy danh sách yêu thích của người dùng
export const getWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await UserModel.findById(req.params.id)
      .select("wishlist")
      .populate("wishlist", "name slug image variants.price")
      .lean();

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng." });

    res.status(200).json({ success: true, data: user.wishlist });
  } catch (err) {
    next(err);
  }
};
