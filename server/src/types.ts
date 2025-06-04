import { Request } from "express";
import { IUser } from "./models/User";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface JwtPayload {
  userId: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string | object;
  details?: any;
}
