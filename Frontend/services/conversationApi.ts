import { apiFetch } from "./api";

export const getConversations = (userId: string) => {
  return apiFetch(`/conversation?userId=${userId}`, {
    method: "GET",
  });
};

export const createConversation = (userId: string, title: string) => {
  return apiFetch("/conversation", {
    method: "POST",
    body: JSON.stringify({
      userId,
      title,
    }),
  });
};

export const deleteConversation = (conversationId: string) => {
  return apiFetch(`/conversation`, {
    method: "DELETE",
    body: JSON.stringify({
      conversationId,
    }),
  });
};

export const renameConversation = (conversationId: string, newtitle: string) => {
  return apiFetch(`/conversation/rename`, {
    method: "PATCH",
    body: JSON.stringify({ conversationId, newtitle }),
  });
};

export const getConversationDetail = (conversationId: string) => {
  return apiFetch(`/conversation/${conversationId}`, {
    method: "GET",
  });
};
