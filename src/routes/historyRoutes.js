import { Router } from "express";
import { getDailyHistory, getRangeHistory } from "../controllers/historyController.js";
import { validate } from "../middleware/validate.js";
import { rangeQuerySchema, requiredDateQuerySchema } from "../validation/schemas.js";

export const historyRoutes = Router();

historyRoutes.get("/daily", validate(requiredDateQuerySchema), getDailyHistory);
historyRoutes.get("/range", validate(rangeQuerySchema), getRangeHistory);
