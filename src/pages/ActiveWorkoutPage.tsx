import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, X, Check, Trash2, Clock, Dumbbell, ChevronDown, ChevronUp, History, TrendingUp, Flame, ArrowUp, RefreshCw, Crown, Star, Zap, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExercises, useLogExercise, useCompleteWorkoutSession, useWorkoutPlanDay } from '@/hooks/useWorkouts';
import { useMultipleExercisesLastPerformance } from '@/hooks/useExerciseHistory';
import { useProfile } from '@/hooks/useProfile';
import { useRoutineDayProgressions } from '@/hooks/useProgressionSuggestion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import PostWorkoutSummary from '@/components/workout/PostWorkoutSummary';
import RestTimer from '@/components/workout/RestTimer';
import { SetFeelingButtons, type SetFeeling } from '@/components/workout/SetFeelingButtons';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { useUpdateExerciseMaxWeight, calculateSuggestedWeight, useExerciseMaxWeights } from '@/hooks/useExerciseMaxWeights';
import ExerciseImage from '@/components/workout/ExerciseImage';
import { prefetchExerciseImages } from '@/hooks/useExerciseImage';

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

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: SetData[];
  isExpanded: boolean;
  targetSets?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  feeling?: 'easy' | 'correct' | 'hard' | null; // Exercise-level feedback
}

interface SetData {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
  isWarmup?: boolean;
  feeling?: 'easy' | 'correct' | 'hard' | null;
  isMaxSet?: boolean; // Mark as max set for next session
  setType?: 'normal' | 'superset' | 'dropset';
}

const ActiveWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const dayId = searchParams.get('dayId');
  const warmupParam = searchParams.get('warmup');
  
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [startTime] = useState(() => new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [searchExercise, setSearchExercise] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [showPostWorkout, setShowPostWorkout] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [hasLoadedRoutine, setHasLoadedRoutine] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [restTimerKey, setRestTimerKey] = useState(0); // Key to trigger timer restart

  const { isPremium } = useSubscription();

  const { data: allExercises } = useExercises();
  const { data: workoutPlanDay } = useWorkoutPlanDay(dayId);
  const { data: profile } = useProfile();
  const { data: exerciseMaxWeights } = useExerciseMaxWeights();
  const updateMaxWeight = useUpdateExerciseMaxWeight();
  const logExercise = useLogExercise();
  const completeSession = useCompleteWorkoutSession();
  const { toast } = useToast();

  // Get exercise IDs for history lookup
  const exerciseIds = useMemo(() => exercises.map(e => e.exerciseId), [exercises]);
  const { data: exerciseHistory } = useMultipleExercisesLastPerformance(exerciseIds);
  const { data: progressions } = useRoutineDayProgressions(dayId);

  // Load exercises from routine when workout plan day is fetched
  useEffect(() => {
    if (workoutPlanDay && !hasLoadedRoutine && allExercises) {
      const routineExercises: WorkoutExercise[] = [];
      
      // Parse warmup sets if present
      let warmupSets: any[] = [];
      if (warmupParam) {
        try {
          warmupSets = JSON.parse(decodeURIComponent(warmupParam));
        } catch (e) {
          console.error('Failed to parse warmup sets', e);
        }
      }

      // Add exercises from routine
      workoutPlanDay.workout_plan_exercises?.forEach((planEx: any, index: number) => {
        const exerciseInfo = planEx.exercises;
        if (!exerciseInfo) return;

        const sets: SetData[] = [];
        
        // Add warmup sets to the first exercise
        if (index === 0 && warmupSets.length > 0) {
          warmupSets.forEach((ws, i) => {
            sets.push({
              id: `warmup-${i}`,
              weight: ws.weight.toString(),
              reps: ws.reps.toString(),
              completed: false,
              isWarmup: true,
            });
          });
        }

        // Add working sets
        const targetSets = planEx.sets || 3;
        for (let i = 0; i < targetSets; i++) {
          sets.push({
            id: `${planEx.id}-set-${i}`,
            weight: '',
            reps: '',
            completed: false,
          });
        }

        routineExercises.push({
          id: planEx.id,
          exerciseId: exerciseInfo.id,
          name: exerciseInfo.name_es || exerciseInfo.name,
          sets,
          isExpanded: index === 0,
          targetSets: planEx.sets,
          targetRepsMin: planEx.reps_min,
          targetRepsMax: planEx.reps_max,
        });
      });

      if (routineExercises.length > 0) {
        setExercises(routineExercises);
        // Prefetch images for all exercises
        prefetchExerciseImages(routineExercises.map(e => e.name));
        toast({ 
          title: `Rutina cargada: ${workoutPlanDay.name}`,
          description: `${routineExercises.length} ejercicios listos${warmupSets.length > 0 ? ' con calentamiento' : ''}`,
        });
      }
      setHasLoadedRoutine(true);
    }
  }, [workoutPlanDay, hasLoadedRoutine, warmupParam, allExercises, toast]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredExercises = useMemo(() => {
    return allExercises?.filter(ex => {
      const matchesSearch = !searchExercise ||
        ex.name_es?.toLowerCase().includes(searchExercise.toLowerCase()) ||
        ex.name?.toLowerCase().includes(searchExercise.toLowerCase());
      const matchesMuscle = !selectedMuscle || ex.primary_muscle === selectedMuscle;
      return matchesSearch && matchesMuscle;
    });
  }, [allExercises, searchExercise, selectedMuscle]);

  const handleAddExercise = (exercise: { id: string; name: string; name_es?: string | null }) => {
    const newExercise: WorkoutExercise = {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      name: exercise.name_es || exercise.name,
      sets: [{ id: crypto.randomUUID(), weight: '', reps: '', completed: false }],
      isExpanded: true,
    };
    setExercises(prev => [...prev, newExercise]);
    setIsAddExerciseOpen(false);
    setSearchExercise('');
    setSelectedMuscle(null);
  };

  const handleAddSet = (exerciseIdx: number, setType?: 'dropset' | 'superset') => {
    setExercises(prev => {
      const updated = [...prev];
      const lastSet = updated[exerciseIdx].sets[updated[exerciseIdx].sets.length - 1];
      const newWeight = setType === 'dropset' 
        ? (parseFloat(lastSet?.weight || '0') * 0.8).toFixed(1) // 20% less for dropset
        : lastSet?.weight || '';
      updated[exerciseIdx].sets.push({
        id: crypto.randomUUID(),
        weight: newWeight,
        reps: lastSet?.reps || '',
        completed: false,
        setType: setType || 'normal',
      });
      return updated;
    });
    
    if (setType) {
      toast({
        title: setType === 'dropset' ? '⬇️ Dropset añadido' : '🔗 Superset añadido',
        description: setType === 'dropset' ? 'Peso reducido un 20%' : 'Serie enlazada',
      });
    }
  };

  const handleRemoveSet = (exerciseIdx: number, setIdx: number) => {
    setExercises(prev => {
      const updated = [...prev];
      if (updated[exerciseIdx].sets.length > 1) {
        updated[exerciseIdx].sets.splice(setIdx, 1);
      }
      return updated;
    });
  };

  const handleSetChange = (exerciseIdx: number, setIdx: number, field: 'weight' | 'reps', value: string) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[exerciseIdx].sets[setIdx][field] = value;
      return updated;
    });
  };

  const handleToggleSetComplete = (exerciseIdx: number, setIdx: number) => {
    setExercises(prev => {
      const updated = prev.map((exercise, eIdx) => {
        if (eIdx !== exerciseIdx) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((set, sIdx) => {
            if (sIdx !== setIdx) return set;
            return { ...set, completed: !set.completed };
          }),
        };
      });
      
      // Auto-start rest timer when completing a set (not when uncompleting)
      const wasCompleted = prev[exerciseIdx].sets[setIdx].completed;
      if (!wasCompleted) {
        setRestTimerKey(k => k + 1);
      }
      
      return updated;
    });
  };

  // Handle per-set feeling
  const handleSetFeeling = (exerciseIdx: number, setIdx: number, feeling: 'easy' | 'correct' | 'hard') => {
    setExercises(prev => {
      const updated = [...prev];
      updated[exerciseIdx].sets[setIdx].feeling = feeling;
      return updated;
    });
  };

  // Toggle max set marker
  const handleToggleMaxSet = (exerciseIdx: number, setIdx: number) => {
    setExercises(prev => {
      const updated = [...prev];
      // Clear other max markers in this exercise
      updated[exerciseIdx].sets = updated[exerciseIdx].sets.map((s, i) => ({
        ...s,
        isMaxSet: i === setIdx ? !s.isMaxSet : false,
      }));
      return updated;
    });
  };

  // Set set type (normal, superset, dropset)
  const handleSetType = (exerciseIdx: number, setIdx: number, type: 'normal' | 'superset' | 'dropset') => {
    setExercises(prev => {
      const updated = [...prev];
      updated[exerciseIdx].sets[setIdx].setType = 
        updated[exerciseIdx].sets[setIdx].setType === type ? 'normal' : type;
      return updated;
    });
  };

  const handleToggleExpand = (exerciseIdx: number) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[exerciseIdx].isExpanded = !updated[exerciseIdx].isExpanded;
      return updated;
    });
  };

  const handleRemoveExercise = (exerciseIdx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== exerciseIdx));
  };

  // Handle exercise-level feeling feedback
  const handleExerciseFeeling = (exerciseIdx: number, feeling: SetFeeling) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[exerciseIdx].feeling = feeling;
      return updated;
    });
  };

  // Get max weight record for an exercise
  const getMaxWeightForExercise = (exerciseId: string) => {
    return exerciseMaxWeights?.find(m => m.exercise_id === exerciseId) || null;
  };


  // Premium feature: Increase weight
  const handleEasyWeight = (exerciseIdx: number) => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    
    setExercises(prev => {
      const updated = [...prev];
      const exercise = updated[exerciseIdx];
      
      // Determine increment based on muscle group (upper body +2.5kg, lower +5kg)
      const exerciseInfo = allExercises?.find(e => e.id === exercise.exerciseId);
      const lowerBodyMuscles = ['quadriceps', 'hamstrings', 'glutes', 'calves'];
      const increment = lowerBodyMuscles.includes(exerciseInfo?.primary_muscle || '') ? 5 : 2.5;
      
      // Increase weight for all non-completed sets
      exercise.sets = exercise.sets.map(set => {
        if (!set.completed && !set.isWarmup) {
          const currentWeight = parseFloat(set.weight) || 0;
          return { ...set, weight: (currentWeight + increment).toString() };
        }
        return set;
      });
      
      return updated;
    });
    
    toast({
      title: '💪 Peso aumentado',
      description: 'Sigue así, campeón!',
    });
  };

  // Premium feature: Swap exercise for equivalent
  const handleMachineOccupied = (exerciseIdx: number) => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    
    const currentExercise = exercises[exerciseIdx];
    const exerciseInfo = allExercises?.find(e => e.id === currentExercise.exerciseId);
    
    if (!exerciseInfo || !allExercises) {
      toast({ title: 'No hay alternativas disponibles', variant: 'destructive' });
      return;
    }
    
    // Find alternative exercise with same primary muscle
    const alternatives = allExercises.filter(e => 
      e.primary_muscle === exerciseInfo.primary_muscle && 
      e.id !== currentExercise.exerciseId &&
      !exercises.some(ex => ex.exerciseId === e.id)
    );
    
    if (alternatives.length === 0) {
      toast({ title: 'No hay alternativas disponibles', variant: 'destructive' });
      return;
    }
    
    // Pick random alternative
    const alternative = alternatives[Math.floor(Math.random() * alternatives.length)];
    
    setExercises(prev => {
      const updated = [...prev];
      updated[exerciseIdx] = {
        ...updated[exerciseIdx],
        exerciseId: alternative.id,
        name: alternative.name_es || alternative.name,
        // Keep sets structure but clear weights/reps
        sets: updated[exerciseIdx].sets.map(set => ({
          ...set,
          weight: '',
          reps: '',
          completed: false,
        })),
      };
      return updated;
    });
    
    toast({
      title: '🔄 Ejercicio cambiado',
      description: `Ahora: ${alternative.name_es || alternative.name}`,
    });
  };

  const handleFinishWorkout = async () => {
    if (!sessionId) {
      toast({ title: 'Error', description: 'No hay sesión activa', variant: 'destructive' });
      return;
    }

    try {
      // Log all completed sets and update max weights with feelings
      for (const exercise of exercises) {
        let bestWeight = 0;
        let bestReps = 0;
        let maxSetWeight = 0;
        let maxSetReps = 0;
        let hasCompletedSets = false;
        let overallFeeling: 'easy' | 'correct' | 'hard' | null = null;

        for (let i = 0; i < exercise.sets.length; i++) {
          const set = exercise.sets[i];
          if (set.completed && (set.weight || set.reps) && !set.isWarmup) {
            hasCompletedSets = true;
            const weight = set.weight ? parseFloat(set.weight) : 0;
            const reps = set.reps ? parseInt(set.reps) : 0;
            
            // If user marked this as max set, prioritize it
            if (set.isMaxSet) {
              maxSetWeight = weight;
              maxSetReps = reps;
            }
            
            // Track best performance
            if (weight > bestWeight || (weight === bestWeight && reps > bestReps)) {
              bestWeight = weight;
              bestReps = reps;
            }

            // Use set-level feeling if available, otherwise exercise-level
            const setFeeling = set.feeling || exercise.feeling;
            if (setFeeling && !overallFeeling) {
              overallFeeling = setFeeling;
            }

            await logExercise.mutateAsync({
              workout_session_id: sessionId,
              exercise_id: exercise.exerciseId,
              set_number: i + 1,
              weight_kg: weight || undefined,
              reps_completed: reps || undefined,
              feeling: setFeeling || undefined,
            });
          }
        }

        // Use max set if marked, otherwise use best performance
        const finalWeight = maxSetWeight > 0 ? maxSetWeight : bestWeight;
        const finalReps = maxSetWeight > 0 ? maxSetReps : bestReps;
        const finalFeeling = overallFeeling || exercise.feeling;

        // Update exercise max weight if we have performance data
        if (hasCompletedSets && finalWeight > 0) {
          try {
            await updateMaxWeight.mutateAsync({
              exerciseId: exercise.exerciseId,
              weightKg: finalWeight,
              reps: finalReps,
              feeling: finalFeeling || 'correct',
            });
          } catch (err) {
            console.error('Error updating max weight:', err);
          }
        }
      }

      // Complete the session
      await completeSession.mutateAsync({ sessionId });
      
      // Save duration and show post-workout summary
      setWorkoutDuration(Math.floor(elapsedTime / 60));
      setShowPostWorkout(true);
    } catch (error) {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
  };

  const handleCancelWorkout = () => {
    navigate('/entreno');
  };

  const handleClosePostWorkout = () => {
    toast({ title: '¡Entreno completado!' });
    navigate('/entreno');
  };

  const totalCompletedSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
    0
  );

  // Show post-workout summary
  if (showPostWorkout) {
    return (
      <PostWorkoutSummary
        durationMinutes={workoutDuration}
        exerciseCount={exercises.length}
        totalSets={totalCompletedSets}
        fitnessGoal={(profile?.fitness_goal as 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance') || 'muscle_gain'}
        bodyWeightKg={profile?.weight_kg || 75}
        onClose={handleClosePostWorkout}
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Premium gradient */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-card to-background border-b border-border px-4 py-4 safe-top">
        <div className="flex items-center justify-between mb-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => setIsCancelDialogOpen(true)}
          >
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
          
          <div className="flex items-center gap-2 text-foreground bg-secondary/80 backdrop-blur px-4 py-2 rounded-full border border-border">
            <Clock className="w-4 h-4 text-primary" />
            <span className="font-mono text-xl font-bold">{formatTime(elapsedTime)}</span>
          </div>
          
          <Button 
            size="sm"
            onClick={handleFinishWorkout}
            disabled={completeSession.isPending || totalCompletedSets === 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
          >
            <Check className="w-4 h-4 mr-1" />
            Finalizar
          </Button>
        </div>

        {/* Stats bar - Modern cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 backdrop-blur rounded-xl p-3 border border-border/50 text-center">
            <p className="text-3xl font-bold text-foreground">{exercises.length}</p>
            <p className="text-xs text-muted-foreground font-medium">Ejercicios</p>
          </div>
          <div className="bg-secondary/50 backdrop-blur rounded-xl p-3 border border-border/50 text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-3xl font-bold text-primary">{totalCompletedSets}</p>
              <Flame className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Series completadas</p>
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-auto px-4 py-6 pb-24">
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Dumbbell className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No hay ejercicios aún</h3>
            <p className="text-muted-foreground mb-6 max-w-xs">Añade ejercicios para comenzar tu entreno</p>
            <Button onClick={() => setIsAddExerciseOpen(true)} className="bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Plus className="w-4 h-4 mr-2" />
              Añadir ejercicio
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise, exerciseIdx) => (
              <div 
                key={exercise.id} 
                className="bg-card rounded-2xl border border-border overflow-hidden shadow-lg"
              >
                {/* Exercise header with image - Premium style */}
                <div className="p-4 bg-gradient-to-r from-card via-card to-secondary/30">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <ExerciseImage exerciseName={exercise.name} size="md" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-lg">
                        {exercise.sets.filter(s => s.completed).length}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-foreground truncate">{exercise.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {exercise.sets.filter(s => s.completed).length}/{exercise.sets.length} series
                        {exercise.targetRepsMin && exercise.targetRepsMax && (
                          <span className="ml-2 text-primary">• {exercise.targetRepsMin}-{exercise.targetRepsMax} reps</span>
                        )}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 h-10 w-10"
                      onClick={() => handleRemoveExercise(exerciseIdx)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Progression suggestion */}
                {progressions?.[exercise.exerciseId]?.shouldProgress && (
                  <div className="mx-4 mt-3 flex items-center gap-2 text-sm bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-500 rounded-xl px-4 py-3 border border-green-500/20">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">
                      ¡Sube a {progressions[exercise.exerciseId].suggestedWeight}kg! 
                    </span>
                    <ArrowUp className="w-4 h-4 ml-auto" />
                  </div>
                )}

                {/* Header row */}
                <div className="px-4 pt-4">
                  <div className="grid grid-cols-[48px_1fr_1fr_48px] gap-3 text-xs font-semibold text-muted-foreground px-1 mb-3">
                    <span className="text-center">SET</span>
                    <span className="text-center">KG</span>
                    <span className="text-center">REPS</span>
                    <span className="text-center">✓</span>
                  </div>
                </div>

                {/* Sets - always visible */}
                <div className="px-4 pb-4 space-y-2">
                  {exercise.sets.map((set, setIdx) => {
                    const isWarmup = set.isWarmup;
                    const workingSetNumber = setIdx + 1 - exercise.sets.filter((s, i) => i < setIdx && s.isWarmup).length;
                    
                    return (
                      <div 
                        key={set.id}
                        className={cn(
                          "grid grid-cols-[48px_1fr_1fr_48px] gap-3 items-center py-2.5 px-2 rounded-xl transition-all",
                          set.completed && "bg-gradient-to-r from-green-500/15 to-emerald-500/10 border border-green-500/20",
                          isWarmup && "bg-orange-500/10 border border-orange-500/20",
                          set.setType === 'dropset' && "bg-purple-500/10 border-l-4 border-purple-500",
                          set.setType === 'superset' && "bg-blue-500/10 border-l-4 border-blue-500",
                          !set.completed && !isWarmup && !set.setType && "bg-secondary/30"
                        )}
                      >
                        {/* Set number - tap to mark as max */}
                        <button
                          type="button"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            if (!isWarmup) {
                              handleToggleMaxSet(exerciseIdx, setIdx);
                              if (navigator.vibrate) navigator.vibrate(50);
                            }
                          }}
                          className={cn(
                            "h-11 w-11 rounded-xl mx-auto flex items-center justify-center cursor-pointer select-none transition-all shadow-sm",
                            set.isMaxSet 
                              ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-lg shadow-yellow-500/30" 
                              : "bg-secondary/80 hover:bg-secondary",
                            !isWarmup && "active:scale-90"
                          )}
                          aria-label={set.isMaxSet ? "Quitar set máximo" : "Marcar set máximo"}
                        >
                          <span
                            className={cn(
                              "text-base font-bold pointer-events-none",
                              isWarmup ? "text-orange-500" : set.isMaxSet ? "text-black" : "text-foreground"
                            )}
                          >
                            {isWarmup ? 'W' : set.isMaxSet ? '★' : workingSetNumber}
                          </span>
                        </button>
                        
                        {/* Weight */}
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={set.weight}
                          onChange={(e) => handleSetChange(exerciseIdx, setIdx, 'weight', e.target.value)}
                          className="h-11 text-center text-lg font-bold bg-secondary/80 border-0 rounded-xl focus:ring-2 focus:ring-primary"
                        />
                        
                        {/* Reps */}
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="0"
                          value={set.reps}
                          onChange={(e) => handleSetChange(exerciseIdx, setIdx, 'reps', e.target.value)}
                          className="h-11 text-center text-lg font-bold bg-secondary/80 border-0 rounded-xl focus:ring-2 focus:ring-primary"
                        />
                        
                        {/* Complete button */}
                        <div
                          onClick={() => {
                            handleToggleSetComplete(exerciseIdx, setIdx);
                            if (navigator.vibrate) navigator.vibrate(30);
                          }}
                          className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center mx-auto cursor-pointer select-none transition-all active:scale-90",
                            set.completed 
                              ? "bg-green-500 text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Check className="w-5 h-5 pointer-events-none" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action row */}
                <div className="flex gap-2 pt-3 mt-3 border-t border-border/30">
                  <button
                    type="button"
                    onClick={() => handleAddSet(exerciseIdx)}
                    className="flex-1 h-9 rounded-lg bg-secondary text-foreground text-sm flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Serie
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSet(exerciseIdx, 'dropset')}
                    className="h-9 px-3 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm flex items-center justify-center gap-1.5"
                  >
                    <Layers className="w-4 h-4" />
                    Drop
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSet(exerciseIdx, 'superset')}
                    className="h-9 px-3 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-4 h-4" />
                    Super
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMachineOccupied(exerciseIdx)}
                    className="h-9 px-3 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rest Timer */}
      <RestTimer key={restTimerKey} defaultSeconds={90} autoStart={restTimerKey > 0} />

      {/* Floating add button */}
      {exercises.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 safe-bottom">
          <Button 
            onClick={() => setIsAddExerciseOpen(true)}
            className="w-full h-12 bg-primary text-primary-foreground shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Añadir ejercicio
          </Button>
        </div>
      )}

      {/* Add Exercise Dialog */}
      <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
        <DialogContent className="bg-card border-border max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Añadir ejercicio</DialogTitle>
            <DialogDescription>Busca y selecciona un ejercicio</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Buscar ejercicio..."
              value={searchExercise}
              onChange={(e) => setSearchExercise(e.target.value)}
              className="bg-secondary border-border"
              autoFocus
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
                  onClick={() => handleAddExercise(ex)}
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

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>¿Cancelar entreno?</DialogTitle>
            <DialogDescription>
              Se perderán todos los datos de esta sesión.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsCancelDialogOpen(false)}
            >
              Continuar
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={handleCancelWorkout}
            >
              Cancelar entreno
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        trigger="general"
      />
      </div>
    </>
  );
};

export default ActiveWorkoutPage;
