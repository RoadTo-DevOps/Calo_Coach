import { UserProfile } from "../models/UserProfile.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await UserProfile.findOne({ userId: req.user._id });
  res.json({ profile });
});

export const upsertProfile = asyncHandler(async (req, res) => {
  const profile = await UserProfile.findOneAndUpdate(
    { userId: req.user._id },
    { ...req.validated.body, userId: req.user._id },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json({ profile });
});
