/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  loginApi,
  registerApi,
  fetchUserApi,
  refreshTokenApi,
} from "@/services/userApi";
import { IUser } from "@/types/auth";
import toast from "react-hot-toast";

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  isLoadingAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Check current user ---
  const checkAuth = async () => {
    const accessToken = localStorage.getItem("accessToken");
   if (!accessToken) {
      setUser(null);
      return;
    }

    try {
      const data = await fetchUserApi();
      setUser(data);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        try {
          const newToken = await refreshTokenApi();

          if (newToken) {
            localStorage.setItem("accessToken", newToken);
            const userData = await fetchUserApi();
            setUser(userData);
          }
        } catch (refreshErr) {
          localStorage.removeItem("accessToken");
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }
  };

  // --- Run on mount ---
  useEffect(() => {
    const run = async () => {
      await checkAuth();
      setLoading(false);
    };
    run();
  }, []);

  // --- Login ---
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user: user, accessToken } = await loginApi(email, password);
      console.log(user);
      console.log(accessToken);

      setUser(user);
      localStorage.setItem("accessToken", accessToken);

      toast.success("Đăng nhập thành công!");
      return true;
    } catch (err) {
      toast.error("Email hoặc mật khẩu không đúng.");
      return false;
    }
  };

  // --- Register ---
  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const { user: userData, accessToken } = await registerApi(
        name,
        email,
        password
      );

      setUser(userData);
      localStorage.setItem("accessToken", accessToken);

      toast.success("Đăng ký thành công!");
      return true;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string }; status?: number };
      };

      toast.error(error.response?.data?.message || "Email hoặc mật khẩu sai");
      return false;
    }
  };

  // --- Logout ---
  const logout = () => {
    setUser(null);
    localStorage.removeItem("accessToken");
    document.cookie = "refreshToken=; max-age=0; path=/";
    toast.success("Đã đăng xuất!");
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    isLoadingAuth: loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
