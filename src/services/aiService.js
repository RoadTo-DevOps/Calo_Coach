import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const foodPresets = [
  { match: ["chicken", "uc ga", "breast"], caloriesPer100g: 165, protein: 31, carbs: 0, fat: 3.6 },
  { match: ["rice", "com"], caloriesPer100g: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { match: ["egg", "trung"], caloriesPer100g: 155, protein: 13, carbs: 1.1, fat: 11 },
  { match: ["beef", "bo"], caloriesPer100g: 217, protein: 26, carbs: 0, fat: 12 },
  { match: ["banana", "chuoi"], caloriesPer100g: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { match: ["yogurt", "sua chua"], caloriesPer100g: 61, protein: 3.5, carbs: 4.7, fat: 3.3 }
];

const mets = {
  walk: 3.8,
  run: 8.3,
  gym: 6,
  cycling: 7.5,
  yoga: 3,
  swim: 7,
  football: 8,
  badminton: 5.5,
  basketball: 6.5,
  tennis: 7,
  jumpRope: 10,
  boxing: 7.8
};

function gramsFromText(text) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(g|gram|grams|kg)/i);
  if (!match) return 100;
  const amount = Number(match[1]);
  return match[2].toLowerCase() === "kg" ? amount * 1000 : amount;
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function chooseFoodPreset(text) {
  const normalized = normalizeText(text);
  return foodPresets.find((preset) => preset.match.some((token) => normalized.includes(token))) || foodPresets[1];
}

function chooseMet(text) {
  const normalized = normalizeText(text);
  if (normalized.includes("run") || normalized.includes("chay")) return mets.run;
  if (normalized.includes("walk") || normalized.includes("di bo")) return mets.walk;
  if (normalized.includes("gym") || normalized.includes("weight")) return mets.gym;
  if (normalized.includes("cycle") || normalized.includes("dap xe")) return mets.cycling;
  if (normalized.includes("yoga")) return mets.yoga;
  if (normalized.includes("swim") || normalized.includes("boi")) return mets.swim;
  if (normalized.includes("football") || normalized.includes("soccer") || normalized.includes("bong da")) return mets.football;
  if (normalized.includes("badminton") || normalized.includes("cau long")) return mets.badminton;
  if (normalized.includes("basketball") || normalized.includes("bong ro")) return mets.basketball;
  if (normalized.includes("tennis") || normalized.includes("quan vot")) return mets.tennis;
  if (normalized.includes("jump rope") || normalized.includes("nhay day")) return mets.jumpRope;
  if (normalized.includes("boxing") || normalized.includes("dam boc")) return mets.boxing;
  return 5;
}

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  return JSON.parse(text.slice(start, end + 1));
}

function getAiConfig() {
  const provider = env.aiProvider.toLowerCase();

  if (provider === "openai" && env.openAiApiKey) {
    return {
      apiKey: env.openAiApiKey,
      baseUrl: env.openAiBaseUrl,
      model: env.openAiModel
    };
  }

  if (["beek", "beeknoee"].includes(provider) && env.beeApiKey) {
    return {
      apiKey: env.beeApiKey,
      baseUrl: env.beeBaseUrl,
      model: env.beeModel
    };
  }

  return null;
}

async function aiJson(prompt) {
  const config = getAiConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.aiTimeoutMs);

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "You are a nutrition and fitness assistant for a Vietnamese health tracking app. Return compact JSON only. Do not provide medical diagnosis. Do not include markdown."
        },
        { role: "user", content: prompt }
      ]
    })
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`${env.aiProvider} provider failed with ${response.status}`);
  }

  const payload = await response.json();
  return extractJson(payload.choices?.[0]?.message?.content || "{}") || null;
}

async function aiText(messages, systemPrompt) {
  const config = getAiConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.aiTimeoutMs);

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.35,
      max_tokens: 900,
      messages: [{ role: "system", content: systemPrompt }, ...messages]
    })
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`${env.aiProvider} provider failed with ${response.status}`);
  }

  const payload = await response.json();
  return payload.choices?.[0]?.message?.content?.trim() || null;
}

