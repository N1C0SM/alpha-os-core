// Plateau Detection & Prediction Service
// Analyzes workout history to detect stagnation and predict future plateaus

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  history: {
    date: string;
    weight: number;
    reps: number;
    sets: number;
    volume: number; // weight * reps * sets
  }[];
}

export interface PlateauAnalysis {
  exerciseId: string;
  exerciseName: string;
  status: 'progressing' | 'stalling' | 'plateaued' | 'declining';
  weeksSinceProgress: number;
  predictedPlateauIn?: number; // weeks until predicted plateau
  currentTrend: number; // positive = gaining, negative = losing, 0 = flat
  recommendation: string;
  suggestedChanges: string[];
  personalRecord?: {
    weight: number;
    reps: number;
    date: string;
  };
}

export interface OverallProgressAnalysis {
  plateauRisk: 'low' | 'medium' | 'high';
  exercisesAtRisk: PlateauAnalysis[];
  overallTrend: 'improving' | 'maintaining' | 'declining';
  recommendations: string[];
  weeklyVolumeChange: number; // percentage
}

// Analyze exercise progress and detect plateaus
export function analyzeExerciseProgress(progress: ExerciseProgress): PlateauAnalysis {
  const { exerciseId, exerciseName, history } = progress;
  
  if (history.length < 3) {
    return {
      exerciseId,
      exerciseName,
      status: 'progressing',
      weeksSinceProgress: 0,
      currentTrend: 0,
      recommendation: 'Necesitas más datos para analizar tu progreso',
      suggestedChanges: ['Continúa entrenando y registrando tus series'],
    };
  }

  // Sort by date descending (most recent first)
  const sorted = [...history].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Find personal record
  const maxWeight = Math.max(...history.map(h => h.weight));
  const prEntry = history.find(h => h.weight === maxWeight);
  const personalRecord = prEntry ? {
    weight: prEntry.weight,
    reps: prEntry.reps,
    date: prEntry.date,
  } : undefined;

  // Calculate volume trend over last 4 weeks
  const recentHistory = sorted.slice(0, Math.min(8, sorted.length));
  const oldHistory = sorted.slice(Math.min(8, sorted.length));

  const recentAvgVolume = recentHistory.reduce((sum, h) => sum + h.volume, 0) / recentHistory.length;
  const oldAvgVolume = oldHistory.length > 0 
    ? oldHistory.reduce((sum, h) => sum + h.volume, 0) / oldHistory.length 
    : recentAvgVolume;

  const volumeChange = oldAvgVolume > 0 
    ? ((recentAvgVolume - oldAvgVolume) / oldAvgVolume) * 100 
    : 0;

  // Calculate weight trend
  const recentAvgWeight = recentHistory.reduce((sum, h) => sum + h.weight, 0) / recentHistory.length;
  const oldAvgWeight = oldHistory.length > 0 
    ? oldHistory.reduce((sum, h) => sum + h.weight, 0) / oldHistory.length 
    : recentAvgWeight;

  const weightChange = oldAvgWeight > 0 
    ? ((recentAvgWeight - oldAvgWeight) / oldAvgWeight) * 100 
    : 0;

  // Determine status
  let status: PlateauAnalysis['status'];
  let weeksSinceProgress = 0;
  
  // Check for consecutive sessions without weight/rep increase
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].volume <= sorted[i + 1].volume) {
      weeksSinceProgress++;
    } else {
      break;
    }
  }

  if (weightChange > 5 || volumeChange > 10) {
    status = 'progressing';
  } else if (weightChange < -5 || volumeChange < -10) {
    status = 'declining';
  } else if (weeksSinceProgress >= 4) {
    status = 'plateaued';
  } else if (weeksSinceProgress >= 2) {
    status = 'stalling';
  } else {
    status = 'progressing';
  }

  // Generate recommendations based on status
  const { recommendation, suggestedChanges } = generateRecommendations(status, exerciseName, weightChange);

  // Predict plateau (simple linear regression)
  let predictedPlateauIn: number | undefined;
  if (status === 'progressing' && volumeChange > 0 && volumeChange < 5) {
    // Slowing progress - might plateau in 3-4 weeks
    predictedPlateauIn = Math.round(4 - (volumeChange / 2));
  } else if (status === 'stalling') {
    predictedPlateauIn = 1;
  }

  return {
    exerciseId,
    exerciseName,
    status,
    weeksSinceProgress,
    predictedPlateauIn,
    currentTrend: volumeChange,
    recommendation,
    suggestedChanges,
    personalRecord,
  };
}

