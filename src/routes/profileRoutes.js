import { Router } from "express";
import { getProfile, upsertProfile } from "../controllers/profileController.js";
import { validate } from "../middleware/validate.js";
import { profileSchema } from "../validation/schemas.js";

export const profileRoutes = Router();

profileRoutes.get("/", getProfile);
profileRoutes.put("/", validate(profileSchema), upsertProfile);
