import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  grupos: { groupId: mongoose.Types.ObjectId; displayName: string }[]; // Updated to store groupId and displayName
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: false },
  grupos: [{ // Updated to store groupId and displayName
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    displayName: { type: String, required: true, trim: true }
  }]
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', userSchema);
