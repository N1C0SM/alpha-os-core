// Routine Decision Service
// Generates personalized workout routines based on user goals

export interface RoutineDecisionInput {
  fitnessGoal: 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
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
}

export interface RoutineRecommendation {
  name: string;
  description: string;
  splitType: 'push_pull_legs' | 'upper_lower' | 'full_body' | 'bro_split';
  days: RoutineDay[];
}

const PPL_ROUTINE: RoutineDay[] = [
  {
    name: 'Push (Pecho, Hombros, Tríceps)',
    focus: ['chest', 'shoulders', 'triceps'],
    exercises: [
      { name: 'Press Banca', muscleGroup: 'chest', sets: 4, repsMin: 6, repsMax: 10, restSeconds: 120 },
      { name: 'Press Inclinado Mancuernas', muscleGroup: 'chest', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
      { name: 'Press Militar', muscleGroup: 'shoulders', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90 },
      { name: 'Elevaciones Laterales', muscleGroup: 'shoulders', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
      { name: 'Fondos en Paralelas', muscleGroup: 'triceps', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
      { name: 'Extensiones Tríceps Polea', muscleGroup: 'triceps', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 },
    ],
  },
  {
    name: 'Pull (Espalda, Bíceps)',
    focus: ['back', 'biceps'],
    exercises: [
      { name: 'Dominadas', muscleGroup: 'back', sets: 4, repsMin: 6, repsMax: 10, restSeconds: 120 },
      { name: 'Remo con Barra', muscleGroup: 'back', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90 },
      { name: 'Jalón al Pecho', muscleGroup: 'back', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
      { name: 'Remo Mancuerna', muscleGroup: 'back', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
      { name: 'Curl Bíceps Barra', muscleGroup: 'biceps', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 60 },
      { name: 'Curl Martillo', muscleGroup: 'biceps', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 },
    ],
  },
  {
    name: 'Legs (Piernas)',
    focus: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
    exercises: [
      { name: 'Sentadilla', muscleGroup: 'quadriceps', sets: 4, repsMin: 6, repsMax: 10, restSeconds: 180 },
      { name: 'Peso Muerto Rumano', muscleGroup: 'hamstrings', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 120 },
      { name: 'Prensa de Piernas', muscleGroup: 'quadriceps', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 90 },
      { name: 'Curl Femoral', muscleGroup: 'hamstrings', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 },
      { name: 'Hip Thrust', muscleGroup: 'glutes', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 90 },
      { name: 'Elevación de Gemelos', muscleGroup: 'calves', sets: 4, repsMin: 12, repsMax: 20, restSeconds: 60 },
    ],
  },
];

const UPPER_LOWER_ROUTINE: RoutineDay[] = [
  {
    name: 'Upper (Torso)',
    focus: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
    exercises: [
      { name: 'Press Banca', muscleGroup: 'chest', sets: 4, repsMin: 6, repsMax: 10, restSeconds: 120 },
      { name: 'Remo con Barra', muscleGroup: 'back', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90 },
      { name: 'Press Militar', muscleGroup: 'shoulders', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
      { name: 'Jalón al Pecho', muscleGroup: 'back', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
      { name: 'Curl Bíceps', muscleGroup: 'biceps', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
      { name: 'Extensiones Tríceps', muscleGroup: 'triceps', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 },
    ],
  },
  {
    name: 'Lower (Piernas)',
    focus: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
    exercises: [
      { name: 'Sentadilla', muscleGroup: 'quadriceps', sets: 4, repsMin: 6, repsMax: 10, restSeconds: 180 },
      { name: 'Peso Muerto Rumano', muscleGroup: 'hamstrings', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 120 },
      { name: 'Prensa de Piernas', muscleGroup: 'quadriceps', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 90 },
      { name: 'Hip Thrust', muscleGroup: 'glutes', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 90 },
      { name: 'Curl Femoral', muscleGroup: 'hamstrings', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 },
      { name: 'Elevación de Gemelos', muscleGroup: 'calves', sets: 4, repsMin: 12, repsMax: 20, restSeconds: 60 },
    ],
  },
];

const FULLBODY_ROUTINE: RoutineDay[] = [
  {
    name: 'Full Body A',
    focus: ['chest', 'back', 'quadriceps', 'shoulders'],
    exercises: [
      { name: 'Sentadilla', muscleGroup: 'quadriceps', sets: 3, repsMin: 6, repsMax: 10, restSeconds: 180 },
      { name: 'Press Banca', muscleGroup: 'chest', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 120 },
      { name: 'Remo con Barra', muscleGroup: 'back', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
      { name: 'Press Militar', muscleGroup: 'shoulders', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
      { name: 'Curl Bíceps', muscleGroup: 'biceps', sets: 2, repsMin: 10, repsMax: 15, restSeconds: 60 },
      { name: 'Extensiones Tríceps', muscleGroup: 'triceps', sets: 2, repsMin: 10, repsMax: 15, restSeconds: 60 },
    ],
  },
  {
    name: 'Full Body B',
    focus: ['hamstrings', 'back', 'chest', 'shoulders'],
    exercises: [
      { name: 'Peso Muerto', muscleGroup: 'hamstrings', sets: 3, repsMin: 6, repsMax: 10, restSeconds: 180 },
      { name: 'Press Inclinado', muscleGroup: 'chest', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
      { name: 'Dominadas', muscleGroup: 'back', sets: 3, repsMin: 6, repsMax: 10, restSeconds: 120 },
      { name: 'Elevaciones Laterales', muscleGroup: 'shoulders', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
      { name: 'Curl Martillo', muscleGroup: 'biceps', sets: 2, repsMin: 10, repsMax: 15, restSeconds: 60 },
      { name: 'Fondos', muscleGroup: 'triceps', sets: 2, repsMin: 8, repsMax: 12, restSeconds: 90 },
    ],
  },
];

export function routineDecision(input: RoutineDecisionInput): RoutineRecommendation {
  const { fitnessGoal, experienceLevel, daysPerWeek } = input;

  // Determine best split based on days per week and experience
  let splitType: 'push_pull_legs' | 'upper_lower' | 'full_body' | 'bro_split';
  let baseDays: RoutineDay[];
  let name: string;
  let description: string;

  if (daysPerWeek <= 3) {
    // Full body for 2-3 days
    splitType = 'full_body';
    baseDays = FULLBODY_ROUTINE;
    name = 'Rutina Full Body';
    description = 'Entrena todo el cuerpo cada sesión. Ideal para 2-3 días por semana.';
  } else if (daysPerWeek === 4) {
    // Upper/Lower for 4 days
    splitType = 'upper_lower';
    baseDays = UPPER_LOWER_ROUTINE;
    name = 'Rutina Upper/Lower';
    description = 'Divide entre torso y piernas. Ideal para 4 días por semana.';
  } else {
    // PPL for 5-6 days
    splitType = 'push_pull_legs';
    baseDays = PPL_ROUTINE;
    name = 'Rutina Push/Pull/Legs';
    description = 'División clásica por movimientos. Ideal para 5-6 días por semana.';
  }

  // Adjust sets/reps based on goal
  const adjustedDays = baseDays.map(day => ({
    ...day,
    exercises: day.exercises.map(ex => {
      let sets = ex.sets;
      let repsMin = ex.repsMin;
      let repsMax = ex.repsMax;
      let restSeconds = ex.restSeconds;

      switch (fitnessGoal) {
        case 'muscle_gain':
          // More volume
          sets = Math.min(ex.sets + 1, 5);
          repsMin = 8;
          repsMax = 12;
          restSeconds = Math.min(ex.restSeconds + 30, 180);
          break;
        case 'fat_loss':
          // Higher reps, less rest
          repsMin = 12;
          repsMax = 15;
          restSeconds = Math.max(ex.restSeconds - 30, 45);
          break;
        case 'recomposition':
          // Balanced
          repsMin = 8;
          repsMax = 12;
          break;
        case 'maintenance':
          // Lower volume
          sets = Math.max(ex.sets - 1, 2);
          break;
      }

      // Adjust for experience level
      if (experienceLevel === 'beginner') {
        sets = Math.max(sets - 1, 2);
        restSeconds = Math.min(restSeconds + 30, 180);
      } else if (experienceLevel === 'advanced') {
        sets = Math.min(sets + 1, 6);
      }

      return { ...ex, sets, repsMin, repsMax, restSeconds };
    }),
  }));

  // Add goal-specific name suffix
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
  };
}
