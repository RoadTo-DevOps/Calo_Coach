import { Router } from "express";
import { dashboardByDate, todayDashboard } from "../controllers/dashboardController.js";
import { validate } from "../middleware/validate.js";
import { dateQuerySchema } from "../validation/schemas.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/today", todayDashboard);
dashboardRoutes.get("/", validate(dateQuerySchema), dashboardByDate);
