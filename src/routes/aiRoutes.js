import { Router } from "express";
import multer from "multer";
import {
  estimateExerciseController,
  estimateFoodController,
  estimateFoodImageController,
  healthChatController,
  mealSuggestions,
  workoutSuggestions
} from "../controllers/aiController.js";
import { AppError } from "../utils/AppError.js";
import { validate } from "../middleware/validate.js";
import { estimateExerciseSchema, estimateFoodSchema, healthChatSchema } from "../validation/schemas.js";

export const aiRoutes = Router();

const foodImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif|heic)$/.test(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new AppError("Chỉ hỗ trợ ảnh JPG, PNG, WEBP, GIF hoặc HEIC.", 400));
  }
}).single("image");

function handleFoodImageUpload(req, res, next) {
  foodImageUpload(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new AppError("Ảnh tối đa 6MB. Vui lòng chọn ảnh nhỏ hơn.", 400));
      return;
    }

    next(error);
  });
}

aiRoutes.post("/estimate-food", validate(estimateFoodSchema), estimateFoodController);
aiRoutes.post("/estimate-food-image", handleFoodImageUpload, estimateFoodImageController);
aiRoutes.post("/estimate-exercise", validate(estimateExerciseSchema), estimateExerciseController);
aiRoutes.post("/meal-suggestions", mealSuggestions);
aiRoutes.post("/workout-suggestions", workoutSuggestions);
aiRoutes.post("/health-chat", validate(healthChatSchema), healthChatController);
