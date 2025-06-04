import { Request } from 'express';
import { IUser } from './models/User'; // Import the Mongoose User document type

export interface AuthenticatedRequest extends Request {
  user?: IUser; // User object from JWT payload, now includes 'grupos' with new structure
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string | object;
  details?: any;
}
