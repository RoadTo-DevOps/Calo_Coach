import { z } from "zod";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const goalIntensity = z.enum(["very_light", "light", "moderate", "strong", "aggressive", "very_aggressive", "custom"]);
const csvString = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  });

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(160),
    password: z.string().min(8).max(128)
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(160),
    password: z.string().min(1).max(128)
  })
});

export const profileSchema = z.object({
  body: z.object({
    gender: z.enum(["male", "female", "other"]),
    age: z.coerce.number().int().min(13).max(120),
    heightCm: z.coerce.number().min(80).max(260),
    weightKg: z.coerce.number().min(25).max(350),
    activityLevel: z.enum(["sedentary", "light", "moderate", "active", "athlete"]).default("light"),
    dietPreference: z.string().trim().max(120).optional().default(""),
    allergies: csvString,
    medicalConditions: csvString,
    workoutDaysPerWeek: z.coerce.number().int().min(0).max(7).default(3)
  })
});

export const goalSchema = z.object({
  body: z
    .object({
      type: z.enum(["lose_weight", "gain_weight", "maintain", "gain_muscle", "endurance", "healthy_eating"]),
      intensity: goalIntensity,
      customCalories: z.coerce.number().int().min(800).max(10000).optional(),
      targetWeightKg: z.coerce.number().min(25).max(350).optional(),
      targetDate: dateKey.optional(),
      status: z.enum(["active", "paused", "completed"]).optional()
    })
    .superRefine((body, ctx) => {
      if (body.intensity === "custom" && body.customCalories === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customCalories"],
          message: "Custom calories are required when intensity is custom"
        });
      }
    })
});

export const goalOptionsSchema = z.object({
  body: z.object({
    type: z.enum(["lose_weight", "gain_weight", "maintain", "gain_muscle", "endurance", "healthy_eating"]),
    targetWeightKg: z.coerce.number().min(25).max(350).optional()
  })
});

export const goalUpdateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    type: z.enum(["lose_weight", "gain_weight", "maintain", "gain_muscle", "endurance", "healthy_eating"]).optional(),
    targetCalories: z.coerce.number().min(800).optional(),
    targetProtein: z.coerce.number().min(0).optional(),
    targetCarbs: z.coerce.number().min(0).optional(),
    targetFat: z.coerce.number().min(0).optional(),
    targetDate: dateKey.optional(),
    status: z.enum(["active", "paused", "completed"]).optional()
  })
});

export const idParamSchema = z.object({
  params: z.object({ id: objectId })
});

export const foodLogSchema = z.object({
  body: z.object({
    date: dateKey,
    mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
    foodName: z.string().trim().min(1).max(160),
    quantity: z.string().trim().min(1).max(80),
    calories: z.coerce.number().min(0),
    protein: z.coerce.number().min(0).default(0),
    carbs: z.coerce.number().min(0).default(0),
    fat: z.coerce.number().min(0).default(0),
    estimatedByAi: z.coerce.boolean().default(false),
    aiConfidence: z.enum(["low", "medium", "high", ""]).optional().default(""),
    aiNote: z.string().trim().max(500).optional().default("")
  })
});

export const exerciseLogSchema = z.object({
  body: z.object({
    date: dateKey,
    exerciseName: z.string().trim().min(1).max(160),
    durationMinutes: z.coerce.number().int().min(1).max(1440),
    intensity: z.enum(["low", "medium", "high"]).default("medium"),
    caloriesBurned: z.coerce.number().min(0),
    estimatedByAi: z.coerce.boolean().default(false),
    aiConfidence: z.enum(["low", "medium", "high", ""]).optional().default(""),
    aiNote: z.string().trim().max(500).optional().default("")
  })
});

export const dateQuerySchema = z.object({
  query: z.object({
    date: dateKey.optional()
  })
});

export const requiredDateQuerySchema = z.object({
  query: z.object({
    date: dateKey
  })
});

export const rangeQuerySchema = z.object({
  query: z.object({
    start: dateKey,
    end: dateKey
  })
});

export const estimateFoodSchema = z.object({
  body: z.object({
    text: z.string().trim().min(2).max(500)
  })
});

export const estimateExerciseSchema = z.object({
  body: z.object({
    text: z.string().trim().min(2).max(500),
    durationMinutes: z.coerce.number().int().min(1).max(1440).optional(),
    intensity: z.enum(["low", "medium", "high"]).optional()
  })
});

export const healthChatSchema = z.object({
  body: z.object({
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1).max(1200)
        })
      )
      .min(1)
      .max(12)
  })
});
