import mongoose, { Schema, Document } from "mongoose";

export interface IToken extends Document {
  userId?: mongoose.Types.ObjectId; // Optional, for password reset or registered user invites
  invitedEmail?: string; // For unregistered user invites
  token: string;
  type: "passwordReset" | "groupInvitation" | "sessionRefreshToken"; // Added groupInvitation type
  groupId?: mongoose.Types.ObjectId; // Added for group invitations
  expiresAt: Date;
  createdAt: Date;
}

const TokenSchema = new Schema<IToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Made optional
    },
    invitedEmail: {
      type: String,
      required: false, // Optional, used for unregistered users
      lowercase: true,
      trim: true,
    },
    token: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["passwordReset", "groupInvitation", "sessionRefreshToken"], // Updated enum
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: false, // Optional, only for groupInvitation type
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IToken>("Token", TokenSchema);