async function tryProvider(prompt) {
  try {
    return await aiJson(prompt);
  } catch (error) {
    console.warn(`AI provider fallback used: ${error.message}`);
    return null;
  }
}

async function requireProvider(prompt, featureName) {
  try {
    const result = await aiJson(prompt);
    if (result) return result;
  } catch (error) {
    console.warn(`AI provider required for ${featureName}: ${error.message}`);
  }

  throw new AppError(
    `Tính năng ${featureName} cần AI provider thật. Hãy cấu hình AI_PROVIDER=openai hoặc AI_PROVIDER=beek cùng API key.`,
    400,
    { provider: env.aiProvider }
  );
}

async function tryProviderText(messages, systemPrompt) {
  try {
    return await aiText(messages, systemPrompt);
  } catch (error) {
    console.warn(`AI chat fallback used: ${error.message}`);
    return null;
  }
}

export async function estimateFood(text) {
  const providerEstimate = await tryProvider(
    `Estimate calories and macros for this food input: "${text}".
Return JSON with exactly these keys:
foodName, quantity, estimatedCalories, protein, carbs, fat, confidence, note.
Use numbers for calories/protein/carbs/fat. confidence must be low, medium, or high.
Keep note short and in Vietnamese.`
  );
  if (providerEstimate?.foodName && providerEstimate?.estimatedCalories !== undefined) {
    return providerEstimate;
  }

  const grams = gramsFromText(text);
  const preset = chooseFoodPreset(text);
  const factor = grams / 100;
  return {
    foodName: text.replace(/\d+(?:\.\d+)?\s*(g|gram|grams|kg)/i, "").trim() || "Food item",
    quantity: `${Math.round(grams)}g`,
    estimatedCalories: Math.round(preset.caloriesPer100g * factor),
    protein: Math.round(preset.protein * factor),
    carbs: Math.round(preset.carbs * factor),
    fat: Math.round(preset.fat * factor),
    confidence: "medium",
    note: "Ước tính dự phòng. Hãy kiểm tra và chỉnh lại trước khi lưu."
  };
}

export async function estimateExercise({ text, durationMinutes = 30, intensity = "medium", weightKg = 70 }) {
  const providerEstimate = await tryProvider(
    `Estimate calories burned for this exercise:
exercise="${text}", durationMinutes=${durationMinutes}, intensity="${intensity}", userWeightKg=${weightKg}.
Return JSON with exactly these keys:
exerciseName, durationMinutes, intensity, estimatedCaloriesBurned, confidence, note.
intensity must be low, medium, or high. confidence must be low, medium, or high.
Keep note short and in Vietnamese.`
  );
  if (providerEstimate?.exerciseName && providerEstimate?.estimatedCaloriesBurned !== undefined) {
    return providerEstimate;
  }

  const intensityFactor = { low: 0.85, medium: 1, high: 1.2 }[intensity] || 1;
  const calories = (chooseMet(text) * 3.5 * weightKg * durationMinutes * intensityFactor) / 200;
  return {
    exerciseName: text,
    durationMinutes,
    intensity,
    estimatedCaloriesBurned: Math.round(calories),
    confidence: "medium",
    note: "Ước tính dự phòng theo công thức MET. Hãy kiểm tra và chỉnh lại trước khi lưu."
  };
}

export async function suggestMeals(context) {
  const providerSuggestions = await requireProvider(
    `Suggest exactly 2 meal options from this user context:
${JSON.stringify(toAiContext(context))}
Return JSON with key mealSuggestions. mealSuggestions must be an array of objects with:
mealName, reason, estimatedCalories, protein, carbs, fat, ingredients, instructions.
Avoid allergies and keep all user-facing text in Vietnamese.`,
    "gợi ý bữa ăn"
  );
  if (Array.isArray(providerSuggestions?.mealSuggestions)) {
    return { mealSuggestions: providerSuggestions.mealSuggestions.slice(0, 2) };
  }

  throw new AppError("Provider chưa trả đúng định dạng gợi ý bữa ăn. Vui lòng thử lại.", 400);
}

