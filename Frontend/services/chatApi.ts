import { apiFetch } from "./api";

export const getMessages = (conversationId: string) => {
  return apiFetch(`/conversations/${conversationId}/messages`, {
    method: "GET",
  });
};

export const sendMessage = (conversationId: string, message: string) => {
  return apiFetch(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
};

export const deleteMessage = (conversationId: string, messageId: string) => {
  return apiFetch(`/conversations/${conversationId}/messages/${messageId}`, {
    method: "DELETE",
  });
};
