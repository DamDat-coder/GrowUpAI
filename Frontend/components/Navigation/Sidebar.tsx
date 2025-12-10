"use client";

import {
  Home,
  MessagesSquare,
  Folder,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/authContext";
import UserBadge from "../Core/UserBadge";
import AuthPopup from "../Core/AuthPopup";

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const items = [
    { href: "/chat", label: "Trang chủ", icon: <Home size={20} /> },
    {
      href: "/messages",
      label: "Hội thoại",
      icon: <MessagesSquare size={20} />,
    },
    { href: "/files", label: "Tệp", icon: <Folder size={20} /> },
    { href: "/settings", label: "Cài đặt", icon: <Settings size={20} /> },
  ];

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
          absolute h-[95vh] w-16 hover:w-50
          bg-gray-50/70 backdrop-blur-md border-r border-gray-200
          flex-col py-6 gap-4 rounded-2xl m-3 shadow-sm transition-all duration-300
          dark:bg-[#252525]
          hidden laptop:flex
        "
      >
        {/* USER BADGE */}
        <div className="px-3 mb-3 laptop:hidden">{user && <UserBadge />}</div>

        {/* MENU ITEMS */}
        {items.map((item, idx) => (
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

        {/* Toggle theme */}
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

        {/* USER SECTION */}
        <div className="mt-14 px-4 pb-4">
          {user ? (
            <UserBadge />
          ) : (
            <button
              onClick={() => {
                setOpen(false);
                setShowAuth(true);
              }}
              className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-xl"
            >
              <User size={20} />
              <span className="font-medium">Đăng nhập</span>
            </button>
          )}
        </div>

        {/* MENU LIST */}
        <div className="flex flex-col gap-3 px-4">
          {items.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}

          <div className="pt-2 flex flex-col gap-2">
            {/* Toggle theme */}
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

            {/* Logout */}
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
