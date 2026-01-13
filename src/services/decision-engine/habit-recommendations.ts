// Habit Recommendation Service
// Suggests personalized habits based on user profile and goals

export interface HabitRecommendationInput {
  weightKg: number;
  heightCm: number;
  fitnessGoal: 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  sleepQuality?: number; // 1-10
  stressLevel?: number; // 1-10
}

export interface RecommendedHabit {
  name: string;
  description: string;
  icon: string;
  category: 'hydration' | 'nutrition' | 'recovery' | 'mindset' | 'training' | 'skin';
  priority: number; // 1-10, higher is more important
  reason: string;
}

// BMI calculation helper
function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function getHabitRecommendations(input: HabitRecommendationInput): RecommendedHabit[] {
  const { weightKg, heightCm, fitnessGoal, experienceLevel = 'beginner', sleepQuality = 7, stressLevel = 5 } = input;
  
  const bmi = calculateBMI(weightKg, heightCm);
  const habits: RecommendedHabit[] = [];

  // ============= Hydration Habits =============
  const waterLiters = getWaterIntake(weightKg, heightCm, fitnessGoal);
  habits.push({
    name: `Beber ${waterLiters.toFixed(1)}L de agua`,
    description: 'Hidratación diaria personalizada según tu peso y objetivo',
    icon: '💧',
    category: 'hydration',
    priority: 10,
    reason: 'La hidratación es fundamental para el rendimiento y la salud',
  });

  // ============= Nutrition Habits =============
  if (fitnessGoal === 'muscle_gain') {
    habits.push({
      name: 'Comer proteína en cada comida',
      description: 'Incluye 25-40g de proteína por comida para maximizar síntesis proteica',
      icon: '🥩',
      category: 'nutrition',
      priority: 9,
      reason: 'La distribución de proteína optimiza la ganancia muscular',
    });
    habits.push({
      name: 'Nunca saltarse el post-entreno',
      description: 'Proteína + carbohidratos dentro de 2h del entrenamiento',
      icon: '🍌',
      category: 'nutrition',
      priority: 8,
      reason: 'Maximiza la recuperación y crecimiento muscular',
    });
  }

  if (fitnessGoal === 'fat_loss') {
    habits.push({
      name: 'Registrar comidas',
      description: 'Lleva un control de lo que comes para mantener el déficit',
      icon: '📝',
      category: 'nutrition',
      priority: 9,
      reason: 'El tracking es clave para mantener el déficit calórico',
    });
    habits.push({
      name: 'Comer despacio',
      description: 'Tómate 20 minutos mínimo por comida',
      icon: '🍽️',
      category: 'nutrition',
      priority: 7,
      reason: 'Mejora la saciedad y reduce sobreingesta',
    });
  }

  // ============= Recovery Habits =============
  if (sleepQuality < 6) {
    habits.push({
      name: 'Dormir 7-8 horas',
      description: 'Acostarse y levantarse a la misma hora cada día',
      icon: '😴',
      category: 'recovery',
      priority: 10,
      reason: 'Tu calidad de sueño es baja - es crucial para recuperación',
    });
    habits.push({
      name: 'Sin pantallas 1h antes de dormir',
      description: 'Evita luz azul para mejorar calidad del sueño',
      icon: '📵',
      category: 'recovery',
      priority: 8,
      reason: 'Mejora la producción de melatonina',
    });
  }

  if (stressLevel > 6) {
    habits.push({
      name: '10 min de meditación',
      description: 'Meditación guiada o respiración profunda diaria',
      icon: '🧘',
      category: 'mindset',
      priority: 9,
      reason: 'Tu nivel de estrés está alto - afecta cortisol y recuperación',
    });
  }

  // ============= Training Habits =============
  habits.push({
    name: 'Calentar 5-10 min',
    description: 'Cardio suave + movilidad antes de entrenar',
    icon: '🔥',
    category: 'training',
    priority: 7,
    reason: 'Previene lesiones y mejora rendimiento',
  });

  if (experienceLevel !== 'advanced') {
    habits.push({
      name: 'Registrar pesos del entreno',
      description: 'Anota series, reps y peso para progresar',
      icon: '📊',
      category: 'training',
      priority: 8,
      reason: 'La progresión registrada es clave para mejorar',
    });
  }

  // ============= Skin & Health Habits =============
  habits.push({
    name: 'Protector solar diario',
    description: 'SPF 30+ incluso en días nublados',
    icon: '☀️',
    category: 'skin',
    priority: 6,
    reason: 'Protege la piel del envejecimiento prematuro',
  });

  if (bmi > 25 || fitnessGoal === 'fat_loss') {
    habits.push({
      name: 'Caminar 10.000 pasos',
      description: 'NEAT extra para quemar calorías sin esfuerzo',
      icon: '🚶',
      category: 'training',
      priority: 8,
      reason: 'Los pasos diarios aumentan el gasto calórico significativamente',
    });
  }

  // ============= General Wellness =============
  habits.push({
    name: 'Estirar después del entreno',
    description: '5-10 min de estiramientos post-entreno',
    icon: '🧘‍♂️',
    category: 'recovery',
    priority: 6,
    reason: 'Mejora flexibilidad y reduce agujetas',
  });

  habits.push({
    name: 'Tomar suplementos',
    description: 'Creatina, vitamina D y omega-3 diarios',
    icon: '💊',
    category: 'nutrition',
    priority: 7,
    reason: 'Suplementos básicos con beneficios comprobados',
  });

  // Sort by priority
  return habits.sort((a, b) => b.priority - a.priority);
}

// ============= Hydration Calculator =============
export interface HydrationRecommendation {
  dailyLiters: number;
  perKgMl: number;
  reason: string;
  tips: string[];
}

export function getWaterIntake(weightKg: number, heightCm: number, fitnessGoal: string): number {
  // Base: 35ml per kg for sedentary, adjust for activity
  let mlPerKg = 35;

  // Add more for active individuals
  mlPerKg += 5; // Base for training

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

  // Adjust for size - taller people need more
  const heightMultiplier = heightCm > 180 ? 1.1 : heightCm < 165 ? 0.9 : 1;

  const totalMl = weightKg * mlPerKg * heightMultiplier;
  return Math.round(totalMl / 100) / 10; // Round to 0.1L
}

export function getHydrationRecommendation(weightKg: number, heightCm: number, fitnessGoal: string): HydrationRecommendation {
  const dailyLiters = getWaterIntake(weightKg, heightCm, fitnessGoal);
  const perKgMl = Math.round((dailyLiters * 1000) / weightKg);

  const tips: string[] = [
    'Bebe un vaso nada más levantarte',
    'Lleva una botella contigo siempre',
    'Bebe antes de sentir sed',
  ];

  if (fitnessGoal === 'muscle_gain') {
    tips.push('Bebe más durante y después del entreno');
    tips.push('Considera añadir electrolitos post-entreno');
  }

  if (fitnessGoal === 'fat_loss') {
    tips.push('Bebe un vaso antes de cada comida');
    tips.push('El agua con limón puede ayudar a la saciedad');
  }

  return {
    dailyLiters,
    perKgMl,
    reason: `Basado en tu peso (${weightKg}kg), altura (${heightCm}cm) y objetivo de ${fitnessGoal === 'muscle_gain' ? 'ganancia muscular' : fitnessGoal === 'fat_loss' ? 'pérdida de grasa' : 'mantenimiento'}`,
    tips,
  };
}
