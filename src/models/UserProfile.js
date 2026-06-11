import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    age: { type: Number, min: 13, max: 120, required: true },
    heightCm: { type: Number, min: 80, max: 260, required: true },
    weightKg: { type: Number, min: 25, max: 350, required: true },
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "athlete"],
      default: "light"
    },
    dietPreference: { type: String, trim: true, default: "" },
    allergies: [{ type: String, trim: true }],
    medicalConditions: [{ type: String, trim: true }],
    workoutDaysPerWeek: { type: Number, min: 0, max: 7, default: 3 }
  },
  { timestamps: true }
);

export const UserProfile = mongoose.model("UserProfile", userProfileSchema);
