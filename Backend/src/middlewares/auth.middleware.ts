import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: { userId: string };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    req.user = { userId: decoded.userId };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const optionalAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    // Nếu không có Token thì cho đi tiếp luôn, req.user sẽ là undefined
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); 
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Nếu token hợp lệ, gắn userId vào request
    req.user = { userId: decoded.userId };
    
    next();
  } catch (err) {
    // Kể cả token lỗi hoặc hết hạn, ta vẫn cho đi tiếp với tư cách là khách ẩn danh (Guest)
    // Hoặc nếu Đạt muốn gắt hơn: Token lởm thì báo lỗi, không có Token thì cho qua.
    next(); 
  }
};