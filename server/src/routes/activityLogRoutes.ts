import { Router } from "express";
import { getActivitiesByGroup } from "../controllers/activityLogController";
import { authenticateToken } from "../middleware/auth"; // Corrigido: Caminho e nome da função

const router = Router();

// Protect all activity log routes
router.use(authenticateToken); // Corrigido: Usar authenticateToken

router.get("/group/:groupId", getActivitiesByGroup);

export default router;
