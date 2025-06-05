import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  grupoId: mongoose.Types.ObjectId;
  criadoPor: mongoose.Types.ObjectId;
  criadoPorNome: string;
  actionType: string; // e.g., 'transaction_created', 'budget_item_updated', 'member_invited'
  description: string; // Human-readable description
  details?: Record<string, any>; // Optional: JSON for specific details (oldValue, newValue, itemId, etc.)
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    grupoId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    criadoPor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    criadoPorNome: { type: String, required: true },
    actionType: { type: String, required: true },
    description: { type: String, required: true },
    details: { type: Schema.Types.Mixed }, // Flexible field for additional data
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

export default mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
