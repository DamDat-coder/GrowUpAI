import { Router } from "express";
import {
  getCurrentUser,
  registerUser,
  loginUser,
  googleLogin,
  refreshAccessToken,
  logoutUser,
} from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

// Protected route
router.get("/me", authMiddleware, getCurrentUser);

export default router;
