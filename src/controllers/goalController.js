import { Goal } from "../models/Goal.js";
import { UserProfile } from "../models/UserProfile.js";
import {
  buildGoalOptions,
  calculateTargetsFromCustomCalories,
  calculateTargetsFromOption,
  minimumSafeCalories
} from "../services/calorieService.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { todayKey } from "../utils/dateUtils.js";

export const getCurrentGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ userId: req.user._id, status: "active" }).sort({ createdAt: -1 });
  res.json({ goal });
});

export const createGoal = asyncHandler(async (req, res) => {
  const profile = await UserProfile.findOne({ userId: req.user._id });
  if (!profile) {
    throw new AppError("Create a health profile before setting goals", 400);
  }

  const targets =
    req.validated.body.intensity === "custom"
      ? calculateTargetsFromCustomCalories(profile, req.validated.body.type, req.validated.body.customCalories)
      : calculateTargetsFromOption(
          profile,
          req.validated.body.type,
          req.validated.body.intensity,
          req.validated.body.targetWeightKg
        );

  if (targets.error) {
    throw new AppError(targets.error, 400, { minCalories: targets.minCalories });
  }

  await Goal.updateMany({ userId: req.user._id, status: "active" }, { status: "paused" });
  const goal = await Goal.create({
    userId: req.user._id,
    type: req.validated.body.type,
    targetWeightKg: req.validated.body.targetWeightKg,
    targetDate: req.validated.body.targetDate,
    startDate: todayKey(),
    status: req.validated.body.status || "active",
    ...targets
  });

  res.status(201).json({ goal });
});

export const getGoalOptions = asyncHandler(async (req, res) => {
  const profile = await UserProfile.findOne({ userId: req.user._id });
  if (!profile) {
    throw new AppError("Create a health profile before setting goals", 400);
  }

  const { type, targetWeightKg } = req.validated.body;
  const options = buildGoalOptions(profile, type, targetWeightKg);
  const targetWeightApplied = options.some((option) => option.estimatedWeeks);
  res.json({
    currentWeightKg: profile.weightKg,
    targetWeightKg: targetWeightKg || null,
    targetWeightApplied,
    minCalories: minimumSafeCalories(profile),
    direction:
      targetWeightKg && targetWeightKg < profile.weightKg
        ? "lose"
        : targetWeightKg && targetWeightKg > profile.weightKg
          ? "gain"
          : "maintain",
    options
  });
});

export const updateGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndUpdate(
    { _id: req.validated.params.id, userId: req.user._id },
    req.validated.body,
    { new: true }
  );
  if (!goal) {
    throw new AppError("Goal not found", 404);
  }
  res.json({ goal });
});
