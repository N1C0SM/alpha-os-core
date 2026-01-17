// Priorities Decision Service
// Generates personalized daily priorities based on user profile and goals

export interface PrioritiesDecisionInput {
  isWorkoutDay: boolean;
  hydrationProgress: number; // 0-100%
  mealsCompleted: number;
  totalMeals: number;
  supplementsTaken: number;
  totalSupplements: number;
  sleepQuality: number; // 1-10
  stressLevel: number; // 1-10
  // Profile-based inputs
  weightKg?: number;
  heightCm?: number;
  fitnessGoal?: 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface DailyPriority {
  order: number;
  title: string;
  description: string;
  category: 'training' | 'nutrition' | 'hydration' | 'supplements' | 'recovery' | 'mindset' | 'protein' | 'sleep';
  icon: string;
  completed: boolean;
}

// Calculate daily protein target based on weight and goal
function getProteinTarget(weightKg: number, goal: string): number {
  const multipliers: Record<string, number> = {
    muscle_gain: 2.0,
    recomposition: 1.8,
    fat_loss: 2.2, // Higher to preserve muscle
    maintenance: 1.6,
  };
  return Math.round(weightKg * (multipliers[goal] || 1.8));
}

export function prioritiesDecision(input: PrioritiesDecisionInput): DailyPriority[] {
  const priorities: DailyPriority[] = [];
  
  const {
    isWorkoutDay,
    hydrationProgress,
    sleepQuality,
    stressLevel,
    weightKg = 75,
    fitnessGoal = 'muscle_gain',
    experienceLevel = 'beginner',
  } = input;
  
  const proteinTarget = getProteinTarget(weightKg, fitnessGoal);
  
  // Priority 1: Training or Recovery (most important)
  if (isWorkoutDay) {
    const workoutDescriptions: Record<string, string> = {
      muscle_gain: 'Entrena duro, busca el fallo muscular controlado',
      fat_loss: 'Mantén la intensidad para quemar calorías',
      recomposition: 'Fuerza + cardio para transformar tu cuerpo',
      maintenance: 'Entreno de mantenimiento, disfruta el proceso',
    };
    
    priorities.push({
      order: 1,
      title: 'Completar entrenamiento',
      description: workoutDescriptions[fitnessGoal] || 'Sigue el plan de hoy',
      category: 'training',
      icon: '💪',
      completed: false,
    });
  } else {
    priorities.push({
      order: 1,
      title: 'Día de recuperación',
      description: sleepQuality < 6 
        ? 'Prioriza dormir 8h esta noche'
        : 'Estiramientos suaves y descanso activo',
      category: 'recovery',
      icon: '🧘',
      completed: false,
    });
  }
  
  // Priority 2: Protein intake (critical for all goals)
  const proteinDescriptions: Record<string, string> = {
    muscle_gain: `Come ${proteinTarget}g de proteína para ganar músculo`,
    fat_loss: `${proteinTarget}g de proteína para preservar músculo`,
    recomposition: `${proteinTarget}g de proteína para recomposición`,
    maintenance: `Mantén ${proteinTarget}g de proteína diarios`,
  };
  
  priorities.push({
    order: 2,
    title: `Comer ${proteinTarget}g de proteína`,
    description: proteinDescriptions[fitnessGoal] || `Objetivo: ${proteinTarget}g`,
    category: 'protein',
    icon: '🥩',
    completed: false,
  });
  
  // Priority 3: Based on goal and what's most impactful
  if (fitnessGoal === 'muscle_gain') {
    if (sleepQuality < 7) {
      priorities.push({
        order: 3,
        title: 'Dormir 8 horas mínimo',
        description: 'El músculo crece mientras duermes',
        category: 'sleep',
        icon: '😴',
        completed: false,
      });
    } else {
      priorities.push({
        order: 3,
        title: 'Tomar creatina (5g)',
        description: 'Mejora fuerza y volumen muscular',
        category: 'supplements',
        icon: '💊',
        completed: false,
      });
    }
  } else if (fitnessGoal === 'fat_loss') {
    if (hydrationProgress < 60) {
      priorities.push({
        order: 3,
        title: 'Beber 3L de agua',
        description: 'Acelera metabolismo y reduce hambre',
        category: 'hydration',
        icon: '💧',
        completed: false,
      });
    } else {
      priorities.push({
        order: 3,
        title: 'Caminar 10.000 pasos',
        description: 'NEAT: quema calorías sin esfuerzo',
        category: 'training',
        icon: '🚶',
        completed: false,
      });
    }
  } else if (fitnessGoal === 'recomposition') {
    priorities.push({
      order: 3,
      title: 'Déficit leve (-300kcal)',
      description: 'Pierde grasa mientras ganas músculo',
      category: 'nutrition',
      icon: '⚖️',
      completed: false,
    });
  } else {
    if (stressLevel >= 7) {
      priorities.push({
        order: 3,
        title: 'Gestionar estrés',
        description: '10 min de respiración o meditación',
        category: 'mindset',
        icon: '🧠',
        completed: false,
      });
    } else {
      priorities.push({
        order: 3,
        title: 'Mantener consistencia',
        description: 'Vas bien. Sigue con el plan.',
        category: 'mindset',
        icon: '🔥',
        completed: true,
      });
    }
  }
  
  return priorities;
}

// Get priority icon by category
export function getPriorityColor(category: DailyPriority['category']): string {
  const colors: Record<DailyPriority['category'], string> = {
    training: 'text-primary',
    nutrition: 'text-green-400',
    hydration: 'text-blue-400',
    supplements: 'text-purple-400',
    recovery: 'text-emerald-400',
    mindset: 'text-amber-400',
    protein: 'text-red-400',
    sleep: 'text-indigo-400',
  };
  return colors[category];
}
