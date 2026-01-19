// Routine Decision Service
// Generates 100% personalized workout routines based on user profile and schedule

import { 
  ExternalActivityType, 
  WeeklyExternalActivities, 
  ACTIVITY_MUSCLE_IMPACT 
} from '@/types/schedule';

export type RoutineTemplate = 
  | 'auto' // Auto-select based on profile
  | 'ppl' // Push/Pull/Legs
  | 'ppl_6' // PPL x2 (6 days)
  | 'upper_lower' // Upper/Lower
  | 'upper_lower_ppl' // Upper/Lower + PPL hybrid
  | 'full_body' // Full Body 3x
  | 'bro_split' // Classic Bro Split (5 days)
  | 'arnold' // Arnold Split
  | 'phat'; // PHAT (Power Hypertrophy)

export interface RoutineDecisionInput {
  fitnessGoal: 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  externalActivities?: WeeklyExternalActivities;
  preferredGymDays?: string[];
  weightKg?: number;
  heightCm?: number;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  bodyFatPercentage?: number;
  template?: RoutineTemplate;
}

export interface RoutineExercise {
  name: string;
  muscleGroup: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  notes?: string;
}

export interface RoutineDay {
  name: string;
  focus: string[];
  exercises: RoutineExercise[];
  assignedDay?: string; // Specific weekday (monday, tuesday, etc.)
  notes?: string;
  avoidMuscles?: string[];
}

export interface RoutineRecommendation {
  name: string;
  description: string;
  splitType: 'push_pull_legs' | 'upper_lower' | 'full_body' | 'bro_split' | 'custom';
  days: RoutineDay[];
  weeklySchedule: { [day: string]: string }; // day -> routine day name
  externalActivityNotes: string[];
  personalNotes: string[];
}

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

// ============= Exercise Templates by Goal =============

interface ExerciseTemplate {
  name: string;
  muscleGroup: string;
  baseSets: number;
  baseRepsMin: number;
  baseRepsMax: number;
  baseRest: number;
  isCompound: boolean;
  priority: number; // Lower = more important
}

// Push exercises with priority
const PUSH_EXERCISES: ExerciseTemplate[] = [
  { name: 'Press Banca', muscleGroup: 'chest', baseSets: 4, baseRepsMin: 5, baseRepsMax: 8, baseRest: 180, isCompound: true, priority: 1 },
  { name: 'Press Inclinado Mancuernas', muscleGroup: 'chest', baseSets: 3, baseRepsMin: 8, baseRepsMax: 12, baseRest: 90, isCompound: true, priority: 2 },
  { name: 'Aperturas con Mancuernas', muscleGroup: 'chest', baseSets: 3, baseRepsMin: 10, baseRepsMax: 15, baseRest: 60, isCompound: false, priority: 4 },
  { name: 'Press Militar', muscleGroup: 'shoulders', baseSets: 4, baseRepsMin: 6, baseRepsMax: 10, baseRest: 120, isCompound: true, priority: 1 },
  { name: 'Elevaciones Laterales', muscleGroup: 'shoulders', baseSets: 4, baseRepsMin: 12, baseRepsMax: 15, baseRest: 45, isCompound: false, priority: 3 },
  { name: 'Elevaciones Frontales', muscleGroup: 'shoulders', baseSets: 3, baseRepsMin: 12, baseRepsMax: 15, baseRest: 45, isCompound: false, priority: 5 },
  { name: 'Fondos en Paralelas', muscleGroup: 'triceps', baseSets: 3, baseRepsMin: 8, baseRepsMax: 12, baseRest: 90, isCompound: true, priority: 2 },
  { name: 'Extensiones Tríceps Polea', muscleGroup: 'triceps', baseSets: 3, baseRepsMin: 10, baseRepsMax: 15, baseRest: 60, isCompound: false, priority: 3 },
  { name: 'Press Francés', muscleGroup: 'triceps', baseSets: 3, baseRepsMin: 10, baseRepsMax: 12, baseRest: 60, isCompound: false, priority: 4 },
  { name: 'Patada de Tríceps', muscleGroup: 'triceps', baseSets: 3, baseRepsMin: 12, baseRepsMax: 15, baseRest: 45, isCompound: false, priority: 5 },
];

