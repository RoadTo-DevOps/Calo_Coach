import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const payload = {
    message: statusCode >= 500 ? "Internal server error" : err.message
  };

  if (err.details) {
    payload.details = err.details;
  }

  if (env.nodeEnv !== "production") {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}
