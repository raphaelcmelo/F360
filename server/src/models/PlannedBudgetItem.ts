import mongoose, { Schema, Document } from 'mongoose';

export interface IPlannedBudgetItem extends Document {
  budgetId: mongoose.Types.ObjectId; // Reference to the Budget document
  groupId: mongoose.Types.ObjectId; // Reference to the Group (for direct queries)
  categoryType: 'renda' | 'despesa' | 'conta' | 'poupanca';
  nome: string; // Description of the item (e.g., "Salário", "Aluguel")
  valorPlanejado: number;
  criadoPor: mongoose.Types.ObjectId; // User who created this specific item
  createdAt: Date;
  updatedAt: Date;
}

const plannedBudgetItemSchema = new Schema<IPlannedBudgetItem>({
  budgetId: {
    type: Schema.Types.ObjectId,
    ref: 'Budget',
    required: true,
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  categoryType: {
    type: String,
    enum: ['renda', 'despesa', 'conta', 'poupanca'],
    required: true,
  },
  nome: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200,
  },
  valorPlanejado: {
    type: Number,
    required: true,
    min: 0, // Planned values should generally be non-negative
  },
  criadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model<IPlannedBudgetItem>('PlannedBudgetItem', plannedBudgetItemSchema);
