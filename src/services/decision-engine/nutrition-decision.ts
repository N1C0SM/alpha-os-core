// Nutrition Decision Service
// Calculates macros and meal recommendations based on goals

export interface NutritionDecisionInput {
  weightKg: number;
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
  fat_loss: 2.4, // Higher protein during cut
  recomposition: 2.0,
  maintenance: 1.8,
};

// Activity level multipliers for TDEE
const ACTIVITY_MULTIPLIERS = {
  low: 1.2,
  moderate: 1.55,
  high: 1.725,
};

export function nutritionDecision(input: NutritionDecisionInput): NutritionDecision {
  const { weightKg, fitnessGoal, isWorkoutDay, activityLevel } = input;
  
  // Calculate BMR using Mifflin-St Jeor (simplified, assumes average male)
  // In production, would use actual user data (age, sex, height)
  const bmr = 10 * weightKg + 625; // Simplified
  
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
  
  // Fat: 25-30% of calories
  const fatCalories = dailyCalories * 0.28;
  const fats = Math.round(fatCalories / 9);
  
  // Carbs: remaining calories
  const carbCalories = dailyCalories - proteinCalories - fatCalories;
  const carbs = Math.round(carbCalories / 4);
  
  // Hydration target: 35ml per kg
  const hydrationTarget = Math.round(weightKg * 35 / 100) * 100; // Round to nearest 100ml
  
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
