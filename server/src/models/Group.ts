import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
  nome: string;
  membros: {
    userId: mongoose.Types.ObjectId;
    role: "member" | "admin" | "owner";
  }[]; // Array de objetos com userId e role
  criadoPor: mongoose.Types.ObjectId; // ID do usuário que criou o grupo
  orcamentos: mongoose.Types.ObjectId[]; // Array de IDs de orçamentos vinculados
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    membros: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["member", "admin", "owner"], // Define roles explicitly
          default: "member",
          required: true,
        },
      },
    ],
    criadoPor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orcamentos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Budget", // Assuming you have a Budget model
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IGroup>("Group", groupSchema);
