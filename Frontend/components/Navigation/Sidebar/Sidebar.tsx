"use client";

import React, { useState, useCallback, useMemo } from "react";
import { PlusCircle, Folder, Settings, Menu } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/authContext";
import { useConversationCache } from "@/hooks/useConversationCache";
import AuthPopup from "../../Core/Auth/AuthPopup";

// Sub-components (Giả định bạn để chung file hoặc import)
import SidebarDesktop from "./SidebarDesktop";
import SidebarMobile from "./SidebarMobile";

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isLoadingAuth } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  
  const { conversations, refetchConversations } = useConversationCache(
    user?.id || null,
    !isLoadingAuth
  );

  // Memoize menu items để tránh re-render không cần thiết
  const menuItems = useMemo(() => [
    {
      label: "Cuộc trò chuyện mới",
      icon: <PlusCircle size={20} />,
      href: "/",
      action: () => {
        refetchConversations();
        setIsMobileOpen(false);
      },
    },
    { href: "/files", label: "Tệp", icon: <Folder size={20} /> },
    { href: "/settings", label: "Cài đặt", icon: <Settings size={20} /> },
  ], [refetchConversations]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="laptop:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-[#252525] shadow-md"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu size={20} className="dark:text-white text-gray-700" />
      </button>

      {/* Desktop Version */}
      <SidebarDesktop 
        items={menuItems} 
        conversations={conversations}
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Mobile Version */}
      <SidebarMobile 
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        items={menuItems}
        conversations={conversations}
        user={user}
        logout={logout}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenAuth={() => { setIsMobileOpen(false); setShowAuth(true); }}
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