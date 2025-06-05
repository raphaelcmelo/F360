import { Request, Response } from "express";
import Group from "../models/Group";
import User from "../models/User";
import Token from "../models/Token";
import { CustomRequest } from "../middleware/authMiddleware";
import { z } from "zod";
import crypto from "crypto";
import { AcceptGroupInvitationSchema } from "../schemas";

// @desc    Accept a group invitation for a registered user
// @route   POST /api/groups/accept-invite
// @access  Private (requires authentication)
export const acceptGroupInvitation = async (req: CustomRequest, res: Response) => {
  try {
    const validatedData = AcceptGroupInvitationSchema.parse(req.body);
    const { groupId, token } = validatedData;

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, error: "Usuário não autenticado." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const invitationTokenDoc = await Token.findOne({
      token: hashedToken,
      type: "groupInvitation",
      groupId: groupId,
      userId: req.user.id, // Ensure the token is for the authenticated user
      expiresAt: { $gt: Date.now() },
    });

    if (!invitationTokenDoc) {
      return res.status(400).json({
        success: false,
        error: "Convite inválido ou expirado.",
      });
    }

    const user = await User.findById(req.user.id);
    const group = await Group.findById(groupId);

    if (!user || !group) {
      return res.status(404).json({
        success: false,
        error: "Usuário ou grupo não encontrado.",
      });
    }

    // Check if user is already a member
    const isAlreadyMember = group.membros.some((member) =>
      member.userId.equals(user._id)
    );

    if (isAlreadyMember) {
      await Token.deleteOne({ _id: invitationTokenDoc._id }); // Clean up token
      return res.status(400).json({
        success: false,
        message: "Você já é membro deste grupo.",
      });
    }

    // Add user to group's members
    group.membros.push({ userId: user._id, role: "member" });
    await group.save();

    // Add group to user's groups
    user.grupos.push({ groupId: group._id, displayName: group.nome });
    await user.save();

    await Token.deleteOne({ _id: invitationTokenDoc._id }); // Invalidate the token

    res.status(200).json({
      success: true,
      message: `Você aceitou o convite e agora é membro do grupo "${group.nome}"!`,
      data: { group, user },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors,
        message: "Dados de convite inválidos.",
      });
    }
    console.error("Error accepting group invitation:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao aceitar o convite do grupo.",
    });
  }
};
