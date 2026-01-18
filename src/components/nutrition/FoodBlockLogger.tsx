import React, { useState } from 'react';
import { Plus, Check, Beef, Wheat, Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Macro values per size (in grams)
const PORTION_MACROS = {
  protein: {
    S: { protein: 15, carbs: 0, fat: 3, calories: 87 },   // e.g., 1 egg, 50g chicken
    M: { protein: 30, carbs: 0, fat: 6, calories: 174 },  // e.g., 100g meat
    L: { protein: 45, carbs: 0, fat: 9, calories: 261 },  // e.g., 150g meat
  },
  carbs: {
    S: { protein: 2, carbs: 25, fat: 1, calories: 117 },   // e.g., 1 slice bread, 50g rice
    M: { protein: 4, carbs: 50, fat: 2, calories: 234 },   // e.g., 100g rice/pasta
    L: { protein: 6, carbs: 75, fat: 3, calories: 351 },   // e.g., 150g rice/pasta
  },
  fat: {
    S: { protein: 0, carbs: 0, fat: 10, calories: 90 },    // e.g., 1 tbsp oil, 10g nuts
    M: { protein: 1, carbs: 1, fat: 20, calories: 181 },   // e.g., 30g nuts, 2 tbsp
    L: { protein: 2, carbs: 2, fat: 30, calories: 272 },   // e.g., avocado, 45g nuts
  },
};

type MacroType = 'protein' | 'carbs' | 'fat';
type PortionSize = 'S' | 'M' | 'L';

interface FoodBlock {
  type: MacroType;
  size: PortionSize;
}

interface LoggedMeal {
  id: string;
  blocks: FoodBlock[];
  timestamp: Date;
  mealName: string;
}

interface FoodBlockLoggerProps {
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetCalories: number;
  consumedProtein?: number;
  consumedCarbs?: number;
  consumedFat?: number;
  consumedCalories?: number;
  onLogMeal: (meal: { 
    protein: number; 
    carbs: number; 
    fat: number; 
    calories: number;
    blocks: FoodBlock[];
  }) => void;
}

const MACRO_CONFIG: Record<MacroType, { 
  label: string; 
  icon: typeof Beef; 
  color: string; 
  examples: Record<PortionSize, string>;
}> = {
  protein: {
    label: 'Proteína',
    icon: Beef,
    color: 'text-red-400',
    examples: {
      S: '1 huevo, 50g pollo',
      M: '100g carne/pescado',
      L: '150g carne, 2 huevos',
    },
  },
  carbs: {
    label: 'Carbos',
    icon: Wheat,
    color: 'text-amber-400',
    examples: {
      S: '1 tostada, 50g arroz',
      M: '100g arroz/pasta',
      L: '150g arroz, 2 tostadas',
    },
  },
  fat: {
    label: 'Grasas',
    icon: Droplet,
    color: 'text-yellow-400',
    examples: {
      S: '1 cda aceite, 10g frutos secos',
      M: '30g frutos secos',
      L: '½ aguacate, 45g frutos secos',
    },
  },
};

const SIZE_LABELS: Record<PortionSize, string> = {
  S: 'Pequeño',
  M: 'Mediano', 
  L: 'Grande',
};

const FoodBlockLogger: React.FC<FoodBlockLoggerProps> = ({
  targetProtein,
  targetCarbs,
  targetFat,
  targetCalories,
  consumedProtein = 0,
  consumedCarbs = 0,
  consumedFat = 0,
  consumedCalories = 0,
  onLogMeal,
}) => {
  const [selectedBlocks, setSelectedBlocks] = useState<FoodBlock[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate remaining macros
  const remainingProtein = Math.max(0, targetProtein - consumedProtein);
  const remainingCarbs = Math.max(0, targetCarbs - consumedCarbs);
  const remainingFat = Math.max(0, targetFat - consumedFat);

  // Calculate selected meal macros
  const selectedMacros = selectedBlocks.reduce(
    (acc, block) => {
      const macros = PORTION_MACROS[block.type][block.size];
      return {
        protein: acc.protein + macros.protein,
        carbs: acc.carbs + macros.carbs,
        fat: acc.fat + macros.fat,
        calories: acc.calories + macros.calories,
      };
    },
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  );

  const toggleBlock = (type: MacroType, size: PortionSize) => {
    const existingIndex = selectedBlocks.findIndex(
      (b) => b.type === type && b.size === size
    );
    
    if (existingIndex >= 0) {
      setSelectedBlocks(selectedBlocks.filter((_, i) => i !== existingIndex));
    } else {
      setSelectedBlocks([...selectedBlocks, { type, size }]);
    }
  };

  const hasBlock = (type: MacroType, size: PortionSize) => {
    return selectedBlocks.some((b) => b.type === type && b.size === size);
  };

  const handleLogMeal = () => {
    if (selectedBlocks.length === 0) return;
    
    onLogMeal({
      ...selectedMacros,
      blocks: selectedBlocks,
    });
    
    setSelectedBlocks([]);
    setIsExpanded(false);
  };

  // Protein status
  const proteinProgress = Math.round((consumedProtein / targetProtein) * 100);
  const getProteinStatus = () => {
    if (proteinProgress >= 100) return { text: '¡Objetivo cumplido! 💪', color: 'text-green-400' };
    if (proteinProgress >= 75) return { text: `Te faltan ${remainingProtein}g`, color: 'text-amber-400' };
    if (proteinProgress >= 50) return { text: `Vas bien, faltan ${remainingProtein}g`, color: 'text-blue-400' };
    return { text: `Prioriza proteína: ${remainingProtein}g pendiente`, color: 'text-red-400' };
  };
  const proteinStatus = getProteinStatus();

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Protein Priority Banner */}
      <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Beef className="w-5 h-5 text-red-400" />
            <span className="font-semibold text-foreground">Proteína</span>
          </div>
          <span className="text-2xl font-bold text-foreground">
            {consumedProtein}g <span className="text-muted-foreground text-lg">/ {targetProtein}g</span>
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full mt-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-400 to-orange-400 transition-all duration-500"
            style={{ width: `${Math.min(proteinProgress, 100)}%` }}
          />
        </div>
        <p className={cn("text-sm mt-2", proteinStatus.color)}>
          {proteinStatus.text}
        </p>
      </div>

      {/* Quick Add Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full p-4 flex items-center justify-center gap-2 transition-colors",
          isExpanded ? "bg-primary/10" : "hover:bg-secondary/50"
        )}
      >
        <Plus className={cn("w-5 h-5 transition-transform", isExpanded && "rotate-45")} />
        <span className="font-medium">
          {isExpanded ? 'Cancelar' : 'Registrar comida'}
        </span>
      </button>

      {/* Expanded Food Block Selector */}
      {isExpanded && (
        <div className="p-4 border-t border-border space-y-4 animate-in slide-in-from-top-2">
          <p className="text-sm text-muted-foreground">
            Selecciona los bloques que comiste. No tienes que ser exacto.
          </p>

          {/* Macro Type Sections */}
          {(Object.keys(MACRO_CONFIG) as MacroType[]).map((type) => {
            const config = MACRO_CONFIG[type];
            const Icon = config.icon;
            
            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", config.color)} />
                  <span className="font-medium text-sm">{config.label}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {(['S', 'M', 'L'] as PortionSize[]).map((size) => {
                    const isSelected = hasBlock(type, size);
                    const macros = PORTION_MACROS[type][size];
                    
                    return (
                      <button
                        key={size}
                        onClick={() => toggleBlock(type, size)}
                        className={cn(
                          "relative p-3 rounded-xl border-2 transition-all text-left",
                          isSelected 
                            ? "border-primary bg-primary/10" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute top-1 right-1">
                            <Check className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <div className="text-lg font-bold">{size}</div>
                        <div className="text-xs text-muted-foreground">{SIZE_LABELS[size]}</div>
                        <div className="text-xs text-muted-foreground/70 mt-1">
                          {type === 'protein' && `${macros.protein}g prot`}
                          {type === 'carbs' && `${macros.carbs}g carbs`}
                          {type === 'fat' && `${macros.fat}g grasa`}
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* Examples */}
                <div className="text-xs text-muted-foreground/60 pl-6">
                  {selectedBlocks.filter(b => b.type === type).length > 0 && (
                    <span>Ej: {config.examples[selectedBlocks.find(b => b.type === type)?.size || 'M']}</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Selected Summary */}
          {selectedBlocks.length > 0 && (
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
              <div className="text-sm font-medium">Esta comida suma:</div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold">{selectedMacros.calories}</div>
                  <div className="text-xs text-muted-foreground">kcal</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-400">{selectedMacros.protein}g</div>
                  <div className="text-xs text-muted-foreground">prot</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-amber-400">{selectedMacros.carbs}g</div>
                  <div className="text-xs text-muted-foreground">carbs</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-400">{selectedMacros.fat}g</div>
                  <div className="text-xs text-muted-foreground">grasa</div>
                </div>
              </div>
              
              <Button 
                onClick={handleLogMeal}
                className="w-full"
                size="lg"
              >
                <Check className="w-4 h-4 mr-2" />
                Registrar comida
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Remaining Macros Summary */}
      {!isExpanded && (
        <div className="p-4 border-t border-border">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className={cn("text-lg font-bold", remainingCarbs === 0 ? "text-green-400" : "text-amber-400")}>
                {remainingCarbs}g
              </div>
              <div className="text-xs text-muted-foreground">Carbos restante</div>
            </div>
            <div>
              <div className={cn("text-lg font-bold", remainingFat === 0 ? "text-green-400" : "text-yellow-400")}>
                {remainingFat}g
              </div>
              <div className="text-xs text-muted-foreground">Grasa restante</div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                {targetCalories - consumedCalories}
              </div>
              <div className="text-xs text-muted-foreground">kcal restante</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodBlockLogger;
