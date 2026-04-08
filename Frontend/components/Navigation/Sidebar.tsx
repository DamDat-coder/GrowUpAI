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
  PanelRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useCallback } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/authContext";
import UserBadge from "../Core/UserBadge";
import AuthPopup from "../Core/AuthPopup";
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
  const { user, logout, isLoadingAuth } = useAuth();

  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const isAuthInitialized = !isLoadingAuth;

  const { conversations, refetchConversations } = useConversationCache(
    user?.id || null,
    isAuthInitialized,
  );

  // ✅ SỬ DỤNG useCallback để ổn định hàm đóng Mobile Menu
  const closeMobileMenuCallback = useCallback(() => {
    setOpen(false);
  }, []);

  // ✅ SỬ DỤNG useCallback để ổn định hàm toggle dropdown
  const handleToggleDropdown = useCallback((): void => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  // HÀM TYPE GUARD ĐỂ LỌC LINK
  const isLinkItem = (item: BaseItem): item is BaseItem & { href: string } => {
    return item.href !== undefined;
  };

  // ✅ KHÔI PHỤC LẠI baseItems và Nút Action
  const baseItems: BaseItem[] = [
    {
      label: "Cuộc trò chuyện mới",
      icon: <PlusCircle size={20} />,
      href: "/",
      action: () => {
        console.log("Trigger refetching...");
        refetchConversations();
        if (open) closeMobileMenuCallback();
      },
    },
    { href: "/files", label: "Tệp", icon: <Folder size={20} /> },
    { href: "/settings", label: "Cài đặt", icon: <Settings size={20} /> },
  ];

  const linkItems = baseItems.filter(isLinkItem);
  return (
    <>
      <button
        className="laptop:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-50 dark:bg-[#252525] dark:text-black shadow"
        onClick={() => setOpen(true)}
      >
        <Menu size={20} className="dark:text-white" />
      </button>

      {/* ===== Desktop Sidebar ===== */}
      <aside
        data-expanded={isPinned}
        className={`
          group fixed h-[95vh] z-50
          ${isPinned ? "w-64" : "w-16 hover:w-64"}
          bg-white/80 dark:bg-[#1a1a1a]/90 backdrop-blur-xl
          border-r border-gray-200 dark:border-white/10
           flex-col py-6 m-3 rounded-2xl shadow-xl
          transition-[width] duration-300 ease-in-out
          hidden laptop:flex overflow-hidden
        `}
      >
        <div className="flex flex-col gap-2 w-full">
          <div className="flex justify-between items-center">
            <Link href="/" className=" items-center p-4 hidden group-hover:flex group-data-[expanded=true]:flex">
              <Image
                src="/Core/short_cut_logo_light_theme.svg"
                width={25}
                height={25}
                alt="logo"
                className=" dark:hidden"
              />
              <Image
                src="/Core/short_cut_logo_dark_theme_v1.svg"
                width={25}
                height={25}
                alt="logo"
                className=" hidden dark:block"
              />
            </Link>
            <div className="relative flex flex-1 group-hover:pr-10 group-data-[expanded=true]:pr-10 justify-center items-center h-10">
              <PanelRight
                size={20}
                onClick={() => setIsPinned((prev) => !prev)}
                className="
                peer
                absolute cursor-pointer
                transition-transform duration-300
                group-hover:translate-x-24
                group-data-[expanded=true]:translate-x-24
              "
              />

              {/* Tooltip */}
              <div
                className="
                absolute top-full
                px-2 py-1 text-xs rounded-md
                bg-black text-white whitespace-nowrap
                opacity-0 translate-y-0.5 translate-x-18
                peer-hover:opacity-100
                peer-hover:translate-y-0
                transition-all duration-200
                pointer-events-none
              "
              >
                {isPinned ? "Bỏ ghim Sidebar" : "Ghim Sidebar"}
              </div>
            </div>
          </div>

          {baseItems.map((item, idx) => {
            // Logic xử lý Click (Action hoặc Link)
            const handleClick = () => {
              if (item.action) item.action();
              if (open) closeMobileMenuCallback();
            };

            const Content = (
              <>
                {/* Cố định vùng chứa Icon để không bị lệch khi giãn Sidebar */}
                <div className="min-w-16 h-10 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                {/* Chữ chỉ hiện khi Group Hover */}
                <span className="text-sm font-medium opacity-0 group-hover:opacity-100 group-data-[expanded=true]:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden text-ellipsis mr-4">
                  {item.label}
                </span>
              </>
            );

            return item.href ? (
              <Link
                key={idx}
                href={item.href}
                onClick={handleClick}
                className="flex items-center h-12 mx-0 transition-colors hover:bg-gray-100 dark:hover:bg-white/10 rounded-none group-hover:rounded-xl"
              >
                {Content}
              </Link>
            ) : (
              <button
                key={idx}
                onClick={handleClick}
                className="flex items-center h-12 mx-0 transition-colors hover:bg-gray-100 dark:hover:bg-white/10 rounded-none group-hover:rounded-xl  text-left"
              >
                {Content}
              </button>
            );
          })}
          {/* MỤC HỘI THOẠI DROPDOWN */}
          <div className="flex flex-col w-full">
            <button
              onClick={handleToggleDropdown}
              className="flex items-center h-12 mx-0 transition-colors hover:bg-gray-100 dark:hover:bg-white/10 rounded-none group-hover:rounded-xl  text-left"
            >
              <div className="min-w-16 h-10 flex items-center justify-center shrink-0">
                <MessagesSquare size={20} />
              </div>
              <div className="flex items-center justify-between w-full opacity-0 group-hover:opacity-100 group-data-[expanded=true]:opacity-100 transition-opacity duration-300 mr-4">
                <span className="text-sm font-medium whitespace-nowrap">
                  Hội thoại
                </span>
                {isDropdownOpen ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </div>
            </button>

            {/* Hiệu ứng trượt Grid mượt mà */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${isDropdownOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className="px-4 py-2 group-data-[expanded=true]:block group-hover:block hidden">
                  {user ? (
                    <ConversationList conversations={conversations} />
                  ) : (
                    <p className="text-xs opacity-50">Đăng nhập để xem</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NÚT TOGGLE THEME Ở BOTTOM */}
        <button
          onClick={toggleTheme}
          className="mt-auto flex items-center h-12 mx-0 transition-colors hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl"
        >
          <div className="min-w-16 h-10 flex items-center justify-center shrink-0">
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </div>
          <span className="text-sm font-medium opacity-0 group-hover:opacity-100 group-data-[expanded=true]:opacity-100 transition-opacity duration-300 whitespace-nowrap">
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
          flex flex-col
        `}
      >
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center p-4">
            <Image
              src="/Core/short_cut_logo_light_theme.svg"
              width={30}
              height={30}
              alt="logo"
              className=" dark:hidden"
            />
            <Image
              src="/Core/short_cut_logo_dark_theme_v1.svg"
              width={30}
              height={30}
              alt="logo"
              className=" hidden dark:block"
            />
          </Link>
          <button
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* USER SECTION (Mobile) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-4">
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
                  grid transition-all duration-300 ease-in-out
                  ${isDropdownOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"}
                `}
              >
                <div className="overflow-hidden">
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
      </div>

      {/* AUTH POPUP */}
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
