import { Router } from "express";
import { getActivitiesByGroup } from "../controllers/activityLogController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// Protect all activity log routes
router.use(protect);

router.get("/group/:groupId", getActivitiesByGroup);

export default router;
