import React, { useState, useMemo } from 'react';
import { Calculator, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PlateCalculatorProps {
  initialWeight?: number;
}

// Standard plate weights in kg (pairs)
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

// Plate colors for visual representation
const PLATE_COLORS: Record<number, string> = {
  25: 'bg-red-500',
  20: 'bg-blue-500',
  15: 'bg-yellow-500',
  10: 'bg-green-500',
  5: 'bg-white border-2 border-gray-300',
  2.5: 'bg-red-300',
  1.25: 'bg-gray-400',
};

const PlateCalculator: React.FC<PlateCalculatorProps> = ({ initialWeight }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetWeight, setTargetWeight] = useState(initialWeight?.toString() || '');
  const [barWeight, setBarWeight] = useState('20');

  const plates = useMemo(() => {
    const target = parseFloat(targetWeight) || 0;
    const bar = parseFloat(barWeight) || 20;
    
    if (target <= bar) return [];

    const weightPerSide = (target - bar) / 2;
    const result: number[] = [];
    let remaining = weightPerSide;

    for (const plate of PLATES) {
      while (remaining >= plate) {
        result.push(plate);
        remaining -= plate;
        remaining = Math.round(remaining * 100) / 100; // Fix floating point
      }
    }

    // Check if we can't make exact weight
    if (remaining > 0.01) {
      return { plates: result, remaining, exact: false };
    }

    return { plates: result, remaining: 0, exact: true };
  }, [targetWeight, barWeight]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors text-sm"
      >
        <Calculator className="w-4 h-4 text-primary" />
        <span className="text-foreground">Calculadora de discos</span>
      </button>
    );
  }

  const plateData = plates as { plates: number[]; remaining: number; exact: boolean };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Calculadora de Discos</h3>
        </div>
        <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Peso objetivo (kg)
          </label>
          <Input
            type="number"
            inputMode="decimal"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            placeholder="100"
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

      {/* Visual bar representation */}
      {plateData.plates && plateData.plates.length > 0 && (
        <>
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Por cada lado:</p>
            
            {/* Bar visualization */}
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center">
                {/* Left plates (reversed for visual) */}
                <div className="flex items-center">
                  {[...plateData.plates].reverse().map((plate, idx) => (
                    <div
                      key={`left-${idx}`}
                      className={cn(
                        "flex items-center justify-center text-xs font-bold rounded-sm",
                        PLATE_COLORS[plate],
                        plate >= 20 ? "w-4 h-16" : plate >= 10 ? "w-3 h-14" : "w-2 h-10",
                        plate === 5 ? "text-gray-700" : "text-white"
                      )}
                    >
                      {plate >= 10 && <span className="rotate-90">{plate}</span>}
                    </div>
                  ))}
                </div>
                
                {/* Bar */}
                <div className="w-20 h-4 bg-gray-600 rounded-sm" />
                
                {/* Right plates */}
                <div className="flex items-center">
                  {plateData.plates.map((plate, idx) => (
                    <div
                      key={`right-${idx}`}
                      className={cn(
                        "flex items-center justify-center text-xs font-bold rounded-sm",
                        PLATE_COLORS[plate],
                        plate >= 20 ? "w-4 h-16" : plate >= 10 ? "w-3 h-14" : "w-2 h-10",
                        plate === 5 ? "text-gray-700" : "text-white"
                      )}
                    >
                      {plate >= 10 && <span className="rotate-90">{plate}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Plate list */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Discos por lado:</p>
            <div className="flex flex-wrap gap-2">
              {plateData.plates.map((plate, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium",
                    PLATE_COLORS[plate],
                    plate === 5 ? "text-gray-700" : "text-white"
                  )}
                >
                  {plate}kg
                </span>
              ))}
            </div>
          </div>

          {!plateData.exact && (
            <p className="text-xs text-amber-500 mt-3">
              ⚠️ No se puede hacer exacto. Faltan {plateData.remaining.toFixed(2)}kg por lado
            </p>
          )}
        </>
      )}

      {targetWeight && (!plateData.plates || plateData.plates.length === 0) && (
        <p className="text-sm text-muted-foreground text-center py-4">
          El peso objetivo debe ser mayor que el peso de la barra
        </p>
      )}
    </Card>
  );
};

export default PlateCalculator;