// Analyze overall workout progress
export function analyzeOverallProgress(
  exerciseProgresses: ExerciseProgress[]
): OverallProgressAnalysis {
  const analyses = exerciseProgresses.map(analyzeExerciseProgress);
  
  // Count exercises by status
  const statusCounts = {
    progressing: 0,
    stalling: 0,
    plateaued: 0,
    declining: 0,
  };
  
  analyses.forEach(a => statusCounts[a.status]++);

  // Determine overall trend
  let overallTrend: OverallProgressAnalysis['overallTrend'];
  const totalExercises = analyses.length;
  
  if (statusCounts.progressing > totalExercises * 0.6) {
    overallTrend = 'improving';
  } else if (statusCounts.declining > totalExercises * 0.3) {
    overallTrend = 'declining';
  } else {
    overallTrend = 'maintaining';
  }

  // Determine plateau risk
  let plateauRisk: OverallProgressAnalysis['plateauRisk'];
  const atRiskCount = statusCounts.stalling + statusCounts.plateaued;
  
  if (atRiskCount > totalExercises * 0.4) {
    plateauRisk = 'high';
  } else if (atRiskCount > totalExercises * 0.2) {
    plateauRisk = 'medium';
  } else {
    plateauRisk = 'low';
  }

  // Get exercises at risk
  const exercisesAtRisk = analyses.filter(
    a => a.status === 'stalling' || a.status === 'plateaued' || a.predictedPlateauIn
  );

  // Calculate weekly volume change
  const totalRecentVolume = exerciseProgresses.reduce((sum, ep) => {
    const recent = ep.history.slice(0, 4).reduce((s, h) => s + h.volume, 0);
    return sum + recent;
  }, 0);

  const totalOldVolume = exerciseProgresses.reduce((sum, ep) => {
    const old = ep.history.slice(4, 8).reduce((s, h) => s + h.volume, 0);
    return sum + old;
  }, 0);

  const weeklyVolumeChange = totalOldVolume > 0 
    ? ((totalRecentVolume - totalOldVolume) / totalOldVolume) * 100 
    : 0;

  // Generate overall recommendations
  const recommendations = generateOverallRecommendations(plateauRisk, overallTrend, exercisesAtRisk);

  return {
    plateauRisk,
    exercisesAtRisk,
    overallTrend,
    recommendations,
    weeklyVolumeChange,
  };
}

function generateRecommendations(
  status: PlateauAnalysis['status'],
  exerciseName: string,
  trend: number
): { recommendation: string; suggestedChanges: string[] } {
  switch (status) {
    case 'progressing':
      return {
        recommendation: `¡Excelente progreso en ${exerciseName}! Mantén el ritmo.`,
        suggestedChanges: [
          'Sigue aumentando peso progresivamente',
          'Asegura descanso adecuado entre sesiones',
        ],
      };
    
    case 'stalling':
      return {
        recommendation: `${exerciseName} muestra señales de estancamiento. Actúa ahora.`,
        suggestedChanges: [
          'Aumenta 1-2 reps antes de subir peso',
          'Considera cambiar el rango de reps',
          'Añade una técnica de intensificación (pausa, tempo)',
          'Revisa tu técnica de ejecución',
        ],
      };
    
    case 'plateaued':
      return {
        recommendation: `Estás en plateau en ${exerciseName}. Cambios necesarios.`,
        suggestedChanges: [
          'Sustituye temporalmente por una variación del ejercicio',
          'Implementa una semana de descarga (50-60% volumen)',
          'Cambia el rango de repeticiones (ej: de 8-12 a 6-8)',
          'Aumenta la frecuencia semanal del grupo muscular',
          'Revisa tu nutrición y sueño',
        ],
      };
    
    case 'declining':
      return {
        recommendation: `${exerciseName} está retrocediendo. Prioriza recuperación.`,
        suggestedChanges: [
          'Toma 4-5 días de descanso del ejercicio',
          'Reduce el volumen total un 30%',
          'Mejora calidad de sueño (7-9 horas)',
          'Aumenta calorías si estás en déficit',
          'Considera posible lesión o fatiga acumulada',
        ],
      };
  }
}

function generateOverallRecommendations(
  risk: 'low' | 'medium' | 'high',
  trend: 'improving' | 'maintaining' | 'declining',
  atRisk: PlateauAnalysis[]
): string[] {
  const recommendations: string[] = [];

  if (risk === 'high') {
    recommendations.push('⚠️ Riesgo alto de estancamiento - Considera una semana de descarga');
    recommendations.push('Revisa tu plan de entrenamiento con el generador de rutinas');
  }

  if (trend === 'declining') {
    recommendations.push('📉 Progreso en declive - Prioriza descanso y recuperación');
    recommendations.push('Asegura 7-9 horas de sueño de calidad');
    recommendations.push('Revisa tu ingesta calórica y proteica');
  }

  if (atRisk.length > 0) {
    const exerciseNames = atRisk.slice(0, 3).map(a => a.exerciseName).join(', ');
    recommendations.push(`🎯 Enfócate en mejorar: ${exerciseNames}`);
  }

  if (trend === 'improving' && risk === 'low') {
    recommendations.push('✨ ¡Excelente progreso! Mantén la consistencia');
    recommendations.push('Considera aumentar ligeramente la intensidad');
  }

  if (recommendations.length === 0) {
    recommendations.push('Continúa con tu plan actual y monitorea tu progreso');
  }

  return recommendations;
}