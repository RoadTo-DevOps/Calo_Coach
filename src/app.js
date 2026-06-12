import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { requireAuth } from "./middleware/authMiddleware.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { aiRoutes } from "./routes/aiRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { exerciseLogRoutes } from "./routes/exerciseLogRoutes.js";
import { foodLogRoutes } from "./routes/foodLogRoutes.js";
import { goalRoutes } from "./routes/goalRoutes.js";
import { historyRoutes } from "./routes/historyRoutes.js";
import { profileRoutes } from "./routes/profileRoutes.js";

export const app = express();

app.set("etag", false);
app.set("trust proxy", env.trustProxy);
app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "health-care-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", requireAuth, profileRoutes);
app.use("/api/goals", requireAuth, goalRoutes);
app.use("/api/food-logs", requireAuth, foodLogRoutes);
app.use("/api/exercise-logs", requireAuth, exerciseLogRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/history", requireAuth, historyRoutes);
app.use("/api/ai", requireAuth, aiRoutes);

app.use(notFound);
app.use(errorHandler);
