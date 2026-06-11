import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["lose_weight", "gain_weight", "maintain", "gain_muscle", "endurance", "healthy_eating"],
      required: true
    },
    targetCalories: { type: Number, min: 800, required: true },
    targetProtein: { type: Number, min: 0, required: true },
    targetCarbs: { type: Number, min: 0, required: true },
    targetFat: { type: Number, min: 0, required: true },
    targetWeightKg: { type: Number, min: 25, max: 350 },
    startDate: { type: String, required: true },
    targetDate: { type: String },
    status: { type: String, enum: ["active", "paused", "completed"], default: "active", index: true }
  },
  { timestamps: true }
);

goalSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const Goal = mongoose.model("Goal", goalSchema);
