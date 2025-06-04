import { Request } from "express";
import { Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: "admin" | "user";
  isActive: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  grupos?: string[];
  comparePassword(candidatePassword: string): Promise<boolean>;
  // Ensure __v is also included in Omit if it's present in IUser and removed by toJSON
  // However, __v is a Mongoose internal field, not typically defined directly in IUser interface unless needed.
  // If toJSON removes it, it's good practice to reflect that in the return type.
  // For now, assuming __v is not explicitly in IUser, but removed by toJSON implementation.
  toJSON(): Omit<
    IUser,
    "password" | "passwordResetToken" | "passwordResetExpires"
  >;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}
