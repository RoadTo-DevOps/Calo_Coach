import { Router } from "express";
import { createFoodLog, deleteFoodLog, listFoodLogs, updateFoodLog } from "../controllers/foodLogController.js";
import { validate } from "../middleware/validate.js";
import { dateQuerySchema, foodLogSchema, idParamSchema } from "../validation/schemas.js";

export const foodLogRoutes = Router();

foodLogRoutes.get("/", validate(dateQuerySchema), listFoodLogs);
foodLogRoutes.post("/", validate(foodLogSchema), createFoodLog);
foodLogRoutes.put("/:id", validate(idParamSchema.merge(foodLogSchema)), updateFoodLog);
foodLogRoutes.delete("/:id", validate(idParamSchema), deleteFoodLog);
