import React, { useState, useMemo } from 'react';
import { Play, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface WarmupSet {
  setNumber: number;
  percentage: number;
  weight: number;
  reps: number;
  rest: string;
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
}

interface PreWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartWorkout: (includeWarmup: boolean, warmupSets: WarmupSet[]) => void;
  dayName: string;
  exercises: Exercise[];
  isStarting?: boolean;
}

const WARMUP_SCHEME = [
  { percentage: 0, reps: 10, rest: '1 min' },   // Bar only
  { percentage: 40, reps: 8, rest: '1 min' },
  { percentage: 55, reps: 5, rest: '1.5 min' },
  { percentage: 70, reps: 3, rest: '2 min' },
  { percentage: 85, reps: 2, rest: '2-3 min' },
];

const PreWorkoutModal: React.FC<PreWorkoutModalProps> = ({
  isOpen,
  onClose,
  onStartWorkout,
  dayName,
  exercises,
  isStarting = false,
}) => {
  const [includeWarmup, setIncludeWarmup] = useState(true);
  const [workingWeight, setWorkingWeight] = useState<number>(0);
  const [barWeight, setBarWeight] = useState<number>(20);
  const [showWarmupDetails, setShowWarmupDetails] = useState(false);

  // Get first compound exercise for warmup reference
  const firstExercise = exercises[0];

  const warmupSets = useMemo(() => {
    if (!workingWeight || workingWeight <= 0) return [];
    
    return WARMUP_SCHEME.map((scheme, index) => {
      const calculatedWeight = scheme.percentage === 0 
        ? barWeight 
        : Math.round((workingWeight * scheme.percentage) / 100 / 2.5) * 2.5;
      
      return {
        setNumber: index + 1,
        percentage: scheme.percentage,
        weight: Math.max(calculatedWeight, barWeight),
        reps: scheme.reps,
        rest: scheme.rest,
      };
    });
  }, [workingWeight, barWeight]);

  const handleStart = () => {
    onStartWorkout(includeWarmup && warmupSets.length > 0, warmupSets);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isStarting && onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            Preparar Entreno
          </DialogTitle>
          <DialogDescription>
            {dayName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Exercises preview */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2">Ejercicios programados:</p>
            <div className="space-y-1">
              {exercises.slice(0, 4).map((ex, i) => (
                <p key={ex.id} className="text-sm text-foreground">
                  {i + 1}. {ex.name} ({ex.sets}×{ex.repsMin}-{ex.repsMax})
                </p>
              ))}
              {exercises.length > 4 && (
                <p className="text-xs text-muted-foreground">
                  +{exercises.length - 4} más
                </p>
              )}
            </div>
          </div>

          {/* Warmup option */}
          <div className="space-y-3">
            <div 
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                includeWarmup 
                  ? "border-primary bg-primary/5" 
                  : "border-border bg-secondary/30"
              )}
              onClick={() => setIncludeWarmup(!includeWarmup)}
            >
              <Checkbox 
                checked={includeWarmup} 
                onCheckedChange={(checked) => setIncludeWarmup(checked === true)}
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">Incluir calentamiento</p>
                <p className="text-xs text-muted-foreground">
                  Series progresivas antes del primer ejercicio
                </p>
              </div>
              <Flame className={cn("w-5 h-5", includeWarmup ? "text-primary" : "text-muted-foreground")} />
            </div>

            {includeWarmup && (
              <div className="space-y-3 pl-3 border-l-2 border-primary/30">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Peso de trabajo (kg)
                    </label>
                    <Input
                      type="number"
                      placeholder="ej: 80"
                      value={workingWeight || ''}
                      onChange={(e) => setWorkingWeight(Number(e.target.value))}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Peso barra (kg)
                    </label>
                    <Input
                      type="number"
                      value={barWeight}
                      onChange={(e) => setBarWeight(Number(e.target.value) || 20)}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>

                {warmupSets.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowWarmupDetails(!showWarmupDetails)}
                      className="flex items-center gap-2 text-sm text-primary"
                    >
                      {showWarmupDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      Ver series de calentamiento
                    </button>

                    {showWarmupDetails && (
                      <div className="mt-2 space-y-1.5">
                        {warmupSets.map((set) => (
                          <div
                            key={set.setNumber}
                            className="flex items-center justify-between py-1.5 px-2 bg-secondary/50 rounded text-xs"
                          >
                            <span className="text-muted-foreground">
                              Set {set.setNumber} ({set.percentage}%)
                            </span>
                            <span className="font-medium text-foreground">
                              {set.weight} kg × {set.reps} reps
                            </span>
                            <span className="text-muted-foreground">
                              {set.rest}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {workingWeight > 0 && warmupSets.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Introduce el peso de trabajo para generar el calentamiento
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isStarting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStart}
              disabled={isStarting}
              className="flex-1 bg-primary text-primary-foreground"
            >
              <Play className="w-4 h-4 mr-2" />
              {isStarting ? 'Iniciando...' : 'Empezar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreWorkoutModal;
