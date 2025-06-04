import { Request, Response } from 'express';
import Group from '../models/Group';
import User from '../models/User';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { CreateGroupSchema, InviteMemberSchema } from '../schemas'; // Assuming you'll create these schemas

// Create a new group
export const createGroup = async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    const validatedData = CreateGroupSchema.parse(req.body);
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated.' });
    }

    const newGroup = await Group.create({
      nome: validatedData.nome,
      membros: [userId], // Creator is automatically a member
      criadoPor: userId,
    });

    // Add the new group to the creator's list of groups
    await User.findByIdAndUpdate(userId, { $push: { grupos: newGroup._id } });

    res.status(201).json({
      success: true,
      data: newGroup,
      message: 'Group created successfully.'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    console.error('Error creating group:', error);
    res.status(500).json({ success: false, error: 'Server error creating group.' });
  }
};

// Get all groups a user is a member of
export const getUserGroups = async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated.' });
    }

    // Find groups where the user is a member
    const groups = await Group.find({ membros: userId }).populate('membros', 'name email'); // Populate members to show their names/emails

    res.status(200).json({
      success: true,
      data: groups,
      message: 'User groups fetched successfully.'
    });
  } catch (error: any) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ success: false, error: 'Server error fetching groups.' });
  }
};

// Invite a member to an existing group
export const inviteMemberToGroup = async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    const { groupId } = req.params;
    const validatedData = InviteMemberSchema.parse(req.body);
    const { email } = validatedData;
    const inviterId = req.user?._id;

    if (!inviterId) {
      return res.status(401).json({ success: false, error: 'User not authenticated.' });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found.' });
    }

    // Check if the inviter is a member of the group
    if (!group.membros.includes(inviterId)) {
      return res.status(403).json({ success: false, error: 'You are not authorized to invite members to this group.' });
    }

    const invitedUser = await User.findOne({ email });

    if (!invitedUser) {
      return res.status(404).json({ success: false, error: 'User with this email not found.' });
    }

    // Check if the user is already a member of the group
    if (group.membros.includes(invitedUser._id)) {
      return res.status(400).json({ success: false, error: 'User is already a member of this group.' });
    }

    // Add user to group's members
    group.membros.push(invitedUser._id);
    await group.save();

    // Add group to user's groups
    invitedUser.grupos.push(group._id);
    await invitedUser.save();

    res.status(200).json({
      success: true,
      message: `${invitedUser.name} has been added to the group ${group.nome}.`
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    console.error('Error inviting member:', error);
    res.status(500).json({ success: false, error: 'Server error inviting member.' });
  }
};
