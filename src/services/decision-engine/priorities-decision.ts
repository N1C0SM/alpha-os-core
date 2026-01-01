// Priorities Decision Service
// Generates the top 3 priorities for the day

export interface PrioritiesDecisionInput {
  isWorkoutDay: boolean;
  hydrationProgress: number; // 0-100%
  mealsCompleted: number;
  totalMeals: number;
  supplementsTaken: number;
  totalSupplements: number;
  sleepQuality: number; // 1-10
  stressLevel: number; // 1-10
}

export interface DailyPriority {
  order: number;
  title: string;
  description: string;
  category: 'training' | 'nutrition' | 'hydration' | 'supplements' | 'recovery' | 'mindset';
  icon: string;
  completed: boolean;
}

export function prioritiesDecision(input: PrioritiesDecisionInput): DailyPriority[] {
  const priorities: DailyPriority[] = [];
  
  const {
    isWorkoutDay,
    hydrationProgress,
    mealsCompleted,
    totalMeals,
    supplementsTaken,
    totalSupplements,
    sleepQuality,
    stressLevel,
  } = input;
  
  // Priority 1: Training or Recovery (most important)
  if (isWorkoutDay) {
    priorities.push({
      order: 1,
      title: 'Completar entreno',
      description: 'Sigue el plan de hoy y registra tus pesos',
      category: 'training',
      icon: '💪',
      completed: false,
    });
  } else {
    priorities.push({
      order: 1,
      title: 'Día de recuperación',
      description: sleepQuality < 6 
        ? 'Prioriza dormir bien esta noche'
        : 'Estiramientos y descanso activo',
      category: 'recovery',
      icon: '🧘',
      completed: false,
    });
  }
  
  // Priority 2: Nutrition
  const mealProgress = totalMeals > 0 ? (mealsCompleted / totalMeals) * 100 : 0;
  if (mealProgress < 100) {
    priorities.push({
      order: 2,
      title: 'Seguir plan nutricional',
      description: `${mealsCompleted}/${totalMeals} comidas completadas`,
      category: 'nutrition',
      icon: '🥗',
      completed: mealProgress >= 100,
    });
  } else {
    priorities.push({
      order: 2,
      title: '¡Nutrición completada!',
      description: 'Todas las comidas del día hechas',
      category: 'nutrition',
      icon: '✅',
      completed: true,
    });
  }
  
  // Priority 3: Based on what's lagging most
  if (hydrationProgress < 50) {
    priorities.push({
      order: 3,
      title: 'Beber más agua',
      description: `Solo ${hydrationProgress}% del objetivo. ¡Hidratate!`,
      category: 'hydration',
      icon: '💧',
      completed: false,
    });
  } else if (supplementsTaken < totalSupplements) {
    priorities.push({
      order: 3,
      title: 'Tomar suplementos',
      description: `${supplementsTaken}/${totalSupplements} suplementos tomados`,
      category: 'supplements',
      icon: '💊',
      completed: false,
    });
  } else if (stressLevel >= 7) {
    priorities.push({
      order: 3,
      title: 'Gestionar estrés',
      description: '10 minutos de respiración o meditación',
      category: 'mindset',
      icon: '🧠',
      completed: false,
    });
  } else {
    priorities.push({
      order: 3,
      title: 'Mantener consistencia',
      description: 'Vas bien. Sigue así.',
      category: 'mindset',
      icon: '🔥',
      completed: true,
    });
  }
  
  return priorities;
}

// Get priority icon by category
export function getPriorityColor(category: DailyPriority['category']): string {
  const colors: Record<DailyPriority['category'], string> = {
    training: 'text-primary',
    nutrition: 'text-success',
    hydration: 'text-blue-400',
    supplements: 'text-purple-400',
    recovery: 'text-green-400',
    mindset: 'text-amber-400',
  };
  return colors[category];
}
