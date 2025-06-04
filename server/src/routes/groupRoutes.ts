import { Router } from "express";
import {
  createGroup,
  getUserGroups,
  inviteMemberToGroup,
  updateGroupDisplayName,
  deleteGroup,
} from "../controllers/groupController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router
  .route("/")
  .post(authenticateToken, createGroup)
  .get(authenticateToken, getUserGroups);

router.route("/:groupId/invite").post(authenticateToken, inviteMemberToGroup);

router
  .route("/:groupId/display-name")
  .put(authenticateToken, updateGroupDisplayName);

router.route("/:groupId").delete(authenticateToken, deleteGroup);

export default router;
