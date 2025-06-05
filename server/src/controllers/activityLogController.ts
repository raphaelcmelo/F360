import { Request, Response } from "express";
import ActivityLog, { IActivityLog } from "../models/ActivityLog";
import { CustomRequest } from "../middleware/authMiddleware";
import mongoose from "mongoose";

/**
 * Helper function to create an activity log entry.
 * This function is called internally by other controllers.
 */
export const createActivityLog = async (
  grupoId: mongoose.Types.ObjectId,
  criadoPor: mongoose.Types.ObjectId,
  criadoPorNome: string,
  actionType: string,
  description: string,
  details?: Record<string, any>
) => {
  try {
    const newLog: IActivityLog = await ActivityLog.create({
      grupoId,
      criadoPor,
      criadoPorNome,
      actionType,
      description,
      details,
    });
  } catch (error) {
    console.error("Error creating activity log:", error);
    // In a real application, you might want to log this error more robustly
  }
};

// @desc    Get activity logs for a specific group
// @route   GET /api/activities/group/:groupId
// @access  Private
export const getActivitiesByGroup = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { groupId } = req.params;
    const { limit = 20, skip = 0 } = req.query; // Pagination options

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: "ID do grupo é obrigatório.",
      });
    }

    // Ensure the user is part of the group before fetching activities
    // This check assumes req.user.grupos contains the groups the user is a member of
    if (
      !req.user ||
      !req.user.grupos.some((g) => g.groupId.toString() === groupId)
    ) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado a visualizar atividades deste grupo.",
      });
    }

    const activities: IActivityLog[] = await ActivityLog.find({
      grupoId: groupId,
    })
      .sort({ createdAt: -1 }) // Sort by most recent first
      .limit(parseInt(limit as string))
      .skip(parseInt(skip as string));

    res.status(200).json({
      success: true,
      data: activities,
      message: "Atividades recuperadas com sucesso.",
    });
  } catch (error: any) {
    console.error("Error fetching activity logs by group:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao buscar atividades.",
    });
  }
};
