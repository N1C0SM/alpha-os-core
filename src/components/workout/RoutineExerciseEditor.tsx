import React, { useState } from 'react';
import { Trash2, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ExerciseImage from './ExerciseImage';

interface RoutineExerciseEditorProps {
  exerciseId: string;
  planExerciseId: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  onUpdate: (updates: { sets?: number; repsMin?: number; repsMax?: number; restSeconds?: number }) => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

const RoutineExerciseEditor: React.FC<RoutineExerciseEditorProps> = ({
  exerciseId,
  planExerciseId,
  name,
  sets,
  repsMin,
  repsMax,
  restSeconds,
  onUpdate,
  onDelete,
  isDeleting,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSets, setLocalSets] = useState(sets);
  const [localRepsMin, setLocalRepsMin] = useState(repsMin);
  const [localRepsMax, setLocalRepsMax] = useState(repsMax);
  const [localRest, setLocalRest] = useState(restSeconds);

  const handleSetsChange = (delta: number) => {
    const newSets = Math.max(1, Math.min(10, localSets + delta));
    setLocalSets(newSets);
    onUpdate({ sets: newSets });
  };

  const handleRepsMinChange = (value: string) => {
    const num = parseInt(value) || 1;
    setLocalRepsMin(num);
    onUpdate({ repsMin: num });
  };

  const handleRepsMaxChange = (value: string) => {
    const num = parseInt(value) || 1;
    setLocalRepsMax(num);
    onUpdate({ repsMax: num });
  };

  const handleRestChange = (delta: number) => {
    const newRest = Math.max(30, Math.min(300, localRest + delta));
    setLocalRest(newRest);
    onUpdate({ restSeconds: newRest });
  };

  const formatRest = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div className="bg-secondary/50 rounded-lg overflow-hidden">
      {/* Collapsed view */}
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ExerciseImage exerciseName={name} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground">
            {localSets} × {localRepsMin}-{localRepsMax} • {formatRest(localRest)}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-destructive h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
          aria-label="Eliminar ejercicio"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Expanded editor */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/30 pt-3">
          {/* Sets */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Series</span>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => handleSetsChange(-1)}
                disabled={localSets <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-semibold text-foreground">{localSets}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => handleSetsChange(1)}
                disabled={localSets >= 10}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Reps Range */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Repeticiones</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                value={localRepsMin}
                onChange={(e) => handleRepsMinChange(e.target.value)}
                className="w-14 h-8 text-center bg-background"
                min={1}
                max={50}
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                inputMode="numeric"
                value={localRepsMax}
                onChange={(e) => handleRepsMaxChange(e.target.value)}
                className="w-14 h-8 text-center bg-background"
                min={1}
                max={50}
              />
            </div>
          </div>

          {/* Rest Time */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Descanso</span>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => handleRestChange(-15)}
                disabled={localRest <= 30}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center font-semibold text-foreground">{formatRest(localRest)}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => handleRestChange(15)}
                disabled={localRest >= 300}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineExerciseEditor;
