import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import ms from "ms";
import User from "../models/User";
import Group from "../models/Group"; // Import the new Group model
import Token from "../models/Token"; // Import the new Token model
import {
  LoginSchema,
  RegisterSchema, // Corrected: Changed CreateUserSchema to RegisterSchema
  ForgotPasswordSchema,
  ResetPasswordSchema,
  AcceptGroupInvitationSchema, // Import the new schema
} from "../schemas";
import { AuthenticatedRequest, ApiResponse } from "../types";
import { sendPasswordResetEmail } from "../utils/emailService";
import { z } from "zod"; // Import Zod for schema parsing

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m", // Use access token expiry
  });
};

export const register = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const validatedData = RegisterSchema.parse(req.body); // Corrected: Used RegisterSchema
    const { email, name, password } = validatedData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error:
          "Já existe usuário cadastrado com este email, tente novamente com outro email.",
      });
      return;
    }

    const user = await User.create({ email, name, password });

    // Handle group invitation during registration
    const { groupId, token } = req.body; // Expect groupId and token from query/body if it's an invitation

    if (groupId && token) {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const invitationTokenDoc = await Token.findOne({
        token: hashedToken,
        type: "groupInvitation",
        groupId: groupId,
        invitedEmail: email, // Ensure the token was for this email
        expiresAt: { $gt: Date.now() },
      });

      if (invitationTokenDoc) {
        const group = await Group.findById(groupId);

        if (group) {
          // Check if user is already a member (shouldn't happen if just registered, but good for safety)
          const isAlreadyMember = group.membros.some((member) =>
            member.userId.equals(user._id)
          );

          if (!isAlreadyMember) {
            // Add new user to group's members
            group.membros.push({ userId: user._id, role: "member" });
            await group.save();

            // Add group to user's groups
            user.grupos.push({ groupId: group._id, displayName: group.nome });
            await user.save();
          }
        }
        await Token.deleteOne({ _id: invitationTokenDoc._id }); // Invalidate the used token
      }
    } else {
      // If no invitation, create a default personal group for the new user
      console.log(`[Register] Creating personal group for user: ${user.name}`);
      const personalGroup = await Group.create({
        nome: `Grupo de ${user.name}`,
        membros: [{ userId: user._id, role: "admin" }],
        criadoPor: user._id,
      });
      console.log(
        `[Register] Personal group created with ID: ${personalGroup._id}`
      );

      // Link the user to their new personal group
      user.grupos.push({
        groupId: personalGroup._id,
        displayName: personalGroup.nome,
      });
      console.log(
        `[Register] Linking personal group ${personalGroup._id} to user ${user._id}`
      );
      await user.save();
      console.log(`[Register] User ${user._id} saved with new group.`);
    }

    const authToken = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token: authToken,
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

    console.error("Registration Error:", error.message || error); // Log the actual error message
    if (error.stack) {
      console.error("Registration Error Stack:", error.stack); // Log stack trace for more details
    }
    res.status(500).json({
      success: false,
      error: "Server error during registration",
      details: error.message || "Unknown error", // Provide error message to client if safe
    });
  }
};

