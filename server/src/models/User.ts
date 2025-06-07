import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  isActive: boolean;
  grupos: { groupId: mongoose.Types.ObjectId; displayName: string }[];
  preferredStartDayOfMonth?: number; // New field for preferred start day
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false }, // Password is required and not selected by default
    isActive: { type: Boolean, default: true }, // Default to true
    grupos: [
      {
        groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
        displayName: { type: String, required: true, trim: true },
      },
    ],
    preferredStartDayOfMonth: {
      type: Number,
      default: 1, // Default to 1st day of the month
      min: 1,
      max: 30, // Allow days 1 to 30
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  if (this.password) {
    // Ensure password exists before hashing
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) {
    return false; // No stored password to compare against
  }
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("User", userSchema);
