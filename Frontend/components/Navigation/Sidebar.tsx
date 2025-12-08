"use client";

import {
  Home,
  MessagesSquare,
  Folder,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
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
    <aside
      className="
      group
      absolute h-[95vh] w-16 hover:w-50
      bg-white/70 backdrop-blur-md border-r border-gray-200 
      flex flex-col py-6 gap-4 rounded-2xl m-3 shadow-sm transition-all duration-300 dark:bg-[#252525]
    "
    >
      {items.map((item, idx) => (
        <Link
          key={idx}
          href={item.href}
          className="m-0 flex items-center gap-3 mx-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:text-black transition-all"
        >
          {/* Icon */}
          <span className="min-w-10 h-10 flex items-center justify-center">
            {item.icon}
          </span>

          {/* Text — ẩn khi không hover */}
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
      {/* Nút đổi theme */}
      <button
        onClick={toggleTheme}
        className="
          mt-auto mx-3 py-2 flex items-center gap-3 rounded-xl
          hover:bg-gray-100
          transition-all
          dark:hover:text-black
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
  );
}
