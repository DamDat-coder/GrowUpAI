import { apiFetch } from "./api";

export interface ChatMessage {
  _id?: string;
  conversationId?: string;
  sender: "user" | "ai";
  message: string;
  createdAt?: string;
}
export interface SendMessageResponse {
  success: boolean;
  data: {
    conversationId: string;
    message: ChatMessage;
    assistantMessage?: ChatMessage;
  };
}

export async function sendMessage(
  message: string,
  conversationId?: string
): Promise<SendMessageResponse> {
  if (!message || typeof message !== "string") {
    throw new Error("message is required and must be a string");
  }

  const endpoint = conversationId ? `/chat/${conversationId}` : `/chat`;

  const res = await apiFetch<SendMessageResponse>(endpoint, {
    method: "POST",
    body: JSON.stringify({ message, conversationId }),
  });

  return res;
}

export async function sendMessageToConversation(
  conversationId: string | undefined,
  message: string
): Promise<SendMessageResponse> {
  return sendMessage(message, conversationId);
}

export async function getHistory(
  conversationId: string
): Promise<{ success: boolean; data: ChatMessage[] }> {
  if (!conversationId) {
    throw new Error("conversationId is required");
  }

  const res = await apiFetch<{ success: boolean; data: ChatMessage[] }>(
    `/chat/${conversationId}`,
    { method: "GET" }
  );

  return res;
}
