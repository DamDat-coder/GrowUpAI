// 📁 hooks/useConversationCache.ts (ĐÃ KHẮC PHỤC LỖI VÒNG LẶP)
import { useState, useEffect, useCallback } from "react";
import { Conversation } from "@/types/conversation";
import { getConversations } from "@/services/conversationApi";
import {
  getConversationsCache,
  setConversationsCache,
  CACHE_UPDATE_EVENT,
} from "@/utils/localStorage";

export interface ConversationCacheHook {
  conversations: Conversation[];
  isLoading: boolean;
  refetchConversations: () => Promise<void>;
}

export const useConversationCache = (
  userId: string | null,
  isAuthInitialized: boolean
): ConversationCacheHook => {
  const [conversations, setConversations] = useState<Conversation[]>(
    getConversationsCache()
  );
  const [isLoading, setIsLoading] = useState(false);

 const fetchAndSync = useCallback(async () => {
    if (isAuthInitialized && !userId) {
      setConversationsCache([]);
      setConversations([]);
      return;
    }

    if (!isAuthInitialized || !userId) {
      return;
    }

    setIsLoading(true);
    try {
      const data = (await getConversations(userId)) as Conversation[];
      setConversationsCache(data);
      setConversations(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách hội thoại:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthInitialized]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageUpdate = () => {
      const newCache = getConversationsCache();

      setConversations(newCache);
    };

    window.addEventListener(CACHE_UPDATE_EVENT, handleStorageUpdate);

    fetchAndSync();

    // Dọn dẹp listener
    return () => {
      window.removeEventListener(CACHE_UPDATE_EVENT, handleStorageUpdate);
    };
  }, [fetchAndSync]);

  return {
    conversations,
    isLoading,
    refetchConversations: fetchAndSync,
  };
};
