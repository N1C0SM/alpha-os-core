// Progression Decision Service
// Analyzes completed sets to determine weight progression

export interface ExerciseLogData {
  weight_kg: number | null;
  reps_completed: number | null;
  is_warmup: boolean | null;
  set_number: number;
}

export interface ProgressionInput {
  exerciseId: string;
  exerciseName: string;
  targetRepsMin: number;
  targetRepsMax: number;
  targetSets: number;
  lastSessionLogs: ExerciseLogData[];
  previousSessionLogs?: ExerciseLogData[]; // For trend analysis
}

export interface ProgressionSuggestion {
  shouldProgress: boolean;
  currentWeight: number;
  suggestedWeight: number;
  progressionAmount: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  streak?: number; // Number of consecutive sessions at target
}

// Standard progression increments based on exercise type
const PROGRESSION_INCREMENTS = {
  compound_upper: 2.5, // Bench, OHP, Rows
  compound_lower: 5.0, // Squat, Deadlift
  isolation: 1.25,     // Curls, extensions
  default: 2.5,
};

// Exercises that use larger increments
const COMPOUND_LOWER_EXERCISES = [
  'sentadilla', 'peso muerto', 'prensa', 'hip thrust',
  'squat', 'deadlift', 'leg press'
];

const ISOLATION_EXERCISES = [
  'curl', 'extension', 'elevacion', 'face pull', 'apertura',
  'lateral raise', 'fly', 'kickback'
];

function getProgressionIncrement(exerciseName: string): number {
  const nameLower = exerciseName.toLowerCase();
  
  if (COMPOUND_LOWER_EXERCISES.some(e => nameLower.includes(e))) {
    return PROGRESSION_INCREMENTS.compound_lower;
  }
  if (ISOLATION_EXERCISES.some(e => nameLower.includes(e))) {
    return PROGRESSION_INCREMENTS.isolation;
  }
  return PROGRESSION_INCREMENTS.default;
}

export function progressionDecision(input: ProgressionInput): ProgressionSuggestion {
  const { 
    exerciseName, 
    targetRepsMin, 
    targetRepsMax, 
    targetSets, 
    lastSessionLogs,
    previousSessionLogs 
  } = input;

  // Filter out warmup sets
  const workingSets = lastSessionLogs.filter(log => !log.is_warmup);
  
  if (workingSets.length === 0) {
    return {
      shouldProgress: false,
      currentWeight: 0,
      suggestedWeight: 0,
      progressionAmount: 0,
      reason: 'No hay datos de la última sesión',
      confidence: 'low',
    };
  }

  // Get the most common weight used (main working weight)
  const weights = workingSets
    .map(s => s.weight_kg)
    .filter((w): w is number => w !== null && w > 0);
  
  if (weights.length === 0) {
    return {
      shouldProgress: false,
      currentWeight: 0,
      suggestedWeight: 0,
      progressionAmount: 0,
      reason: 'No hay registros de peso',
      confidence: 'low',
    };
  }

  const currentWeight = Math.max(...weights);
  const progressionIncrement = getProgressionIncrement(exerciseName);

  // Check if all working sets hit target reps
  const completedSets = workingSets.filter(set => {
    const reps = set.reps_completed ?? 0;
    return reps >= targetRepsMax;
  });

  const allSetsCompleted = completedSets.length >= targetSets;
  const mostSetsCompleted = completedSets.length >= Math.ceil(targetSets * 0.8); // 80%+

  // Check previous session for streak calculation
  let streak = 0;
  if (previousSessionLogs) {
    const prevWorkingSets = previousSessionLogs.filter(log => !log.is_warmup);
    const prevCompleted = prevWorkingSets.filter(set => 
      (set.reps_completed ?? 0) >= targetRepsMax
    );
    if (prevCompleted.length >= targetSets) {
      streak = 1;
    }
  }

  // Decision logic
  if (allSetsCompleted) {
    // Perfect session - definitely progress
    return {
      shouldProgress: true,
      currentWeight,
      suggestedWeight: currentWeight + progressionIncrement,
      progressionAmount: progressionIncrement,
      reason: `¡Todas las series completadas con ${targetRepsMax} reps! 💪`,
      confidence: 'high',
      streak: streak + 1,
    };
  }

  if (mostSetsCompleted) {
    // Almost there - suggest trying same weight or small increase
    return {
      shouldProgress: true,
      currentWeight,
      suggestedWeight: currentWeight + (progressionIncrement / 2),
      progressionAmount: progressionIncrement / 2,
      reason: `${completedSets.length}/${targetSets} series al máximo. Micro-progresión sugerida.`,
      confidence: 'medium',
    };
  }

  // Check if struggling (less than 50% of sets completed)
  const struggling = completedSets.length < targetSets / 2;
  
  if (struggling) {
    return {
      shouldProgress: false,
      currentWeight,
      suggestedWeight: currentWeight,
      progressionAmount: 0,
      reason: `Mantén ${currentWeight}kg hasta completar todas las series`,
      confidence: 'high',
    };
  }

  // Middle ground - keep current weight
  return {
    shouldProgress: false,
    currentWeight,
    suggestedWeight: currentWeight,
    progressionAmount: 0,
    reason: `${completedSets.length}/${targetSets} series completadas. ¡Casi lo tienes!`,
    confidence: 'medium',
  };
}

// Helper to get suggested weight for an exercise based on history
export function getSuggestedWeightForExercise(
  exerciseName: string,
  lastWeight: number,
  allSetsCompleted: boolean
): number {
  if (!allSetsCompleted || lastWeight === 0) {
    return lastWeight;
  }
  
  const increment = getProgressionIncrement(exerciseName);
  return lastWeight + increment;
}
