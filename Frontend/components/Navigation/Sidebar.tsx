"use client";

import {
  MessagesSquare,
  Folder,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  User,
  ChevronDown,
  ChevronUp,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useCallback } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/authContext";
import UserBadge from "../Core/UserBadge";
import AuthPopup from "../Core/AuthPopup";
import { Conversation } from "@/types/conversation";
import { createConversation } from "@/services/conversationApi"; // Giả định API tạo mới
import ConversationList from "./ConversationList";

// ✅ IMPORT CUSTOM HOOK MỚI
import { useConversationCache } from "@/hooks/useConversationCache";

// Khai báo Interface (đã sửa chữa lỗi TS trước đó)
interface BaseItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
}

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ✅ SỬ DỤNG CUSTOM HOOK THAY CHO STATE VÀ useEffect
  const { conversations, refetchConversations } = useConversationCache(
    user?.id || null
  );

  // ✅ SỬ DỤNG useCallback để ổn định hàm đóng Mobile Menu
  const closeMobileMenuCallback = useCallback(() => {
    setOpen(false);
  }, []);

  // ✅ SỬ DỤNG useCallback để ổn định hàm toggle dropdown
  const handleToggleDropdown = useCallback((): void => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  // 🔴 LOGIC TẠO MỚI (Sử dụng refetchConversations để cập nhật Cache)
  const handleCreateNewConversation = async (): Promise<void> => {
    if (open) closeMobileMenuCallback();

    if (!user) {
      setShowAuth(true);
      return;
    }

    try {
      const newConv = (await createConversation()) as Conversation;

      // ✅ Cập nhật cache sau khi tạo mới và fetch lại data mới nhất
      await refetchConversations();

      console.log(`Chuyển hướng đến /chat/${newConv._id}`);
      // router.push(`/chat/${newConv._id}`);
    } catch (error) {
      console.error("Lỗi tạo hội thoại:", error);
    }
  };

  // HÀM TYPE GUARD ĐỂ LỌC LINK
  const isLinkItem = (item: BaseItem): item is BaseItem & { href: string } => {
    return item.href !== undefined;
  };

  // ✅ KHÔI PHỤC LẠI baseItems và Nút Action
  const baseItems: BaseItem[] = [
    {
      label: "Thêm cuộc trò chuyện mới",
      icon: <PlusCircle size={20} />,
      action: handleCreateNewConversation,
    },
    { href: "/files", label: "Tệp", icon: <Folder size={20} /> },
    { href: "/settings", label: "Cài đặt", icon: <Settings size={20} /> },
  ];

  // THAO TÁC TÁCH MẢNG ĐÃ SỬA LỖI TS(18048)
  const isActionItem = (
    item: BaseItem
  ): item is BaseItem & { action: () => void } => {
    return item.action !== undefined;
  };
  const linkItems = baseItems.filter(isLinkItem);
  const actionItemWithAction = baseItems.filter(isActionItem)[0];
  return (
    <>
      {/* BURGER MENU BUTTON — only < laptop */}
      <button
        className="laptop:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-50 dark:bg[#252525] dark:text-black shadow"
        onClick={() => setOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* ===== Desktop Sidebar ===== */}
      <aside
        className="
          group
          fixed h-[95vh] w-16 hover:w-64
          bg-gray-50/70 backdrop-blur-md border-r border-gray-200
          flex-col py-6 gap-4 rounded-2xl m-3 shadow-sm transition-all duration-300
          dark:bg-[#252525]
          hidden laptop:flex
        "
      >
        <div className="px-3 mb-3 laptop:hidden">{user && <UserBadge />}</div>

        <div className="flex flex-col gap-1">
          {/* NÚT THÊM CUỘC TRÒ CHUYỆN MỚI (Desktop) */}
          {actionItemWithAction && (
            <button
              onClick={actionItemWithAction.action}
              className="m-0 flex items-center gap-3 mx-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:text-black transition-all"
            >
              <span className="min-w-10 h-10 flex items-center justify-center text-blue-500">
                {actionItemWithAction.icon}
              </span>
              <span
                className="
                    text-sm font-medium opacity-0 
                    group-hover:opacity-100 group-hover:translate-x-0 
                    -translate-x-2 transition-all duration-300 whitespace-nowrap text-blue-500
                "
              >
                {actionItemWithAction.label}
              </span>
            </button>
          )}

          {/* CÁC MỤC LINK KHÁC (Desktop) */}
          {linkItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="m-0 flex items-center gap-3 mx-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:text-black transition-all"
            >
              <span className="min-w-10 h-10 flex items-center justify-center">
                {item.icon}
              </span>
              <span
                className="
                  text-sm font-medium opacity-0 
                  group-hover:opacity-100 group-hover:translate-x-0 
                  -translate-x-2 transition-all duration-300 whitespace-nowrap
                "
              >
                {item.label}
              </span>
            </Link>
          ))}

          {/* MỤC HỘI THOẠI VÀ DROPDOWN (Desktop) */}
          {/* ... (Phần này sử dụng handleToggleDropdown) ... */}
          <div className="flex flex-col">
            <button
              onClick={() => handleToggleDropdown()}
              className="m-0 flex items-center gap-3 mx-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:text-black transition-all text-left"
            >
              <span className="min-w-10 h-10 flex items-center justify-center">
                <MessagesSquare size={20} />
              </span>
              <span
                className="
                      text-sm font-medium opacity-0 
                      group-hover:opacity-100 group-hover:translate-x-0 
                      -translate-x-2 transition-all duration-300 whitespace-nowrap grow
                    "
              >
                Hội thoại
              </span>
            </button>
            {/* Danh sách Dropdown (Desktop) */}
            <div
              className={`
                overflow-hidden transition-[max-height] duration-300 ease-in-out
                ${isDropdownOpen ? "max-h-96" : "max-h-0"}

                opacity-0 
                group-hover:opacity-100 
                transition-opacity duration-300
              `}
            >
              {user ? (
                <ConversationList conversations={conversations} />
              ) : (
                <p className="text-xs text-center p-2 opacity-60">
                  Đăng nhập để xem hội thoại
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="
            mt-auto mx-3 py-2 flex items-center gap-3 rounded-xl
            hover:bg-gray-100 transition-all dark:hover:text-black
          "
        >
          <span className="min-w-10 h-10 flex items-center justify-center">
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </span>

          <span
            className="
              text-sm font-medium opacity-0 
              group-hover:opacity-100 group-hover:translate-x-0 
              -translate-x-2 transition-all duration-300 whitespace-nowrap
            "
          >
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </span>
        </button>
      </aside>

      {/* ===== Overlay ===== */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 laptop:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ===== Mobile Slide Menu ===== */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 z-50 
          bg-gray-50 dark:bg-[#252525]
          border-r border-gray-200 dark:border-gray-700
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          laptop:hidden
        `}
      >
        <button
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={() => setOpen(false)}
        >
          <X size={20} />
        </button>

        {/* USER SECTION (Mobile) */}
        <div className="mt-14 px-4 pb-4">
          {user ? (
            <UserBadge />
          ) : (
            <button
              onClick={() => {
                setOpen(false);
                setShowAuth(true);
              }}
              className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-xl w-full"
            >
              <User size={20} />
              <span className="font-medium">Đăng nhập</span>
            </button>
          )}
        </div>

        {/* MENU LIST (Mobile) */}
        <div className="flex flex-col gap-3 px-4">
          {actionItemWithAction && (
            <button
              onClick={() => {
                actionItemWithAction.action();
                closeMobileMenuCallback();
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500"
            >
              {actionItemWithAction.icon}
              <span className="text-sm font-medium">
                {actionItemWithAction.label}
              </span>
            </button>
          )}
          {/* CÁC MỤC LINK KHÁC (Mobile) */}
          {linkItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              onClick={closeMobileMenuCallback}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
          {/* MỤC HỘI THOẠI VÀ DROPDOWN (Mobile) */}
          <div className="flex flex-col">
            <button
              onClick={() => handleToggleDropdown()}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
            >
              <MessagesSquare size={20} />
              <span className="text-sm font-medium grow">Hội thoại</span>
              {isDropdownOpen ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            {/* Danh sách Dropdown (Mobile) */}
            <div
              className={`
                overflow-hidden transition-[max-height] duration-300 ease-in-out
                ${isDropdownOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}
              `}
            >
              {user ? (
                <ConversationList
                  conversations={conversations}
                  closeMobileMenu={closeMobileMenuCallback}
                />
              ) : (
                <p className="text-xs text-center p-2 opacity-60">
                  Đăng nhập để xem hội thoại
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            {/* Toggle theme (Mobile) */}
            <button
              onClick={() => {
                toggleTheme();
                setOpen(false);
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              <span className="text-sm font-medium">
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </span>
            </button>

            {/* Logout (Mobile) */}
            {user && (
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 mt-auto"
              >
                <User size={20} />
                <span className="text-sm font-medium">Đăng xuất</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AUTH POPUP */}
      <AuthPopup
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => setShowAuth(false)}
      />
    </>
  );
}
