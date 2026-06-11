import mongoose from "mongoose";

const weightLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true },
    weightKg: { type: Number, min: 25, max: 350, required: true }
  },
  { timestamps: true }
);

weightLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const WeightLog = mongoose.model("WeightLog", weightLogSchema);
