import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User";
import Group from "../models/Group"; // Import the new Group model
import {
  LoginSchema,
  CreateUserSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "../schemas";
import { AuthenticatedRequest, ApiResponse } from "../types";
import { sendPasswordResetEmail } from "../utils/emailService";

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export const register = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const validatedData = CreateUserSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error:
          "Já existe usuário cadastrado com este email, tente novamente com outro email.",
      });
      return;
    }

    const user = await User.create(validatedData);

    // Create a default personal group for the new user
    const personalGroup = await Group.create({
      nome: `Grupo Pessoal de ${user.name}`,
      membros: [user._id],
      criadoPor: user._id,
    });

    // Link the user to their new personal group
    user.grupos.push(personalGroup._id);
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
      message: "User registered successfully and personal group created.",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
      return;
    }

    console.error("Registration Error:", error); // Log the actual error for debugging
    res.status(500).json({
      success: false,
      error: "Server error during registration",
    });
  }
};

export const login = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const validatedData = LoginSchema.parse(req.body);

    // Populate the 'grupos' field when fetching the user
    const user = await User.findOne({ email: validatedData.email })
      .select("+password")
      .populate("grupos"); // Populate the groups

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
      return;
    }

    const isValidPassword = await user.comparePassword(validatedData.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
      return;
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
      },
      message: "Login successful",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
      return;
    }

    console.error("Login Error:", error); // Log the actual error for debugging
    res.status(500).json({
      success: false,
      error: "Server error during login",
    });
  }
};

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    // Ensure the user object in req.user has populated groups if needed
    // If req.user is set by a middleware, that middleware should populate 'grupos'
    // For now, assuming req.user is already populated or we don't need groups here.
    // If not populated, you might need to fetch it again:
    const user = await User.findById(req.user?._id).populate('grupos');
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    res.json({
      success: true,
      data: user.toJSON(), // Use toJSON to remove sensitive fields
    });
  } catch (error: any) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ success: false, error: "Server error fetching profile" });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const validatedData = ForgotPasswordSchema.parse(req.body);
    const { email } = validatedData;

    // User.findOne will not return fields with select: false unless explicitly stated
    // However, for forgot password, we don't need to check existing token/expiry yet.
    const user = await User.findOne({ email });

    // Important: Always send a generic success message to prevent user enumeration
    if (!user || !user.isActive) {
      res.status(200).json({
        success: true, // Perceived success
        message:
          "If an account with this email exists, a password reset link has been sent.",
      });
      return;
    }

    // Generate the reset token (unhashed version to be sent via email)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before storing it in the database
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token expiry (e.g., 1 hour from now)
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour in ms

    await user.save({ validateBeforeSave: false }); // Skip validation for these fields if not in main schema validation

    try {
      await sendPasswordResetEmail(user.email, resetToken);
      res.status(200).json({
        success: true,
        message:
          "If an account with this email exists, a password reset link has been sent.",
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Even if email fails, don't reveal user existence.
      // Log the error for admin, but user still gets generic success.
      // Critical: Reset token and expiry should be cleared if email fails to prevent unusable tokens.
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      // Send generic message. For critical failures, an admin should be alerted.
      res.status(200).json({
        // Or 500 if we want to indicate a server issue without revealing specifics
        success: true, // Still perceived success to the client for security
        message:
          "If an account with this email exists, a password reset link has been sent. If you don't receive it, please try again later or contact support.",
      });
    }
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
      return;
    }
    console.error("Forgot Password Error:", error);
    // Generic message for other errors too
    res.status(200).json({
      // Or 500 but be careful not to leak info
      success: true, // Perceived success
      message:
        "If an account with this email exists, a password reset link has been sent.",
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { token } = req.params;
    const validatedData = ResetPasswordSchema.parse(req.body);

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user by hashed token and check expiry
    // Need to explicitly select the passwordResetToken and passwordResetExpires fields
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      res.status(400).json({
        success: false,
        error:
          "Invalid or expired password reset token. Please try resetting your password again.",
      });
      return;
    }

    // Set new password (it will be hashed by the pre-save hook in User model)
    user.password = validatedData.password;
    user.passwordResetToken = undefined; // Clear the token
    user.passwordResetExpires = undefined; // Clear the expiry

    await user.save(); // Validation (e.g. password length) will run here due to pre-save hook

    // Optionally, log the user in by generating a new JWT token
    // const jwtToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
      // data: { token: jwtToken } // If auto-login is desired
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
      return;
    }
    console.error("Reset Password Error:", error);
    res.status(500).json({
      success: false,
      error:
        "An error occurred while resetting your password. Please try again.",
    });
  }
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    // For JWTs, logout is primarily client-side by removing the token.
    // If using refresh tokens, you might invalidate the refresh token here.
    // For this implementation, we'll just send a success response.
    // The client-side will handle clearing the tokens.
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error: any) {
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during logout",
    });
  }
};
