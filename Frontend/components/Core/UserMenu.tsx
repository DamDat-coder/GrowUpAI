"use client";

import { memo } from "react";
import { LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/contexts/authContext";

interface Props {
  show: boolean;
}

function UserMenu({ show }: Props) {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-[#2b2b2b] rounded-full shadow cursor-pointer">
        <User size={20} />
        <span className="font-medium">{user.name}</span>
      </div>

      {/* Dropdown */}
      {show && (
        <div className="absolute right-0 top-10 w-60 bg-white dark:bg-[#2b2b2b] shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-fadeIn">
          <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <Settings size={16} /> Cài đặt tài khoản
          </button>
          <button
            onClick={logout}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-500"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(UserMenu);
