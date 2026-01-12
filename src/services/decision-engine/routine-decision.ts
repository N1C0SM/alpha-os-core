// Routine Decision Service
// Generates personalized workout routines based on user goals and external activities

import { 
  ExternalActivityType, 
  WeeklyExternalActivities, 
  ACTIVITY_MUSCLE_IMPACT 
} from '@/types/schedule';

export interface RoutineDecisionInput {
  fitnessGoal: 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  externalActivities?: WeeklyExternalActivities;
  preferredGymDays?: string[];
  weightKg?: number;
  heightCm?: number;
}

export interface RoutineDay {
  name: string;
  focus: string[];
  exercises: {
    name: string;
    muscleGroup: string;
    sets: number;
    repsMin: number;
    repsMax: number;
    restSeconds: number;
  }[];
  notes?: string;
  avoidMuscles?: string[];
}

export interface RoutineRecommendation {
  name: string;
  description: string;
  splitType: 'push_pull_legs' | 'upper_lower' | 'full_body' | 'bro_split' | 'custom';
  days: RoutineDay[];
  weeklySchedule?: { [day: string]: string }; // day -> routine day name
  externalActivityNotes?: string[];
}

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// ============= Exercise Templates (Gym Bro Optimized) =============

const PUSH_EXERCISES = [
  // Compound strength first - 5x5 style
  { name: 'Press Banca', muscleGroup: 'chest', sets: 5, repsMin: 5, repsMax: 5, restSeconds: 180 },
  { name: 'Press Inclinado Mancuernas', muscleGroup: 'chest', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90 },
  { name: 'Aperturas con Mancuernas', muscleGroup: 'chest', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 },
  { name: 'Press Militar', muscleGroup: 'shoulders', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 120 },
  { name: 'Elevaciones Laterales', muscleGroup: 'shoulders', sets: 4, repsMin: 12, repsMax: 15, restSeconds: 45 },
  { name: 'Fondos en Paralelas', muscleGroup: 'triceps', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
  { name: 'Extensiones Tríceps Polea', muscleGroup: 'triceps', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 },
  { name: 'Press Francés', muscleGroup: 'triceps', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
];

const PULL_EXERCISES = [
  // Heavy compounds first
  { name: 'Dominadas', muscleGroup: 'back', sets: 4, repsMin: 6, repsMax: 10, restSeconds: 120 },
  { name: 'Remo con Barra', muscleGroup: 'back', sets: 5, repsMin: 5, repsMax: 5, restSeconds: 180 },
  { name: 'Jalón al Pecho', muscleGroup: 'back', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
  { name: 'Remo Mancuerna', muscleGroup: 'back', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
  { name: 'Face Pulls', muscleGroup: 'shoulders', sets: 4, repsMin: 15, repsMax: 20, restSeconds: 45 },
  { name: 'Curl Bíceps Barra', muscleGroup: 'biceps', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 60 },
  { name: 'Curl Martillo', muscleGroup: 'biceps', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
  { name: 'Curl Concentrado', muscleGroup: 'biceps', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 45 },
];

const LEG_EXERCISES = [
  // King of exercises first
  { name: 'Sentadilla', muscleGroup: 'quadriceps', sets: 5, repsMin: 5, repsMax: 5, restSeconds: 180 },
  { name: 'Peso Muerto Rumano', muscleGroup: 'hamstrings', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 120 },
  { name: 'Prensa de Piernas', muscleGroup: 'quadriceps', sets: 4, repsMin: 10, repsMax: 12, restSeconds: 90 },
  { name: 'Extensiones de Cuádriceps', muscleGroup: 'quadriceps', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
  { name: 'Curl Femoral', muscleGroup: 'hamstrings', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 },
  { name: 'Hip Thrust', muscleGroup: 'glutes', sets: 4, repsMin: 10, repsMax: 12, restSeconds: 90 },
  { name: 'Elevación de Gemelos', muscleGroup: 'calves', sets: 5, repsMin: 12, repsMax: 20, restSeconds: 45 },
];

const UPPER_EXERCISES = [
  { name: 'Press Banca', muscleGroup: 'chest', sets: 5, repsMin: 5, repsMax: 5, restSeconds: 180 },
  { name: 'Remo con Barra', muscleGroup: 'back', sets: 5, repsMin: 5, repsMax: 5, restSeconds: 180 },
  { name: 'Press Militar', muscleGroup: 'shoulders', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 120 },
  { name: 'Jalón al Pecho', muscleGroup: 'back', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
  { name: 'Face Pulls', muscleGroup: 'shoulders', sets: 3, repsMin: 15, repsMax: 20, restSeconds: 45 },
  { name: 'Curl Bíceps', muscleGroup: 'biceps', sets: 4, repsMin: 10, repsMax: 12, restSeconds: 60 },
  { name: 'Extensiones Tríceps', muscleGroup: 'triceps', sets: 4, repsMin: 10, repsMax: 12, restSeconds: 60 },
];

const LOWER_EXERCISES = [
  { name: 'Sentadilla', muscleGroup: 'quadriceps', sets: 5, repsMin: 5, repsMax: 5, restSeconds: 180 },
  { name: 'Peso Muerto Rumano', muscleGroup: 'hamstrings', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 120 },
  { name: 'Prensa de Piernas', muscleGroup: 'quadriceps', sets: 4, repsMin: 10, repsMax: 12, restSeconds: 90 },
  { name: 'Zancadas', muscleGroup: 'quadriceps', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
  { name: 'Hip Thrust', muscleGroup: 'glutes', sets: 4, repsMin: 10, repsMax: 12, restSeconds: 90 },
  { name: 'Curl Femoral', muscleGroup: 'hamstrings', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 },
  { name: 'Elevación de Gemelos', muscleGroup: 'calves', sets: 5, repsMin: 12, repsMax: 20, restSeconds: 45 },
];

const FULLBODY_A_EXERCISES = [
  { name: 'Sentadilla', muscleGroup: 'quadriceps', sets: 4, repsMin: 5, repsMax: 8, restSeconds: 180 },
  { name: 'Press Banca', muscleGroup: 'chest', sets: 4, repsMin: 6, repsMax: 10, restSeconds: 120 },
  { name: 'Remo con Barra', muscleGroup: 'back', sets: 4, repsMin: 6, repsMax: 10, restSeconds: 120 },
  { name: 'Press Militar', muscleGroup: 'shoulders', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
  { name: 'Face Pulls', muscleGroup: 'shoulders', sets: 3, repsMin: 15, repsMax: 20, restSeconds: 45 },
  { name: 'Curl Bíceps', muscleGroup: 'biceps', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
  { name: 'Extensiones Tríceps', muscleGroup: 'triceps', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
];

const FULLBODY_B_EXERCISES = [
  { name: 'Peso Muerto', muscleGroup: 'hamstrings', sets: 4, repsMin: 5, repsMax: 8, restSeconds: 180 },
  { name: 'Press Inclinado', muscleGroup: 'chest', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90 },
  { name: 'Dominadas', muscleGroup: 'back', sets: 4, repsMin: 6, repsMax: 10, restSeconds: 120 },
  { name: 'Elevaciones Laterales', muscleGroup: 'shoulders', sets: 4, repsMin: 12, repsMax: 15, restSeconds: 45 },
  { name: 'Hip Thrust', muscleGroup: 'glutes', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
  { name: 'Curl Martillo', muscleGroup: 'biceps', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
  { name: 'Fondos', muscleGroup: 'triceps', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
];

// ============= Fatigue Analysis =============

function analyzeFatigue(externalActivities: WeeklyExternalActivities): {
  muscleLoadByDay: { [day: string]: { high: string[]; moderate: string[] } };
  totalCardioLoad: number;
  recommendations: string[];
} {
  const muscleLoadByDay: { [day: string]: { high: string[]; moderate: string[] } } = {};
  let totalCardioLoad = 0;
  const recommendations: string[] = [];

  for (const [day, activity] of Object.entries(externalActivities)) {
    if (!activity) continue;
    
    const impact = ACTIVITY_MUSCLE_IMPACT[activity.activity];
    if (!impact) continue;

    muscleLoadByDay[day] = {
      high: impact.highFatigue,
      moderate: impact.moderateFatigue,
    };

    if (impact.cardiovascularLoad === 'high') totalCardioLoad += 2;
    else if (impact.cardiovascularLoad === 'moderate') totalCardioLoad += 1;
  }

  // Generate recommendations
  const allHighFatigue = Object.values(muscleLoadByDay).flatMap(m => m.high);
  const muscleFrequency: { [muscle: string]: number } = {};
  allHighFatigue.forEach(m => { muscleFrequency[m] = (muscleFrequency[m] || 0) + 1; });

  for (const [muscle, freq] of Object.entries(muscleFrequency)) {
    if (freq >= 2) {
      recommendations.push(`⚠️ ${muscle} trabajado ${freq}x/semana en actividades externas - reducir volumen en gym`);
    }
  }

  if (totalCardioLoad >= 4) {
    recommendations.push('🫀 Alto volumen cardio semanal - considera añadir calorías extra');
  }

  return { muscleLoadByDay, totalCardioLoad, recommendations };
}

// ============= Smart Routine Generator =============

function filterExercises(
  exercises: typeof PUSH_EXERCISES,
  avoidMuscles: string[],
  reduceVolumeMuscles: string[]
): typeof PUSH_EXERCISES {
  return exercises
    .filter(ex => !avoidMuscles.includes(ex.muscleGroup))
    .map(ex => {
      if (reduceVolumeMuscles.includes(ex.muscleGroup)) {
        return { ...ex, sets: Math.max(ex.sets - 1, 2) };
      }
      return ex;
    });
}

function getAdjacentDayFatigue(
  day: string,
  muscleLoadByDay: { [day: string]: { high: string[]; moderate: string[] } }
): { avoid: string[]; reduce: string[] } {
  const dayIndex = DAYS_ORDER.indexOf(day);
  const prevDay = DAYS_ORDER[(dayIndex - 1 + 7) % 7];
  const nextDay = DAYS_ORDER[(dayIndex + 1) % 7];

  const avoid: string[] = [];
  const reduce: string[] = [];

  // Avoid muscles that were heavily worked the day before
  if (muscleLoadByDay[prevDay]) {
    avoid.push(...muscleLoadByDay[prevDay].high);
    reduce.push(...muscleLoadByDay[prevDay].moderate);
  }

  // Also consider if the next day has intense activity
  if (muscleLoadByDay[nextDay]) {
    reduce.push(...muscleLoadByDay[nextDay].high);
  }

  return { avoid: [...new Set(avoid)], reduce: [...new Set(reduce)] };
}

// Calculate body composition category based on weight and height
function getBodyCompositionCategory(weightKg?: number, heightCm?: number): 'light' | 'average' | 'heavy' {
  if (!weightKg || !heightCm) return 'average';
  
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  
  if (bmi < 20) return 'light';
  if (bmi > 27) return 'heavy';
  return 'average';
}

// Adjust volume based on body composition
function getVolumeMultiplier(bodyCategory: 'light' | 'average' | 'heavy', fitnessGoal: string): number {
  // Heavier individuals may need more volume for hypertrophy but less for fat loss
  // Lighter individuals may benefit from slightly higher volume for muscle gain
  if (fitnessGoal === 'muscle_gain') {
    if (bodyCategory === 'light') return 1.15; // Needs more stimulus
    if (bodyCategory === 'heavy') return 0.9;  // Already has base, focus on intensity
    return 1.0;
  }
  if (fitnessGoal === 'fat_loss') {
    if (bodyCategory === 'heavy') return 1.1; // More volume for calorie burn
    if (bodyCategory === 'light') return 0.9; // Preserve muscle, less volume
    return 1.0;
  }
  return 1.0;
}

// Get intensity recommendation based on body composition
function getIntensityAdjustment(bodyCategory: 'light' | 'average' | 'heavy'): { repsAdjust: number; restAdjust: number } {
  if (bodyCategory === 'heavy') {
    // Heavier individuals may need more rest between sets
    return { repsAdjust: 0, restAdjust: 15 };
  }
  if (bodyCategory === 'light') {
    // Lighter individuals can often handle shorter rest
    return { repsAdjust: 1, restAdjust: -10 };
  }
  return { repsAdjust: 0, restAdjust: 0 };
}

export function routineDecision(input: RoutineDecisionInput): RoutineRecommendation {
  const { 
    fitnessGoal, 
    experienceLevel, 
    daysPerWeek, 
    externalActivities = {},
    preferredGymDays = [],
    weightKg,
    heightCm 
  } = input;

  const fatigueAnalysis = analyzeFatigue(externalActivities);
  const gymDays = preferredGymDays.length > 0 ? preferredGymDays : [];
  const actualGymDays = gymDays.length || daysPerWeek;

  // Body composition analysis for personalization
  const bodyCategory = getBodyCompositionCategory(weightKg, heightCm);
  const volumeMultiplier = getVolumeMultiplier(bodyCategory, fitnessGoal);
  const intensityAdjust = getIntensityAdjustment(bodyCategory);

  // Determine best split based on available gym days
  let splitType: RoutineRecommendation['splitType'];
  let baseDays: RoutineDay[];
  let name: string;
  let description: string;

  // With external activities, we need a more flexible approach
  const hasSignificantExternalLoad = Object.keys(externalActivities).length >= 2;

  // Consider gym days from schedule for optimal split selection
  if (actualGymDays <= 2 || (actualGymDays <= 3 && hasSignificantExternalLoad)) {
    splitType = 'full_body';
    name = 'Rutina Full Body';
    description = 'Entrena todo el cuerpo cada sesión, optimizado para complementar tus otras actividades.';
    baseDays = [
      { name: 'Full Body A', focus: ['chest', 'back', 'quadriceps', 'shoulders'], exercises: FULLBODY_A_EXERCISES },
      { name: 'Full Body B', focus: ['hamstrings', 'back', 'chest', 'shoulders'], exercises: FULLBODY_B_EXERCISES },
    ];
  } else if (actualGymDays <= 4) {
    splitType = 'upper_lower';
    name = 'Rutina Upper/Lower';
    description = 'División torso/piernas adaptada a tu agenda de actividades.';
    baseDays = [
      { name: 'Upper (Torso)', focus: ['chest', 'back', 'shoulders', 'biceps', 'triceps'], exercises: UPPER_EXERCISES },
      { name: 'Lower (Piernas)', focus: ['quadriceps', 'hamstrings', 'glutes', 'calves'], exercises: LOWER_EXERCISES },
    ];
  } else {
    splitType = 'push_pull_legs';
    name = 'Rutina Push/Pull/Legs';
    description = 'División clásica por movimientos, ajustada para evitar sobreentrenamiento.';
    baseDays = [
      { name: 'Push (Pecho, Hombros, Tríceps)', focus: ['chest', 'shoulders', 'triceps'], exercises: PUSH_EXERCISES },
      { name: 'Pull (Espalda, Bíceps)', focus: ['back', 'biceps'], exercises: PULL_EXERCISES },
      { name: 'Legs (Piernas)', focus: ['quadriceps', 'hamstrings', 'glutes', 'calves'], exercises: LEG_EXERCISES },
    ];
  }

  // Add personalization notes
  const personalNotes: string[] = [];
  if (weightKg && heightCm) {
    if (bodyCategory === 'light') {
      personalNotes.push('📊 Tu composición corporal sugiere enfoque en volumen moderado-alto para estimular crecimiento');
    } else if (bodyCategory === 'heavy') {
      personalNotes.push('📊 Tu composición corporal sugiere enfoque en intensidad con descansos adecuados');
    }
  }

  // Adjust exercises based on fatigue, goals, and body composition
  const adjustedDays = baseDays.map(day => {
    let exercises = day.exercises;

    // Apply goal-based and body composition adjustments
    exercises = exercises.map(ex => {
      let sets = ex.sets;
      let repsMin = ex.repsMin;
      let repsMax = ex.repsMax;
      let restSeconds = ex.restSeconds;

      switch (fitnessGoal) {
        case 'muscle_gain':
          sets = Math.min(ex.sets + 1, 5);
          repsMin = 8;
          repsMax = 12;
          restSeconds = Math.min(ex.restSeconds + 30, 180);
          break;
        case 'fat_loss':
          repsMin = 12;
          repsMax = 15;
          restSeconds = Math.max(ex.restSeconds - 30, 45);
          break;
        case 'recomposition':
          repsMin = 8;
          repsMax = 12;
          break;
        case 'maintenance':
          sets = Math.max(ex.sets - 1, 2);
          break;
      }

      // Experience level adjustments
      if (experienceLevel === 'beginner') {
        sets = Math.max(sets - 1, 2);
        restSeconds = Math.min(restSeconds + 30, 180);
      } else if (experienceLevel === 'advanced') {
        sets = Math.min(sets + 1, 6);
      }

      // Apply body composition adjustments
      sets = Math.round(sets * volumeMultiplier);
      sets = Math.max(2, Math.min(sets, 6)); // Clamp between 2-6
      repsMax += intensityAdjust.repsAdjust;
      restSeconds = Math.max(30, restSeconds + intensityAdjust.restAdjust);

      return { ...ex, sets, repsMin, repsMax, restSeconds };
    });

    return { ...day, exercises };
  });

  // Create weekly schedule mapping
  const weeklySchedule: { [day: string]: string } = {};
  const notes: string[] = [];

  if (gymDays.length > 0) {
    // Map gym days to routine days, considering fatigue
    let routineDayIndex = 0;
    
    for (const gymDay of gymDays.sort((a, b) => DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b))) {
      const { avoid, reduce } = getAdjacentDayFatigue(gymDay, fatigueAnalysis.muscleLoadByDay);
      
      // Try to pick the best routine day that doesn't conflict with fatigue
      let bestDayIndex = routineDayIndex % adjustedDays.length;
      
      // Check if the current routine day has conflicts
      const routineDay = adjustedDays[bestDayIndex];
      const hasConflict = routineDay.focus.some(f => avoid.includes(f));
      
      if (hasConflict && adjustedDays.length > 1) {
        // Try another routine day
        for (let i = 0; i < adjustedDays.length; i++) {
          const altDay = adjustedDays[i];
          if (!altDay.focus.some(f => avoid.includes(f))) {
            bestDayIndex = i;
            break;
          }
        }
      }

      weeklySchedule[gymDay] = adjustedDays[bestDayIndex].name;

      // Add note if there's reduced volume needed
      if (reduce.length > 0) {
        const reduceMuscles = reduce.filter(m => routineDay.focus.includes(m));
        if (reduceMuscles.length > 0) {
          notes.push(`📋 ${gymDay}: Reduce volumen en ${reduceMuscles.join(', ')} (fatiga del día anterior/siguiente)`);
        }
      }

      routineDayIndex++;
    }
  }

  // Goal labels
  const goalLabels: Record<string, string> = {
    muscle_gain: 'Hipertrofia',
    fat_loss: 'Definición',
    recomposition: 'Recomposición',
    maintenance: 'Mantenimiento',
  };

  return {
    name: `${name} - ${goalLabels[fitnessGoal]}`,
    description,
    splitType,
    days: adjustedDays,
    weeklySchedule: Object.keys(weeklySchedule).length > 0 ? weeklySchedule : undefined,
    externalActivityNotes: [...fatigueAnalysis.recommendations, ...personalNotes, ...notes],
  };
}
