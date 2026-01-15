import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateProfile, useUpdateUserSchedule, useUpdateUserPreferences } from '@/hooks/useProfile';
import { useCreateFoodPreferences } from '@/hooks/useFoodPreferences';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  Target, 
  Dumbbell, 
  Calendar,
  Clock,
  Moon,
  Loader2,
  Wrench,
  Activity,
  Utensils,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

type FitnessGoal = 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
type Gender = 'male' | 'female' | 'other';
type TrainingType = 'gym' | 'calisthenics' | 'running' | 'swimming';
type TrainingStyle = 'weights' | 'calisthenics' | 'mixed';
type EquipmentType = 'barbell' | 'dumbbells' | 'machines' | 'cables' | 'pullup_bar' | 'parallel_bars';
type FoodPreference = 'normal' | 'dont_care' | 'supplements';

interface ExternalActivity {
  name: string;
  day: string;
  time: string;
}

interface OnboardingData {
  // Step 1: Basic info
  gender: Gender | null;
  heightCm: number;
  weightKg: number;
  bodyFatPercentage: number | null;
  dateOfBirth: string;
  
  // Step 2: What to train
  trainingTypes: TrainingType[];
  
  // Step 3: Style & Equipment
  trainingStyle: TrainingStyle;
  availableEquipment: EquipmentType[];
  
  // Step 4: External sports
  externalActivities: ExternalActivity[];
  
  // Step 5: Goals
  fitnessGoal: FitnessGoal;
  secondaryGoals: string[];
  experienceLevel: ExperienceLevel;
  
  // Step 6: Food preferences
  foodPreference: FoodPreference;
  likedFoods: string;
  dislikedFoods: string;
  allergies: string;
  
  // Step 7: Schedule
  workoutDaysPerWeek: number;
  workoutDurationMinutes: number;
  preferredWorkoutTime: string;
  
  // Step 8: Wellbeing
  wakeTime: string;
  sleepTime: string;
  stressLevel: number;
  sleepQuality: number;
}

const INITIAL_DATA: OnboardingData = {
  gender: null,
  heightCm: 175,
  weightKg: 75,
  bodyFatPercentage: null,
  dateOfBirth: '',
  trainingTypes: ['gym'],
  trainingStyle: 'weights',
  availableEquipment: [],
  externalActivities: [],
  fitnessGoal: 'muscle_gain',
  secondaryGoals: [],
  experienceLevel: 'beginner',
  foodPreference: 'normal',
  likedFoods: '',
  dislikedFoods: '',
  allergies: '',
  workoutDaysPerWeek: 4,
  workoutDurationMinutes: 60,
  preferredWorkoutTime: '18:00',
  wakeTime: '07:00',
  sleepTime: '23:00',
  stressLevel: 5,
  sleepQuality: 7,
};

