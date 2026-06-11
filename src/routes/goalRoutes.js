import { Router } from "express";
import { createGoal, getCurrentGoal, getGoalOptions, updateGoal } from "../controllers/goalController.js";
import { validate } from "../middleware/validate.js";
import { goalOptionsSchema, goalSchema, goalUpdateSchema } from "../validation/schemas.js";

export const goalRoutes = Router();

goalRoutes.get("/current", getCurrentGoal);
goalRoutes.post("/options", validate(goalOptionsSchema), getGoalOptions);
goalRoutes.post("/", validate(goalSchema), createGoal);
goalRoutes.put("/:id", validate(goalUpdateSchema), updateGoal);
