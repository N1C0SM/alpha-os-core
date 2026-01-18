import React, { useMemo, useState } from 'react';
import { ChefHat, Check, RefreshCw, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MacroTarget {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

interface MealOption {
  id: string;
  name: string;
  description: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  ingredients: string[];
  mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  tags: string[];
}

interface MealSuggestionsProps {
  targetMacros: MacroTarget;
  remainingMacros: MacroTarget;
  likedFoods?: string | null;
  dislikedFoods?: string | null;
  allergies?: string | null;
  preference?: string | null;
  onSelectMeal?: (meal: MealOption) => void;
}

// Database of meal options with macro info
const MEAL_DATABASE: MealOption[] = [
  // Breakfasts
  {
    id: 'breakfast-1',
    name: 'Tortilla de claras con avena',
    description: '4 claras + 1 yema, 50g avena con plátano',
    protein: 28,
    carbs: 45,
    fat: 8,
    calories: 364,
    ingredients: ['huevos', 'avena', 'plátano'],
    mealType: 'breakfast',
    tags: ['alto-proteína', 'energía'],
  },
  {
    id: 'breakfast-2',
    name: 'Yogur griego con frutos rojos',
    description: '200g yogur griego, 30g granola, frutos rojos',
    protein: 20,
    carbs: 35,
    fat: 10,
    calories: 310,
    ingredients: ['yogur', 'granola', 'frutos rojos'],
    mealType: 'breakfast',
    tags: ['rápido', 'proteína'],
  },
  {
    id: 'breakfast-3',
    name: 'Tostadas con aguacate y huevo',
    description: '2 tostadas integrales, ½ aguacate, 2 huevos',
    protein: 22,
    carbs: 30,
    fat: 20,
    calories: 388,
    ingredients: ['pan integral', 'aguacate', 'huevos'],
    mealType: 'breakfast',
    tags: ['grasas saludables', 'proteína'],
  },
  // Lunches
  {
    id: 'lunch-1',
    name: 'Pollo con arroz y verduras',
    description: '150g pechuga, 80g arroz, brócoli/judías',
    protein: 45,
    carbs: 65,
    fat: 8,
    calories: 514,
    ingredients: ['pollo', 'arroz', 'verduras'],
    mealType: 'lunch',
    tags: ['clásico', 'alto-proteína', 'gym'],
  },
  {
    id: 'lunch-2',
    name: 'Salmón con patata y espárragos',
    description: '150g salmón, 200g patata, espárragos',
    protein: 38,
    carbs: 40,
    fat: 18,
    calories: 474,
    ingredients: ['salmón', 'patata', 'espárragos'],
    mealType: 'lunch',
    tags: ['omega-3', 'proteína'],
  },
  {
    id: 'lunch-3',
    name: 'Pasta con carne picada',
    description: '80g pasta, 120g carne picada magra, tomate',
    protein: 35,
    carbs: 70,
    fat: 12,
    calories: 532,
    ingredients: ['pasta', 'carne picada', 'tomate'],
    mealType: 'lunch',
    tags: ['carbos', 'proteína', 'energía'],
  },
  {
    id: 'lunch-4',
    name: 'Ensalada de atún con quinoa',
    description: '150g atún, 60g quinoa, verduras mixtas, aceite oliva',
    protein: 40,
    carbs: 30,
    fat: 15,
    calories: 415,
    ingredients: ['atún', 'quinoa', 'verduras', 'aceite'],
    mealType: 'lunch',
    tags: ['ligero', 'proteína', 'saludable'],
  },
  // Snacks
  {
    id: 'snack-1',
    name: 'Batido de proteína con plátano',
    description: '1 scoop proteína, plátano, leche almendras',
    protein: 28,
    carbs: 30,
    fat: 3,
    calories: 259,
    ingredients: ['proteína whey', 'plátano', 'leche'],
    mealType: 'snack',
    tags: ['rápido', 'post-entreno', 'proteína'],
  },
  {
    id: 'snack-2',
    name: 'Frutos secos con fruta',
    description: '30g almendras/nueces, 1 manzana',
    protein: 8,
    carbs: 25,
    fat: 15,
    calories: 263,
    ingredients: ['almendras', 'nueces', 'manzana'],
    mealType: 'snack',
    tags: ['grasas saludables', 'energía'],
  },
  {
    id: 'snack-3',
    name: 'Queso cottage con piña',
    description: '150g queso cottage, 100g piña',
    protein: 18,
    carbs: 15,
    fat: 4,
    calories: 168,
    ingredients: ['queso cottage', 'piña'],
    mealType: 'snack',
    tags: ['proteína', 'ligero'],
  },
  // Dinners
  {
    id: 'dinner-1',
    name: 'Pavo con verduras salteadas',
    description: '150g pechuga pavo, mix verduras, aceite oliva',
    protein: 42,
    carbs: 15,
    fat: 10,
    calories: 318,
    ingredients: ['pavo', 'verduras', 'aceite'],
    mealType: 'dinner',
    tags: ['ligero', 'alto-proteína', 'bajo-carb'],
  },
  {
    id: 'dinner-2',
    name: 'Tortilla francesa con ensalada',
    description: '3 huevos, ensalada mixta, aceite oliva',
    protein: 22,
    carbs: 8,
    fat: 18,
    calories: 282,
    ingredients: ['huevos', 'ensalada', 'aceite'],
    mealType: 'dinner',
    tags: ['rápido', 'bajo-carb'],
  },
  {
    id: 'dinner-3',
    name: 'Merluza al horno con verduras',
    description: '180g merluza, calabacín, pimiento, aceite',
    protein: 35,
    carbs: 12,
    fat: 12,
    calories: 292,
    ingredients: ['merluza', 'calabacín', 'pimiento'],
    mealType: 'dinner',
    tags: ['ligero', 'pescado', 'proteína'],
  },
  {
    id: 'dinner-4',
    name: 'Revuelto de gambas con champiñones',
    description: '150g gambas, 2 huevos, champiñones',
    protein: 38,
    carbs: 5,
    fat: 14,
    calories: 298,
    ingredients: ['gambas', 'huevos', 'champiñones'],
    mealType: 'dinner',
    tags: ['bajo-carb', 'mariscos', 'proteína'],
  },
];

// Filter and score meals based on user preferences and remaining macros
function scoreMeal(
  meal: MealOption,
  remaining: MacroTarget,
  likedFoods: string[],
  dislikedFoods: string[],
  allergies: string[]
): number {
  let score = 50; // Base score

  // Check for allergies or disliked foods - eliminate
  for (const ingredient of meal.ingredients) {
    const ingredientLower = ingredient.toLowerCase();
    if (allergies.some(a => ingredientLower.includes(a.toLowerCase()))) {
      return -1; // Eliminate
    }
    if (dislikedFoods.some(d => ingredientLower.includes(d.toLowerCase()))) {
      score -= 30;
    }
  }

  // Bonus for liked foods
  for (const ingredient of meal.ingredients) {
    const ingredientLower = ingredient.toLowerCase();
    if (likedFoods.some(l => ingredientLower.includes(l.toLowerCase()))) {
      score += 20;
    }
  }

  // Score based on how well it fits remaining macros (prioritize protein)
  const proteinFit = Math.min(meal.protein / Math.max(remaining.protein, 1), 1);
  score += proteinFit * 30;

  // Penalize if it exceeds remaining by too much
  if (meal.protein > remaining.protein * 1.2) score -= 10;
  if (meal.carbs > remaining.carbs * 1.3) score -= 15;
  if (meal.fat > remaining.fat * 1.3) score -= 10;
  if (meal.calories > remaining.calories * 1.2) score -= 15;

  return score;
}

const MealSuggestions: React.FC<MealSuggestionsProps> = ({
  targetMacros,
  remainingMacros,
  likedFoods,
  dislikedFoods,
  allergies,
  preference,
  onSelectMeal,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);

  // Parse user preferences
  const likedList = useMemo(() => 
    (likedFoods || '').split(',').map(s => s.trim()).filter(Boolean),
    [likedFoods]
  );
  const dislikedList = useMemo(() => 
    (dislikedFoods || '').split(',').map(s => s.trim()).filter(Boolean),
    [dislikedFoods]
  );
  const allergiesList = useMemo(() => 
    (allergies || '').split(',').map(s => s.trim()).filter(Boolean),
    [allergies]
  );

  // Determine meal type based on time
  const currentMealType = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 18) return 'snack';
    return 'dinner';
  }, []);

  // Get suggested meals
  const suggestedMeals = useMemo(() => {
    // Filter by meal type first
    const typeFiltered = MEAL_DATABASE.filter(m => m.mealType === currentMealType);
    
    // Score and sort
    const scored = typeFiltered.map(meal => ({
      meal,
      score: scoreMeal(meal, remainingMacros, likedList, dislikedList, allergiesList),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

    // Add some randomness by shuffling top results
    const top = scored.slice(0, 6);
    for (let i = top.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [top[i], top[j]] = [top[j], top[i]];
    }

    return top.slice(0, 3).map(({ meal }) => meal);
  }, [currentMealType, remainingMacros, likedList, dislikedList, allergiesList, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    setSelectedMealId(null);
  };

  const handleSelectMeal = (meal: MealOption) => {
    setSelectedMealId(meal.id);
    onSelectMeal?.(meal);
  };

  const mealTypeLabels: Record<string, string> = {
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    snack: 'Merienda',
    dinner: 'Cena',
  };

  if (remainingMacros.protein <= 0) {
    return (
      <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-center">
        <Check className="w-8 h-8 text-success mx-auto mb-2" />
        <p className="text-success font-medium">¡Objetivo de proteína cumplido!</p>
        <p className="text-sm text-muted-foreground mt-1">
          Ya alcanzaste tu meta de {targetMacros.protein}g de proteína hoy
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">
            Sugerencias para {mealTypeLabels[currentMealType]}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Otras opciones
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Basado en tus preferencias y {remainingMacros.protein}g de proteína restante
      </p>

      <div className="space-y-3">
        {suggestedMeals.map((meal) => {
          const isSelected = selectedMealId === meal.id;
          
          return (
            <button
              key={meal.id}
              onClick={() => handleSelectMeal(meal)}
              className={cn(
                "w-full text-left bg-card rounded-xl p-4 border transition-all",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">{meal.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{meal.description}</p>
                  
                  {/* Macro badges */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">
                      {meal.protein}g prot
                    </span>
                    <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
                      {meal.carbs}g carbs
                    </span>
                    <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full">
                      {meal.fat}g grasa
                    </span>
                    <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                      {meal.calories} kcal
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {suggestedMeals.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <p>No hay sugerencias disponibles para este momento</p>
          <p className="text-sm">Prueba con el registro manual de bloques</p>
        </div>
      )}
    </div>
  );
};

export default MealSuggestions;