const PULL_EXERCISES: ExerciseTemplate[] = [
  { name: 'Dominadas', muscleGroup: 'back', baseSets: 4, baseRepsMin: 6, baseRepsMax: 10, baseRest: 120, isCompound: true, priority: 1 },
  { name: 'Remo con Barra', muscleGroup: 'back', baseSets: 4, baseRepsMin: 5, baseRepsMax: 8, baseRest: 180, isCompound: true, priority: 1 },
  { name: 'Jalón al Pecho', muscleGroup: 'back', baseSets: 3, baseRepsMin: 10, baseRepsMax: 12, baseRest: 90, isCompound: true, priority: 2 },
  { name: 'Remo Mancuerna', muscleGroup: 'back', baseSets: 3, baseRepsMin: 10, baseRepsMax: 12, baseRest: 90, isCompound: true, priority: 3 },
  { name: 'Face Pulls', muscleGroup: 'shoulders', baseSets: 4, baseRepsMin: 15, baseRepsMax: 20, baseRest: 45, isCompound: false, priority: 2 },
  { name: 'Curl Bíceps Barra', muscleGroup: 'biceps', baseSets: 3, baseRepsMin: 8, baseRepsMax: 12, baseRest: 60, isCompound: false, priority: 2 },
  { name: 'Curl Martillo', muscleGroup: 'biceps', baseSets: 3, baseRepsMin: 10, baseRepsMax: 12, baseRest: 60, isCompound: false, priority: 3 },
  { name: 'Curl Concentrado', muscleGroup: 'biceps', baseSets: 3, baseRepsMin: 10, baseRepsMax: 15, baseRest: 45, isCompound: false, priority: 4 },
  { name: 'Curl Predicador', muscleGroup: 'biceps', baseSets: 3, baseRepsMin: 10, baseRepsMax: 12, baseRest: 60, isCompound: false, priority: 5 },
];

const LEG_EXERCISES: ExerciseTemplate[] = [
  { name: 'Sentadilla', muscleGroup: 'quadriceps', baseSets: 4, baseRepsMin: 5, baseRepsMax: 8, baseRest: 180, isCompound: true, priority: 1 },
  { name: 'Peso Muerto Rumano', muscleGroup: 'hamstrings', baseSets: 4, baseRepsMin: 8, baseRepsMax: 10, baseRest: 120, isCompound: true, priority: 1 },
  { name: 'Prensa de Piernas', muscleGroup: 'quadriceps', baseSets: 4, baseRepsMin: 10, baseRepsMax: 12, baseRest: 90, isCompound: true, priority: 2 },
  { name: 'Zancadas', muscleGroup: 'quadriceps', baseSets: 3, baseRepsMin: 10, baseRepsMax: 12, baseRest: 90, isCompound: true, priority: 3 },
  { name: 'Extensiones de Cuádriceps', muscleGroup: 'quadriceps', baseSets: 3, baseRepsMin: 12, baseRepsMax: 15, baseRest: 60, isCompound: false, priority: 4 },
  { name: 'Curl Femoral', muscleGroup: 'hamstrings', baseSets: 3, baseRepsMin: 10, baseRepsMax: 15, baseRest: 60, isCompound: false, priority: 3 },
  { name: 'Hip Thrust', muscleGroup: 'glutes', baseSets: 4, baseRepsMin: 10, baseRepsMax: 12, baseRest: 90, isCompound: true, priority: 2 },
  { name: 'Elevación de Gemelos', muscleGroup: 'calves', baseSets: 4, baseRepsMin: 15, baseRepsMax: 20, baseRest: 45, isCompound: false, priority: 3 },
  { name: 'Sentadilla Búlgara', muscleGroup: 'quadriceps', baseSets: 3, baseRepsMin: 8, baseRepsMax: 12, baseRest: 90, isCompound: true, priority: 4 },
];

// ============= Body Composition Analysis =============

interface BodyAnalysis {
  bmi: number;
  category: 'underweight' | 'light' | 'average' | 'overweight' | 'heavy';
  volumeMultiplier: number;
  restAdjustment: number;
  repAdjustment: number;
  notes: string[];
}

