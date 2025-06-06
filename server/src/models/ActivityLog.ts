import { Schema, model, Document, Types } from "mongoose";

export interface IActivityLog extends Document {
  grupoId: Types.ObjectId;
  criadoPor: Types.ObjectId;
  criadoPorNome: string;
  actionType: string;
  description: string;
  details?: Record<string, any>; // Allow flexible details object
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    grupoId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    criadoPor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    criadoPorNome: {
      type: String,
      required: true,
    },
    actionType: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    details: {
      type: Schema.Types.Mixed, // Use Mixed to allow any type of object
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const ActivityLog = model<IActivityLog>("ActivityLog", ActivityLogSchema);

export default ActivityLog;
