"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Auth routes
router.post("/register", user_controller_1.registerUser);
router.post("/login", user_controller_1.loginUser);
router.post("/google", user_controller_1.googleLogin);
router.post("/refresh", user_controller_1.refreshAccessToken);
router.post("/logout", user_controller_1.logoutUser);
// Protected route
router.get("/me", auth_middleware_1.authMiddleware, user_controller_1.getCurrentUser);
exports.default = router;
