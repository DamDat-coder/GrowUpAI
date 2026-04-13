import { Schema, model, Document } from "mongoose";

export interface IConversation extends Document {
  userId: string;
  title: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, required: false },
    title: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default model<IConversation>("Conversation", ConversationSchema);
