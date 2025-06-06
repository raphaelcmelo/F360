import { Request, Response } from "express";
import ActivityLog, { IActivityLog } from "../models/ActivityLog";
import { AuthenticatedRequest } from "../types";
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

// @desc    Get activity logs for a specific group, optionally filtered by budget
// @route   GET /api/activities/group/:groupId
// @access  Private
export const getActivitiesByGroup = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { groupId } = req.params;
    const { limit = 20, skip = 0, budgetId } = req.query;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: "ID do grupo é obrigatório.",
      });
    }

    if (
      !req.user ||
      !req.user.grupos.some((g) => g.groupId.toString() === groupId)
    ) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado a visualizar atividades deste grupo.",
      });
    }

    const query: any = {
      grupoId: new mongoose.Types.ObjectId(groupId),
    };

    // If budgetId is provided, apply a more complex filter that includes all relevant activities
    if (
      budgetId &&
      typeof budgetId === "string" &&
      mongoose.Types.ObjectId.isValid(budgetId)
    ) {
      const budgetObjectId = new mongoose.Types.ObjectId(budgetId);
      query.$and = [
        {
          $or: [
            // Always show general group activities (e.g., group created, member invited/removed)
            {
              actionType: {
                $in: [
                  "group_created",
                  "group_updated",
                  "group_deleted",
                  "member_invited",
                  "member_removed",
                ],
              },
            },
            // Always show budget creation/deletion activities
            { actionType: { $in: ["budget_created", "budget_deleted"] } },
            // Always show all transaction activities for the group (as they are part of the overall financial flow)
            {
              actionType: {
                $in: [
                  "transaction_created",
                  "transaction_updated",
                  "transaction_deleted",
                ],
              },
            },
            // Show budget item activities only if they are linked to the selected budget
            {
              actionType: {
                $in: [
                  "budget_item_created",
                  "budget_item_updated",
                  "budget_item_deleted",
                ],
              },
              "details.budgetId": budgetObjectId,
            },
          ],
        },
      ];
    }

    const activities: IActivityLog[] = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
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
