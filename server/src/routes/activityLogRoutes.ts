import { Router } from "express";
import { getActivitiesByGroup } from "../controllers/activityLogController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Protect all activity log routes
router.use(authenticateToken);

router.get("/group/:groupId", getActivitiesByGroup);

export default router;
