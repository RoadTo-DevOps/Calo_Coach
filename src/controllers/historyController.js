import { ExerciseLog } from "../models/ExerciseLog.js";
import { FoodLog } from "../models/FoodLog.js";
import { Goal } from "../models/Goal.js";
import { summarizeNutrition } from "../services/calorieService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function dailySummary(userId, date) {
  const [foodLogs, exerciseLogs, goal] = await Promise.all([
    FoodLog.find({ userId, date }),
    ExerciseLog.find({ userId, date }),
    Goal.findOne({ userId, status: "active" }).sort({ createdAt: -1 })
  ]);
  return { date, ...summarizeNutrition(foodLogs, exerciseLogs, goal) };
}

export const getDailyHistory = asyncHandler(async (req, res) => {
  const summary = await dailySummary(req.user._id, req.validated.query.date);
  res.json({ summary });
});

export const getRangeHistory = asyncHandler(async (req, res) => {
  const { start, end } = req.validated.query;
  const [foodLogs, exerciseLogs, goal] = await Promise.all([
    FoodLog.find({ userId: req.user._id, date: { $gte: start, $lte: end } }),
    ExerciseLog.find({ userId: req.user._id, date: { $gte: start, $lte: end } }),
    Goal.findOne({ userId: req.user._id, status: "active" }).sort({ createdAt: -1 })
  ]);

  const dates = [...new Set([...foodLogs.map((item) => item.date), ...exerciseLogs.map((item) => item.date)])].sort();
  const summaries = dates.map((date) => ({
    date,
    ...summarizeNutrition(
      foodLogs.filter((item) => item.date === date),
      exerciseLogs.filter((item) => item.date === date),
      goal
    )
  }));

  res.json({ summaries });
});
