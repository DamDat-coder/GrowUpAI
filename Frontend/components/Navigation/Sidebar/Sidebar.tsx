"use client";

import React, { useState, useMemo } from "react";
import { PlusCircle, Folder, Settings, Menu } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/authContext";
import AuthPopup from "../../Core/Auth/AuthPopup";
import SidebarDesktop from "./SidebarDesktop";
import SidebarMobile from "./SidebarMobile";
import { useSidebar } from "@/contexts/SidebarContext";

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  // Lấy hàm refetch từ context để dùng cho nút "Cuộc trò chuyện mới"
  const { refetchConversations } = useSidebar();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Menu items bây giờ gọi refreshConversations từ Context
  const menuItems = useMemo(
    () => [
      {
        label: "Cuộc trò chuyện mới",
        icon: <PlusCircle size={20} />,
        href: "/",
        action: () => {
          refetchConversations(); // Đồng bộ lại danh sách khi tạo mới
          setIsMobileOpen(false);
        },
      },
      { href: "/files", label: "Tệp", icon: <Folder size={20} /> },
      { href: "/settings", label: "Cài đặt", icon: <Settings size={20} /> },
    ],
    [refetchConversations],
  );

  return (
    <>
      {/* Nút mở Mobile Sidebar */}
      <button
        className="laptop:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-[#252525] shadow-md"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu size={20} className="dark:text-white text-gray-700" />
      </button>

      {/* Desktop Version - Không cần truyền 'conversations' qua props nữa */}
      <SidebarDesktop
        items={menuItems}
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Mobile Version - Tương tự, bỏ conversations props */}
      <SidebarMobile
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        items={menuItems}
        user={user}
        logout={logout}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenAuth={() => {
          setIsMobileOpen(false);
          setShowAuth(true);
        }}
      />

      <AuthPopup
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => {
          setShowAuth(false);
          refetchConversations();
        }}
      />
    </>
  );
}
