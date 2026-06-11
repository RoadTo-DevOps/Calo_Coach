import { ExerciseLog } from "../models/ExerciseLog.js";
import { FoodLog } from "../models/FoodLog.js";
import { Goal } from "../models/Goal.js";
import { summarizeNutrition } from "../services/calorieService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { todayKey } from "../utils/dateUtils.js";

async function buildDashboard(userId, date) {
  const [foodLogs, exerciseLogs, goal] = await Promise.all([
    FoodLog.find({ userId, date }).sort({ createdAt: -1 }),
    ExerciseLog.find({ userId, date }).sort({ createdAt: -1 }),
    Goal.findOne({ userId, status: "active" }).sort({ createdAt: -1 })
  ]);
  return {
    date,
    goal,
    foodLogs,
    exerciseLogs,
    summary: summarizeNutrition(foodLogs, exerciseLogs, goal)
  };
}

export const todayDashboard = asyncHandler(async (req, res) => {
  res.json(await buildDashboard(req.user._id, todayKey()));
});

export const dashboardByDate = asyncHandler(async (req, res) => {
  res.json(await buildDashboard(req.user._id, req.validated.query.date || todayKey()));
});
