const activityFactors = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9
};

const KCAL_PER_KG = 7700;

const defaultCalorieDeltas = {
  lose_weight: {
    very_light: -110,
    light: -275,
    moderate: -550,
    strong: -825,
    aggressive: -1100,
    very_aggressive: -1375
  },
  gain_weight: { light: 200, moderate: 350, strong: 500 },
  gain_muscle: { light: 150, moderate: 250, strong: 350 },
  maintain: { light: 0, moderate: -100, strong: -200 },
  endurance: { light: 100, moderate: 200, strong: 300 },
  healthy_eating: { light: 0, moderate: -150, strong: -250 }
};

const weeklyWeightRates = {
  lose_weight: {
    very_light: -0.1,
    light: -0.25,
    moderate: -0.5,
    strong: -0.75,
    aggressive: -1,
    very_aggressive: -1.25
  },
  gain_weight: { light: 0.2, moderate: 0.35, strong: 0.5 },
  gain_muscle: { light: 0.1, moderate: 0.2, strong: 0.3 }
};

export function calculateBmr(profile) {
  const { gender, age, heightCm, weightKg } = profile;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === "female" ? base - 161 : base + 5);
}

export function calculateTdee(profile) {
  const factor = activityFactors[profile.activityLevel] || activityFactors.light;
  return Math.round(calculateBmr(profile) * factor);
}

function macroTargets(profile, goalType, targetCalories) {
  const weight = Number(profile.weightKg || 70);
  const protein = goalType === "gain_muscle" ? weight * 2 : weight * 1.6;
  const fat = Math.max(40, (targetCalories * 0.25) / 9);
  const carbs = Math.max(80, (targetCalories - protein * 4 - fat * 9) / 4);

  return {
    targetProtein: Math.round(protein),
    targetCarbs: Math.round(carbs),
    targetFat: Math.round(fat)
  };
}

export function minimumSafeCalories(profile) {
  const genderFloor = profile.gender === "male" ? 1300 : 1200;
  return Math.max(genderFloor, Math.round(calculateBmr(profile) * 0.8));
}

function targetWeightPlan(profile, goalType, targetWeightKg, intensity) {
  const currentWeight = Number(profile.weightKg);
  const targetWeight = Number(targetWeightKg);
  const requestedRate = weeklyWeightRates[goalType]?.[intensity];

  if (!Number.isFinite(currentWeight) || !Number.isFinite(targetWeight) || !requestedRate) {
    return null;
  }

  const totalChangeKg = targetWeight - currentWeight;
  const isValidDirection = requestedRate < 0 ? totalChangeKg < 0 : totalChangeKg > 0;
  if (!isValidDirection) {
    return null;
  }

  return {
    targetWeightKg: targetWeight,
    totalWeightChangeKg: Number(totalChangeKg.toFixed(1)),
    requestedWeeklyWeightChangeKg: Number(requestedRate.toFixed(2)),
    weeklyWeightChangeKg: Number(requestedRate.toFixed(2)),
    estimatedWeeks: Math.max(1, Math.ceil(Math.abs(totalChangeKg) / Math.abs(requestedRate))),
    calorieDelta: Math.round((requestedRate * KCAL_PER_KG) / 7)
  };
}

function applyMinimumCalorieGuard({ weightPlan, tdee, rawTargetCalories, minCalories }) {
  const targetCalories = Math.max(minCalories, rawTargetCalories);
  const clampedByMinimum = targetCalories > rawTargetCalories;

  if (!weightPlan) {
    return { targetCalories, clampedByMinimum };
  }

  const effectiveRate = ((targetCalories - tdee) * 7) / KCAL_PER_KG;
  const effectiveWeeks = Math.max(
    1,
    Math.ceil(Math.abs(weightPlan.totalWeightChangeKg) / Math.max(0.01, Math.abs(effectiveRate)))
  );

  return {
    targetCalories,
    clampedByMinimum,
    weeklyWeightChangeKg: Number(effectiveRate.toFixed(2)),
    estimatedWeeks: effectiveWeeks
  };
}

