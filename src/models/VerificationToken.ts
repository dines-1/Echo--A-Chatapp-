import mongoose, { Schema, Document } from "mongoose";

export type TokenPurpose = "email-verification" | "password-reset";

export interface IVerificationToken extends Document {
  userId: mongoose.Types.ObjectId;
  otp: string;
  purpose: TokenPurpose;
  expiresAt: Date;
  createdAt: Date;
}

const VerificationTokenSchema = new Schema<IVerificationToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    otp: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["email-verification", "password-reset"],
      required: true,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

VerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const VerificationToken =
  mongoose.models.VerificationToken ||
  mongoose.model<IVerificationToken>("VerificationToken", VerificationTokenSchema);

export default VerificationToken;