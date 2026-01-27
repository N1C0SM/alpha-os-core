// Proactive Alerts Service
// Generates intelligent, actionable alerts based on user data patterns

export type AlertType = 
  | 'stagnation' 
  | 'consistency' 
  | 'fatigue' 
  | 'nutrition' 
  | 'progress'
  | 'hydration'
  | 'weight_change';

export type AlertPriority = 'high' | 'medium' | 'low';

export interface ProactiveAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
  icon: string;
  color: 'red' | 'yellow' | 'blue' | 'green' | 'purple';
  dismissible: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

interface WorkoutSession {
  id: string;
  date: string;
  completed_at: string | null;
  workout_plan_day_id: string | null;
}

interface ExerciseMaxWeight {
  exercise_id: string;
  functional_max_kg: number;
  consecutive_successful_sessions: number;
  last_feeling: string | null;
  should_progress: boolean;
}

interface MealLog {
  id: string;
  date: string;
  protein: number;
}

// Generate unique alert ID
function generateAlertId(type: AlertType, suffix: string): string {
  return `${type}-${suffix}-${Date.now()}`;
}

// Check training consistency
export function getConsistencyAlerts(
  scheduledDaysPerWeek: number,
  recentSessions: WorkoutSession[],
  weekRange: number = 7
): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];
  
  // Get sessions from last week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - weekRange);
  
  const completedThisWeek = recentSessions.filter(s => {
    const sessionDate = new Date(s.date);
    return sessionDate >= weekAgo && s.completed_at !== null;
  }).length;
  
  const completionRate = scheduledDaysPerWeek > 0 
    ? completedThisWeek / scheduledDaysPerWeek 
    : 0;
  
  if (completionRate < 0.5 && scheduledDaysPerWeek > 0) {
    alerts.push({
      id: generateAlertId('consistency', 'low'),
      type: 'consistency',
      priority: 'high',
      title: 'Entrenos por debajo del objetivo',
      description: `Solo ${completedThisWeek}/${scheduledDaysPerWeek} sesiones esta semana. ¿Ajustamos el plan?`,
      actionLabel: 'Ajustar plan',
      actionPath: '/entreno',
      icon: '⚠️',
      color: 'yellow',
      dismissible: true,
      createdAt: new Date(),
      metadata: { completedThisWeek, scheduledDaysPerWeek, completionRate },
    });
  } else if (completionRate >= 1 && completedThisWeek >= scheduledDaysPerWeek) {
    alerts.push({
      id: generateAlertId('consistency', 'perfect'),
      type: 'consistency',
      priority: 'low',
      title: '¡Semana perfecta! 🎯',
      description: `Completaste ${completedThisWeek}/${scheduledDaysPerWeek} entrenamientos. ¡Sigue así!`,
      icon: '🏆',
      color: 'green',
      dismissible: true,
      createdAt: new Date(),
      metadata: { completedThisWeek, scheduledDaysPerWeek },
    });
  }
  
  return alerts;
}

// Check for stagnation across exercises
export function getStagnationAlerts(
  exerciseMaxWeights: ExerciseMaxWeight[],
  exerciseNames: Record<string, string>
): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];
  
  const stagnantExercises = exerciseMaxWeights.filter(e => 
    e.consecutive_successful_sessions === 0 && 
    e.last_feeling === 'hard'
  );
  
  if (stagnantExercises.length >= 2) {
    const names = stagnantExercises
      .slice(0, 3)
      .map(e => exerciseNames[e.exercise_id] || 'Ejercicio')
      .join(', ');
    
    alerts.push({
      id: generateAlertId('stagnation', 'multiple'),
      type: 'stagnation',
      priority: 'medium',
      title: 'Posible estancamiento detectado',
      description: `${names} - considera cambiar variantes o ajustar volumen`,
      actionLabel: 'Ver sugerencias',
      actionPath: '/entreno',
      icon: '📊',
      color: 'yellow',
      dismissible: true,
      createdAt: new Date(),
      metadata: { exerciseIds: stagnantExercises.map(e => e.exercise_id) },
    });
  }
  
  // Check for exercises ready to progress
  const readyToProgress = exerciseMaxWeights.filter(e => e.should_progress);
  
  if (readyToProgress.length > 0) {
    const names = readyToProgress
      .slice(0, 3)
      .map(e => exerciseNames[e.exercise_id] || 'Ejercicio')
      .join(', ');
    
    alerts.push({
      id: generateAlertId('progress', 'ready'),
      type: 'progress',
      priority: 'low',
      title: '💪 ¡Listo para subir peso!',
      description: `${names} - el sistema sugiere aumentar carga`,
      icon: '📈',
      color: 'green',
      dismissible: true,
      createdAt: new Date(),
      metadata: { exerciseIds: readyToProgress.map(e => e.exercise_id) },
    });
  }
  
  return alerts;
}

