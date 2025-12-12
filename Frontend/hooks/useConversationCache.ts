// hooks/useConversationCache.ts
import { useState, useEffect, useCallback } from "react";
import { Conversation } from "@/types/conversation";
import { getConversations } from "@/services/conversationApi"; // Giả định API
import {
  getConversationsCache,
  setConversationsCache,
  CACHE_UPDATE_EVENT,
} from "@/utils/localStorage";

interface ConversationCacheHook {
  conversations: Conversation[];
  isLoading: boolean;
  // Hàm này có thể được gọi từ bên ngoài (ví dụ: sau khi tạo cuộc trò chuyện mới)
  refetchConversations: () => Promise<void>; 
}

export const useConversationCache = (
  userId: string | null
): ConversationCacheHook => {
  const [conversations, setConversations] = useState<Conversation[]>(
    getConversationsCache() // 1. Tải nhanh từ cache khi khởi tạo
  );
  const [isLoading, setIsLoading] = useState(false);

  // Hàm fetch dữ liệu từ API và cập nhật Cache/State
  const fetchAndSync = useCallback(async () => {
    if (!userId) {
      if (conversations.length > 0) {
        setConversationsCache([]);
        setConversations([]);
      }
      return;
    }

    setIsLoading(true);
    try {
      const data = (await getConversations(userId)) as Conversation[];
      
      // 2. Cập nhật cache và State (Hàm tiện ích sẽ gọi setConversationsCache)
      setConversationsCache(data);
      setConversations(data);
      
    } catch (error) {
      console.error("Lỗi khi tải danh sách hội thoại:", error);
      // Giữ lại state hiện tại nếu API lỗi
    } finally {
      setIsLoading(false);
    }
  }, [userId, conversations.length]); 
  // [conversations.length] là cần thiết nếu bạn muốn logic tạo mới conversation
  // (không dùng refetch) hoạt động, nhưng tốt nhất là dùng `refetchConversations`

  // 3. Lắng nghe sự kiện (Đồng bộ giữa các tab và Webhook)
  useEffect(() => {
    // Chỉ chạy ở phía client (tránh lỗi SSR)
    if (typeof window === "undefined") return;

    // Handler cập nhật State khi có sự kiện từ localStorage khác
    const handleStorageUpdate = () => {
      const newCache = getConversationsCache();
      // Chỉ cập nhật state nếu cache thực sự khác (tránh re-render không cần thiết)
      if (JSON.stringify(newCache) !== JSON.stringify(conversations)) {
        setConversations(newCache);
      }
    };

    window.addEventListener(CACHE_UPDATE_EVENT, handleStorageUpdate);

    // 4. Lần chạy đầu tiên: Fetch nếu không có cache hoặc user mới
    if (conversations.length === 0 || userId) {
        fetchAndSync();
    }
    
    // Dọn dẹp listener
    return () => {
      window.removeEventListener(CACHE_UPDATE_EVENT, handleStorageUpdate);
    };
  }, [userId]);

  // Trả về hàm refetch public
  return { conversations, isLoading, refetchConversations: fetchAndSync };
};