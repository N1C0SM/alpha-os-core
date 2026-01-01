// Training Decision Service
// Determines whether user should train, rest, or do active recovery

export interface TrainingDecisionInput {
  sleepHours: number;
  sleepQuality: number; // 1-10
  stressLevel: number; // 1-10
  sorenessLevel: number; // 1-10
  isScheduledWorkoutDay: boolean;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  daysSinceLastWorkout: number;
  consecutiveWorkoutDays: number;
}

export interface TrainingDecision {
  shouldTrain: boolean;
  recommendation: 'full_workout' | 'light_workout' | 'active_recovery' | 'rest';
  reason: string;
  intensityModifier: number; // 0.5 to 1.2
  suggestedFocus?: string;
}

/**
 * Decides training recommendation based on user state
 * Current logic is simple but extensible
 */
export function trainingDecision(input: TrainingDecisionInput): TrainingDecision {
  const readinessScore = calculateReadiness(input);
  
  // Critical rest conditions
  if (input.sleepHours < 5) {
    return {
      shouldTrain: false,
      recommendation: 'rest',
      reason: 'Menos de 5 horas de sueño. Tu cuerpo necesita recuperarse.',
      intensityModifier: 0,
    };
  }
  
  if (input.stressLevel >= 9) {
    return {
      shouldTrain: false,
      recommendation: 'active_recovery',
      reason: 'Estrés muy alto. Mejor hacer recuperación activa.',
      intensityModifier: 0.3,
      suggestedFocus: 'Estiramientos y movilidad',
    };
  }
  
  if (input.sorenessLevel >= 9) {
    return {
      shouldTrain: false,
      recommendation: 'rest',
      reason: 'Agujetas severas. Dale tiempo a tus músculos.',
      intensityModifier: 0,
    };
  }
  
  if (input.consecutiveWorkoutDays >= 5) {
    return {
      shouldTrain: false,
      recommendation: 'rest',
      reason: '5 días seguidos de entreno. Toca descanso obligatorio.',
      intensityModifier: 0,
    };
  }
  
  // Not a scheduled workout day
  if (!input.isScheduledWorkoutDay) {
    if (readinessScore >= 8 && input.daysSinceLastWorkout >= 2) {
      return {
        shouldTrain: true,
        recommendation: 'light_workout',
        reason: 'No es día de entreno, pero te sientes genial. Puedes hacer algo ligero.',
        intensityModifier: 0.6,
        suggestedFocus: 'Cardio ligero o accesorios',
      };
    }
    return {
      shouldTrain: false,
      recommendation: 'rest',
      reason: 'Día de descanso programado. Recupera para mañana.',
      intensityModifier: 0,
    };
  }
  
  // Scheduled workout day - determine intensity
  if (readinessScore >= 8) {
    return {
      shouldTrain: true,
      recommendation: 'full_workout',
      reason: '¡Estás en tu mejor momento! Dale con todo.',
      intensityModifier: 1.1,
    };
  }
  
  if (readinessScore >= 6) {
    return {
      shouldTrain: true,
      recommendation: 'full_workout',
      reason: 'Buen estado. Entreno normal.',
      intensityModifier: 1.0,
    };
  }
  
  if (readinessScore >= 4) {
    return {
      shouldTrain: true,
      recommendation: 'light_workout',
      reason: 'No estás al 100%. Reduce la intensidad hoy.',
      intensityModifier: 0.7,
    };
  }
  
  return {
    shouldTrain: false,
    recommendation: 'active_recovery',
    reason: 'Tu cuerpo pide descanso. Mejor recuperación activa.',
    intensityModifier: 0.3,
    suggestedFocus: 'Estiramientos y movilidad',
  };
}

function calculateReadiness(input: TrainingDecisionInput): number {
  const sleepScore = Math.min(input.sleepHours / 8, 1) * (input.sleepQuality / 10);
  const stressScore = (10 - input.stressLevel) / 10;
  const sorenessScore = (10 - input.sorenessLevel) / 10;
  
  // Experience affects recovery ability
  const experienceModifier = {
    beginner: 0.9,
    intermediate: 1.0,
    advanced: 1.1,
  }[input.experienceLevel];
  
  const rawScore = ((sleepScore * 0.4) + (stressScore * 0.35) + (sorenessScore * 0.25)) * 10;
  
  return Math.min(10, rawScore * experienceModifier);
}
