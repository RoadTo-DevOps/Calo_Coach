import { Router } from "express";
import {
  estimateExerciseController,
  estimateFoodController,
  healthChatController,
  mealSuggestions,
  workoutSuggestions
} from "../controllers/aiController.js";
import { validate } from "../middleware/validate.js";
import { estimateExerciseSchema, estimateFoodSchema, healthChatSchema } from "../validation/schemas.js";

export const aiRoutes = Router();

aiRoutes.post("/estimate-food", validate(estimateFoodSchema), estimateFoodController);
aiRoutes.post("/estimate-exercise", validate(estimateExerciseSchema), estimateExerciseController);
aiRoutes.post("/meal-suggestions", mealSuggestions);
aiRoutes.post("/workout-suggestions", workoutSuggestions);
aiRoutes.post("/health-chat", validate(healthChatSchema), healthChatController);
