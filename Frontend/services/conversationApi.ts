import { apiFetch } from "./api";

export const getConversations = () => {
  return apiFetch("/conversations", { method: "GET" });
};

export const createConversation = () => {
  return apiFetch("/conversations", { method: "POST" });
};

export const deleteConversation = (conversationId: string) => {
  return apiFetch(`/conversations/${conversationId}`, { method: "DELETE" });
};

export const renameConversation = (conversationId: string, title: string) => {
  return apiFetch(`/conversations/${conversationId}`, {
    method: "PUT",
    body: JSON.stringify({ title }),
  });
};

export const getConversationDetail = (conversationId: string) => {
  return apiFetch(`/conversations/${conversationId}`, { method: "GET" });
};
