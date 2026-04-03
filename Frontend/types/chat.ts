export interface BackendMessage {
  _id: string;
  conversationId: string;
  sender: "user" | "ai";
  message: string;
  createdAt: string;
}