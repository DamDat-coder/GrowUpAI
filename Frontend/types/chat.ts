export interface BackendMessage {
  _id: string;
  conversationId: string;
  sender: "user" | "assistant";
  message: string;
  createdAt: string;
}
export interface ChatMessage {
  _id?: string;
  conversationId?: string;
  sender: "user" | "assistant";
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