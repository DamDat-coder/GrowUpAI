// 📁 contexts/SidebarContext.tsx
"use client";

import React, { createContext, useContext } from "react";
import { useConversationCache, ConversationCacheHook } from "@/hooks/useConversationCache";
import { useAuth } from "@/contexts/authContext";

// Dùng chung kiểu dữ liệu từ Hook của Dat luôn
const SidebarContext = createContext<ConversationCacheHook | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoadingAuth } = useAuth();

  // Đưa Hook của Dat vào đây - CHỈ GỌI DUY NHẤT 1 LẦN TẠI ĐÂY
  const sidebarData = useConversationCache(user?.id || null, !isLoadingAuth);

  return (
    <SidebarContext.Provider value={sidebarData}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within SidebarProvider");
  return context;
};