import { Request, Response } from "express";
import Budget from "../models/Budget";
import PlannedBudgetItem from "../models/PlannedBudgetItem";
import Group from "../models/Group";
import { AuthenticatedRequest, ApiResponse } from "../types";
import { CreateBudgetSchema } from "../schemas";
import mongoose from "mongoose"; // Import mongoose to validate ObjectId

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

    // Validate grupoId as a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(grupoId)) {
      return res.status(400).json({
        success: false,
        error: "ID do grupo inválido.",
      });
    }

    // Verify if the user is a member of the specified group
    const group = await Group.findById(grupoId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, error: "Group not found." });
    }
    // FIX: Correctly check if the user is a member of the group by accessing member.userId
    if (!group.membros.some((member) => member.userId.equals(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Você não é um membro deste grupo." });
    }

    // Check for existing budget for the same group and period
    const existingBudget = await Budget.findOne({
      grupoId,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim), // FIX: Corrected typo from dataFFim to dataFim
    });

    if (existingBudget) {
      return res.status(409).json({
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

    // --- Cloning Logic ---
    // Calculate previous month's dates
    const prevMonthStartDate = new Date(dataInicio);
    prevMonthStartDate.setMonth(prevMonthStartDate.getMonth() - 1);
    prevMonthStartDate.setDate(1); // Set to 1st of previous month

    const prevMonthEndDate = new Date(prevMonthStartDate.getFullYear(), prevMonthStartDate.getMonth() + 1, 0); // Last day of previous month

    // Find the budget for the previous month
    const previousMonthBudget = await Budget.findOne({
      grupoId,
      dataInicio: prevMonthStartDate,
      dataFim: prevMonthEndDate,
    });

    if (previousMonthBudget) {
      const previousMonthItems = await PlannedBudgetItem.find({
        budgetId: previousMonthBudget._id,
      });

      // Clone items to the new budget
      const clonedItems = previousMonthItems.map((item) => ({
        budgetId: newBudget._id,
        groupId: item.groupId,
        categoryType: item.categoryType,
        nome: item.nome,
        valorPlanejado: item.valorPlanejado,
        criadoPor: userId, // New items are created by the current user
      }));

      if (clonedItems.length > 0) {
        await PlannedBudgetItem.insertMany(clonedItems);
      }
    }
    // --- End Cloning Logic ---

    res.status(201).json({
      success: true,
      data: newBudget,
      message: "Orçamento criado com sucesso.",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
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

    // Validate budgetId as a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(budgetId)) {
      return res.status(400).json({
        success: false,
        error: "ID do orçamento inválido.",
      });
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
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para acessar este orçamento.",
      });
    }

    // Fetch planned budget items for this budget
    const plannedItems = await PlannedBudgetItem.find({
      budgetId: budget._id,
    }).lean();

    // Calculate aggregated totals for each category type
    const aggregatedTotals = plannedItems.reduce(
      (acc, item) => {
        acc[item.categoryType] =
          (acc[item.categoryType] || 0) + item.valorPlanejado;
        return acc;
      },
      { renda: 0, despesa: 0, conta: 0, poupanca: 0 }
    );

    const budgetWithTotals = {
      ...budget,
      totalRendaPlanejado: aggregatedTotals.renda,
      totalDespesaPlanejado: aggregatedTotals.despesa,
      totalContaPlanejado: aggregatedTotals.conta,
      totalPoupancaPlanejado: aggregatedTotals.poupanca,
    };

    res.status(200).json({
      success: true,
      data: budgetWithTotals, // Send the enriched budget
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

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "User not authenticated." });
    }

    // Validate groupId as a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        error: "ID do grupo inválido.",
      });
    }

    // Verify if the user is a member of the specified group
    const group = await Group.findById(groupId);

    if (!group) {
      // FIX: Changed from 403 to 404 for semantic correctness
      return res.status(404).json({
        success: false,
        error: "Grupo não encontrado.", // Updated error message
      });
    }

    const isMember = group.membros.some((member) => {
      const isCurrentMember = member.userId.equals(userId);
      return isCurrentMember;
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para acessar os orçamentos deste grupo.",
      });
    }

    const budgets = await Budget.find({ grupoId: groupId })
      .sort({ dataInicio: -1 })
      .lean();

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

    // Validate budgetId as a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(budgetId)) {
      return res.status(400).json({
        success: false,
        error: "ID do orçamento inválido.",
      });
    }

    const budget = await Budget.findById(budgetId);

    if (!budget) {
      return res
        .status(404)
        .json({ success: false, error: "Orçamento não encontrado." });
    }

    // Only the creator of the budget can delete it
    if (!budget.criadoPor.equals(userId)) {
      return res.status(403).json({
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
