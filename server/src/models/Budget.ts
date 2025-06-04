import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  grupoId: mongoose.Types.ObjectId; // Reference to the Group
  dataInicio: Date;
  dataFim: Date;
  criadoPor: mongoose.Types.ObjectId; // User who created this budget
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>({
  grupoId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  dataInicio: {
    type: Date,
    required: true,
  },
  dataFim: {
    type: Date,
    required: true,
  },
  criadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model<IBudget>('Budget', budgetSchema);
