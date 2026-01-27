// Stagnation Detection Service
// Analyzes exercise progress to detect plateaus and suggest modifications

export interface ExerciseLogSummary {
  exercise_id: string;
  weight_kg: number | null;
  reps_completed: number | null;
  created_at: string;
  workout_session_id: string;
}

export interface StagnationAnalysis {
  exerciseId: string;
  exerciseName: string;
  isStagnant: boolean;
  weeksSinceProgress: number;
  currentWeight: number;
  maxWeight: number;
  suggestion: StagnationSuggestion | null;
  trend: 'improving' | 'stable' | 'declining';
  confidence: 'high' | 'medium' | 'low';
}

export interface StagnationSuggestion {
  type: 'increase_volume' | 'change_exercise' | 'deload' | 'increase_intensity';
  title: string;
  description: string;
  actionLabel: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ExerciseAlternative {
  id: string;
  name: string;
  name_es: string | null;
  primary_muscle: string;
  reason: string;
}

// Group logs by session and exercise for analysis
function groupLogsBySession(logs: ExerciseLogSummary[]): Map<string, number[]> {
  const bySession = new Map<string, number[]>();
  
  logs.forEach(log => {
    const weight = log.weight_kg ?? 0;
    if (weight > 0) {
      const existing = bySession.get(log.workout_session_id) || [];
      existing.push(weight);
      bySession.set(log.workout_session_id, existing);
    }
  });
  
  return bySession;
}

// Calculate max weight per session
function getSessionMaxWeights(logs: ExerciseLogSummary[]): { date: string; maxWeight: number }[] {
  const bySession = new Map<string, { date: string; weights: number[] }>();
  
  logs.forEach(log => {
    const weight = log.weight_kg ?? 0;
    if (weight > 0) {
      const existing = bySession.get(log.workout_session_id);
      if (existing) {
        existing.weights.push(weight);
      } else {
        bySession.set(log.workout_session_id, {
          date: log.created_at,
          weights: [weight]
        });
      }
    }
  });
  
  return Array.from(bySession.values())
    .map(session => ({
      date: session.date,
      maxWeight: Math.max(...session.weights)
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Calculate weeks since last weight increase
function calculateWeeksSinceProgress(sessionMaxWeights: { date: string; maxWeight: number }[]): number {
  if (sessionMaxWeights.length < 2) return 0;
  
  const latestMax = sessionMaxWeights[sessionMaxWeights.length - 1].maxWeight;
  let lastProgressDate: Date | null = null;
  
  // Find last time weight increased
  for (let i = sessionMaxWeights.length - 2; i >= 0; i--) {
    if (sessionMaxWeights[i].maxWeight < latestMax) {
      lastProgressDate = new Date(sessionMaxWeights[i + 1].date);
      break;
    }
  }
  
  if (!lastProgressDate) {
    // No progress found - use first session as baseline
    lastProgressDate = new Date(sessionMaxWeights[0].date);
  }
  
  const now = new Date();
  const diffMs = now.getTime() - lastProgressDate.getTime();
  const weeks = diffMs / (1000 * 60 * 60 * 24 * 7);
  
  return Math.floor(weeks);
}

// Determine trend based on recent sessions
function calculateTrend(sessionMaxWeights: { date: string; maxWeight: number }[]): 'improving' | 'stable' | 'declining' {
  if (sessionMaxWeights.length < 3) return 'stable';
  
  const recent = sessionMaxWeights.slice(-3);
  const first = recent[0].maxWeight;
  const last = recent[recent.length - 1].maxWeight;
  
  const diff = last - first;
  const percentChange = (diff / first) * 100;
  
  if (percentChange >= 2) return 'improving';
  if (percentChange <= -2) return 'declining';
  return 'stable';
}

// Generate suggestion based on stagnation analysis
function generateSuggestion(
  weeksSinceProgress: number,
  trend: 'improving' | 'stable' | 'declining',
  sessionCount: number
): StagnationSuggestion | null {
  if (weeksSinceProgress < 2) return null;
  
  // Declining trend with stagnation - needs deload
  if (trend === 'declining' && weeksSinceProgress >= 2) {
    return {
      type: 'deload',
      title: 'Semana de descarga recomendada',
      description: 'Tu rendimiento ha bajado. Una semana al 60% de intensidad puede ayudarte a recuperar.',
      actionLabel: 'Programar descarga',
      priority: 'high',
    };
  }
  
  // Long stagnation - change exercise
  if (weeksSinceProgress >= 4) {
    return {
      type: 'change_exercise',
      title: 'Cambiar ejercicio',
      description: 'Llevas 4+ semanas sin progresar. Cambiar el ejercicio puede estimular nuevas ganancias.',
      actionLabel: 'Ver alternativas',
      priority: 'high',
    };
  }
  
  // Medium stagnation - try volume increase
  if (weeksSinceProgress >= 2 && sessionCount >= 4) {
    return {
      type: 'increase_volume',
      title: 'Aumentar volumen',
      description: 'Añade 1-2 series más durante 2 semanas para superar el estancamiento.',
      actionLabel: 'Aplicar cambio',
      priority: 'medium',
    };
  }
  
  // Early stagnation - increase intensity
  if (weeksSinceProgress >= 2) {
    return {
      type: 'increase_intensity',
      title: 'Intensificar entreno',
      description: 'Prueba técnicas de intensidad como dropsets o rest-pause.',
      actionLabel: 'Ver técnicas',
      priority: 'low',
    };
  }
  
  return null;
}

// Main stagnation analysis function
export function analyzeExerciseStagnation(
  exerciseId: string,
  exerciseName: string,
  logs: ExerciseLogSummary[]
): StagnationAnalysis {
  // Need at least 4 sessions for meaningful analysis
  if (logs.length < 4) {
    return {
      exerciseId,
      exerciseName,
      isStagnant: false,
      weeksSinceProgress: 0,
      currentWeight: logs[logs.length - 1]?.weight_kg ?? 0,
      maxWeight: Math.max(...logs.map(l => l.weight_kg ?? 0)),
      suggestion: null,
      trend: 'stable',
      confidence: 'low',
    };
  }
  
  const sessionMaxWeights = getSessionMaxWeights(logs);
  const weeksSinceProgress = calculateWeeksSinceProgress(sessionMaxWeights);
  const trend = calculateTrend(sessionMaxWeights);
  const currentWeight = sessionMaxWeights[sessionMaxWeights.length - 1]?.maxWeight ?? 0;
  const maxWeight = Math.max(...sessionMaxWeights.map(s => s.maxWeight));
  
  // Stagnant if no progress for 2+ weeks
  const isStagnant = weeksSinceProgress >= 2 || trend === 'declining';
  
  const suggestion = generateSuggestion(weeksSinceProgress, trend, sessionMaxWeights.length);
  
  // Confidence based on data quality
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (sessionMaxWeights.length >= 8) confidence = 'high';
  else if (sessionMaxWeights.length >= 5) confidence = 'medium';
  
  return {
    exerciseId,
    exerciseName,
    isStagnant,
    weeksSinceProgress,
    currentWeight,
    maxWeight,
    suggestion,
    trend,
    confidence,
  };
}

// Find alternative exercises for the same muscle group
export function findAlternativeExercises(
  currentExerciseId: string,
  currentMuscle: string,
  allExercises: Array<{ id: string; name: string; name_es: string | null; primary_muscle: string }>,
  excludeIds: string[] = []
): ExerciseAlternative[] {
  const excluded = new Set([currentExerciseId, ...excludeIds]);
  
  return allExercises
    .filter(e => e.primary_muscle === currentMuscle && !excluded.has(e.id))
    .slice(0, 3)
    .map(e => ({
      id: e.id,
      name: e.name,
      name_es: e.name_es,
      primary_muscle: e.primary_muscle,
      reason: `Mismo grupo muscular (${currentMuscle})`,
    }));
}

// Volume adjustment suggestion
export function suggestVolumeChange(
  currentSets: number,
  currentRepsMin: number,
  currentRepsMax: number,
  stagnationWeeks: number
): { sets: number; repsMin: number; repsMax: number; change: string } {
  if (stagnationWeeks >= 3) {
    // Significant stagnation - bigger change
    return {
      sets: Math.min(currentSets + 2, 6),
      repsMin: currentRepsMin,
      repsMax: currentRepsMax + 2,
      change: `+2 series, +2 reps máx`,
    };
  }
  
  if (stagnationWeeks >= 2) {
    // Mild stagnation - small change
    return {
      sets: Math.min(currentSets + 1, 5),
      repsMin: currentRepsMin,
      repsMax: currentRepsMax,
      change: `+1 serie`,
    };
  }
  
  return {
    sets: currentSets,
    repsMin: currentRepsMin,
    repsMax: currentRepsMax,
    change: 'Sin cambios',
  };
}
