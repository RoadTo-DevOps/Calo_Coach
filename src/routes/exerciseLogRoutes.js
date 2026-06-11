import { Router } from "express";
import {
  createExerciseLog,
  deleteExerciseLog,
  listExerciseLogs,
  updateExerciseLog
} from "../controllers/exerciseLogController.js";
import { validate } from "../middleware/validate.js";
import { dateQuerySchema, exerciseLogSchema, idParamSchema } from "../validation/schemas.js";

export const exerciseLogRoutes = Router();

exerciseLogRoutes.get("/", validate(dateQuerySchema), listExerciseLogs);
exerciseLogRoutes.post("/", validate(exerciseLogSchema), createExerciseLog);
exerciseLogRoutes.put("/:id", validate(idParamSchema.merge(exerciseLogSchema)), updateExerciseLog);
exerciseLogRoutes.delete("/:id", validate(idParamSchema), deleteExerciseLog);
