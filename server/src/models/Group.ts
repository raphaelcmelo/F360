import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  nome: string;
  membros: mongoose.Types.ObjectId[]; // Array de IDs de usuários
  criadoPor: mongoose.Types.ObjectId; // ID do usuário que criou o grupo
  orcamentos: mongoose.Types.ObjectId[]; // Array de IDs de orçamentos vinculados
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>({
  nome: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  membros: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  criadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orcamentos: [{
    type: Schema.Types.ObjectId,
    ref: 'Budget' // Assuming you have a Budget model
  }]
}, {
  timestamps: true
});

export default mongoose.model<IGroup>('Group', groupSchema);
