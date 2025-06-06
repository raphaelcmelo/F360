import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/database";

// Import routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import budgetRoutes from "./routes/budgetRoutes";
import groupRoutes from "./routes/groupRoutes";
import budgetItemRoutes from "./routes/budgetItemRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import activityLogRoutes from "./routes/activityLogRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 300, // limit each IP to 300 requests per windowMs (temporary increase)
//   message: "Too many requests from this IP, please try again after 15 minutes",
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(limiter);

// General API rate limiter (will apply to all routes if not overridden by more specific limiters in routers)
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: "Too many general API requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalApiLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/budget-items", budgetItemRoutes);
app.use("/api/transactions", transactionRoutes); // Use transaction routes
app.use("/api/activities", activityLogRoutes); // Use activity log routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Global error handler
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
