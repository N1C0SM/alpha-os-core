import React, { useState, useMemo } from 'react';
import { Trophy, X, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { calculate1RM } from '@/hooks/usePersonalRecords';

interface OneRMCalculatorProps {
  initialWeight?: number;
  initialReps?: number;
}

const OneRMCalculator: React.FC<OneRMCalculatorProps> = ({ 
  initialWeight,
  initialReps 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [weight, setWeight] = useState(initialWeight?.toString() || '');
  const [reps, setReps] = useState(initialReps?.toString() || '');

  const results = useMemo(() => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
    
    if (w <= 0 || r <= 0) return null;

    const oneRM = calculate1RM(w, r);

    // Calculate percentages
    const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60];
    const estimatedReps = [1, 2, 3, 5, 6, 8, 10, 12, 15];

    return {
      oneRM,
      table: percentages.map((pct, idx) => ({
        percentage: pct,
        weight: Math.round(oneRM * pct / 100 * 2) / 2, // Round to 0.5
        reps: estimatedReps[idx],
      })),
    };
  }, [weight, reps]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors text-sm"
      >
        <Trophy className="w-4 h-4 text-primary" />
        <span className="text-foreground">Calculadora 1RM</span>
      </button>
    );
  }

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Calculadora 1RM</h3>
        </div>
        <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Peso levantado (kg)
          </label>
          <Input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="80"
            className="bg-secondary border-border"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Repeticiones
          </label>
          <Input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="5"
            className="bg-secondary border-border"
          />
        </div>
      </div>

      {results && (
        <>
          {/* 1RM Result */}
          <div className="bg-primary/10 rounded-xl p-4 mb-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Tu 1RM estimado</p>
            <p className="text-4xl font-bold text-primary">{results.oneRM}kg</p>
            <p className="text-xs text-muted-foreground mt-1">
              Fórmula Brzycki
            </p>
          </div>

          {/* Percentage table */}
          <div className="space-y-1">
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground px-2 pb-1 border-b border-border">
              <span>%</span>
              <span>Peso</span>
              <span>~Reps</span>
            </div>
            {results.table.map((row) => (
              <div 
                key={row.percentage}
                className={`grid grid-cols-3 gap-2 text-sm px-2 py-1.5 rounded-lg ${
                  row.percentage === 100 ? 'bg-primary/10 font-semibold' : ''
                }`}
              >
                <span className="text-muted-foreground">{row.percentage}%</span>
                <span className="text-foreground font-medium">{row.weight}kg</span>
                <span className="text-muted-foreground">×{row.reps}</span>
              </div>
            ))}
          </div>

          {/* Progressive overload tip */}
          <div className="mt-4 p-3 bg-secondary/50 rounded-lg flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">Progresión sugerida: </span>
              Cuando completes {parseInt(reps) + 1}-{parseInt(reps) + 2} reps con {weight}kg, 
              sube a {Math.round((parseFloat(weight) + 2.5) * 2) / 2}kg
            </div>
          </div>
        </>
      )}

      {!results && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Introduce peso y repeticiones para calcular tu 1RM
        </p>
      )}
    </Card>
  );
};

export default OneRMCalculator;
