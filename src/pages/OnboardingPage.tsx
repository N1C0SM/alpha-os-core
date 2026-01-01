import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateProfile, useUpdateUserSchedule, useUpdateUserPreferences } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  Target, 
  Dumbbell, 
  Calendar,
  Clock,
  Salad,
  Moon,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

type FitnessGoal = 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
type Gender = 'male' | 'female' | 'other';

interface OnboardingData {
  // Step 1: Basic info
  gender: Gender | null;
  dateOfBirth: string;
  heightCm: number;
  weightKg: number;
  
  // Step 2: Goals
  fitnessGoal: FitnessGoal;
  experienceLevel: ExperienceLevel;
  
  // Step 3: Schedule
  workoutDaysPerWeek: number;
  workoutDurationMinutes: number;
  preferredWorkoutTime: string;
  
  // Step 4: Meal times
  wakeTime: string;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  sleepTime: string;
  
  // Step 5: Preferences
  stressLevel: number;
  sleepQuality: number;
}

const INITIAL_DATA: OnboardingData = {
  gender: null,
  dateOfBirth: '',
  heightCm: 175,
  weightKg: 75,
  fitnessGoal: 'muscle_gain',
  experienceLevel: 'beginner',
  workoutDaysPerWeek: 4,
  workoutDurationMinutes: 60,
  preferredWorkoutTime: '18:00',
  wakeTime: '07:00',
  breakfastTime: '08:00',
  lunchTime: '13:00',
  dinnerTime: '20:00',
  sleepTime: '23:00',
  stressLevel: 5,
  sleepQuality: 7,
};

const STEPS = [
  { title: 'Datos físicos', icon: Target },
  { title: 'Objetivos', icon: Dumbbell },
  { title: 'Disponibilidad', icon: Calendar },
  { title: 'Horarios', icon: Clock },
  { title: 'Bienestar', icon: Moon },
];

