import React, { useState, useMemo } from 'react';
import { Flame, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WarmupSet {
  setNumber: number;
  percentage: number;
  weight: number;
  reps: number;
  rest: string;
}

interface WarmupGeneratorProps {
  workingWeight?: number;
  onApply?: (sets: WarmupSet[]) => void;
}

const WarmupGenerator: React.FC<WarmupGeneratorProps> = ({ 
  workingWeight: initialWeight,
  onApply 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [workingWeight, setWorkingWeight] = useState(initialWeight?.toString() || '');
  const [barWeight, setBarWeight] = useState('20'); // Standard Olympic bar

  const warmupSets = useMemo((): WarmupSet[] => {
    const working = parseFloat(workingWeight) || 0;
    const bar = parseFloat(barWeight) || 20;
    
    if (working <= bar) return [];

    // Progressive warmup scheme based on working weight
    const percentages = working > 100 
      ? [0, 40, 55, 70, 80, 90]  // Heavy lifts get more warmup
      : working > 60
        ? [0, 50, 70, 85]        // Medium lifts
        : [0, 60, 80];           // Light lifts

    return percentages.map((pct, idx) => {
      const weight = pct === 0 ? bar : Math.round((working * pct) / 100 / 2.5) * 2.5;
      const reps = pct === 0 
        ? 10 
        : pct <= 50 
          ? 8 
          : pct <= 70 
            ? 5 
            : pct <= 85 
              ? 3 
              : 2;
      
      return {
        setNumber: idx + 1,
        percentage: pct,
        weight,
        reps,
        rest: pct === 0 ? '30s' : pct <= 70 ? '60s' : '90s',
      };
    });
  }, [workingWeight, barWeight]);

  const totalWarmupWeight = useMemo(() => {
    return warmupSets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
  }, [warmupSets]);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors text-sm"
      >
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="text-foreground">Generar calentamiento</span>
      </button>
    );
  }

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-foreground">Generador de Calentamiento</h3>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsExpanded(false)}
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Peso de trabajo (kg)
          </label>
          <Input
            type="number"
            inputMode="decimal"
            value={workingWeight}
            onChange={(e) => setWorkingWeight(e.target.value)}
            placeholder="80"
            className="bg-secondary border-border"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Peso barra (kg)
          </label>
          <Input
            type="number"
            inputMode="decimal"
            value={barWeight}
            onChange={(e) => setBarWeight(e.target.value)}
            placeholder="20"
            className="bg-secondary border-border"
          />
        </div>
      </div>

      {/* Warmup sets */}
      {warmupSets.length > 0 ? (
        <>
          <div className="space-y-2 mb-4">
            {/* Header */}
            <div className="grid grid-cols-[50px_1fr_60px_60px_50px] gap-2 text-xs text-muted-foreground px-1">
              <span>Set</span>
              <span>%</span>
              <span>Peso</span>
              <span>Reps</span>
              <span>Rest</span>
            </div>

            {warmupSets.map((set) => (
              <div 
                key={set.setNumber}
                className={cn(
                  "grid grid-cols-[50px_1fr_60px_60px_50px] gap-2 items-center py-2 px-2 rounded-lg",
                  set.percentage === 0 ? "bg-orange-500/10" : "bg-secondary/50"
                )}
              >
                <span className="text-sm font-medium text-foreground">
                  {set.setNumber}
                </span>
                <div className="flex items-center gap-1">
                  {set.percentage === 0 ? (
                    <span className="text-xs text-orange-500 font-medium">Barra</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">{set.percentage}%</span>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {set.weight}kg
                </span>
                <span className="text-sm text-foreground">
                  ×{set.reps}
                </span>
                <span className="text-xs text-muted-foreground">
                  {set.rest}
                </span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t border-border">
            <span>Volumen total calentamiento:</span>
            <span className="font-medium text-foreground">
              {totalWarmupWeight.toLocaleString()}kg
            </span>
          </div>

          {onApply && (
            <Button
              className="w-full mt-4 bg-primary text-primary-foreground"
              onClick={() => onApply(warmupSets)}
            >
              <Dumbbell className="w-4 h-4 mr-2" />
              Aplicar calentamiento
            </Button>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Introduce el peso de trabajo para generar el calentamiento
        </p>
      )}
    </Card>
  );
};

export default WarmupGenerator;
