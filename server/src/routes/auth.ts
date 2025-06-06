import express, { Router } from "express";
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  getProfile, // Keep getProfile for the /me route
  forgotPassword,
  resetPassword,
  logout,
  refreshToken, // Import the new controller
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router: Router = express.Router();

router.post("/register", register);

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 login attempts per 5 minutes
  message: {
    success: false,
    error: "Too many login attempts from this IP, please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
router.post('/login', loginLimiter, login); // Apply limiter to the login route

router.post('/logout', authenticateToken, logout);

const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 refresh token attempts per 15 minutes
  message: {
    success: false,
    error: "Too many refresh token attempts from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
router.post('/refresh-token', refreshTokenLimiter, refreshToken); // Apply limiter

// New /me route to get user profile using token
router.get("/me", authenticateToken, getProfile);

// Password recovery routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Logout route
// router.post("/logout", authenticateToken, logout); // Commented out as it's added above

export default router;
