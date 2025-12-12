// @/types/conversation.ts

import { IUser } from "@/types/auth";

export interface Conversation {
  _id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// export interface ConversationListProps {
//   conversations: Conversation[];
//   user: IUser;
//   closeMobileMenu?: () => void;
// }
export interface ConversationListProps {
  conversations: Conversation[];
  closeMobileMenu?: () => void; // Tùy chọn (chỉ dùng cho mobile)
}