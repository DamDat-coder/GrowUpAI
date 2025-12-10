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

  // state form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async () => {
    setLoading(true);

    if (mode === "login") {
      console.log(email, password);

      const ok = await login(email, password);
      if (ok) {
        onSuccess?.();
        onClose();
      }
    } else {
      if (password !== confirmPw) {
        setLoading(false);
        return alert("Mật khẩu không khớp!");
      }

      const ok = await register("User", email, password);
      if (ok) {
        onSuccess?.();
        onClose();
      }
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
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 w-[30%] shadow-xl relative"
          >
            {/* Close */}
            <button
              onClick={onClose}
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
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-2 rounded-lg border bg-transparent outline-none"
              />

              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-2 rounded-lg border bg-transparent outline-none"
              />

              {mode === "register" && (
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="px-4 py-2 rounded-lg border bg-transparent outline-none"
                />
              )}

              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="mt-2 w-full py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading
                  ? "Đang xử lý..."
                  : mode === "login"
                  ? "Đăng nhập"
                  : "Tạo tài khoản"}
              </button>
            </form>

            {/* Switch mode */}
            <p className="text-sm text-center mt-4 opacity-80">
              {mode === "login" ? (
                <>
                  Chưa có tài khoản?{" "}
                  <button
                    onClick={() => setMode("register")}
                    className="underline"
                  >
                    Đăng ký
                  </button>
                </>
              ) : (
                <>
                  Đã có tài khoản?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="underline"
                  >
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