const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const updateProfile = useUpdateProfile();
  const updateSchedule = useUpdateUserSchedule();
  const updatePreferences = useUpdateUserPreferences();

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    
    try {
      // Update profile
      await updateProfile.mutateAsync({
        gender: data.gender,
        height_cm: data.heightCm,
        weight_kg: data.weightKg,
        fitness_goal: data.fitnessGoal,
        experience_level: data.experienceLevel,
        onboarding_completed: true,
      });

      // Update schedule
      await updateSchedule.mutateAsync({
        wake_time: data.wakeTime,
        sleep_time: data.sleepTime,
        workout_time: data.preferredWorkoutTime,
        breakfast_time: data.breakfastTime,
        lunch_time: data.lunchTime,
        dinner_time: data.dinnerTime,
        workout_days_per_week: data.workoutDaysPerWeek,
        workout_duration_minutes: data.workoutDurationMinutes,
      });

      // Update preferences
      await updatePreferences.mutateAsync({
        stress_level: data.stressLevel,
        sleep_quality: data.sleepQuality,
      });

      toast({
        title: '¡Perfil completado!',
        description: 'Tu plan personalizado está listo.',
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar tu perfil. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepBasicInfo data={data} updateData={updateData} />;
      case 1:
        return <StepGoals data={data} updateData={updateData} />;
      case 2:
        return <StepSchedule data={data} updateData={updateData} />;
      case 3:
        return <StepMealTimes data={data} updateData={updateData} />;
      case 4:
        return <StepWellbeing data={data} updateData={updateData} />;
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 0:
        return data.gender && data.heightCm > 0 && data.weightKg > 0;
      case 1:
        return data.fitnessGoal && data.experienceLevel;
      case 2:
        return data.workoutDaysPerWeek >= 1 && data.workoutDaysPerWeek <= 7;
      case 3:
        return data.wakeTime && data.sleepTime;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Paso {step + 1} de {STEPS.length}
          </span>
          <span className="text-sm font-medium text-primary">
            {STEPS[step].title}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="animate-fade-in">
          {renderStep()}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="p-6 border-t border-border bg-background">
        <div className="flex gap-4">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-12"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Atrás
            </Button>
          )}
          
          {step < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex-1 h-12 bg-primary text-primary-foreground"
            >
              Siguiente
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={loading || !isStepValid()}
              className="flex-1 h-12 bg-primary text-primary-foreground"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Empezar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Step Components
interface StepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const StepBasicInfo: React.FC<StepProps> = ({ data, updateData }) => {
  const genderOptions: { value: Gender; label: string; emoji: string }[] = [
    { value: 'male', label: 'Hombre', emoji: '👨' },
    { value: 'female', label: 'Mujer', emoji: '👩' },
    { value: 'other', label: 'Otro', emoji: '🧑' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Cuéntanos sobre ti</h2>
        <p className="text-muted-foreground mt-2">Necesitamos estos datos para personalizar tu plan</p>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Género</Label>
        <div className="grid grid-cols-3 gap-3">
          {genderOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateData({ gender: option.value })}
              className={cn(
                'p-4 rounded-xl border-2 transition-all',
                data.gender === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary hover:border-primary/50'
              )}
            >
              <span className="text-2xl block mb-1">{option.emoji}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height" className="text-foreground">Altura (cm)</Label>
          <Input
            id="height"
            type="number"
            value={data.heightCm}
            onChange={e => updateData({ heightCm: Number(e.target.value) })}
            className="bg-secondary border-border text-center text-lg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight" className="text-foreground">Peso (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={data.weightKg}
            onChange={e => updateData({ weightKg: Number(e.target.value) })}
            className="bg-secondary border-border text-center text-lg"
          />
        </div>
      </div>
    </div>
  );
};

const StepGoals: React.FC<StepProps> = ({ data, updateData }) => {
  const goals: { value: FitnessGoal; label: string; emoji: string; desc: string }[] = [
    { value: 'muscle_gain', label: 'Ganar músculo', emoji: '💪', desc: 'Hipertrofia y fuerza' },
    { value: 'fat_loss', label: 'Perder grasa', emoji: '🔥', desc: 'Definición manteniendo músculo' },
    { value: 'recomposition', label: 'Recomposición', emoji: '⚖️', desc: 'Ganar músculo y perder grasa' },
    { value: 'maintenance', label: 'Mantener', emoji: '🎯', desc: 'Conservar forma actual' },
  ];

  const levels: { value: ExperienceLevel; label: string; desc: string }[] = [
    { value: 'beginner', label: 'Principiante', desc: 'Menos de 1 año entrenando' },
    { value: 'intermediate', label: 'Intermedio', desc: '1-3 años de experiencia' },
    { value: 'advanced', label: 'Avanzado', desc: 'Más de 3 años entrenando' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">¿Cuál es tu objetivo?</h2>
        <p className="text-muted-foreground mt-2">Adaptaremos todo a tu meta</p>
      </div>

      <div className="space-y-3">
        {goals.map(goal => (
          <button
            key={goal.value}
            type="button"
            onClick={() => updateData({ fitnessGoal: goal.value })}
            className={cn(
              'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left',
              data.fitnessGoal === goal.value
                ? 'border-primary bg-primary/10'
                : 'border-border bg-secondary hover:border-primary/50'
            )}
          >
            <span className="text-3xl">{goal.emoji}</span>
            <div>
              <span className="font-semibold text-foreground block">{goal.label}</span>
              <span className="text-sm text-muted-foreground">{goal.desc}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="pt-4">
        <Label className="text-foreground block mb-3">Nivel de experiencia</Label>
        <div className="grid grid-cols-3 gap-2">
          {levels.map(level => (
            <button
              key={level.value}
              type="button"
              onClick={() => updateData({ experienceLevel: level.value })}
              className={cn(
                'p-3 rounded-xl border-2 transition-all',
                data.experienceLevel === level.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary hover:border-primary/50'
              )}
            >
              <span className="text-sm font-medium block">{level.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const StepSchedule: React.FC<StepProps> = ({ data, updateData }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Tu disponibilidad</h2>
        <p className="text-muted-foreground mt-2">¿Cuánto tiempo puedes dedicar?</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-foreground block mb-3">Días de entreno por semana</Label>
          <div className="flex justify-center gap-2">
            {[2, 3, 4, 5, 6].map(days => (
              <button
                key={days}
                type="button"
                onClick={() => updateData({ workoutDaysPerWeek: days })}
                className={cn(
                  'w-12 h-12 rounded-xl border-2 font-bold transition-all',
                  data.workoutDaysPerWeek === days
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary hover:border-primary/50'
                )}
              >
                {days}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-foreground block mb-3">Duración del entreno</Label>
          <div className="grid grid-cols-3 gap-2">
            {[45, 60, 90].map(mins => (
              <button
                key={mins}
                type="button"
                onClick={() => updateData({ workoutDurationMinutes: mins })}
                className={cn(
                  'p-3 rounded-xl border-2 transition-all',
                  data.workoutDurationMinutes === mins
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-secondary hover:border-primary/50'
                )}
              >
                <span className="font-medium">{mins} min</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="workoutTime" className="text-foreground block mb-2">
            Hora preferida de entreno
          </Label>
          <Input
            id="workoutTime"
            type="time"
            value={data.preferredWorkoutTime}
            onChange={e => updateData({ preferredWorkoutTime: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
      </div>
    </div>
  );
};

const StepMealTimes: React.FC<StepProps> = ({ data, updateData }) => {
  const times = [
    { key: 'wakeTime', label: 'Despertar', icon: '☀️' },
    { key: 'breakfastTime', label: 'Desayuno', icon: '🥞' },
    { key: 'lunchTime', label: 'Almuerzo', icon: '🥗' },
    { key: 'dinnerTime', label: 'Cena', icon: '🍽️' },
    { key: 'sleepTime', label: 'Dormir', icon: '🌙' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Tus horarios</h2>
        <p className="text-muted-foreground mt-2">Para sincronizar comidas y suplementos</p>
      </div>

      <div className="space-y-4">
        {times.map(({ key, label, icon }) => (
          <div key={key} className="flex items-center gap-4">
            <span className="text-2xl w-10">{icon}</span>
            <Label className="flex-1 text-foreground">{label}</Label>
            <Input
              type="time"
              value={data[key]}
              onChange={e => updateData({ [key]: e.target.value })}
              className="w-32 bg-secondary border-border"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const StepWellbeing: React.FC<StepProps> = ({ data, updateData }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Tu bienestar actual</h2>
        <p className="text-muted-foreground mt-2">Para adaptar la intensidad inicial</p>
      </div>

      <div className="space-y-8">
        <div>
          <div className="flex justify-between mb-3">
            <Label className="text-foreground">Nivel de estrés actual</Label>
            <span className="text-primary font-bold">{data.stressLevel}/10</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
              <button
                key={level}
                type="button"
                onClick={() => updateData({ stressLevel: level })}
                className={cn(
                  'flex-1 h-10 rounded-lg transition-all text-sm font-medium',
                  data.stressLevel >= level
                    ? level <= 3 
                      ? 'bg-success text-success-foreground'
                      : level <= 6
                      ? 'bg-warning text-warning-foreground'
                      : 'bg-destructive text-destructive-foreground'
                    : 'bg-secondary'
                )}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Relajado</span>
            <span>Muy estresado</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-3">
            <Label className="text-foreground">Calidad de sueño reciente</Label>
            <span className="text-primary font-bold">{data.sleepQuality}/10</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
              <button
                key={level}
                type="button"
                onClick={() => updateData({ sleepQuality: level })}
                className={cn(
                  'flex-1 h-10 rounded-lg transition-all text-sm font-medium',
                  data.sleepQuality >= level
                    ? level >= 7
                      ? 'bg-success text-success-foreground'
                      : level >= 4
                      ? 'bg-warning text-warning-foreground'
                      : 'bg-destructive text-destructive-foreground'
                    : 'bg-secondary'
                )}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Muy mal</span>
            <span>Excelente</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
