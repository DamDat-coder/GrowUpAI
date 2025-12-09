import { Schema, model, Document } from "mongoose";

export interface IConversation extends Document {
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
  },
  { timestamps: true }
);

export default model<IConversation>("Conversation", ConversationSchema);