const STEPS = [
  { title: 'Datos físicos', icon: Target },
  { title: 'Qué entrenas', icon: Activity },
  { title: 'Estilo y material', icon: Wrench },
  { title: 'Otros deportes', icon: Dumbbell },
  { title: 'Objetivos', icon: Target },
  { title: 'Comida', icon: Utensils },
  { title: 'Disponibilidad', icon: Calendar },
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
  const createFoodPreferences = useCreateFoodPreferences();

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
      // Update profile with new fields
      await updateProfile.mutateAsync({
        gender: data.gender,
        height_cm: data.heightCm,
        weight_kg: data.weightKg,
        body_fat_percentage: data.bodyFatPercentage,
        date_of_birth: data.dateOfBirth || null,
        fitness_goal: data.fitnessGoal,
        experience_level: data.experienceLevel,
        training_types: data.trainingTypes,
        training_style: data.trainingStyle,
        available_equipment: data.availableEquipment,
        secondary_goals: data.secondaryGoals,
        onboarding_completed: true,
      });

      // Update schedule with external activities
      await updateSchedule.mutateAsync({
        wake_time: data.wakeTime,
        sleep_time: data.sleepTime,
        workout_time: data.preferredWorkoutTime,
        workout_days_per_week: data.workoutDaysPerWeek,
        workout_duration_minutes: data.workoutDurationMinutes,
        external_activities: data.externalActivities.length > 0 
          ? JSON.parse(JSON.stringify(data.externalActivities))
          : {},
      });

      // Update preferences
      await updatePreferences.mutateAsync({
        stress_level: data.stressLevel,
        sleep_quality: data.sleepQuality,
      });

      // Create food preferences
      await createFoodPreferences.mutateAsync({
        preference: data.foodPreference,
        liked_foods: data.likedFoods,
        disliked_foods: data.dislikedFoods,
        allergies: data.allergies,
      });

      toast({
        title: '¡Perfil completado!',
        description: 'Tu plan personalizado está listo.',
      });
      
      navigate('/');
    } catch (error) {
      console.error('Onboarding error:', error);
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
      case 0: return <StepBasicInfo data={data} updateData={updateData} />;
      case 1: return <StepTrainingTypes data={data} updateData={updateData} />;
      case 2: return <StepStyleEquipment data={data} updateData={updateData} />;
      case 3: return <StepExternalSports data={data} updateData={updateData} />;
      case 4: return <StepGoals data={data} updateData={updateData} />;
      case 5: return <StepFoodPreferences data={data} updateData={updateData} />;
      case 6: return <StepSchedule data={data} updateData={updateData} />;
      case 7: return <StepWellbeing data={data} updateData={updateData} />;
      default: return null;
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 0: return data.gender && data.heightCm > 0 && data.weightKg > 0;
      case 1: return data.trainingTypes.length > 0;
      case 2: return data.trainingStyle;
      case 3: return true; // Optional
      case 4: return data.fitnessGoal && data.experienceLevel;
      case 5: return data.foodPreference;
      case 6: return data.workoutDaysPerWeek >= 1 && data.workoutDaysPerWeek <= 7;
      case 7: return true;
      default: return false;
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
            <Button variant="outline" onClick={handleBack} className="flex-1 h-12">
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

      <div className="space-y-2">
        <Label htmlFor="bodyfat" className="text-foreground">Grasa corporal % (opcional)</Label>
        <Input
          id="bodyfat"
          type="number"
          step="0.1"
          placeholder="Ej: 15"
          value={data.bodyFatPercentage ?? ''}
          onChange={e => updateData({ bodyFatPercentage: e.target.value ? Number(e.target.value) : null })}
          className="bg-secondary border-border text-center text-lg"
        />
        <p className="text-xs text-muted-foreground">Ayuda a personalizar mejor tus rutinas</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dob" className="text-foreground">Fecha de nacimiento (opcional)</Label>
        <Input
          id="dob"
          type="date"
          value={data.dateOfBirth}
          onChange={e => updateData({ dateOfBirth: e.target.value })}
          className="bg-secondary border-border"
        />
      </div>
    </div>
  );
};

