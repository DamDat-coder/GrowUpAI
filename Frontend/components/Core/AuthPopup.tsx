"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/authContext";

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthPopup({
  isOpen,
  onClose,
  onSuccess,
}: AuthPopupProps) {
  const [mode, setMode] = useState<"login" | "register">("login");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPw: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPw: "",
  });

  const { email, password, confirmPw } = formData;

  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  // Validate realtime (no effect, no warning)
  const validateField = (name: string, value: string) => {
    setErrors((prev) => {
      const updated = { ...prev };

      if (name === "email") {
        if (!value.trim()) updated.email = "Vui lòng nhập email!";
        else if (!value.includes("@")) updated.email = "Email không hợp lệ!";
        else updated.email = "";
      }

      if (name === "password") {
        if (!value.trim()) updated.password = "Vui lòng nhập mật khẩu!";
        else if (value.length < 6)
          updated.password = "Mật khẩu phải có ít nhất 6 ký tự!";
        else updated.password = "";
      }

      if (name === "confirmPw" && mode === "register") {
        if (!value.trim()) updated.confirmPw = "Vui lòng nhập lại mật khẩu!";
        else if (value !== formData.password)
          updated.confirmPw = "Mật khẩu không khớp!";
        else updated.confirmPw = "";
      }

      return updated;
    });
  };

  // Reset form khi đóng popup — không dùng effect
  const handleClose = () => {
    setFormData({ email: "", password: "", confirmPw: "" });
    setErrors({ email: "", password: "", confirmPw: "" });
    onClose();
  };

  const handleSubmit = async () => {
    // Kiểm tra lỗi trước khi gửi
    if (errors.email || errors.password || errors.confirmPw) return;

    setLoading(true);

    let ok = false;

    if (mode === "login") {
      ok = await login(email, password);
    } else {
      ok = await register("User", email, password);
    }

    if (ok) {
      onSuccess?.();
      handleClose();
    }

    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            key="popup"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-gray-50 dark:bg-[#1e1e1e] rounded-2xl p-6 w-[70%] tablet:w-[50%] laptop:w-[30%] shadow-xl relative"
          >
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <X size={20} />
            </button>

            {/* Logo */}
            <div className="flex justify-center items-center">
              <Image
                src="/Core/logo.png"
                width={90}
                height={90}
                alt="logo"
                className="p-1 rounded-lg dark:hidden"
              />
              <Image
                src="/Core/logo_dark_theme.png"
                width={90}
                height={90}
                alt="logo"
                className="p-1 rounded-lg hidden dark:block"
              />
            </div>

            <h2 className="text-xl font-bold text-center pb-4">
              {mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
            </h2>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="flex flex-col gap-3"
            >
              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    validateField("email", e.target.value);
                  }}
                  className="px-4 py-2 rounded-lg border bg-transparent outline-none w-full"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <input
                  type="password"
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    validateField("password", e.target.value);
                  }}
                  className="px-4 py-2 rounded-lg border bg-transparent outline-none w-full"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm password */}
              {mode === "register" && (
                <div>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPw}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPw: e.target.value });
                      validateField("confirmPw", e.target.value);
                    }}
                    className="px-4 py-2 rounded-lg border bg-transparent outline-none w-full"
                  />
                  {errors.confirmPw && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.confirmPw}
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-2 rounded-lg bg-black text-white dark:bg-gray-50 dark:text-black font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading
                  ? "Đang xử lý..."
                  : mode === "login"
                  ? "Đăng nhập"
                  : "Tạo tài khoản"}
              </button>
            </form>

            {/* Switch */}
            <p className="text-sm text-center mt-4 opacity-80">
              {mode === "login" ? (
                <>
                  Chưa có tài khoản?{" "}
                  <button onClick={() => setMode("register")} className="underline">
                    Đăng ký
                  </button>
                </>
              ) : (
                <>
                  Đã có tài khoản?{" "}
                  <button onClick={() => setMode("login")} className="underline">
                    Đăng nhập
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
