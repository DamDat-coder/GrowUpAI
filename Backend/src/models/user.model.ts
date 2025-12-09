import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string | null;
  name: string;
  googleId?: string | null;
  refreshToken?: string | null;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    googleId: { type: String, default: null },
    refreshToken: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const UserModel: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default UserModel;
