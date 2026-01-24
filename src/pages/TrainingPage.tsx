import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Play, Plus, Loader2, ChevronRight, Trash2, Calendar, Clock, PencilLine, Check, X, Sparkles, CalendarDays, Flame, Crown } from 'lucide-react';
import PreWorkoutModal from '@/components/workout/PreWorkoutModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useWorkoutPlans,
  useCreateWorkoutPlan,
  useExercises,
  useCreateWorkoutDay,
  useAddExerciseToPlan,
  useWorkoutSessions,
  useStartWorkoutSession,
  useDeleteWorkoutDay,
  useUpdateWorkoutDay,
  useDeleteWorkoutPlanExercise,
  useDeleteWorkoutPlan,
  useUpdateWorkoutPlan,
  useUpdateWorkoutPlanExercise,
} from '@/hooks/useWorkouts';
import { useProfile, useUserSchedule, useUpdateUserSchedule } from '@/hooks/useProfile';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { routineDecision, ROUTINE_TEMPLATES, RoutineTemplate } from '@/services/decision-engine/routine-decision';
import { WeeklyExternalActivities, ACTIVITY_MUSCLE_IMPACT, ExternalActivity } from '@/types/schedule';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import RoutineExerciseEditor from '@/components/workout/RoutineExerciseEditor';

const WEEKDAYS = [
  { id: 'monday', name: 'Lunes', short: 'L' },
  { id: 'tuesday', name: 'Martes', short: 'M' },
  { id: 'wednesday', name: 'Miércoles', short: 'X' },
  { id: 'thursday', name: 'Jueves', short: 'J' },
  { id: 'friday', name: 'Viernes', short: 'V' },
  { id: 'saturday', name: 'Sábado', short: 'S' },
  { id: 'sunday', name: 'Domingo', short: 'D' },
];

const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Pecho' },
  { id: 'back', name: 'Espalda' },
  { id: 'shoulders', name: 'Hombros' },
  { id: 'biceps', name: 'Bíceps' },
  { id: 'triceps', name: 'Tríceps' },
  { id: 'quadriceps', name: 'Cuádriceps' },
  { id: 'hamstrings', name: 'Isquios' },
  { id: 'glutes', name: 'Glúteos' },
  { id: 'calves', name: 'Gemelos' },
  { id: 'core', name: 'Core' },
];

const TrainingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'routines' | 'history'>('routines');
  const [isNewRoutineOpen, setIsNewRoutineOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [viewingRoutine, setViewingRoutine] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingDayName, setEditingDayName] = useState('');
  const [editingRoutineName, setEditingRoutineName] = useState(false);
  const [routineNameValue, setRoutineNameValue] = useState('');

  const [newRoutineName, setNewRoutineName] = useState('');
  const [newDayName, setNewDayName] = useState('');
  const [searchExercise, setSearchExercise] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<RoutineTemplate>('auto');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTrainingDays, setSelectedTrainingDays] = useState<string[]>([]);
  
  // Pre-workout modal state
  const [preWorkoutDayId, setPreWorkoutDayId] = useState<string | null>(null);
  const [isStartingRoutineWorkout, setIsStartingRoutineWorkout] = useState(false);
  
  // Subscription limits
  const { canCreateRoutine, routineCount, routineLimit, isPremium, routinesRemaining } = useSubscriptionLimits();

  const { data: workoutPlans, isLoading } = useWorkoutPlans();
  const { data: exercises } = useExercises();
  const { data: sessions } = useWorkoutSessions();
  const { data: profile } = useProfile();
  const { data: schedule } = useUserSchedule();
  const updateSchedule = useUpdateUserSchedule();
  const createPlan = useCreateWorkoutPlan();
  const createDay = useCreateWorkoutDay();
  const addExercise = useAddExerciseToPlan();
  const startSession = useStartWorkoutSession();
  const updateDay = useUpdateWorkoutDay();
  const deleteDay = useDeleteWorkoutDay();
  const deletePlanExercise = useDeleteWorkoutPlanExercise();
  const deletePlan = useDeleteWorkoutPlan();
  const updatePlan = useUpdateWorkoutPlan();
  const updatePlanExercise = useUpdateWorkoutPlanExercise();
  const { toast } = useToast();

  // Analyze external activities for blocked/fatigued days
  const { blockedDays, partialFatigueDays } = useMemo(() => {
    const blocked: string[] = [];
    const partialFatigue: { [day: string]: string[] } = {};
    
    if (!schedule?.external_activities) return { blockedDays: blocked, partialFatigueDays: partialFatigue };
    
    const activities = schedule.external_activities as unknown as WeeklyExternalActivities;
    
    for (const [day, activity] of Object.entries(activities)) {
      if (!activity) continue;
      const typedActivity = activity as ExternalActivity;
      const impact = ACTIVITY_MUSCLE_IMPACT[typedActivity.activity];
      if (!impact) continue;
      
      // High cardio + long duration blocks the day
      if (impact.cardiovascularLoad === 'high' && typedActivity.duration >= 60) {
        blocked.push(day);
      } else if (impact.highFatigue.length > 0) {
        partialFatigue[day] = impact.highFatigue;
      }
    }
    
    return { blockedDays: blocked, partialFatigueDays: partialFatigue };
  }, [schedule?.external_activities]);

  // Auto-select optimal training days based on template and schedule
  const selectOptimalDays = (template: RoutineTemplate, requiredDays: number, maxDays: number): string[] => {
    const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const availableDays = ALL_DAYS.filter(d => !blockedDays.includes(d));
    
    // Optimal distribution patterns for different day counts
    const OPTIMAL_PATTERNS: { [key: number]: number[][] } = {
      3: [[0, 2, 4], [0, 2, 5], [1, 3, 5]], // L-X-V, L-X-S, M-J-S (48h recovery)
      4: [[0, 1, 3, 4], [0, 2, 3, 5], [1, 2, 4, 5]], // L-M-J-V, L-X-J-S
      5: [[0, 1, 2, 3, 4], [0, 1, 3, 4, 5]], // L-M-X-J-V
      6: [[0, 1, 2, 3, 4, 5]], // L-M-X-J-V-S
    };
    
    const targetDays = requiredDays;
    const patterns = OPTIMAL_PATTERNS[targetDays] || [[0, 1, 2, 3, 4, 5, 6].slice(0, targetDays)];
    
    // Find best pattern that fits available days
    for (const pattern of patterns) {
      const selectedDays = pattern.map(idx => ALL_DAYS[idx]);
      const allAvailable = selectedDays.every(d => availableDays.includes(d));
      
      if (allAvailable) {
        return selectedDays;
      }
    }
    
    // Fallback: pick first N available days with best spacing
    const result: string[] = [];
    for (let i = 0; i < availableDays.length && result.length < targetDays; i++) {
      const day = availableDays[i];
      const dayIndex = ALL_DAYS.indexOf(day);
      
      // Check if adding this day maintains good spacing (at least 1 day gap when possible)
      if (result.length === 0) {
        result.push(day);
      } else {
        const lastDayIndex = ALL_DAYS.indexOf(result[result.length - 1]);
        // Prefer at least 1 day gap for recovery, but accept consecutive if needed
        if (dayIndex - lastDayIndex >= 1 || availableDays.length - i <= targetDays - result.length) {
          result.push(day);
        }
      }
    }
    
    // If we still don't have enough, add remaining available days
    while (result.length < targetDays && result.length < availableDays.length) {
      const nextDay = availableDays.find(d => !result.includes(d));
      if (nextDay) result.push(nextDay);
    }
    
    return result.sort((a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b));
  };

  // Auto-select days when template changes
  useEffect(() => {
    if (isNewRoutineOpen && selectedTemplate !== 'auto') {
      const config = ROUTINE_TEMPLATES[selectedTemplate];
      const optimalDays = selectOptimalDays(selectedTemplate, config.minDays, config.maxDays);
      setSelectedTrainingDays(optimalDays);
    } else if (isNewRoutineOpen && selectedTemplate === 'auto') {
      // For auto template, use schedule preferred days or calculate based on profile
      const preferredDays = schedule?.preferred_workout_days || [];
      const availableDays = preferredDays.filter((d: string) => !blockedDays.includes(d));
      if (availableDays.length >= 3) {
        setSelectedTrainingDays(availableDays);
      } else {
        const optimalDays = selectOptimalDays('auto', 3, 6);
        setSelectedTrainingDays(optimalDays);
      }
    }
  }, [isNewRoutineOpen, selectedTemplate, blockedDays, schedule?.preferred_workout_days]);

  // Get template requirements
  const templateConfig = ROUTINE_TEMPLATES[selectedTemplate];
  const requiredDays = templateConfig?.minDays || 3;
  const maxDays = templateConfig?.maxDays || 6;
  const daysMatch = selectedTrainingDays.length >= requiredDays && selectedTrainingDays.length <= maxDays;

  const toggleTrainingDay = (day: string) => {
    setSelectedTrainingDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  // AUTOPILOT: No empty workouts. This triggers AI routine creation
  const handleCreateRoutineWithAI = async () => {
    if (!canCreateRoutine) {
      setShowUpgradeModal(true);
      return;
    }
    setIsNewRoutineOpen(true);
    // Auto-trigger AI generation with optimal template
    setTimeout(() => handleGenerateRoutine('auto'), 100);
  };

  const handleStartRoutineWorkout = async (dayId: string, includeWarmup: boolean, warmupSets: any[]) => {
    setIsStartingRoutineWorkout(true);
    try {
      const session = await startSession.mutateAsync(dayId);
      // Pass warmup info via URL params
      const warmupParam = includeWarmup && warmupSets.length > 0 
        ? `&warmup=${encodeURIComponent(JSON.stringify(warmupSets))}`
        : '';
      navigate(`/entreno/activo?session=${session.id}&dayId=${dayId}${warmupParam}`);
    } catch (error) {
      toast({ title: 'Error al iniciar', variant: 'destructive' });
    } finally {
      setIsStartingRoutineWorkout(false);
      setPreWorkoutDayId(null);
    }
  };


  const handleCreateRoutine = async () => {
    if (!newRoutineName.trim()) return;
    if (!canCreateRoutine) {
      setIsNewRoutineOpen(false);
      setShowUpgradeModal(true);
      return;
    }
    try {
      const plan = await createPlan.mutateAsync({ name: newRoutineName, split_type: 'custom' });
      setNewRoutineName('');
      setIsNewRoutineOpen(false);
      setViewingRoutine(plan.id);
      toast({ title: 'Rutina creada' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleGenerateRoutine = async (template: RoutineTemplate = 'auto') => {
    if (!canCreateRoutine) {
      setIsNewRoutineOpen(false);
      setShowUpgradeModal(true);
      return;
    }
    if (!profile) {
      toast({ title: 'Configura tu perfil primero', variant: 'destructive' });
      return;
    }

    // Validate days match template requirements
    if (!daysMatch) {
      toast({ 
        title: 'Selecciona los días correctos', 
        description: `${templateConfig.name} requiere ${requiredDays === maxDays ? requiredDays : `${requiredDays}-${maxDays}`} días`,
        variant: 'destructive' 
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Save selected training days to user schedule
      await updateSchedule.mutateAsync({
        preferred_workout_days: selectedTrainingDays,
        workout_days_per_week: selectedTrainingDays.length
      });

      const externalActivities = schedule?.external_activities && typeof schedule.external_activities === 'object' && !Array.isArray(schedule.external_activities) 
        ? schedule.external_activities as any
        : {};
      
      // Calculate age from date_of_birth
      let age: number | undefined;
      if (profile.date_of_birth) {
        const dob = new Date(profile.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
      }
      
      const recommendation = routineDecision({
        fitnessGoal: (profile.fitness_goal as 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance') || 'muscle_gain',
        experienceLevel: (profile.experience_level as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
        daysPerWeek: selectedTrainingDays.length,
        externalActivities,
        preferredGymDays: selectedTrainingDays,
        weightKg: profile.weight_kg || undefined,
        heightCm: profile.height_cm || undefined,
        gender: profile.gender || undefined,
        age,
        bodyFatPercentage: profile.body_fat_percentage || undefined,
        template,
      });

      // Create the plan
      const plan = await createPlan.mutateAsync({
        name: recommendation.name,
        description: recommendation.description,
        split_type: recommendation.splitType,
        days_per_week: selectedTrainingDays.length,
      });

      // Create days with exercises and assigned weekdays
      for (let i = 0; i < recommendation.days.length; i++) {
        const dayData = recommendation.days[i];
        
        // Create day with assigned weekday
        const day = await createDay.mutateAsync({
          workout_plan_id: plan.id,
          name: dayData.name,
          day_number: i + 1,
          focus: dayData.focus as any[],
          assigned_weekdays: dayData.assignedDay ? [dayData.assignedDay] : [],
        });

        // Find matching exercises from DB and add them
        for (const ex of dayData.exercises) {
          // Better matching: try exact match first, then partial
          const matchingExercise = exercises?.find(
            e => e.name_es?.toLowerCase() === ex.name.toLowerCase() ||
                 e.name?.toLowerCase() === ex.name.toLowerCase()
          ) || exercises?.find(
            e => e.name_es?.toLowerCase().includes(ex.name.toLowerCase().split(' ')[0]) ||
                 e.name?.toLowerCase().includes(ex.name.toLowerCase().split(' ')[0])
          );
          
          if (matchingExercise) {
            await addExercise.mutateAsync({
              workout_plan_day_id: day.id,
              exercise_id: matchingExercise.id,
              sets: ex.sets,
              reps_min: ex.repsMin,
              reps_max: ex.repsMax,
              rest_seconds: ex.restSeconds,
            });
          }
        }
      }

      setIsNewRoutineOpen(false);
      setViewingRoutine(plan.id);
      
      // Show comprehensive feedback
      const allNotes = [...(recommendation.externalActivityNotes || []), ...(recommendation.personalNotes || [])];
      if (allNotes.length > 0) {
        toast({ 
          title: '¡Rutina 100% personalizada creada!', 
          description: `${recommendation.description}\n\n${allNotes.slice(0, 2).join('\n')}`,
        });
      } else {
        toast({ title: '¡Rutina 100% personalizada creada!', description: recommendation.description });
      }
    } catch (error) {
      console.error('Error generating routine:', error);
      toast({ title: 'Error al generar rutina', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddDay = async (routineId: string) => {
    if (!newDayName.trim()) return;
    const routine = workoutPlans?.find(p => p.id === routineId);
    const dayNumber = (routine?.workout_plan_days?.length || 0) + 1;

    try {
      await createDay.mutateAsync({
        workout_plan_id: routineId,
        name: newDayName,
        day_number: dayNumber,
      });
      setNewDayName('');
      toast({ title: 'Día añadido' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleAddExercise = async (exerciseId: string) => {
    if (!selectedDayId) return;
    try {
      await addExercise.mutateAsync({
        workout_plan_day_id: selectedDayId,
        exercise_id: exerciseId,
      });
      toast({ title: 'Ejercicio añadido' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleStartEditDay = (dayId: string, currentName: string) => {
    setEditingDayId(dayId);
    setEditingDayName(currentName);
  };

  const handleCancelEditDay = () => {
    setEditingDayId(null);
    setEditingDayName('');
  };

  const handleSaveDayName = async () => {
    if (!editingDayId) return;
    if (!editingDayName.trim()) return;

    try {
      await updateDay.mutateAsync({ dayId: editingDayId, name: editingDayName.trim() });
      toast({ title: 'Día actualizado' });
      handleCancelEditDay();
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar el día', variant: 'destructive' });
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    try {
      await deleteDay.mutateAsync({ dayId });
      toast({ title: 'Día eliminado' });
      if (selectedDayId === dayId) setSelectedDayId(null);
      if (editingDayId === dayId) handleCancelEditDay();
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar el día', variant: 'destructive' });
    }
  };

  const handleDeleteExerciseFromDay = async (planExerciseId: string) => {
    try {
      await deletePlanExercise.mutateAsync({ planExerciseId });
      toast({ title: 'Ejercicio eliminado' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar el ejercicio', variant: 'destructive' });
    }
  };

  const handleUpdateExercise = async (
    planExerciseId: string, 
    updates: { sets?: number; repsMin?: number; repsMax?: number; restSeconds?: number }
  ) => {
    try {
      await updatePlanExercise.mutateAsync({ planExerciseId, ...updates });
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar el ejercicio', variant: 'destructive' });
    }
  };

  const handleDeleteRoutine = async (planId: string) => {
    try {
      await deletePlan.mutateAsync({ planId });
      toast({ title: 'Rutina eliminada' });
      setViewingRoutine(null);
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar la rutina', variant: 'destructive' });
    }
  };

  const currentRoutine = workoutPlans?.find(p => p.id === viewingRoutine);

  // Get exercises for pre-workout modal
  const preWorkoutDay = currentRoutine?.workout_plan_days?.find(d => d.id === preWorkoutDayId);
  const preWorkoutExercises = useMemo(() => {
    if (!preWorkoutDay?.workout_plan_exercises) return [];
    return preWorkoutDay.workout_plan_exercises.map(ex => ({
      id: ex.id,
      name: ex.exercises?.name_es || ex.exercises?.name || 'Ejercicio',
      sets: ex.sets || 3,
      repsMin: ex.reps_min || 8,
      repsMax: ex.reps_max || 12,
    }));
  }, [preWorkoutDay]);

  const filteredExercises = useMemo(() => {
    return exercises?.filter(ex => {
      const matchesSearch = !searchExercise ||
        ex.name_es?.toLowerCase().includes(searchExercise.toLowerCase()) ||
        ex.name?.toLowerCase().includes(searchExercise.toLowerCase());
      const matchesMuscle = !selectedMuscle || ex.primary_muscle === selectedMuscle;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchExercise, selectedMuscle]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Viewing a specific routine
  if (currentRoutine) {
    return (
      <div className="px-4 py-6 safe-top">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setViewingRoutine(null)}
            className="text-muted-foreground"
          >
            ← Atrás
          </Button>
        </div>
        
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {editingRoutineName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={routineNameValue}
                  onChange={(e) => setRoutineNameValue(e.target.value)}
                  className="text-xl font-bold bg-secondary border-border"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-primary shrink-0"
                  onClick={() => {
                    if (routineNameValue.trim()) {
                      updatePlan.mutate({ planId: currentRoutine.id, name: routineNameValue.trim() });
                    }
                    setEditingRoutineName(false);
                  }}
                  disabled={updatePlan.isPending || !routineNameValue.trim()}
                  aria-label="Guardar nombre"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingRoutineName(false)}
                  aria-label="Cancelar"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground truncate">{currentRoutine.name}</h1>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setRoutineNameValue(currentRoutine.name);
                    setEditingRoutineName(true);
                  }}
                  aria-label="Editar nombre"
                >
                  <PencilLine className="w-4 h-4" />
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {currentRoutine.workout_plan_days?.length || 0} días de entreno
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive shrink-0"
            onClick={() => handleDeleteRoutine(currentRoutine.id)}
            disabled={deletePlan.isPending}
            aria-label="Eliminar rutina"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Days list */}
        <div className="space-y-3 mb-6">
          {currentRoutine.workout_plan_days?.sort((a, b) => a.day_number - b.day_number).map((day) => {
            const isEditing = editingDayId === day.id;

            return (
              <div key={day.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingDayName}
                          onChange={(e) => setEditingDayName(e.target.value)}
                          className="bg-secondary border-border"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-primary"
                          onClick={handleSaveDayName}
                          disabled={updateDay.isPending || !editingDayName.trim()}
                          aria-label="Guardar nombre del día"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleCancelEditDay}
                          aria-label="Cancelar edición"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{day.name}</h3>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleStartEditDay(day.id, day.name)}
                          aria-label="Editar día"
                        >
                          <PencilLine className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDeleteDay(day.id)}
                          disabled={deleteDay.isPending}
                          aria-label="Eliminar día"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-primary"
                    onClick={() => {
                      setSelectedDayId(day.id);
                      setIsAddExerciseOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ejercicio
                  </Button>
                </div>

                {/* Weekday assignment - multi-select chips */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {WEEKDAYS.map((wd) => {
                      const assignedDays = (day as any).assigned_weekdays || [];
                      const isSelected = assignedDays.includes(wd.id);
                      return (
                        <button
                          key={wd.id}
                          type="button"
                          onClick={() => {
                            const currentDays = [...(assignedDays as string[])];
                            const newDays = isSelected
                              ? currentDays.filter(d => d !== wd.id)
                              : [...currentDays, wd.id];
                            updateDay.mutate({ 
                              dayId: day.id, 
                              assignedWeekdays: newDays.length > 0 ? newDays : null 
                            });
                          }}
                          className={cn(
                            "px-2 py-1 text-xs rounded-full border transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50"
                          )}
                        >
                          {wd.short}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {day.workout_plan_exercises && day.workout_plan_exercises.length > 0 ? (
                  <div className="space-y-2">
                    {day.workout_plan_exercises.map((ex) => (
                      <RoutineExerciseEditor
                        key={ex.id}
                        exerciseId={ex.exercise_id}
                        planExerciseId={ex.id}
                        name={ex.exercises?.name_es || ex.exercises?.name || 'Ejercicio'}
                        sets={ex.sets || 3}
                        repsMin={ex.reps_min || 8}
                        repsMax={ex.reps_max || 12}
                        restSeconds={ex.rest_seconds || 90}
                        onUpdate={(updates) => handleUpdateExercise(ex.id, updates)}
                        onDelete={() => handleDeleteExerciseFromDay(ex.id)}
                        isDeleting={deletePlanExercise.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin ejercicios</p>
                )}

                {/* Start workout button */}
                {day.workout_plan_exercises && day.workout_plan_exercises.length > 0 && (
                  <Button
                    onClick={() => setPreWorkoutDayId(day.id)}
                    className="w-full mt-3 bg-primary text-primary-foreground"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Empezar Entreno
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add new day */}
        <div className="bg-card rounded-xl border border-dashed border-border p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nombre del día (ej: Pecho y Tríceps)"
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              className="bg-secondary border-border"
            />
            <Button 
              onClick={() => handleAddDay(currentRoutine.id)}
              disabled={!newDayName.trim() || createDay.isPending}
              className="bg-primary text-primary-foreground shrink-0"
            >
              {createDay.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Add Exercise Dialog */}
        <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
          <DialogContent className="bg-card border-border max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Añadir ejercicio</DialogTitle>
              <DialogDescription>Busca y selecciona ejercicios</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 pt-2">
              <Input
                placeholder="Buscar ejercicio..."
                value={searchExercise}
                onChange={(e) => setSearchExercise(e.target.value)}
                className="bg-secondary border-border"
              />
              
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedMuscle(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                    !selectedMuscle ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  )}
                >
                  Todos
                </button>
                {MUSCLE_GROUPS.map((muscle) => (
                  <button
                    key={muscle.id}
                    onClick={() => setSelectedMuscle(muscle.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                      selectedMuscle === muscle.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {muscle.name}
                  </button>
                ))}
              </div>
            </div>
            
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-2 py-2">
                {filteredExercises?.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleAddExercise(ex.id)}
                    disabled={addExercise.isPending}
                    className="w-full flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors text-left"
                  >
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {ex.name_es || ex.name}
                      </span>
                      <p className="text-xs text-muted-foreground capitalize">
                        {MUSCLE_GROUPS.find(m => m.id === ex.primary_muscle)?.name || ex.primary_muscle}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-primary" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Pre-Workout Modal */}
        <PreWorkoutModal
          isOpen={!!preWorkoutDayId}
          onClose={() => setPreWorkoutDayId(null)}
          onStartWorkout={(includeWarmup, warmupSets) => 
            handleStartRoutineWorkout(preWorkoutDayId!, includeWarmup, warmupSets)
          }
          dayName={preWorkoutDay?.name || ''}
          exercises={preWorkoutExercises}
          isStarting={isStartingRoutineWorkout}
        />
      </div>
    );
  }

  // Main view
  return (
    <div className="px-4 py-6 safe-top">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Entrenamiento</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('routines')}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === 'routines' 
              ? "bg-card text-foreground shadow-sm" 
              : "text-muted-foreground"
          )}
        >
          Mis Rutinas
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === 'history' 
              ? "bg-card text-foreground shadow-sm" 
              : "text-muted-foreground"
          )}
        >
          Historial
        </button>
      </div>

      {activeTab === 'routines' && (
        <>
          {/* Auto routine generation - AUTOPILOT */}
          <Button 
            className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mb-6 text-base font-semibold shadow-lg"
            onClick={() => {
              if (!canCreateRoutine && (!workoutPlans || workoutPlans.length === 0)) {
                setShowUpgradeModal(true);
                return;
              }
              // If user has no routine, create one with AI
              if (!workoutPlans || workoutPlans.length === 0) {
                setIsNewRoutineOpen(true);
                // Auto-trigger AI generation
                setTimeout(() => handleGenerateRoutine('auto'), 100);
              } else {
                // Find today's workout from existing routine
                const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                const activeRoutine = workoutPlans[0];
                const todayDay = activeRoutine?.workout_plan_days?.find(
                  d => d.assigned_weekdays?.includes(today)
                );
                if (todayDay) {
                  setViewingRoutine(activeRoutine.id);
                  setPreWorkoutDayId(todayDay.id);
                } else {
                  // No workout today, show routine
                  setViewingRoutine(activeRoutine.id);
                  toast({ title: 'Hoy es día de descanso 😴' });
                }
              }
            }}
            disabled={startSession.isPending || isGenerating}
          >
            {(startSession.isPending || isGenerating) ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2" />
            )}
            {workoutPlans && workoutPlans.length > 0 
              ? 'Entrenar Hoy' 
              : 'Crear Rutina con IA'}
          </Button>

          {/* Routines list */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-foreground">Rutinas</h2>
              {!isPremium && (
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {routineCount}/{routineLimit}
                </span>
              )}
              {isPremium && (
                <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onClick={() => {
                if (!canCreateRoutine) {
                  setShowUpgradeModal(true);
                } else {
                  setIsNewRoutineOpen(true);
                }
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Nueva
            </Button>
          </div>

          {workoutPlans && workoutPlans.length > 0 ? (
            <div className="space-y-3">
              {workoutPlans.map((routine) => (
                <button
                  key={routine.id}
                  onClick={() => setViewingRoutine(routine.id)}
                  className="w-full bg-card rounded-xl border border-border p-4 text-left hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{routine.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {routine.workout_plan_days?.length || 0} días
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">Aún no tienes rutina</p>
              <p className="text-xs text-muted-foreground mb-4">El sistema creará una basada en tu perfil y objetivo</p>
              <Button onClick={handleCreateRoutineWithAI} className="bg-primary text-primary-foreground">
                <Sparkles className="w-4 h-4 mr-2" />
                Crear Rutina con IA
              </Button>
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <>
          {sessions && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">
                      {session.workout_plan_days?.name || 'Entreno libre'}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {session.duration_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {session.duration_minutes} min
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Sin entrenos registrados</p>
            </div>
          )}
        </>
      )}

      {/* New Routine Dialog */}
      <Dialog open={isNewRoutineOpen} onOpenChange={setIsNewRoutineOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Nueva Rutina</DialogTitle>
            <DialogDescription>Crea una rutina personalizada o genera una basada en tu objetivo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Elige una plantilla:</p>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {(Object.entries(ROUTINE_TEMPLATES) as [RoutineTemplate, typeof ROUTINE_TEMPLATES[RoutineTemplate]][]).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTemplate(key)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-colors",
                      selectedTemplate === key 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-sm font-medium text-foreground">{config.name}</span>
                    <p className="text-xs text-muted-foreground">{config.minDays === config.maxDays ? `${config.minDays} días` : `${config.minDays}-${config.maxDays} días`}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-selected Days Display */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Días seleccionados automáticamente:</p>
              <div className="flex gap-3 justify-center">
                {WEEKDAYS.map(day => {
                  const isBlocked = blockedDays.includes(day.id);
                  const hasFatigue = Object.keys(partialFatigueDays).includes(day.id);
                  const isSelected = selectedTrainingDays.includes(day.id);
                  
                  return (
                    <div
                      key={day.id}
                      className={cn(
                        "w-12 h-12 rounded-xl font-semibold text-sm flex items-center justify-center relative transition-all",
                        isBlocked
                          ? "bg-destructive/20 text-destructive line-through"
                          : isSelected
                            ? hasFatigue 
                              ? "bg-yellow-500 text-yellow-950 shadow-md"
                              : "bg-primary text-primary-foreground shadow-md"
                            : "bg-secondary/50 text-muted-foreground/50"
                      )}
                      title={
                        isBlocked 
                          ? `${day.name}: Bloqueado` 
                          : hasFatigue 
                            ? `${day.name}: Fatiga parcial`
                            : day.name
                      }
                    >
                      {day.short}
                      {isBlocked && <span className="absolute -top-1 -right-1 text-sm">🚫</span>}
                      {hasFatigue && !isBlocked && isSelected && <span className="absolute -top-1 -right-1 text-sm">⚠️</span>}
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Basado en tu horario y recuperación muscular
              </p>
            </div>

            {/* Generate personalized routine button */}
            <Button 
              onClick={() => handleGenerateRoutine(selectedTemplate)}
              variant="outline"
              className="w-full h-14 border-primary/50 hover:bg-primary/10 text-foreground"
              disabled={isGenerating || !profile || !daysMatch}
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-5 h-5 mr-2 text-primary" />
              )}
              <div className="text-left">
                <span className="font-semibold">
                  {selectedTemplate === 'auto' ? 'Generar Rutina Personalizada' : `Crear ${ROUTINE_TEMPLATES[selectedTemplate].name}`}
                </span>
                <p className="text-xs text-muted-foreground">
                  Adaptada a tu peso, altura{profile?.body_fat_percentage ? ' y % grasa' : ''} y objetivo
                </p>
              </div>
            </Button>

            {/* Removed manual creation - AUTOPILOT mode */}
            <p className="text-xs text-center text-muted-foreground">
              El sistema creará tu rutina automáticamente basándose en tu perfil, objetivo y horario.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        trigger="routines"
      />
    </div>
  );
};

export default TrainingPage;
