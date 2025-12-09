import { Schema, model, Document } from "mongoose";

export interface IChatMessage extends Document {
  conversationId: string;
  sender: "user" | "ai";
  message: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    conversationId: { type: String, required: true },
    sender: { type: String, enum: ["user", "ai"], required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export default model<IChatMessage>("ChatMessage", ChatMessageSchema);