export function buildGoalOptions(profile, goalType, targetWeightKg = null) {
  const tdee = calculateTdee(profile);
  const bmr = calculateBmr(profile);
  const minCalories = minimumSafeCalories(profile);
  const configs = {
    lose_weight: [
      {
        intensity: "very_light",
        label: "Rất nhẹ",
        calorieDelta: -110,
        description: "Mong muốn giảm 0.10 kg/tuần, dễ duy trì khi mới bắt đầu."
      },
      {
        intensity: "light",
        label: "Nhẹ",
        calorieDelta: -275,
        description: "Mong muốn giảm 0.25 kg/tuần, ít ảnh hưởng năng lượng."
      },
      {
        intensity: "moderate",
        label: "Vừa",
        calorieDelta: -550,
        description: "Mong muốn giảm 0.5 kg/tuần, cân bằng giữa tốc độ và khả năng duy trì."
      },
      {
        intensity: "strong",
        label: "Mạnh",
        calorieDelta: -825,
        description: "Mong muốn giảm 0.75 kg/tuần, cần theo dõi đói, tập luyện và phục hồi."
      },
      {
        intensity: "aggressive",
        label: "Rất mạnh",
        calorieDelta: -1100,
        description: "Mong muốn giảm 1 kg/tuần, chỉ phù hợp khi vẫn trên ngưỡng calo an toàn."
      },
      {
        intensity: "very_aggressive",
        label: "Cao nhất",
        calorieDelta: -1375,
        description: "Mong muốn giảm 1.25 kg/tuần, app sẽ chặn nếu calo xuống quá thấp."
      }
    ],
    gain_weight: [
      { intensity: "light", label: "Nhẹ", calorieDelta: 200, description: "Tăng chậm, hạn chế tích mỡ." },
      { intensity: "moderate", label: "Vừa", calorieDelta: 350, description: "Phù hợp cho tăng cân ổn định." },
      { intensity: "strong", label: "Mạnh", calorieDelta: 500, description: "Tăng nhanh hơn, cần kiểm soát chất lượng bữa ăn." }
    ],
    gain_muscle: [
      { intensity: "light", label: "Nhẹ", calorieDelta: 150, description: "Lean bulk thận trọng." },
      { intensity: "moderate", label: "Vừa", calorieDelta: 250, description: "Tăng cơ cân bằng với protein cao." },
      { intensity: "strong", label: "Mạnh", calorieDelta: 350, description: "Ưu tiên hiệu suất tập, cần ngủ và phục hồi tốt." }
    ],
    maintain: [
      { intensity: "light", label: "Ổn định", calorieDelta: 0, description: "Giữ cân theo TDEE hiện tại." },
      { intensity: "moderate", label: "Linh hoạt", calorieDelta: -100, description: "Giữ cân với biên an toàn nhẹ." },
      { intensity: "strong", label: "Siết nhẹ", calorieDelta: -200, description: "Giữ cân nhưng ưu tiên giảm mỡ chậm." }
    ],
    endurance: [
      { intensity: "light", label: "Nhẹ", calorieDelta: 100, description: "Hỗ trợ vận động thêm nhẹ." },
      { intensity: "moderate", label: "Vừa", calorieDelta: 200, description: "Phù hợp tập sức bền đều đặn." },
      { intensity: "strong", label: "Mạnh", calorieDelta: 300, description: "Cho lịch tập nhiều hơn, cần đủ carb." }
    ],
    healthy_eating: [
      { intensity: "light", label: "Nhẹ", calorieDelta: 0, description: "Tập trung chất lượng bữa ăn." },
      { intensity: "moderate", label: "Vừa", calorieDelta: -150, description: "Ăn lành mạnh kèm kiểm soát calo nhẹ." },
      { intensity: "strong", label: "Mạnh", calorieDelta: -250, description: "Siết thói quen ăn uống rõ hơn." }
    ]
  };

  return (configs[goalType] || configs.maintain).map((option) => {
    const weightPlan = targetWeightPlan(profile, goalType, targetWeightKg, option.intensity);
    const calorieDelta = weightPlan?.calorieDelta ?? defaultCalorieDeltas[goalType]?.[option.intensity] ?? option.calorieDelta;
    const guarded = applyMinimumCalorieGuard({
      weightPlan,
      tdee,
      rawTargetCalories: Math.round(tdee + calorieDelta),
      minCalories
    });

    return {
      ...option,
      ...weightPlan,
      ...guarded,
      calorieDelta,
      bmr,
      tdee,
      minCalories,
      ...macroTargets(profile, goalType, guarded.targetCalories)
    };
  });
}

export function calculateTargetsFromOption(profile, goalType, intensity, targetWeightKg = null) {
  const options = buildGoalOptions(profile, goalType, targetWeightKg);
  return options.find((item) => item.intensity === intensity) || options[Math.min(1, options.length - 1)];
}

export function calculateTargetsFromCustomCalories(profile, goalType, customCalories) {
  const bmr = calculateBmr(profile);
  const tdee = calculateTdee(profile);
  const minCalories = minimumSafeCalories(profile);
  const targetCalories = Math.round(Number(customCalories));

  if (!Number.isFinite(targetCalories) || targetCalories < minCalories) {
    return {
      error: `Mức calo này quá thấp so với hồ sơ hiện tại. Mức tối thiểu an toàn là ${minCalories} kcal/ngày.`,
      minCalories,
      bmr,
      tdee
    };
  }

  return {
    intensity: "custom",
    label: "Tùy chỉnh",
    description: "Mức calo do bạn tự chọn trong biên an toàn.",
    bmr,
    tdee,
    minCalories,
    targetCalories,
    ...macroTargets(profile, goalType, targetCalories)
  };
}

export function summarizeNutrition(foodLogs = [], exerciseLogs = [], goal = null) {
  const totalCaloriesIn = foodLogs.reduce((sum, item) => sum + Number(item.calories || 0), 0);
  const totalProtein = foodLogs.reduce((sum, item) => sum + Number(item.protein || 0), 0);
  const totalCarbs = foodLogs.reduce((sum, item) => sum + Number(item.carbs || 0), 0);
  const totalFat = foodLogs.reduce((sum, item) => sum + Number(item.fat || 0), 0);
  const totalCaloriesBurned = exerciseLogs.reduce((sum, item) => sum + Number(item.caloriesBurned || 0), 0);
  const targetCalories = goal?.targetCalories ? Number(goal.targetCalories) : null;
  const remainingCalories = targetCalories === null ? null : targetCalories - totalCaloriesIn + totalCaloriesBurned;

  return {
    totalCaloriesIn,
    totalCaloriesBurned,
    remainingCalories,
    netCalories: totalCaloriesIn - totalCaloriesBurned,
    targetCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    completedGoalPercent: targetCalories > 0 ? Math.min(100, Math.round((totalCaloriesIn / targetCalories) * 100)) : 0
  };
}
