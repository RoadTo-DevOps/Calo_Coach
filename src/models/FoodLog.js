import mongoose from "mongoose";

const foodLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true },
    mealType: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"], required: true },
    foodName: { type: String, required: true, trim: true, maxlength: 160 },
    quantity: { type: String, required: true, trim: true, maxlength: 80 },
    calories: { type: Number, min: 0, required: true },
    protein: { type: Number, min: 0, default: 0 },
    carbs: { type: Number, min: 0, default: 0 },
    fat: { type: Number, min: 0, default: 0 },
    estimatedByAi: { type: Boolean, default: false },
    aiConfidence: { type: String, enum: ["low", "medium", "high", ""], default: "" },
    aiNote: { type: String, maxlength: 500, default: "" }
  },
  { timestamps: true }
);

foodLogSchema.index({ userId: 1, date: 1, createdAt: -1 });

export const FoodLog = mongoose.model("FoodLog", foodLogSchema);
