// utils/localStorage.ts
import { Conversation } from "@/types/conversation";

const CACHE_KEY = "conversations_cache";

/**
 * Đọc dữ liệu hội thoại từ localStorage.
 * Trả về mảng rỗng nếu không có dữ liệu hoặc lỗi.
 */
export const getConversationsCache = (): Conversation[] => {
  if (typeof window === "undefined") return [];
  try {
    const json = localStorage.getItem(CACHE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error("Lỗi khi đọc cache localStorage:", error);
    return [];
  }
};

/**
 * Ghi dữ liệu hội thoại vào localStorage.
 */
export const setConversationsCache = (data: Conversation[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("storage_conversations_update"));

  } catch (error) {
    console.error("Lỗi khi ghi cache localStorage:", error);
  }
};

export const CACHE_UPDATE_EVENT = "storage_conversations_update";