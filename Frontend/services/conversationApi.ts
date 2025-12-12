import { apiFetch } from "./api";

export const getConversations = (userId: string) => {
  return apiFetch(`/conversation?userId=${userId}`, {
    method: "GET",
  });
};

export const createConversation = () => {
  return apiFetch("/conversation", { method: "POST" });
};

export const deleteConversation = (conversationId: string) => {
  return apiFetch(`/conversation/${conversationId}`, {
    method: "DELETE",
  });
};

export const renameConversation = (conversationId: string, title: string) => {
  return apiFetch(`/conversation/${conversationId}`, {
    method: "PUT",
    body: JSON.stringify({ title }),
  });
};

export const getConversationDetail = (conversationId: string) => {
  return apiFetch(`/conversation/${conversationId}`, {
    method: "GET",
  });
};
