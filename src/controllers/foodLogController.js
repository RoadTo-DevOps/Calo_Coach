import { FoodLog } from "../models/FoodLog.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { todayKey } from "../utils/dateUtils.js";

export const listFoodLogs = asyncHandler(async (req, res) => {
  const date = req.validated.query.date || todayKey();
  const foodLogs = await FoodLog.find({ userId: req.user._id, date }).sort({ createdAt: -1 });
  res.json({ foodLogs });
});

export const createFoodLog = asyncHandler(async (req, res) => {
  const foodLog = await FoodLog.create({ ...req.validated.body, userId: req.user._id });
  res.status(201).json({ foodLog });
});

export const updateFoodLog = asyncHandler(async (req, res) => {
  const foodLog = await FoodLog.findOneAndUpdate(
    { _id: req.validated.params.id, userId: req.user._id },
    req.validated.body,
    { new: true }
  );
  if (!foodLog) throw new AppError("Food log not found", 404);
  res.json({ foodLog });
});

export const deleteFoodLog = asyncHandler(async (req, res) => {
  const deleted = await FoodLog.findOneAndDelete({ _id: req.validated.params.id, userId: req.user._id });
  if (!deleted) throw new AppError("Food log not found", 404);
  res.status(204).end();
});
