"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  PanelRight,
  MessagesSquare,
  ChevronUp,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import ConversationList from "../ConversationList";
import { SharedSidebarProps } from "@/types/sidebar";
import { useSidebar } from "@/contexts/SidebarContext";

export default function SidebarDesktop({
  items,
  user,
  theme,
  toggleTheme,
}: SharedSidebarProps) {
  const [isPinned, setIsPinned] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const { conversations } = useSidebar();
  return (
    <aside
      data-expanded={isPinned}
      className={`
        group fixed h-[95vh] z-50 m-3 rounded-2xl shadow-xl
        ${isPinned ? "w-64" : "w-16 hover:w-64"}
        bg-white/80 dark:bg-[#1a1a1a]/90 backdrop-blur-xl
        border-r border-gray-200 dark:border-white/10
        flex-col py-6 transition-[width] duration-300 ease-in-out
        hidden laptop:flex overflow-hidden
      `}
    >
      {/* Header & Pin Button */}
      <div className="flex justify-between items-center mb-4">
        <Link
          href="/"
          className="p-4 hidden group-hover:flex group-data-[expanded=true]:flex"
        >
          <Image
            src={
              theme === "light"
                ? "/Core/short_cut_logo_light_theme.svg"
                : "/Core/short_cut_logo_dark_theme_v1.svg"
            }
            width={25}
            height={25}
            alt="logo"
          />
        </Link>
        <div className="relative flex flex-1 group-hover:pr-10 group-data-[expanded=true]:pr-10 justify-center items-center h-10">
          <PanelRight
            size={20}
            onClick={() => setIsPinned(!isPinned)}
            className="peer absolute cursor-pointer transition-transform duration-300 group-hover:translate-x-24 group-data-[expanded=true]:translate-x-24"
          />
          <div className="absolute top-full px-2 py-1 text-xs rounded-md bg-black text-white opacity-0 peer-hover:opacity-100 transition-all pointer-events-none">
            {isPinned ? "Bỏ ghim" : "Ghim Sidebar"}
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex flex-col gap-1 w-full">
        {items.map((item, idx: number) => (
          <SidebarItem key={idx} item={item} isExpanded={isPinned} />
        ))}

        {/* Conversations Dropdown */}
        <div className="flex flex-col w-full">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center h-12 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <div className="min-w-16 h-10 flex items-center justify-center shrink-0">
              <MessagesSquare size={20} />
            </div>
            <div className="flex items-center justify-between w-full opacity-0 group-hover:opacity-100 group-data-[expanded=true]:opacity-100 transition-opacity pr-4">
              <span className="text-sm font-medium">Hội thoại</span>
              {isDropdownOpen ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </div>
          </button>

          <div
            className={` grid transition-all duration-300 ${isDropdownOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <div className="px-4 py-2 hidden group-hover:block group-data-[expanded=true]:block">
                {user ? (
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    <ConversationList conversations={conversations} />
                  </div>
                ) : (
                  <p className="text-xs opacity-50">Đăng nhập để xem</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Toggle at Bottom */}
      <button
        onClick={toggleTheme}
        className="mt-auto flex items-center h-12 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl"
      >
        <div className="min-w-16 h-10 flex items-center justify-center shrink-0">
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </div>
        <span className="text-sm font-medium opacity-0 group-hover:opacity-100 group-data-[expanded=true]:opacity-100 transition-opacity">
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </span>
      </button>
    </aside>
  );
}
