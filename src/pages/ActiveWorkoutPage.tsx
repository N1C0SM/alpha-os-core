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

  const handleAddSet = (exerciseIdx: number) => {
    setExercises(prev => {
      const updated = [...prev];
      const lastSet = updated[exerciseIdx].sets[updated[exerciseIdx].sets.length - 1];
      updated[exerciseIdx].sets.push({
        id: crypto.randomUUID(),
        weight: lastSet?.weight || '',
        reps: lastSet?.reps || '',
        completed: false,
      });
      return updated;
    });
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
      const updated = [...prev];
      updated[exerciseIdx].sets[setIdx].completed = !updated[exerciseIdx].sets[setIdx].completed;
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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsCancelDialogOpen(true)}
            className="text-muted-foreground"
          >
            Cancelar
          </Button>
          
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-lg font-semibold">{formatTime(elapsedTime)}</span>
          </div>
          
          <Button 
            size="sm"
            onClick={handleFinishWorkout}
            disabled={completeSession.isPending}
            className="bg-primary text-primary-foreground"
          >
            Finalizar
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-4 py-2 bg-card border-b border-border flex items-center justify-around text-center">
        <div>
          <p className="text-2xl font-bold text-foreground">{exercises.length}</p>
          <p className="text-xs text-muted-foreground">Ejercicios</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{totalCompletedSets}</p>
          <p className="text-xs text-muted-foreground">Series</p>
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-auto px-4 py-4 pb-24">
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Dumbbell className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No hay ejercicios aún</p>
            <Button onClick={() => setIsAddExerciseOpen(true)} className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Añadir ejercicio
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise, exerciseIdx) => (
              <div key={exercise.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => handleToggleExpand(exerciseIdx)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{exercise.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {exercise.sets.filter(s => s.completed).length}/{exercise.sets.length} series
                      {exercise.targetRepsMin && exercise.targetRepsMax && (
                        <span className="ml-1">• {exercise.targetRepsMin}-{exercise.targetRepsMax} reps</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveExercise(exerciseIdx);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {exercise.isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {exercise.isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {/* Progression suggestion */}
                    {progressions?.[exercise.exerciseId]?.shouldProgress && (
                      <div className="flex items-center gap-2 text-xs bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg px-3 py-2 mb-2">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="font-medium">
                          ¡Sube a {progressions[exercise.exerciseId].suggestedWeight}kg! 
                        </span>
                        <span className="text-green-600/70 dark:text-green-400/70">
                          (+{progressions[exercise.exerciseId].progressionAmount}kg)
                        </span>
                      </div>
                    )}

                    {/* Last performance */}
                    {exerciseHistory?.[exercise.exerciseId] && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2 mb-2">
                        <History className="w-3.5 h-3.5" />
                        <span>Último:</span>
                        <span className="font-medium text-foreground">
                          {exerciseHistory[exercise.exerciseId].sets.map((s, i) => 
                            `${s.weight_kg || 0}kg×${s.reps_completed || 0}`
                          ).join(' / ')}
                        </span>
                      </div>
                    )}

                    {/* Header */}
                    <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 text-xs text-muted-foreground px-1">
                      <span>Set</span>
                      <span>Kg</span>
                      <span>Reps</span>
                      <span></span>
                    </div>

                    {/* Sets */}
                    {exercise.sets.map((set, setIdx) => {
                      const lastSet = exerciseHistory?.[exercise.exerciseId]?.sets?.[setIdx];
                      const isWarmup = set.isWarmup;
                      const workingSetNumber = setIdx + 1 - exercise.sets.filter((s, i) => i < setIdx && s.isWarmup).length;
                      
                      return (
                        <div key={set.id} className="space-y-1">
                          {/* Set type indicator */}
                          {set.setType && set.setType !== 'normal' && (
                            <div className={cn(
                              "text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-1",
                              set.setType === 'superset' && "bg-purple-500/20 text-purple-500",
                              set.setType === 'dropset' && "bg-amber-500/20 text-amber-500"
                            )}>
                              {set.setType === 'superset' && <><Layers className="w-3 h-3" /> Superset</>}
                              {set.setType === 'dropset' && <><Zap className="w-3 h-3" /> Dropset</>}
                            </div>
                          )}
                          
                          <div 
                            className={cn(
                              "grid grid-cols-[40px_1fr_1fr_40px] gap-2 items-center",
                              set.completed && "opacity-60",
                              isWarmup && "bg-orange-500/10 rounded-lg py-1 -mx-1 px-1",
                              set.isMaxSet && "ring-2 ring-yellow-500/50 rounded-lg"
                            )}
                          >
                            <span className={cn(
                              "text-sm font-medium text-center relative",
                              isWarmup ? "text-orange-500" : "text-foreground"
                            )}>
                              {isWarmup ? (
                                <Flame className="w-4 h-4 mx-auto" />
                              ) : (
                                <>
                                  {workingSetNumber}
                                  {set.isMaxSet && (
                                    <Star className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1 fill-yellow-500" />
                                  )}
                                </>
                              )}
                            </span>
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder={isWarmup ? set.weight : (lastSet?.weight_kg?.toString() || "0")}
                              value={isWarmup ? set.weight : set.weight}
                              onChange={(e) => handleSetChange(exerciseIdx, setIdx, 'weight', e.target.value)}
                              className={cn(
                                "h-10 text-center bg-secondary border-border",
                                isWarmup && "bg-orange-500/5"
                              )}
                              disabled={isWarmup}
                            />
                            <Input
                              type="number"
                              inputMode="numeric"
                              placeholder={isWarmup ? set.reps : (lastSet?.reps_completed?.toString() || "0")}
                              value={isWarmup ? set.reps : set.reps}
                              onChange={(e) => handleSetChange(exerciseIdx, setIdx, 'reps', e.target.value)}
                              className={cn(
                                "h-10 text-center bg-secondary border-border",
                                isWarmup && "bg-orange-500/5"
                              )}
                              disabled={isWarmup}
                            />
                            <Button
                              size="icon"
                              variant={set.completed ? "default" : "outline"}
                              className={cn(
                                "h-10 w-10",
                                set.completed && !isWarmup && "bg-primary text-primary-foreground",
                                set.completed && isWarmup && "bg-orange-500 text-white"
                              )}
                              onClick={() => handleToggleSetComplete(exerciseIdx, setIdx)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Per-set feedback + actions (only for working sets) */}
                          {!isWarmup && set.completed && (
                            <div className="flex items-center gap-1 pl-10 mt-1">
                              {/* Feeling buttons - compact */}
                              <div className="flex gap-0.5 flex-1">
                                {(['easy', 'correct', 'hard'] as const).map((f) => (
                                  <button
                                    key={f}
                                    onClick={() => handleSetFeeling(exerciseIdx, setIdx, f)}
                                    className={cn(
                                      "flex-1 h-6 text-[10px] rounded border transition-all",
                                      set.feeling === f 
                                        ? f === 'easy' ? 'bg-green-500/20 border-green-500 text-green-600' 
                                          : f === 'correct' ? 'bg-blue-500/20 border-blue-500 text-blue-600'
                                          : 'bg-red-500/20 border-red-500 text-red-600'
                                        : 'bg-secondary/50 border-border text-muted-foreground'
                                    )}
                                  >
                                    {f === 'easy' ? '👍' : f === 'correct' ? '✓' : '💪'}
                                  </button>
                                ))}
                              </div>
                              
                              {/* Max set toggle */}
                              <button
                                onClick={() => handleToggleMaxSet(exerciseIdx, setIdx)}
                                className={cn(
                                  "h-6 px-2 text-[10px] rounded border flex items-center gap-1",
                                  set.isMaxSet 
                                    ? "bg-yellow-500/20 border-yellow-500 text-yellow-600"
                                    : "bg-secondary/50 border-border text-muted-foreground"
                                )}
                                title="Marcar como máximo"
                              >
                                <Star className={cn("w-3 h-3", set.isMaxSet && "fill-yellow-500")} />
                                Max
                              </button>

                              {/* Superset/Dropset toggles */}
                              <button
                                onClick={() => handleSetType(exerciseIdx, setIdx, 'superset')}
                                className={cn(
                                  "h-6 w-6 text-[10px] rounded border flex items-center justify-center",
                                  set.setType === 'superset'
                                    ? "bg-purple-500/20 border-purple-500 text-purple-600"
                                    : "bg-secondary/50 border-border text-muted-foreground"
                                )}
                                title="Superset"
                              >
                                <Layers className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleSetType(exerciseIdx, setIdx, 'dropset')}
                                className={cn(
                                  "h-6 w-6 text-[10px] rounded border flex items-center justify-center",
                                  set.setType === 'dropset'
                                    ? "bg-amber-500/20 border-amber-500 text-amber-600"
                                    : "bg-secondary/50 border-border text-muted-foreground"
                                )}
                                title="Dropset"
                              >
                                <Zap className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Feedback: How did this exercise feel? */}
                    <div className="pt-2 border-t border-border/50 mt-2">
                      <p className="text-xs text-muted-foreground mb-2 text-center">¿Cómo estuvo este ejercicio?</p>
                      <SetFeelingButtons
                        feeling={exercise.feeling || null}
                        onFeelingChange={(feeling) => handleExerciseFeeling(exerciseIdx, feeling)}
                      />
                    </div>

                    {/* Premium action buttons */}
                    <div className="flex gap-2 pt-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 text-xs",
                          isPremium 
                            ? "border-green-500/30 text-green-600 hover:bg-green-500/10" 
                            : "border-yellow-500/30 text-yellow-600"
                        )}
                        onClick={() => handleEasyWeight(exerciseIdx)}
                      >
                        {!isPremium && <Crown className="w-3 h-3 mr-1" />}
                        <ArrowUp className="w-3 h-3 mr-1" />
                        Peso fácil
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 text-xs",
                          isPremium 
                            ? "border-blue-500/30 text-blue-600 hover:bg-blue-500/10" 
                            : "border-yellow-500/30 text-yellow-600"
                        )}
                        onClick={() => handleMachineOccupied(exerciseIdx)}
                      >
                        {!isPremium && <Crown className="w-3 h-3 mr-1" />}
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Máquina ocupada
                      </Button>
                    </div>

                    {/* Add/Remove set buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddSet(exerciseIdx)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Serie
                      </Button>
                      {exercise.sets.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveSet(exerciseIdx, exercise.sets.length - 1)}
                          className="text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rest Timer */}
      <RestTimer defaultSeconds={90} />

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
