import express from 'express';
import { createGroup, getUserGroups, inviteMemberToGroup, updateGroupDisplayName } from '../controllers/groupController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, createGroup);
router.get('/', protect, getUserGroups);
router.post('/:groupId/invite', protect, inviteMemberToGroup);
router.put('/:groupId/display-name', protect, updateGroupDisplayName); // New route

export default router;
