// Nutrition Decision Service
// Calculates macros and meal recommendations based on goals

export interface NutritionDecisionInput {
  weightKg: number;
  heightCm?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  fitnessGoal: 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance';
  isWorkoutDay: boolean;
  activityLevel: 'low' | 'moderate' | 'high';
}

export interface NutritionDecision {
  dailyCalories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  proteinPerKg: number;
  mealDistribution: MealMacros[];
  hydrationTarget: number; // ml
  explanation: string;
  goalLabel: string;
}

export interface MealMacros {
  name: string;
  type: 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'pre_workout' | 'post_workout';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string;
}

// Multipliers for different goals (relative to maintenance)
const GOAL_MULTIPLIERS = {
  muscle_gain: 1.15, // 15% surplus
  fat_loss: 0.80, // 20% deficit
  recomposition: 1.0, // maintenance
  maintenance: 1.0,
};

// Protein per kg based on goal
const PROTEIN_PER_KG = {
  muscle_gain: 2.2,
  fat_loss: 2.4, // Higher protein during cut to preserve muscle
  recomposition: 2.0,
  maintenance: 1.8,
};

// Activity level multipliers for TDEE
const ACTIVITY_MULTIPLIERS = {
  low: 1.2,
  moderate: 1.55,
  high: 1.725,
};

// Goal explanations
const GOAL_EXPLANATIONS = {
  muscle_gain: 'Superávit calórico (+15%) con proteína alta para maximizar ganancia muscular. Carbohidratos elevados para energía y recuperación.',
  fat_loss: 'Déficit calórico (-20%) con proteína muy alta para preservar músculo. Grasas moderadas para hormonas saludables.',
  recomposition: 'Calorías de mantenimiento con proteína alta. Ideal para ganar músculo y perder grasa simultáneamente.',
  maintenance: 'Calorías para mantener tu peso actual. Proteína suficiente para recuperación muscular.',
};

const GOAL_LABELS = {
  muscle_gain: '💪 Ganancia Muscular',
  fat_loss: '🔥 Pérdida de Grasa',
  recomposition: '⚖️ Recomposición',
  maintenance: '✅ Mantenimiento',
};

export function nutritionDecision(input: NutritionDecisionInput): NutritionDecision {
  const { weightKg, heightCm, age, gender, fitnessGoal, isWorkoutDay, activityLevel } = input;
  
  // Calculate BMR using Mifflin-St Jeor equation
  let bmr: number;
  if (heightCm && age) {
    if (gender === 'female') {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    } else {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
    }
  } else {
    // Simplified calculation if we don't have full data
    bmr = 10 * weightKg + 625;
  }
  
  // TDEE
  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  
  // Daily calories based on goal
  let dailyCalories = Math.round(tdee * GOAL_MULTIPLIERS[fitnessGoal]);
  
  // Adjust for workout vs rest day
  if (isWorkoutDay) {
    dailyCalories += 200; // Extra calories on training days
  }
  
  // Calculate macros
  const proteinPerKg = PROTEIN_PER_KG[fitnessGoal];
  const protein = Math.round(weightKg * proteinPerKg);
  const proteinCalories = protein * 4;
  
  // Fat: varies by goal
  let fatPercent: number;
  switch (fitnessGoal) {
    case 'fat_loss':
      fatPercent = 0.25; // Lower fat on cut
      break;
    case 'muscle_gain':
      fatPercent = 0.25; // Moderate fat for bulk
      break;
    default:
      fatPercent = 0.28;
  }
  
  const fatCalories = dailyCalories * fatPercent;
  const fats = Math.round(fatCalories / 9);
  
  // Carbs: remaining calories
  const carbCalories = dailyCalories - proteinCalories - fatCalories;
  const carbs = Math.max(50, Math.round(carbCalories / 4)); // Minimum 50g carbs
  
  // Recalculate actual calories
  dailyCalories = (protein * 4) + (carbs * 4) + (fats * 9);
  
  // Hydration target: personalized based on weight, height and goal
  let mlPerKg = 40; // Base for active individuals
  
  // Adjust for goal
  switch (fitnessGoal) {
    case 'muscle_gain':
      mlPerKg += 5; // More water for muscle synthesis
      break;
    case 'fat_loss':
      mlPerKg += 3; // Water helps satiety and metabolism
      break;
    case 'recomposition':
      mlPerKg += 4;
      break;
  }
  
  // Adjust for height - taller people need more
  const heightMultiplier = heightCm ? (heightCm > 180 ? 1.1 : heightCm < 165 ? 0.9 : 1) : 1;
  
  const hydrationTarget = Math.round((weightKg * mlPerKg * heightMultiplier) / 100) * 100;
  
  // Generate meal distribution
  const mealDistribution = generateMealDistribution({
    dailyCalories,
    protein,
    carbs,
    fats,
    isWorkoutDay,
  });
  
  return {
    dailyCalories,
    protein,
    carbs,
    fats,
    proteinPerKg,
    mealDistribution,
    hydrationTarget,
    explanation: GOAL_EXPLANATIONS[fitnessGoal],
    goalLabel: GOAL_LABELS[fitnessGoal],
  };
}

