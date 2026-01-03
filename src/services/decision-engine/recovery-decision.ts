// Recovery Decision Service
// Provides personalized post-workout recommendations

export interface RecoveryDecisionInput {
  workoutDurationMinutes: number;
  exerciseCount: number;
  totalSets: number;
  fitnessGoal: 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance';
  bodyWeightKg: number;
}

export interface RecoveryRecommendation {
  hydration: {
    duringWorkout: number; // ml
    postWorkout: number; // ml
    dailyTotal: number; // ml
    tip: string;
  };
  nutrition: {
    proteinGrams: number;
    carbsGrams: number;
    timing: string;
    tip: string;
  };
  supplements: {
    name: string;
    dosage: string;
    timing: string;
    reason: string;
    amazonUrl: string;
  }[];
  recovery: {
    restHours: number;
    muscleRecoveryDays: number;
    sleepHours: number;
    tip: string;
  };
}

export function recoveryDecision(input: RecoveryDecisionInput): RecoveryRecommendation {
  const { workoutDurationMinutes, exerciseCount, totalSets, fitnessGoal, bodyWeightKg } = input;
  
  // Calculate intensity factor (1-3)
  const intensityFactor = Math.min(3, Math.max(1, 
    (exerciseCount >= 6 ? 1 : 0) + 
    (totalSets >= 15 ? 1 : 0) + 
    (workoutDurationMinutes >= 60 ? 1 : 0) + 1
  ));

  // HYDRATION
  // During workout: 500-1000ml per hour
  const duringWorkout = Math.round((workoutDurationMinutes / 60) * 750);
  // Post workout: 500-750ml immediately
  const postWorkout = 500 + (intensityFactor * 100);
  // Daily: 35-40ml per kg body weight for active people
  const dailyTotal = Math.round(bodyWeightKg * 38);

  // NUTRITION - Post workout
  // Protein: 0.3-0.5g per kg
  const proteinGrams = Math.round(bodyWeightKg * 0.4);
  // Carbs depend on goal
  let carbsGrams: number;
  let nutritionTip: string;
  
  switch (fitnessGoal) {
    case 'muscle_gain':
      carbsGrams = Math.round(bodyWeightKg * 0.8);
      nutritionTip = 'Prioriza carbohidratos rápidos + proteína para maximizar síntesis muscular.';
      break;
    case 'fat_loss':
      carbsGrams = Math.round(bodyWeightKg * 0.3);
      nutritionTip = 'Enfócate en proteína con carbohidratos moderados para mantener músculo.';
      break;
    case 'recomposition':
      carbsGrams = Math.round(bodyWeightKg * 0.5);
      nutritionTip = 'Balance de proteína y carbohidratos para recuperación óptima.';
      break;
    default:
      carbsGrams = Math.round(bodyWeightKg * 0.5);
      nutritionTip = 'Mantén tu ingesta habitual de macros post-entreno.';
  }

  // SUPPLEMENTS
  const supplements: RecoveryRecommendation['supplements'] = [
    {
      name: 'Proteína Whey',
      dosage: `${proteinGrams}g`,
      timing: 'Dentro de 30-60 min post-entreno',
      reason: 'Acelera la síntesis de proteína muscular y recuperación.',
      amazonUrl: 'https://www.amazon.es/dp/B00JG8G89A',
    },
    {
      name: 'Creatina Monohidrato',
      dosage: '5g',
      timing: 'Con tu batido post-entreno',
      reason: 'Mejora recuperación, fuerza y rendimiento en próximos entrenos.',
      amazonUrl: 'https://www.amazon.es/dp/B00ESFBZTE',
    },
  ];

  // Add goal-specific supplements
  if (fitnessGoal === 'muscle_gain') {
    supplements.push({
      name: 'Carbohidratos (Maltodextrina/Ciclodextrina)',
      dosage: `${carbsGrams}g`,
      timing: 'Con tu batido post-entreno',
      reason: 'Repone glucógeno muscular y potencia absorción de proteína.',
      amazonUrl: 'https://www.amazon.es/dp/B00JKGSLBA',
    });
  }

  if (intensityFactor >= 2) {
    supplements.push({
      name: 'Electrolitos',
      dosage: '1 sobre',
      timing: 'Durante o después del entreno',
      reason: 'Repone minerales perdidos por sudoración intensa.',
      amazonUrl: 'https://www.amazon.es/dp/B08CXNXZ1V',
    });
  }

  // RECOVERY
  const muscleRecoveryDays = intensityFactor >= 2 ? 48 : 24; // hours between same muscle
  const sleepHours = fitnessGoal === 'muscle_gain' ? 8 : 7;
  
  let recoveryTip: string;
  if (intensityFactor >= 3) {
    recoveryTip = 'Entreno intenso. Prioriza sueño de calidad y evita entrenar los mismos músculos en 48-72h.';
  } else if (intensityFactor >= 2) {
    recoveryTip = 'Buen entreno. Descansa al menos 48h antes de volver a trabajar estos músculos.';
  } else {
    recoveryTip = 'Entreno ligero. Puedes volver a entrenar mañana si te sientes recuperado.';
  }

  return {
    hydration: {
      duringWorkout,
      postWorkout,
      dailyTotal,
      tip: `Lleva ${Math.round(duringWorkout / 1000 * 10) / 10}L de agua al gimnasio. Bebe ${postWorkout}ml inmediatamente después.`,
    },
    nutrition: {
      proteinGrams,
      carbsGrams,
      timing: 'Dentro de 30-60 minutos post-entreno',
      tip: nutritionTip,
    },
    supplements,
    recovery: {
      restHours: muscleRecoveryDays,
      muscleRecoveryDays: Math.round(muscleRecoveryDays / 24),
      sleepHours,
      tip: recoveryTip,
    },
  };
}
