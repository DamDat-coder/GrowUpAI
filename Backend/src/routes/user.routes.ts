import { Router } from "express";
import {
  getCurrentUser,
  googleLogin,
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,

} from "../controllers/user.controller";


import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware";

const router = Router();

// Xác thực và quản lý người dùng
router.get("/me", verifyToken, getCurrentUser);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/google-login", googleLogin);




export default router;