interface MacroTotals {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  isWorkoutDay: boolean;
}

function generateMealDistribution(totals: MacroTotals): MealMacros[] {
  const { dailyCalories, protein, carbs, fats, isWorkoutDay } = totals;
  
  if (isWorkoutDay) {
    // 5 meals: breakfast, lunch, pre-workout snack, post-workout, dinner
    return [
      {
        name: 'Desayuno',
        type: 'breakfast',
        calories: Math.round(dailyCalories * 0.25),
        protein: Math.round(protein * 0.25),
        carbs: Math.round(carbs * 0.25),
        fats: Math.round(fats * 0.25),
        time: '08:00',
      },
      {
        name: 'Almuerzo',
        type: 'lunch',
        calories: Math.round(dailyCalories * 0.25),
        protein: Math.round(protein * 0.25),
        carbs: Math.round(carbs * 0.20),
        fats: Math.round(fats * 0.30),
        time: '13:00',
      },
      {
        name: 'Pre-entreno',
        type: 'pre_workout',
        calories: Math.round(dailyCalories * 0.10),
        protein: Math.round(protein * 0.10),
        carbs: Math.round(carbs * 0.20),
        fats: Math.round(fats * 0.05),
        time: '17:00',
      },
      {
        name: 'Post-entreno',
        type: 'post_workout',
        calories: Math.round(dailyCalories * 0.20),
        protein: Math.round(protein * 0.25),
        carbs: Math.round(carbs * 0.25),
        fats: Math.round(fats * 0.10),
        time: '19:30',
      },
      {
        name: 'Cena',
        type: 'dinner',
        calories: Math.round(dailyCalories * 0.20),
        protein: Math.round(protein * 0.15),
        carbs: Math.round(carbs * 0.10),
        fats: Math.round(fats * 0.30),
        time: '21:00',
      },
    ];
  }
  
  // Rest day: 4 meals
  return [
    {
      name: 'Desayuno',
      type: 'breakfast',
      calories: Math.round(dailyCalories * 0.25),
      protein: Math.round(protein * 0.25),
      carbs: Math.round(carbs * 0.30),
      fats: Math.round(fats * 0.25),
      time: '08:00',
    },
    {
      name: 'Almuerzo',
      type: 'lunch',
      calories: Math.round(dailyCalories * 0.30),
      protein: Math.round(protein * 0.30),
      carbs: Math.round(carbs * 0.30),
      fats: Math.round(fats * 0.30),
      time: '13:00',
    },
    {
      name: 'Merienda',
      type: 'snack',
      calories: Math.round(dailyCalories * 0.15),
      protein: Math.round(protein * 0.15),
      carbs: Math.round(carbs * 0.20),
      fats: Math.round(fats * 0.15),
      time: '17:00',
    },
    {
      name: 'Cena',
      type: 'dinner',
      calories: Math.round(dailyCalories * 0.30),
      protein: Math.round(protein * 0.30),
      carbs: Math.round(carbs * 0.20),
      fats: Math.round(fats * 0.30),
      time: '20:00',
    },
  ];
}
