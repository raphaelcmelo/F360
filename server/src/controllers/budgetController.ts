import { Request, Response } from "express";
import Budget from "../models/Budget";
import PlannedBudgetItem from "../models/PlannedBudgetItem";
import Group from "../models/Group";
import { AuthenticatedRequest, ApiResponse } from "../types";
import { CreateBudgetSchema } from "../schemas";

// Create a new budget for a specific group
export const createBudget = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
) => {
  try {
    const validatedData = CreateBudgetSchema.parse(req.body);
    const userId = req.user?._id;
    const { grupoId, dataInicio, dataFim } = validatedData;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "User not authenticated." });
    }

    // Verify if the user is a member of the specified group
    const group = await Group.findById(grupoId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, error: "Group not found." });
    }
    if (!group.membros.some((memberId) => memberId.equals(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "You are not a member of this group." });
    }

    // Check for existing budget for the same group and period
    const existingBudget = await Budget.findOne({
      grupoId,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
    });

    if (existingBudget) {
      return res
        .status(409)
        .json({
          success: false,
          error: "Um orçamento para este grupo e período já existe.",
        });
    }

    const newBudget = await Budget.create({
      grupoId,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
      criadoPor: userId,
    });

    // Optionally, link the budget to the group (if not already done via grupoId)
    // group.orcamentos.push(newBudget._id);
    // await group.save();

    res.status(201).json({
      success: true,
      data: newBudget,
      message: "Orçamento criado com sucesso.",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res
        .status(400)
        .json({
          success: false,
          error: "Validation error",
          details: error.errors,
        });
    }
    console.error("Error creating budget:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error creating budget." });
  }
};

// Get a specific budget by ID
export const getBudgetById = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
) => {
  try {
    const { budgetId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "User not authenticated." });
    }

    const budget = await Budget.findById(budgetId).lean();

    if (!budget) {
      return res
        .status(404)
        .json({ success: false, error: "Orçamento não encontrado." });
    }

    // Verify if the user is a member of the group associated with this budget
    const group = await Group.findById(budget.grupoId);
    if (!group || !group.membros.some((memberId) => memberId.equals(userId))) {
      return res
        .status(403)
        .json({
          success: false,
          error: "Você não tem permissão para acessar este orçamento.",
        });
    }

    res.status(200).json({
      success: true,
      data: budget,
      message: "Orçamento encontrado com sucesso.",
    });
  } catch (error: any) {
    console.error("Error fetching budget:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error fetching budget." });
  }
};

// Get all budgets for a specific group
export const getGroupBudgets = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?._id;

    console.log("DEBUG: getGroupBudgets - Received groupId:", groupId);
    console.log("DEBUG: getGroupBudgets - Authenticated userId:", userId);

    if (!userId) {
      console.log(
        "DEBUG: getGroupBudgets - User not authenticated, returning 401."
      );
      return res
        .status(401)
        .json({ success: false, error: "User not authenticated." });
    }

    // Verify if the user is a member of the specified group
    const group = await Group.findById(groupId);
    console.log(
      "DEBUG: getGroupBudgets - Found group:",
      group ? group.nome : "None"
    );

    if (!group) {
      console.log("DEBUG: getGroupBudgets - Group not found, returning 403.");
      return res
        .status(403)
        .json({
          success: false,
          error:
            "Você não tem permissão para acessar os orçamentos deste grupo.",
        });
    }

    const isMember = group.membros.some((memberId) => memberId.equals(userId));
    console.log(
      "DEBUG: getGroupBudgets - Group members:",
      group.membros.map((m) => m.toString())
    );
    console.log(
      "DEBUG: getGroupBudgets - Is user a member of this group?",
      isMember
    );

    if (!isMember) {
      console.log(
        "DEBUG: getGroupBudgets - User is not a member, returning 403."
      );
      return res
        .status(403)
        .json({
          success: false,
          error:
            "Você não tem permissão para acessar os orçamentos deste grupo.",
        });
    }

    const budgets = await Budget.find({ grupoId: groupId })
      .sort({ dataInicio: -1 })
      .lean();
    console.log("DEBUG: getGroupBudgets - Budgets found:", budgets.length);

    res.status(200).json({
      success: true,
      data: budgets,
      message: "Orçamentos do grupo encontrados com sucesso.",
    });
  } catch (error: any) {
    console.error("Error fetching group budgets:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error fetching group budgets." });
  }
};

// Delete a budget
export const deleteBudget = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
) => {
  try {
    const { budgetId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "User not authenticated." });
    }

    const budget = await Budget.findById(budgetId);

    if (!budget) {
      return res
        .status(404)
        .json({ success: false, error: "Orçamento não encontrado." });
    }

    // Only the creator of the budget can delete it
    if (!budget.criadoPor.equals(userId)) {
      return res
        .status(403)
        .json({
          success: false,
          error: "Você não tem permissão para deletar este orçamento.",
        });
    }

    // Delete all planned budget items associated with this budget
    await PlannedBudgetItem.deleteMany({ budgetId: budget._id });

    // Delete the budget document
    await Budget.deleteOne({ _id: budgetId });

    res.status(200).json({
      success: true,
      message: "Orçamento e seus itens planejados deletados com sucesso.",
    });
  } catch (error: any) {
    console.error("Error deleting budget:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error deleting budget." });
  }
};