export const login = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const validatedData = LoginSchema.parse(req.body);

    const user = await User.findOne({ email: validatedData.email })
      .select("+password")
      .populate("grupos.groupId");

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

    // Generate Access Token
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m" }
    );

    // Generate Refresh Token
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const hashedRefreshToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const refreshTokenExpiresIn =
      process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "7d";
    const refreshTokenExpiresAt = new Date(
      Date.now() + ms(refreshTokenExpiresIn)
    );

    await Token.create({
      userId: user._id,
      token: hashedRefreshToken,
      type: "sessionRefreshToken",
      expiresAt: refreshTokenExpiresAt,
    });

    const userObject = user.toJSON();
    delete userObject.password;

    res.json({
      success: true,
      data: {
        user: userObject,
        accessToken,
        refreshToken, // Send the original refresh token to the client
      },
      message: "Login successful",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      // More specific error handling
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
      return;
    }
    console.error("Login Error:", error);
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
    const user = await User.findById(req.user?._id).populate("grupos.groupId");
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    res.json({
      success: true,
      data: user.toJSON(), // Use toJSON to remove sensitive fields (password is already excluded by schema select: false)
    });
  } catch (error: any) {
    console.error("Get Profile Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error fetching profile" });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const validatedData = ForgotPasswordSchema.parse(req.body);
    const { email } = validatedData;

    const user = await User.findOne({ email });

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
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token expiry (e.g., 1 hour from now)
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour in ms

    // Create a new Token document
    await Token.create({
      userId: user._id,
      token: hashedToken,
      type: "passwordReset",
      expiresAt,
    });

    try {
      await sendPasswordResetEmail(user.email, resetToken);
      res.status(200).json({
        success: true,
        message:
          "If an account with this email exists, a password reset link has been sent.",
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // If email fails, consider deleting the token to prevent unusable tokens.
      // For now, we'll just log and send a generic message.
      res.status(200).json({
        success: true,
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
    res.status(200).json({
      success: true,
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

    // Find the token in the Token collection
    const resetTokenDoc = await Token.findOne({
      token: hashedToken,
      type: "passwordReset",
      expiresAt: { $gt: Date.now() }, // Check if token is not expired
    });

    if (!resetTokenDoc) {
      res.status(400).json({
        success: false,
        error:
          "Invalid or expired password reset token. Please try resetting your password again.",
      });
      return;
    }

    // Find the user associated with the token
    const user = await User.findById(resetTokenDoc.userId).select("+password"); // Select password to ensure pre-save hook works

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found for this token.",
      });
      return;
    }

    // Set new password (it will be hashed by the pre-save hook in User model)
    user.password = validatedData.password;
    await user.save();

    // Invalidate the used token by deleting it from the Token collection
    await Token.deleteOne({ _id: resetTokenDoc._id });

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
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
  req: AuthenticatedRequest, // Assuming logout might be an authenticated route
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { refreshToken } = req.body; // Expect refresh token from client

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: "Refresh token is required.",
      });
      return;
    }

    const hashedRefreshToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // Attempt to delete the token
    // We include userId in the query if available from an authenticated session
    // to ensure users can only delete their own tokens.
    // If req.user is not available (e.g. logout is not an authenticated route),
    // then we might omit it, but it's less secure as anyone with a valid refresh token could invalidate it.
    // For now, let's assume req.user might be present.
    const deleteQuery: any = {
      token: hashedRefreshToken,
      type: "sessionRefreshToken",
    };
    if (req.user?._id) {
      deleteQuery.userId = req.user._id;
    }

    const result = await Token.deleteOne(deleteQuery);

    if (result.deletedCount === 0) {
      // This could mean the token was already invalid, expired, or doesn't belong to the user (if userId was in query)
      // For simplicity, we'll still return a success, as the client's goal (being logged out) is achieved.
      // Alternatively, you could return a 404 or specific message if token not found.
      console.warn(
        `Refresh token not found or already invalidated during logout: ${refreshToken.substring(
          0,
          10
        )}...`
      );
    }

    res.status(200).json({
      success: true,
      message: "Logout successful. Token invalidated if it existed.",
    });
  } catch (error: any) {
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during logout",
    });
  }
};

// Add this function to server/src/controllers/authController.ts
// Ensure imports for crypto, jwt, Token, ms, Request, Response, ApiResponse are present.

export const refreshToken = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  const { token: providedRefreshToken } = req.body; // Assuming client sends { "token": "refreshTokenValue" }

  if (!providedRefreshToken) {
    res
      .status(401)
      .json({ success: false, error: "Refresh token not provided" });
    return;
  }

  try {
    const hashedProvidedRefreshToken = crypto
      .createHash("sha256")
      .update(providedRefreshToken)
      .digest("hex");

    // Find the token, ensure it's a sessionRefreshToken and not expired
    const tokenDoc = await Token.findOne({
      token: hashedProvidedRefreshToken,
      type: "sessionRefreshToken",
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc || !tokenDoc.userId) {
      // If tokenDoc is null or userId is somehow missing (should not happen for sessionRefreshTokens)
      res
        .status(403)
        .json({ success: false, error: "Invalid or expired refresh token." });
      return;
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: tokenDoc.userId },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m" }
    );

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
      message: "Access token refreshed successfully",
    });
  } catch (error: any) {
    console.error("Refresh Token Error:", error);
    // Check if error is ZodError if you parse req.body with Zod, though not shown here for simplicity
    res
      .status(500)
      .json({ success: false, error: "Server error during token refresh" });
  }
};
export const getUserGroups = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).populate("grupos.groupId");
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    res.json({
      success: true,
      data: user.grupos.map((group) => ({
        groupId: group.groupId._id,
        displayName: group.displayName,
      })),
    });
  } catch (error: any) {
    console.error("Get User Groups Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching user groups",
    });
  }
};
