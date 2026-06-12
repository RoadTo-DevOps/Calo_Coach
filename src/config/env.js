import dotenv from "dotenv";

dotenv.config();

const requiredInProduction = ["MONGO_URI", "JWT_SECRET"];

for (const key of requiredInProduction) {
  if (process.env.NODE_ENV === "production" && !process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/health_care",
  jwtSecret: process.env.JWT_SECRET || "development-only-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  aiProvider: process.env.AI_PROVIDER || "fallback",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  openAiVisionModel: process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
  openAiBaseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  beeApiKey: process.env.BEE_API_KEY || "",
  beeModel: process.env.BEE_MODEL || "deepseek-chat",
  beeVisionModel: process.env.BEE_VISION_MODEL || "gemini-3.5-flash",
  beeBaseUrl: process.env.BEE_BASE_URL || "https://platform.beeknoee.com/api/v1",
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS || 15000),
  aiImageTimeoutMs: Number(process.env.AI_IMAGE_TIMEOUT_MS || 45000)
};