function analyzeBody(weightKg?: number, heightCm?: number, gender?: string, age?: number, bodyFatPercentage?: number): BodyAnalysis {
  const notes: string[] = [];
  
  if (!weightKg || !heightCm) {
    return {
      bmi: 22,
      category: 'average',
      volumeMultiplier: 1.0,
      restAdjustment: 0,
      repAdjustment: 0,
      notes: []
    };
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  
  let category: BodyAnalysis['category'];
  let volumeMultiplier = 1.0;
  let restAdjustment = 0;
  let repAdjustment = 0;

  // Use body fat percentage if available for more accurate assessment
  if (bodyFatPercentage !== undefined) {
    if (gender === 'male') {
      if (bodyFatPercentage < 10) {
        category = 'light';
        volumeMultiplier = 1.1;
        repAdjustment = 1;
        restAdjustment = -10;
        notes.push('🎯 Bajo % grasa - prioriza fuerza y volumen moderado-alto');
      } else if (bodyFatPercentage > 25) {
        category = 'heavy';
        volumeMultiplier = 0.9;
        restAdjustment = 20;
        notes.push('⏱️ Descansos más largos para optimizar rendimiento');
        notes.push('🔥 Considera añadir 15-20 min de cardio LISS post-entreno');
      } else if (bodyFatPercentage > 18) {
        category = 'overweight';
        volumeMultiplier = 0.95;
        restAdjustment = 10;
        notes.push('💪 Enfoque en intensidad sobre volumen total');
      } else if (bodyFatPercentage < 12) {
        category = 'light';
        volumeMultiplier = 1.05;
        notes.push('📈 Buen nivel de grasa para maximizar ganancias');
      } else {
        category = 'average';
      }
    } else {
      // Female body fat ranges
      if (bodyFatPercentage < 18) {
        category = 'light';
        volumeMultiplier = 1.05;
        notes.push('🎯 Excelente nivel de grasa corporal');
      } else if (bodyFatPercentage > 35) {
        category = 'heavy';
        volumeMultiplier = 0.9;
        restAdjustment = 20;
        notes.push('🔥 Considera añadir cardio LISS post-entreno');
      } else if (bodyFatPercentage > 28) {
        category = 'overweight';
        volumeMultiplier = 0.95;
        restAdjustment = 10;
        notes.push('💪 Enfoque en intensidad sobre volumen total');
      } else {
        category = 'average';
      }
    }
  } else {
    // Fall back to BMI if no body fat percentage
    if (bmi < 18.5) {
      category = 'underweight';
      volumeMultiplier = 0.85;
      repAdjustment = -1;
      notes.push('🎯 Enfoque en movimientos compuestos pesados con descansos largos');
      notes.push('🍽️ Prioriza superávit calórico para maximizar ganancias');
    } else if (bmi < 21) {
      category = 'light';
      volumeMultiplier = 1.1;
      repAdjustment = 1;
      restAdjustment = -10;
      notes.push('📈 Volumen moderado-alto para maximizar estímulo de crecimiento');
    } else if (bmi >= 27) {
      category = 'heavy';
      volumeMultiplier = 0.9;
      restAdjustment = 20;
      notes.push('⏱️ Descansos más largos para optimizar rendimiento');
      notes.push('🔥 Considera añadir 10-15 min de cardio post-entreno');
    } else if (bmi >= 25) {
      category = 'overweight';
      volumeMultiplier = 0.95;
      restAdjustment = 10;
      notes.push('💪 Enfoque en intensidad sobre volumen total');
    } else {
      category = 'average';
    }
  }

  // Age adjustments
  if (age && age > 40) {
    restAdjustment += 15;
    notes.push('🕐 Calentamiento extendido recomendado (10-15 min)');
  }
  if (age && age < 25) {
    volumeMultiplier *= 1.05;
  }

  // Gender adjustments
  if (gender === 'female') {
    notes.push('🎯 Énfasis en glúteos e isquios para balance muscular');
  }

  return { bmi, category, volumeMultiplier, restAdjustment, repAdjustment, notes };
}

// ============= Fatigue Analysis =============

interface FatigueAnalysis {
  muscleLoadByDay: { [day: string]: { high: string[]; moderate: string[] } };
  totalCardioLoad: number;
  blockedDays: string[];
  recommendations: string[];
}

function analyzeFatigue(externalActivities: WeeklyExternalActivities): FatigueAnalysis {
  const muscleLoadByDay: { [day: string]: { high: string[]; moderate: string[] } } = {};
  let totalCardioLoad = 0;
  const recommendations: string[] = [];
  const blockedDays: string[] = [];

  for (const [day, activity] of Object.entries(externalActivities)) {
    if (!activity) continue;
    
    const impact = ACTIVITY_MUSCLE_IMPACT[activity.activity];
    if (!impact) continue;

    muscleLoadByDay[day] = {
      high: impact.highFatigue,
      moderate: impact.moderateFatigue,
    };

    // High intensity activities block gym
    if (impact.cardiovascularLoad === 'high' && activity.duration >= 60) {
      blockedDays.push(day);
    }

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
    recommendations.push('🫀 Alto volumen cardio semanal - aumenta calorías 200-300kcal');
  }

  return { muscleLoadByDay, totalCardioLoad, blockedDays, recommendations };
}

// ============= Template-Based Split Selection =============

export interface TemplateConfig {
  name: string;
  description: string;
  minDays: number;
  maxDays: number;
  splitType: RoutineRecommendation['splitType'];
  getDays: (availableDays: number) => string[];
}

export const ROUTINE_TEMPLATES: Record<RoutineTemplate, TemplateConfig> = {
  auto: {
    name: 'Auto',
    description: 'Selección automática basada en tu perfil',
    minDays: 2,
    maxDays: 7,
    splitType: 'custom',
    getDays: () => [], // Will be handled by selectOptimalSplit
  },
  ppl: {
    name: 'Push/Pull/Legs',
    description: 'Clásico PPL de 3 días',
    minDays: 3,
    maxDays: 3,
    splitType: 'push_pull_legs',
    getDays: () => ['Push', 'Pull', 'Piernas'],
  },
  ppl_6: {
    name: 'PPL x2',
    description: 'Push/Pull/Legs doble - 6 días',
    minDays: 6,
    maxDays: 6,
    splitType: 'push_pull_legs',
    getDays: () => ['Push', 'Pull', 'Piernas', 'Push 2', 'Pull 2', 'Piernas 2'],
  },
  upper_lower: {
    name: 'Torso/Pierna',
    description: 'Upper/Lower split',
    minDays: 4,
    maxDays: 4,
    splitType: 'upper_lower',
    getDays: () => ['Upper A', 'Lower A', 'Upper B', 'Lower B'],
  },
  upper_lower_ppl: {
    name: 'Upper/Lower + PPL',
    description: 'Híbrido de 5 días',
    minDays: 5,
    maxDays: 5,
    splitType: 'custom',
    getDays: () => ['Upper', 'Lower', 'Push', 'Pull', 'Piernas'],
  },
  full_body: {
    name: 'Full Body',
    description: 'Cuerpo completo 3x semana',
    minDays: 3,
    maxDays: 3,
    splitType: 'full_body',
    getDays: () => ['Full Body A', 'Full Body B', 'Full Body C'],
  },
  bro_split: {
    name: 'Bro Split',
    description: 'Clásico de 5 días por grupo muscular',
    minDays: 5,
    maxDays: 5,
    splitType: 'bro_split',
    getDays: () => ['Pecho', 'Espalda', 'Hombros', 'Piernas', 'Brazos'],
  },
  arnold: {
    name: 'Arnold Split',
    description: 'Split de Arnold Schwarzenegger',
    minDays: 6,
    maxDays: 6,
    splitType: 'custom',
    getDays: () => ['Pecho/Espalda', 'Hombros/Brazos', 'Piernas', 'Pecho/Espalda 2', 'Hombros/Brazos 2', 'Piernas 2'],
  },
  phat: {
    name: 'PHAT',
    description: 'Power Hypertrophy Adaptive Training',
    minDays: 5,
    maxDays: 5,
    splitType: 'custom',
    getDays: () => ['Upper Power', 'Lower Power', 'Espalda/Hombros', 'Piernas Hiper', 'Pecho/Brazos'],
  },
};

function selectTemplateBasedSplit(
  template: RoutineTemplate,
  availableGymDays: number
): { splitType: RoutineRecommendation['splitType']; routineDays: string[] } {
  const config = ROUTINE_TEMPLATES[template];
  return {
    splitType: config.splitType,
    routineDays: config.getDays(availableGymDays),
  };
}

// ============= Smart Split Selection =============

function selectOptimalSplit(
  availableGymDays: number,
  hasSignificantExternalLoad: boolean,
  experienceLevel: string,
  fitnessGoal: string
): { splitType: RoutineRecommendation['splitType']; routineDays: string[] } {
  
  // Beginners benefit from more frequency
  if (experienceLevel === 'beginner') {
    if (availableGymDays <= 3) {
      return { splitType: 'full_body', routineDays: ['Full Body A', 'Full Body B', 'Full Body C'].slice(0, availableGymDays) };
    }
    return { splitType: 'upper_lower', routineDays: ['Upper A', 'Lower A', 'Upper B', 'Lower B'].slice(0, availableGymDays) };
  }

  // With significant external activities, prefer less frequency per muscle
  if (hasSignificantExternalLoad && availableGymDays <= 3) {
    return { splitType: 'full_body', routineDays: ['Full Body A', 'Full Body B', 'Full Body C'].slice(0, availableGymDays) };
  }

  // Fat loss benefits from more frequency (metabolic demand)
  if (fitnessGoal === 'fat_loss' && availableGymDays <= 4) {
    return { splitType: 'upper_lower', routineDays: ['Upper A', 'Lower A', 'Upper B', 'Lower B'].slice(0, availableGymDays) };
  }

  // Muscle gain with enough days = PPL
  if (availableGymDays >= 5) {
    return { 
      splitType: 'push_pull_legs', 
      routineDays: ['Push', 'Pull', 'Piernas', 'Push 2', 'Pull 2', 'Piernas 2'].slice(0, availableGymDays) 
    };
  }
  
  if (availableGymDays >= 4) {
    return { splitType: 'upper_lower', routineDays: ['Upper A', 'Lower A', 'Upper B', 'Lower B'] };
  }

  if (availableGymDays === 3) {
    return { splitType: 'push_pull_legs', routineDays: ['Push', 'Pull', 'Piernas'] };
  }

  return { splitType: 'full_body', routineDays: ['Full Body A', 'Full Body B'] };
}


// ============= Exercise Selection & Adjustment =============

function adjustExercise(
  template: ExerciseTemplate, 
  bodyAnalysis: BodyAnalysis,
  fitnessGoal: string,
  experienceLevel: string
): RoutineExercise {
  let sets = template.baseSets;
  let repsMin = template.baseRepsMin;
  let repsMax = template.baseRepsMax;
  let restSeconds = template.baseRest;

  // Goal adjustments
  switch (fitnessGoal) {
    case 'muscle_gain':
      if (template.isCompound) {
        sets = Math.min(sets + 1, 5);
        restSeconds = Math.min(restSeconds + 30, 180);
      } else {
        repsMin = 10;
        repsMax = 15;
      }
      break;
    case 'fat_loss':
      repsMin = Math.max(repsMin, 12);
      repsMax = Math.min(repsMax + 3, 20);
      restSeconds = Math.max(restSeconds - 30, 30);
      sets = Math.max(sets - 1, 2);
      break;
    case 'recomposition':
      repsMin = 8;
      repsMax = 12;
      break;
    case 'maintenance':
      sets = Math.max(sets - 1, 2);
      break;
  }

  // Experience adjustments
  if (experienceLevel === 'beginner') {
    sets = Math.max(sets - 1, 2);
    restSeconds = Math.min(restSeconds + 30, 180);
  } else if (experienceLevel === 'advanced') {
    sets = Math.min(sets + 1, 6);
  }

  // Body composition adjustments
  sets = Math.round(sets * bodyAnalysis.volumeMultiplier);
  sets = Math.max(2, Math.min(sets, 6));
  repsMax += bodyAnalysis.repAdjustment;
  restSeconds = Math.max(30, Math.min(restSeconds + bodyAnalysis.restAdjustment, 300));

  return {
    name: template.name,
    muscleGroup: template.muscleGroup,
    sets,
    repsMin,
    repsMax,
    restSeconds,
  };
}

function selectExercisesForDay(
  dayType: string,
  bodyAnalysis: BodyAnalysis,
  fitnessGoal: string,
  experienceLevel: string,
  avoidMuscles: string[],
  reduceMuscles: string[]
): RoutineExercise[] {
  let templates: ExerciseTemplate[] = [];
  const dayLower = dayType.toLowerCase();
  
  // Select base templates by day type
  if (dayLower.includes('push')) {
    templates = [...PUSH_EXERCISES];
  } else if (dayLower.includes('pull')) {
    templates = [...PULL_EXERCISES];
  } else if (dayLower.includes('pierna') || dayLower.includes('lower') || dayLower.includes('leg')) {
    templates = [...LEG_EXERCISES];
  } else if (dayLower.includes('upper') && dayLower.includes('power')) {
    // PHAT Upper Power - heavy compounds
    templates = [
      ...PUSH_EXERCISES.filter(e => e.isCompound),
      ...PULL_EXERCISES.filter(e => e.isCompound),
    ].map(e => ({ ...e, baseSets: e.baseSets + 1, baseRepsMin: 3, baseRepsMax: 5, baseRest: 180 }));
  } else if (dayLower.includes('lower') && dayLower.includes('power')) {
    // PHAT Lower Power - heavy compounds
    templates = [...LEG_EXERCISES.filter(e => e.isCompound)]
      .map(e => ({ ...e, baseSets: e.baseSets + 1, baseRepsMin: 3, baseRepsMax: 5, baseRest: 180 }));
  } else if (dayLower.includes('upper')) {
    // Mix of push and pull for upper
    templates = [
      ...PUSH_EXERCISES.filter(e => e.priority <= 3),
      ...PULL_EXERCISES.filter(e => e.priority <= 3),
    ].sort((a, b) => a.priority - b.priority);
  } else if (dayLower.includes('full')) {
    // Full body = compound focus
    templates = [
      ...LEG_EXERCISES.filter(e => e.priority <= 2),
      ...PUSH_EXERCISES.filter(e => e.priority <= 2),
      ...PULL_EXERCISES.filter(e => e.priority <= 2),
    ].sort((a, b) => a.priority - b.priority);
  } else if (dayLower.includes('pecho') && dayLower.includes('espalda')) {
    // Arnold split - Chest/Back
    templates = [
      ...PUSH_EXERCISES.filter(e => e.muscleGroup === 'chest'),
      ...PULL_EXERCISES.filter(e => e.muscleGroup === 'back'),
    ];
  } else if (dayLower.includes('hombros') && dayLower.includes('brazos')) {
    // Arnold split - Shoulders/Arms
    templates = [
      ...PUSH_EXERCISES.filter(e => e.muscleGroup === 'shoulders' || e.muscleGroup === 'triceps'),
      ...PULL_EXERCISES.filter(e => e.muscleGroup === 'biceps'),
    ];
  } else if (dayLower.includes('pecho')) {
    // Bro split - Chest day
    templates = [...PUSH_EXERCISES.filter(e => e.muscleGroup === 'chest')];
    // Add some triceps work
    templates.push(...PUSH_EXERCISES.filter(e => e.muscleGroup === 'triceps').slice(0, 2));
  } else if (dayLower.includes('espalda')) {
    // Bro split - Back day
    templates = [...PULL_EXERCISES.filter(e => e.muscleGroup === 'back')];
    // Add some biceps work
    templates.push(...PULL_EXERCISES.filter(e => e.muscleGroup === 'biceps').slice(0, 2));
  } else if (dayLower.includes('hombros')) {
    // Bro split - Shoulders day
    templates = [...PUSH_EXERCISES.filter(e => e.muscleGroup === 'shoulders')];
    // Add rear delts
    templates.push(...PULL_EXERCISES.filter(e => e.name.includes('Face')));
  } else if (dayLower.includes('brazos')) {
    // Bro split - Arms day
    templates = [
      ...PUSH_EXERCISES.filter(e => e.muscleGroup === 'triceps'),
      ...PULL_EXERCISES.filter(e => e.muscleGroup === 'biceps'),
    ];
  } else if (dayLower.includes('hiper')) {
    // PHAT Hypertrophy day - higher reps
    templates = [...LEG_EXERCISES]
      .map(e => ({ ...e, baseRepsMin: 10, baseRepsMax: 15, baseRest: 60 }));
  }

  // Filter out avoided muscles
  templates = templates.filter(t => !avoidMuscles.includes(t.muscleGroup));
  
  // Reduce sets for fatigued muscles
  templates = templates.map(t => {
    if (reduceMuscles.includes(t.muscleGroup)) {
      return { ...t, baseSets: Math.max(t.baseSets - 1, 2) };
    }
    return t;
  });

  // Sort by priority and select appropriate number
  templates.sort((a, b) => a.priority - b.priority);
  
  // Limit exercises based on experience
  const maxExercises = experienceLevel === 'beginner' ? 5 : 
                       experienceLevel === 'intermediate' ? 7 : 8;
  
  templates = templates.slice(0, maxExercises);

  return templates.map(t => adjustExercise(t, bodyAnalysis, fitnessGoal, experienceLevel));
}

// ============= Main Routine Generator =============

export function routineDecision(input: RoutineDecisionInput): RoutineRecommendation {
  const { 
    fitnessGoal, 
    experienceLevel, 
    daysPerWeek, 
    externalActivities = {},
    preferredGymDays = [],
    weightKg,
    heightCm,
    gender,
    age,
    bodyFatPercentage,
    template = 'auto'
  } = input;

  // Analyze user body composition (now includes body fat %)
  const bodyAnalysis = analyzeBody(weightKg, heightCm, gender, age, bodyFatPercentage);
  
  // Analyze external activities
  const fatigueAnalysis = analyzeFatigue(externalActivities);
  
  // Determine available gym days
  const availableGymDays = preferredGymDays.length > 0 
    ? preferredGymDays.filter(d => !fatigueAnalysis.blockedDays.includes(d))
    : DAYS_ORDER.filter(d => !fatigueAnalysis.blockedDays.includes(d)).slice(0, daysPerWeek);

  const hasSignificantExternalLoad = Object.keys(externalActivities).length >= 2;

  // Select split based on template or auto-select
  let splitType: RoutineRecommendation['splitType'];
  let routineDays: string[];
  
  if (template !== 'auto') {
    const templateResult = selectTemplateBasedSplit(template, availableGymDays.length);
    splitType = templateResult.splitType;
    routineDays = templateResult.routineDays;
  } else {
    const autoResult = selectOptimalSplit(
      availableGymDays.length,
      hasSignificantExternalLoad,
      experienceLevel,
      fitnessGoal
    );
    splitType = autoResult.splitType;
    routineDays = autoResult.routineDays;
  }

  // Create weekly schedule - assign routine days to specific weekdays
  const weeklySchedule: { [day: string]: string } = {};
  const sortedGymDays = availableGymDays.sort((a, b) => 
    DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b)
  );

  // Create routine days with assigned weekdays
  const routineDaysData: RoutineDay[] = [];
  const personalNotes: string[] = [...bodyAnalysis.notes];

  for (let i = 0; i < Math.min(routineDays.length, sortedGymDays.length); i++) {
    const dayName = routineDays[i];
    const assignedDay = sortedGymDays[i];
    
    // Get muscles to avoid/reduce based on adjacent day fatigue
    const prevDay = DAYS_ORDER[(DAYS_ORDER.indexOf(assignedDay) - 1 + 7) % 7];
    const nextDay = DAYS_ORDER[(DAYS_ORDER.indexOf(assignedDay) + 1) % 7];
    
    const avoidMuscles: string[] = [];
    const reduceMuscles: string[] = [];
    
    if (fatigueAnalysis.muscleLoadByDay[prevDay]) {
      avoidMuscles.push(...fatigueAnalysis.muscleLoadByDay[prevDay].high);
      reduceMuscles.push(...fatigueAnalysis.muscleLoadByDay[prevDay].moderate);
    }
    if (fatigueAnalysis.muscleLoadByDay[nextDay]) {
      reduceMuscles.push(...fatigueAnalysis.muscleLoadByDay[nextDay].high);
    }

    // Get focus muscles based on day type
    let focus: string[] = [];
    if (dayName.toLowerCase().includes('push')) {
      focus = ['chest', 'shoulders', 'triceps'];
    } else if (dayName.toLowerCase().includes('pull')) {
      focus = ['back', 'biceps'];
    } else if (dayName.toLowerCase().includes('pierna') || dayName.toLowerCase().includes('lower') || dayName.toLowerCase().includes('leg')) {
      focus = ['quadriceps', 'hamstrings', 'glutes', 'calves'];
    } else if (dayName.toLowerCase().includes('upper')) {
      focus = ['chest', 'back', 'shoulders', 'biceps', 'triceps'];
    } else {
      focus = ['full_body'];
    }

    const exercises = selectExercisesForDay(
      dayName,
      bodyAnalysis,
      fitnessGoal,
      experienceLevel,
      [...new Set(avoidMuscles)],
      [...new Set(reduceMuscles)]
    );

    // Add notes if there are adjustments
    let dayNotes: string | undefined;
    if (avoidMuscles.length > 0) {
      dayNotes = `⚡ Volumen reducido por actividad del ${DAY_LABELS[prevDay] || prevDay}`;
    }

    routineDaysData.push({
      name: dayName,
      focus,
      exercises,
      assignedDay,
      notes: dayNotes,
      avoidMuscles: [...new Set(avoidMuscles)],
    });

    weeklySchedule[assignedDay] = dayName;
  }

  // Generate personalized description and NAME
  const goalLabels: Record<string, string> = {
    muscle_gain: 'Hipertrofia',
    fat_loss: 'Definición',
    recomposition: 'Recomposición',
    maintenance: 'Mantenimiento',
  };

  const splitLabels: Record<string, string> = {
    push_pull_legs: 'Push/Pull/Legs',
    upper_lower: 'Torso/Pierna',
    full_body: 'Full Body',
    bro_split: 'Bro Split',
    custom: 'Híbrida',
  };

  // Generate meaningful name based on goal, split, and user context
  // NEVER use generic names like "Personalizado" or "Custom"
  const generateRoutineName = (): string => {
    const goalEmoji = {
      muscle_gain: '💪',
      fat_loss: '🔥',
      recomposition: '⚡',
      maintenance: '✅',
    }[fitnessGoal];

    const levelAdjective = {
      beginner: 'Fundamental',
      intermediate: 'Avanzado',
      advanced: 'Elite',
    }[experienceLevel];

    // Context-aware naming
    if (hasSignificantExternalLoad) {
      return `${goalEmoji} ${goalLabels[fitnessGoal]} + Atleta Activo`;
    }

    if (availableGymDays.length <= 3) {
      return `${goalEmoji} ${goalLabels[fitnessGoal]} Express (${availableGymDays.length}d)`;
    }

    if (template !== 'auto') {
      return `${goalEmoji} ${ROUTINE_TEMPLATES[template].name} - ${goalLabels[fitnessGoal]}`;
    }

    return `${goalEmoji} ${levelAdjective} ${splitLabels[splitType]}`;
  };

  // Build description
  let description = `${splitLabels[splitType]} diseñada para ${goalLabels[fitnessGoal].toLowerCase()}. `;
  
  if (weightKg && heightCm) {
    description += `Ajustada a tu composición (${weightKg}kg). `;
  }
  
  const assignedDaysList = routineDaysData
    .filter(d => d.assignedDay)
    .map(d => DAY_LABELS[d.assignedDay!])
    .join(', ');
  description += `Días: ${assignedDaysList}.`;

  // Add external activity notes
  if (Object.keys(externalActivities).length > 0) {
    personalNotes.push('📅 Adaptada a tus deportes externos');
  }

  return {
    name: generateRoutineName(),
    description,
    splitType,
    days: routineDaysData,
    weeklySchedule,
    externalActivityNotes: fatigueAnalysis.recommendations,
    personalNotes,
  };
}
