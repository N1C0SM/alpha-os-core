// External activity types for schedule management

export type ExternalActivityType = 
  | 'climbing' 
  | 'swimming' 
  | 'running' 
  | 'boxing' 
  | 'cycling' 
  | 'yoga' 
  | 'martial_arts'
  | 'basketball'
  | 'soccer'
  | 'tennis'
  | 'other';

export interface ExternalActivity {
  activity: ExternalActivityType;
  time: string; // HH:mm format
  duration: number; // in minutes
  notes?: string;
}

export type WeeklyExternalActivities = {
  [day: string]: ExternalActivity | null;
};

export const ACTIVITY_LABELS: Record<ExternalActivityType, { label: string; emoji: string }> = {
  climbing: { label: 'Escalada', emoji: '🧗' },
  swimming: { label: 'Natación', emoji: '🏊' },
  running: { label: 'Running', emoji: '🏃' },
  boxing: { label: 'Boxeo', emoji: '🥊' },
  cycling: { label: 'Ciclismo', emoji: '🚴' },
  yoga: { label: 'Yoga', emoji: '🧘' },
  martial_arts: { label: 'Artes Marciales', emoji: '🥋' },
  basketball: { label: 'Baloncesto', emoji: '🏀' },
  soccer: { label: 'Fútbol', emoji: '⚽' },
  tennis: { label: 'Tenis', emoji: '🎾' },
  other: { label: 'Otro', emoji: '🏋️' },
};

// Muscle fatigue mapping for each activity
// This helps the routine generator avoid overworking muscles
export const ACTIVITY_MUSCLE_IMPACT: Record<ExternalActivityType, {
  highFatigue: string[]; // Muscles worked heavily
  moderateFatigue: string[]; // Muscles worked moderately
  cardiovascularLoad: 'low' | 'moderate' | 'high';
}> = {
  climbing: {
    highFatigue: ['back', 'biceps', 'forearms', 'core'],
    moderateFatigue: ['shoulders'],
    cardiovascularLoad: 'moderate',
  },
  swimming: {
    highFatigue: ['back', 'shoulders'],
    moderateFatigue: ['chest', 'triceps', 'core'],
    cardiovascularLoad: 'high',
  },
  running: {
    highFatigue: ['quadriceps', 'hamstrings', 'calves'],
    moderateFatigue: ['glutes', 'core'],
    cardiovascularLoad: 'high',
  },
  boxing: {
    highFatigue: ['shoulders', 'core'],
    moderateFatigue: ['chest', 'triceps', 'back'],
    cardiovascularLoad: 'high',
  },
  cycling: {
    highFatigue: ['quadriceps', 'hamstrings', 'glutes'],
    moderateFatigue: ['calves', 'core'],
    cardiovascularLoad: 'high',
  },
  yoga: {
    highFatigue: [],
    moderateFatigue: ['core'],
    cardiovascularLoad: 'low',
  },
  martial_arts: {
    highFatigue: ['core', 'shoulders'],
    moderateFatigue: ['quadriceps', 'hamstrings', 'back'],
    cardiovascularLoad: 'high',
  },
  basketball: {
    highFatigue: ['quadriceps', 'calves'],
    moderateFatigue: ['shoulders', 'core'],
    cardiovascularLoad: 'high',
  },
  soccer: {
    highFatigue: ['quadriceps', 'hamstrings', 'calves'],
    moderateFatigue: ['glutes', 'core'],
    cardiovascularLoad: 'high',
  },
  tennis: {
    highFatigue: ['shoulders', 'forearms'],
    moderateFatigue: ['core', 'quadriceps'],
    cardiovascularLoad: 'moderate',
  },
  other: {
    highFatigue: [],
    moderateFatigue: [],
    cardiovascularLoad: 'moderate',
  },
};