// Check nutrition status
export function getNutritionAlerts(
  todayProteinGrams: number,
  targetProteinGrams: number,
  currentHour: number
): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];
  
  // Only alert after midday
  if (currentHour < 12) return alerts;
  
  const proteinPercentage = targetProteinGrams > 0 
    ? (todayProteinGrams / targetProteinGrams) * 100 
    : 0;
  
  // Expected progress based on time of day
  const expectedProgress = ((currentHour - 7) / 14) * 100; // 7am to 9pm
  
  if (currentHour >= 14 && proteinPercentage < expectedProgress * 0.5) {
    alerts.push({
      id: generateAlertId('nutrition', 'protein-low'),
      type: 'nutrition',
      priority: 'medium',
      title: 'Proteína por debajo del objetivo',
      description: `${todayProteinGrams}g / ${targetProteinGrams}g - añade una comida rica en proteína`,
      actionLabel: 'Ver sugerencias',
      actionPath: '/nutricion',
      icon: '🥩',
      color: 'red',
      dismissible: true,
      createdAt: new Date(),
      metadata: { todayProteinGrams, targetProteinGrams, percentage: proteinPercentage },
    });
  }
  
  return alerts;
}

// Check hydration
export function getHydrationAlerts(
  consumedMl: number,
  targetMl: number,
  currentHour: number
): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];
  
  if (currentHour < 10) return alerts;
  
  const percentage = targetMl > 0 ? (consumedMl / targetMl) * 100 : 0;
  const expectedPercentage = ((currentHour - 7) / 14) * 100;
  
  if (percentage < expectedPercentage * 0.6 && currentHour >= 12) {
    const remaining = Math.round((targetMl - consumedMl) / 1000 * 10) / 10;
    
    alerts.push({
      id: generateAlertId('hydration', 'low'),
      type: 'hydration',
      priority: 'medium',
      title: '💧 Hidratación baja',
      description: `Te faltan ${remaining}L para tu objetivo. ¡Bebe agua!`,
      actionLabel: 'Registrar',
      actionPath: '/nutricion',
      icon: '💧',
      color: 'blue',
      dismissible: true,
      createdAt: new Date(),
      metadata: { consumedMl, targetMl, remaining },
    });
  }
  
  return alerts;
}

// Check weight changes for macro adjustment
export function getWeightChangeAlerts(
  currentWeightKg: number | null,
  previousWeightKg: number | null,
  fitnessGoal: string
): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];
  
  if (!currentWeightKg || !previousWeightKg) return alerts;
  
  const change = currentWeightKg - previousWeightKg;
  const absChange = Math.abs(change);
  
  if (absChange >= 0.5) {
    const direction = change > 0 ? 'subido' : 'bajado';
    const isGoodChange = 
      (fitnessGoal === 'muscle_gain' && change > 0) ||
      (fitnessGoal === 'fat_loss' && change < 0);
    
    alerts.push({
      id: generateAlertId('weight_change', direction),
      type: 'weight_change',
      priority: isGoodChange ? 'low' : 'medium',
      title: `Peso ${direction} ${absChange.toFixed(1)}kg`,
      description: isGoodChange 
        ? '¡Buen progreso! Tus macros se han ajustado automáticamente.'
        : 'Macros recalculados según tu nuevo peso.',
      icon: change > 0 ? '⬆️' : '⬇️',
      color: isGoodChange ? 'green' : 'yellow',
      dismissible: true,
      createdAt: new Date(),
      metadata: { currentWeightKg, previousWeightKg, change },
    });
  }
  
  return alerts;
}

// Check recovery/fatigue patterns
export function getFatigueAlerts(
  recentSessions: Array<{ feeling?: string | null; date: string }>
): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];
  
  // Check last 3 sessions
  const lastThree = recentSessions.slice(-3);
  const hardSessions = lastThree.filter(s => s.feeling === 'hard').length;
  
  if (hardSessions >= 2) {
    alerts.push({
      id: generateAlertId('fatigue', 'high'),
      type: 'fatigue',
      priority: 'medium',
      title: 'Señales de fatiga detectadas',
      description: 'Los últimos entrenos han sido duros. Considera un día de descanso extra.',
      icon: '😴',
      color: 'purple',
      dismissible: true,
      createdAt: new Date(),
      metadata: { hardSessions, totalSessions: lastThree.length },
    });
  }
  
  return alerts;
}

// Get all proactive alerts for a user
export function getAllProactiveAlerts(params: {
  scheduledDaysPerWeek: number;
  recentSessions: WorkoutSession[];
  exerciseMaxWeights: ExerciseMaxWeight[];
  exerciseNames: Record<string, string>;
  todayProteinGrams: number;
  targetProteinGrams: number;
  consumedMl: number;
  targetMl: number;
  currentWeightKg: number | null;
  previousWeightKg: number | null;
  fitnessGoal: string;
}): ProactiveAlert[] {
  const currentHour = new Date().getHours();
  
  const allAlerts: ProactiveAlert[] = [
    ...getConsistencyAlerts(params.scheduledDaysPerWeek, params.recentSessions),
    ...getStagnationAlerts(params.exerciseMaxWeights, params.exerciseNames),
    ...getNutritionAlerts(params.todayProteinGrams, params.targetProteinGrams, currentHour),
    ...getHydrationAlerts(params.consumedMl, params.targetMl, currentHour),
    ...getWeightChangeAlerts(params.currentWeightKg, params.previousWeightKg, params.fitnessGoal),
    ...getFatigueAlerts(params.recentSessions),
  ];
  
  // Sort by priority
  const priorityOrder: Record<AlertPriority, number> = { high: 0, medium: 1, low: 2 };
  allAlerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  // Limit to top 3 alerts to avoid overwhelming
  return allAlerts.slice(0, 3);
}
