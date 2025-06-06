import express, { Router } from "express";
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
router.post("/login", login);
router.post('/logout', authenticateToken, logout);
router.post('/refresh-token', refreshToken); // Add the new route

// New /me route to get user profile using token
router.get("/me", authenticateToken, getProfile);

// Password recovery routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Logout route
// router.post("/logout", authenticateToken, logout); // Commented out as it's added above

export default router;
