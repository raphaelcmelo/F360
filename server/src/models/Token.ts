import mongoose, { Schema, Document } from "mongoose";

export interface IToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string; // Hashed token
  type: "passwordReset" | "refreshToken" | "emailVerification"; // Define token types
  expiresAt: Date;
  createdAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    token: {
      type: String,
      required: true,
      unique: true, // Ensure token is unique
    },
    type: {
      type: String,
      required: true,
      enum: ["passwordReset", "refreshToken", "emailVerification"], // Enforce allowed types
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

// Create an index on expiresAt for automatic cleanup (TTL index)
// This will automatically delete documents after their expiresAt date
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IToken>("Token", tokenSchema);
