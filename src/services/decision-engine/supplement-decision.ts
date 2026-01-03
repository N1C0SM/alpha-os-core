// Supplement Decision Service
// Recommends supplements and timing based on goals

export interface SupplementDecisionInput {
  fitnessGoal: 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance';
  isWorkoutDay: boolean;
  sleepQuality: number; // 1-10
}

export interface SupplementRecommendation {
  name: string;
  brand: string;
  timing: 'morning' | 'pre_workout' | 'intra_workout' | 'post_workout' | 'with_meal' | 'before_bed';
  dosage: string;
  priority: 'essential' | 'recommended' | 'optional';
  reason: string;
  amazonUrl: string;
}

export interface SupplementDecision {
  recommendations: SupplementRecommendation[];
  totalSupplements: number;
}

export function supplementDecision(input: SupplementDecisionInput): SupplementDecision {
  const { fitnessGoal, isWorkoutDay, sleepQuality } = input;
  
  const recommendations: SupplementRecommendation[] = [];
  
  // ESSENTIAL: Creatine (every day)
  recommendations.push({
    name: 'Creatina Monohidrato',
    brand: 'MyProtein',
    timing: 'morning',
    dosage: '5g',
    priority: 'essential',
    reason: 'Mejora fuerza y rendimiento. Tomar diariamente.',
    amazonUrl: 'https://www.amazon.es/dp/B00ESFBZTE',
  });
  
  // ESSENTIAL: Protein (training days or if goal is muscle gain)
  if (isWorkoutDay || fitnessGoal === 'muscle_gain') {
    recommendations.push({
      name: 'Impact Whey Protein',
      brand: 'MyProtein',
      timing: isWorkoutDay ? 'post_workout' : 'with_meal',
      dosage: '25-30g',
      priority: 'essential',
      reason: isWorkoutDay 
        ? 'Recuperación post-entreno. Tomar dentro de 2h después.'
        : 'Completar proteína diaria.',
      amazonUrl: 'https://www.amazon.es/dp/B00JG8G89A',
    });
  }
  
  // RECOMMENDED: Pre-workout (training days only)
  if (isWorkoutDay) {
    recommendations.push({
      name: 'THE Pre-Workout',
      brand: 'MyProtein',
      timing: 'pre_workout',
      dosage: '1 scoop',
      priority: 'recommended',
      reason: 'Energía y enfoque para el entreno. Tomar 30min antes.',
      amazonUrl: 'https://www.amazon.es/dp/B0C9LDHS1Q',
    });
  }
  
  // RECOMMENDED: Omega 3 (everyone)
  recommendations.push({
    name: 'Omega 3',
    brand: 'MyProtein',
    timing: 'with_meal',
    dosage: '2 cápsulas',
    priority: 'recommended',
    reason: 'Salud cardiovascular y antiinflamatorio.',
    amazonUrl: 'https://www.amazon.es/dp/B00DQFGO5G',
  });
  
  // OPTIONAL: ZMA (if sleep quality is low)
  if (sleepQuality < 7) {
    recommendations.push({
      name: 'ZMA',
      brand: 'Optimum Nutrition',
      timing: 'before_bed',
      dosage: '3 cápsulas',
      priority: 'recommended',
      reason: 'Mejora calidad del sueño y recuperación.',
      amazonUrl: 'https://www.amazon.es/dp/B000GIQT20',
    });
  }
  
  // OPTIONAL: Casein (before bed on training days)
  if (isWorkoutDay && fitnessGoal === 'muscle_gain') {
    recommendations.push({
      name: 'Caseína Gold Standard',
      brand: 'Optimum Nutrition',
      timing: 'before_bed',
      dosage: '1 scoop',
      priority: 'optional',
      reason: 'Proteína de liberación lenta para la noche.',
      amazonUrl: 'https://www.amazon.es/dp/B002DYJ0HM',
    });
  }
  
  // OPTIONAL: Vitamin D (everyone)
  recommendations.push({
    name: 'Vitamina D3',
    brand: 'HSN',
    timing: 'morning',
    dosage: '1 cápsula',
    priority: 'optional',
    reason: 'Sistema inmune y energía. Especialmente en invierno.',
    amazonUrl: 'https://www.amazon.es/dp/B07BDPVK6K',
  });
  
  return {
    recommendations,
    totalSupplements: recommendations.length,
  };
}

// Helper to get supplements by timing
export function getSupplementsByTiming(
  recommendations: SupplementRecommendation[],
  timing: SupplementRecommendation['timing']
): SupplementRecommendation[] {
  return recommendations.filter(r => r.timing === timing);
}

// Helper to get essential supplements
export function getEssentialSupplements(
  recommendations: SupplementRecommendation[]
): SupplementRecommendation[] {
  return recommendations.filter(r => r.priority === 'essential');
}
