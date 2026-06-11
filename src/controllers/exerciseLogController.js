import { ExerciseLog } from "../models/ExerciseLog.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { todayKey } from "../utils/dateUtils.js";

export const listExerciseLogs = asyncHandler(async (req, res) => {
  const date = req.validated.query.date || todayKey();
  const exerciseLogs = await ExerciseLog.find({ userId: req.user._id, date }).sort({ createdAt: -1 });
  res.json({ exerciseLogs });
});

export const createExerciseLog = asyncHandler(async (req, res) => {
  const exerciseLog = await ExerciseLog.create({ ...req.validated.body, userId: req.user._id });
  res.status(201).json({ exerciseLog });
});

export const updateExerciseLog = asyncHandler(async (req, res) => {
  const exerciseLog = await ExerciseLog.findOneAndUpdate(
    { _id: req.validated.params.id, userId: req.user._id },
    req.validated.body,
    { new: true }
  );
  if (!exerciseLog) throw new AppError("Exercise log not found", 404);
  res.json({ exerciseLog });
});

export const deleteExerciseLog = asyncHandler(async (req, res) => {
  const deleted = await ExerciseLog.findOneAndDelete({ _id: req.validated.params.id, userId: req.user._id });
  if (!deleted) throw new AppError("Exercise log not found", 404);
  res.status(204).end();
});
