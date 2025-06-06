import { Schema, model, Document, Types } from "mongoose";

export interface ITransaction extends Document {
  grupoId: Types.ObjectId;
  criadoPor: Types.ObjectId;
  criadoPorNome: string;
  data: Date;
  categoria: "renda" | "despesa" | "conta" | "poupanca";
  tipo: string;
  valor: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
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
    data: {
      type: Date,
      required: true,
    },
    categoria: {
      type: String,
      enum: ["renda", "despesa", "conta", "poupanca"],
      required: true,
    },
    tipo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    valor: {
      type: Number,
      required: true,
      min: 0.01,
    },
    description: {
      type: String,
      maxlength: 140,
      trim: true,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
