import { ExerciseLog } from "../models/ExerciseLog.js";
import { FoodLog } from "../models/FoodLog.js";
import { Goal } from "../models/Goal.js";
import { UserProfile } from "../models/UserProfile.js";
import { estimateExercise, estimateFood, healthChat, suggestMeals, suggestWorkouts } from "../services/aiService.js";
import { summarizeNutrition } from "../services/calorieService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { todayKey } from "../utils/dateUtils.js";

async function userContext(userId) {
  const date = todayKey();
  const [profile, goal, foodLogs, exerciseLogs] = await Promise.all([
    UserProfile.findOne({ userId }),
    Goal.findOne({ userId, status: "active" }).sort({ createdAt: -1 }),
    FoodLog.find({ userId, date }),
    ExerciseLog.find({ userId, date })
  ]);
  return {
    date,
    profile,
    goal,
    foodLogs,
    exerciseLogs,
    ...summarizeNutrition(foodLogs, exerciseLogs, goal)
  };
}

export const estimateFoodController = asyncHandler(async (req, res) => {
  res.json({ estimate: await estimateFood(req.validated.body.text) });
});

export const estimateExerciseController = asyncHandler(async (req, res) => {
  const context = await userContext(req.user._id);
  const estimate = await estimateExercise({
    ...req.validated.body,
    weightKg: context.profile?.weightKg || 70
  });
  res.json({ estimate });
});

export const mealSuggestions = asyncHandler(async (req, res) => {
  res.json(await suggestMeals(await userContext(req.user._id)));
});

export const workoutSuggestions = asyncHandler(async (req, res) => {
  res.json(await suggestWorkouts(await userContext(req.user._id)));
});

export const healthChatController = asyncHandler(async (req, res) => {
  res.json(await healthChat(await userContext(req.user._id), req.validated.body.messages));
});