const StepTrainingTypes: React.FC<StepProps> = ({ data, updateData }) => {
  const options: { value: TrainingType; label: string; emoji: string; desc: string }[] = [
    { value: 'gym', label: 'Gym / Fuerza', emoji: '🏋️', desc: 'Pesas y máquinas' },
    { value: 'calisthenics', label: 'Calistenia', emoji: '🤸', desc: 'Peso corporal' },
    { value: 'running', label: 'Running', emoji: '🏃', desc: 'Correr, cardio' },
    { value: 'swimming', label: 'Natación', emoji: '🏊', desc: 'Nadar' },
  ];

  const toggleType = (type: TrainingType) => {
    const current = data.trainingTypes;
    if (current.includes(type)) {
      updateData({ trainingTypes: current.filter(t => t !== type) });
    } else {
      updateData({ trainingTypes: [...current, type] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">¿Qué quieres entrenar?</h2>
        <p className="text-muted-foreground mt-2">Puedes elegir varios</p>
      </div>

      <div className="space-y-3">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleType(option.value)}
            className={cn(
              'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left',
              data.trainingTypes.includes(option.value)
                ? 'border-primary bg-primary/10'
                : 'border-border bg-secondary hover:border-primary/50'
            )}
          >
            <span className="text-3xl">{option.emoji}</span>
            <div className="flex-1">
              <span className="font-semibold text-foreground block">{option.label}</span>
              <span className="text-sm text-muted-foreground">{option.desc}</span>
            </div>
            {data.trainingTypes.includes(option.value) && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const StepStyleEquipment: React.FC<StepProps> = ({ data, updateData }) => {
  const styles: { value: TrainingStyle; label: string; desc: string }[] = [
    { value: 'weights', label: 'Peso libre', desc: 'Barras, mancuernas, kettlebells' },
    { value: 'calisthenics', label: 'Calistenia', desc: 'Dominadas, fondos, muscle-ups' },
    { value: 'mixed', label: 'Mezcla', desc: 'Combinar todo' },
  ];

  const equipment: { value: EquipmentType; label: string; emoji: string }[] = [
    { value: 'barbell', label: 'Barra olímpica', emoji: '🏋️' },
    { value: 'dumbbells', label: 'Mancuernas', emoji: '💪' },
    { value: 'machines', label: 'Máquinas', emoji: '🎰' },
    { value: 'cables', label: 'Poleas', emoji: '🔗' },
    { value: 'pullup_bar', label: 'Barra de dominadas', emoji: '🧲' },
    { value: 'parallel_bars', label: 'Paralelas', emoji: '➖' },
  ];

  const toggleEquipment = (eq: EquipmentType) => {
    const current = data.availableEquipment;
    if (current.includes(eq)) {
      updateData({ availableEquipment: current.filter(e => e !== eq) });
    } else {
      updateData({ availableEquipment: [...current, eq] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Tu estilo de entreno</h2>
        <p className="text-muted-foreground mt-2">Y el material que tienes disponible</p>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Estilo principal</Label>
        <div className="grid grid-cols-1 gap-2">
          {styles.map(style => (
            <button
              key={style.value}
              type="button"
              onClick={() => updateData({ trainingStyle: style.value })}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                data.trainingStyle === style.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary hover:border-primary/50'
              )}
            >
              <span className="font-semibold text-foreground">{style.label}</span>
              <span className="text-sm text-muted-foreground block">{style.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Material disponible</Label>
        <div className="grid grid-cols-2 gap-2">
          {equipment.map(eq => (
            <button
              key={eq.value}
              type="button"
              onClick={() => toggleEquipment(eq.value)}
              className={cn(
                'p-3 rounded-xl border-2 flex items-center gap-2 transition-all text-left',
                data.availableEquipment.includes(eq.value)
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary hover:border-primary/50'
              )}
            >
              <span className="text-xl">{eq.emoji}</span>
              <span className="text-sm font-medium">{eq.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const StepExternalSports: React.FC<StepProps> = ({ data, updateData }) => {
  const [newActivity, setNewActivity] = useState({ name: '', day: 'monday', time: '18:00' });
  
  const dayOptions = [
    { value: 'monday', label: 'Lunes' },
    { value: 'tuesday', label: 'Martes' },
    { value: 'wednesday', label: 'Miércoles' },
    { value: 'thursday', label: 'Jueves' },
    { value: 'friday', label: 'Viernes' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' },
  ];

  const presets = [
    { name: 'Boxeo', emoji: '🥊' },
    { name: 'Escalada', emoji: '🧗' },
    { name: 'Fútbol', emoji: '⚽' },
    { name: 'Padel', emoji: '🎾' },
    { name: 'Baloncesto', emoji: '🏀' },
  ];

  const addActivity = (name: string) => {
    if (!name.trim()) return;
    updateData({
      externalActivities: [...data.externalActivities, { ...newActivity, name }]
    });
    setNewActivity({ name: '', day: 'monday', time: '18:00' });
  };

  const removeActivity = (idx: number) => {
    updateData({
      externalActivities: data.externalActivities.filter((_, i) => i !== idx)
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Otros deportes</h2>
        <p className="text-muted-foreground mt-2">Añade actividades que ya haces (opcional)</p>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            type="button"
            onClick={() => addActivity(preset.name)}
            className="px-4 py-2 rounded-full border border-border bg-secondary hover:border-primary/50 flex items-center gap-2"
          >
            <span>{preset.emoji}</span>
            <span className="text-sm font-medium">{preset.name}</span>
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="space-y-3 p-4 rounded-xl bg-secondary/50 border border-border">
        <Input
          placeholder="Otro deporte..."
          value={newActivity.name}
          onChange={e => setNewActivity({ ...newActivity, name: e.target.value })}
          className="bg-secondary border-border"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={newActivity.day}
            onChange={e => setNewActivity({ ...newActivity, day: e.target.value })}
            className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
          >
            {dayOptions.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <Input
            type="time"
            value={newActivity.time}
            onChange={e => setNewActivity({ ...newActivity, time: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addActivity(newActivity.name)}
          disabled={!newActivity.name.trim()}
          className="w-full"
        >
          Añadir actividad
        </Button>
      </div>

      {/* Added activities */}
      {data.externalActivities.length > 0 && (
        <div className="space-y-2">
          <Label className="text-foreground">Actividades añadidas</Label>
          {data.externalActivities.map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div>
                <span className="font-medium text-foreground">{activity.name}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  {dayOptions.find(d => d.value === activity.day)?.label} {activity.time}
                </span>
              </div>
              <button
                onClick={() => removeActivity(idx)}
                className="text-destructive text-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
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

  const secondaryOptions = [
    'Más fuerza', 'Más resistencia', 'Más flexibilidad', 'Mejor postura',
    'Reducir estrés', 'Mejorar sueño', 'Más energía', 'Mejor piel'
  ];

  const levels: { value: ExperienceLevel; label: string; desc: string }[] = [
    { value: 'beginner', label: 'Principiante', desc: 'Menos de 1 año' },
    { value: 'intermediate', label: 'Intermedio', desc: '1-3 años' },
    { value: 'advanced', label: 'Avanzado', desc: 'Más de 3 años' },
  ];

  const toggleSecondary = (goal: string) => {
    const current = data.secondaryGoals;
    if (current.includes(goal)) {
      updateData({ secondaryGoals: current.filter(g => g !== goal) });
    } else {
      updateData({ secondaryGoals: [...current, goal] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
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

      <div className="space-y-2">
        <Label className="text-foreground">Objetivos secundarios (opcional)</Label>
        <div className="flex flex-wrap gap-2">
          {secondaryOptions.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleSecondary(opt)}
              className={cn(
                'px-3 py-2 rounded-full text-sm font-medium transition-all',
                data.secondaryGoals.includes(opt)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary border border-border text-muted-foreground hover:border-primary/50'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
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
              <span className="text-xs text-muted-foreground">{level.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const StepFoodPreferences: React.FC<StepProps> = ({ data, updateData }) => {
  const preferences: { value: FoodPreference; label: string; emoji: string; desc: string }[] = [
    { value: 'normal', label: 'Normal', emoji: '🥗', desc: 'Comida equilibrada y variada' },
    { value: 'dont_care', label: 'Me da igual', emoji: '🤷', desc: 'Como lo que sea' },
    { value: 'supplements', label: 'Con suplementos', emoji: '💊', desc: 'Optimizado con suplementación' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Tu alimentación</h2>
        <p className="text-muted-foreground mt-2">Para adaptar las recomendaciones</p>
      </div>

      <div className="space-y-3">
        {preferences.map(pref => (
          <button
            key={pref.value}
            type="button"
            onClick={() => updateData({ foodPreference: pref.value })}
            className={cn(
              'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left',
              data.foodPreference === pref.value
                ? 'border-primary bg-primary/10'
                : 'border-border bg-secondary hover:border-primary/50'
            )}
          >
            <span className="text-3xl">{pref.emoji}</span>
            <div>
              <span className="font-semibold text-foreground block">{pref.label}</span>
              <span className="text-sm text-muted-foreground">{pref.desc}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-foreground">Alimentos que te gustan (opcional)</Label>
          <Textarea
            placeholder="Pollo, arroz, huevos, brócoli..."
            value={data.likedFoods}
            onChange={e => updateData({ likedFoods: e.target.value })}
            className="bg-secondary border-border mt-2"
            rows={2}
          />
        </div>

        <div>
          <Label className="text-foreground">Alimentos que NO te gustan (opcional)</Label>
          <Textarea
            placeholder="Pescado, champiñones..."
            value={data.dislikedFoods}
            onChange={e => updateData({ dislikedFoods: e.target.value })}
            className="bg-secondary border-border mt-2"
            rows={2}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <Label className="text-foreground">Alergias o intolerancias</Label>
          </div>
          <Textarea
            placeholder="Lactosa, gluten, frutos secos..."
            value={data.allergies}
            onChange={e => updateData({ allergies: e.target.value })}
            className="bg-secondary border-border"
            rows={2}
          />
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

const StepWellbeing: React.FC<StepProps> = ({ data, updateData }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Tu bienestar actual</h2>
        <p className="text-muted-foreground mt-2">Para adaptar la intensidad inicial</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <Label className="text-foreground">Hora de despertar</Label>
          <Input
            type="time"
            value={data.wakeTime}
            onChange={e => updateData({ wakeTime: e.target.value })}
            className="bg-secondary border-border mt-2"
          />
        </div>
        <div>
          <Label className="text-foreground">Hora de dormir</Label>
          <Input
            type="time"
            value={data.sleepTime}
            onChange={e => updateData({ sleepTime: e.target.value })}
            className="bg-secondary border-border mt-2"
          />
        </div>
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