import mongoose from "mongoose";

const exerciseLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true },
    exerciseName: { type: String, required: true, trim: true, maxlength: 160 },
    durationMinutes: { type: Number, min: 1, max: 1440, required: true },
    intensity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    caloriesBurned: { type: Number, min: 0, required: true },
    estimatedByAi: { type: Boolean, default: false },
    aiConfidence: { type: String, enum: ["low", "medium", "high", ""], default: "" },
    aiNote: { type: String, maxlength: 500, default: "" }
  },
  { timestamps: true }
);

exerciseLogSchema.index({ userId: 1, date: 1, createdAt: -1 });

export const ExerciseLog = mongoose.model("ExerciseLog", exerciseLogSchema);