export async function suggestWorkouts(context) {
  const providerSuggestions = await requireProvider(
    `Suggest exactly 2 workout or sport activity options from this user context:
${JSON.stringify(toAiContext(context))}
Return JSON with key workoutSuggestions. workoutSuggestions must be an array of objects with:
name, category, durationMinutes, intensity, estimatedCaloriesBurned, reason, equipment, exercises.
category must be one of: sport, cardio, strength, mobility.
Include 1 sport option when reasonable, such as football, badminton, swimming, cycling, basketball, tennis, boxing, jump rope, hiking, or jogging.
equipment must be an array of short Vietnamese strings, use ["Không cần"] if none.
exercises must be an array of concrete steps or activity blocks.
Keep all user-facing text in Vietnamese. Do not give medical advice.`,
    "gợi ý tập luyện"
  );
  if (Array.isArray(providerSuggestions?.workoutSuggestions)) {
    return { workoutSuggestions: providerSuggestions.workoutSuggestions.slice(0, 2) };
  }

  throw new AppError("AI chưa trả đúng định dạng gợi ý tập luyện. Vui lòng thử lại.", 400);
}

export async function healthChat(context, messages) {
  const safeContext = toAiContext(context);
  const systemPrompt = `Bạn là trợ lý sức khỏe nhỏ trong app CaloCoach.
Bạn chỉ hỗ trợ tham khảo về ăn uống, calo, macro, thói quen vận động và cách dùng app.
Không chẩn đoán bệnh, không kê thuốc, không thay thế bác sĩ hoặc chuyên gia dinh dưỡng.
Nếu user hỏi triệu chứng nghiêm trọng, đau ngực, khó thở, ngất, rối loạn ăn uống, hoặc bệnh lý nguy hiểm, hãy khuyên liên hệ bác sĩ/cấp cứu.
Trả lời bằng tiếng Việt, ngắn gọn, thực tế, có bước hành động cụ thể.
Ngữ cảnh user hiện tại: ${JSON.stringify(safeContext)}`;

  const reply = await tryProviderText(messages, systemPrompt);
  if (reply) {
    return { reply };
  }

  return {
    reply:
      "Hiện tại AI provider chưa khả dụng nên mình trả lời ở chế độ dự phòng. Bạn có thể hỏi về calo còn lại, cách chia bữa, macro hoặc bài tập nhẹ. Lưu ý: app chỉ hỗ trợ tham khảo, không thay thế tư vấn y tế."
  };
}

function toAiContext(context) {
  return {
    date: context.date,
    profile: context.profile
      ? {
          gender: context.profile.gender,
          age: context.profile.age,
          heightCm: context.profile.heightCm,
          weightKg: context.profile.weightKg,
          activityLevel: context.profile.activityLevel,
          dietPreference: context.profile.dietPreference,
          allergies: context.profile.allergies,
          medicalConditions: context.profile.medicalConditions,
          workoutDaysPerWeek: context.profile.workoutDaysPerWeek
        }
      : null,
    goal: context.goal
      ? {
          type: context.goal.type,
          targetCalories: context.goal.targetCalories,
          targetProtein: context.goal.targetProtein,
          targetCarbs: context.goal.targetCarbs,
          targetFat: context.goal.targetFat
        }
      : null,
    totalCaloriesIn: context.totalCaloriesIn,
    totalCaloriesBurned: context.totalCaloriesBurned,
    remainingCalories: context.remainingCalories,
    totalProtein: context.totalProtein,
    totalCarbs: context.totalCarbs,
    totalFat: context.totalFat,
    foodsToday: context.foodLogs?.map((item) => ({
      mealType: item.mealType,
      foodName: item.foodName,
      quantity: item.quantity,
      calories: item.calories
    })),
    exercisesToday: context.exerciseLogs?.map((item) => ({
      exerciseName: item.exerciseName,
      durationMinutes: item.durationMinutes,
      intensity: item.intensity,
      caloriesBurned: item.caloriesBurned
    }))
  };
}
