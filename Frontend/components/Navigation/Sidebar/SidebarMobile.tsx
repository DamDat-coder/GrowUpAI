"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, User, MessagesSquare, ChevronUp, ChevronDown, Moon, Sun, LogOut } from "lucide-react";
import UserBadge from "../../Core/Auth/UserBadge";
import ConversationList from "../ConversationList";
import { MobileSidebarProps } from "@/types/sidebar";

export default function SidebarMobile({ isOpen, onClose, items, conversations, user, logout, theme, toggleTheme, onOpenAuth }:MobileSidebarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-60 laptop:hidden backdrop-blur-sm" onClick={onClose} />
      )}

      {/* Slide Menu */}
      <div className={`
        fixed top-0 left-0 h-full w-72 z-[70
        bg-white dark:bg-[#1a1a1a] shadow-2xl
        transition-transform duration-300 ease-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        laptop:hidden flex flex-col
      `}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-white/5">
          <Image src={theme === "light" ? "/Core/short_cut_logo_light_theme.svg" : "/Core/short_cut_logo_dark_theme_v1.svg"} 
            width={30} height={30} alt="logo" />
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100 dark:bg-white/5">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* User Section */}
          <section>
            {user ? <UserBadge /> : (
              <button onClick={onOpenAuth} className="flex items-center gap-3 bg-[#109150] text-white px-4 py-3 rounded-xl w-full">
                <User size={20} />
                <span className="font-semibold">Đăng nhập ngay</span>
              </button>
            )}
          </section>

          {/* Menu Items */}
          <nav className="space-y-1">
            {items.map((item, idx:number) => (
              <Link key={idx} href={item.href || "#"} onClick={() => { item.action?.(); onClose(); }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}

            {/* Conversation Dropdown Mobile */}
            <div className="pt-2">
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 px-3 py-3 w-full">
                <MessagesSquare size={20} />
                <span className="text-sm font-medium flex-1 text-left">Hội thoại gần đây</span>
                {isDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <div className={`grid transition-all ${isDropdownOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden px-2 border-l-2 border-gray-100 dark:border-white/5 ml-5">
                  {user ? <ConversationList conversations={conversations} /> : <p className="text-xs p-2 opacity-50 text-center">Đăng nhập để xem</p>}
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t dark:border-white/5 space-y-2">
          <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-3 w-full rounded-xl hover:bg-gray-100 dark:hover:bg-white/5">
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            <span className="text-sm font-medium">{theme === "light" ? "Giao diện tối" : "Giao diện sáng"}</span>
          </button>
          
          {user && (
            <button onClick={() => { logout(); onClose(); }} className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
              <LogOut size={20} />
              <span className="text-sm font-medium">Đăng xuất</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}