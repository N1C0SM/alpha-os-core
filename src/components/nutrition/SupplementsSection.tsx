import React from 'react';
import { Check, Pill, Clock, Zap, Sun, Moon, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupplementRecommendations, useSupplementLogs, useToggleSupplement } from '@/hooks/useSupplements';
import type { SupplementRecommendation } from '@/services/decision-engine/supplement-decision';

const timingIcons: Record<SupplementRecommendation['timing'], React.ReactNode> = {
  morning: <Sun className="w-4 h-4" />,
  pre_workout: <Zap className="w-4 h-4" />,
  intra_workout: <Clock className="w-4 h-4" />,
  post_workout: <Zap className="w-4 h-4" />,
  with_meal: <Utensils className="w-4 h-4" />,
  before_bed: <Moon className="w-4 h-4" />,
};

const timingLabels: Record<SupplementRecommendation['timing'], string> = {
  morning: 'Mañana',
  pre_workout: 'Pre-entreno',
  intra_workout: 'Intra-entreno',
  post_workout: 'Post-entreno',
  with_meal: 'Con comida',
  before_bed: 'Antes de dormir',
};

const priorityColors: Record<SupplementRecommendation['priority'], string> = {
  essential: 'bg-primary/20 text-primary border-primary/30',
  recommended: 'bg-warning/20 text-warning border-warning/30',
  optional: 'bg-muted text-muted-foreground border-border',
};

const priorityLabels: Record<SupplementRecommendation['priority'], string> = {
  essential: 'Esencial',
  recommended: 'Recomendado',
  optional: 'Opcional',
};

const SupplementsSection: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const { data: recommendations, isLoading } = useSupplementRecommendations();
  const { data: logs } = useSupplementLogs(today);
  const toggleSupplement = useToggleSupplement();

  if (isLoading || !recommendations) {
    return null;
  }

  const isSupplementTaken = (timing: SupplementRecommendation['timing']) => {
    return logs?.some(log => log.timing === timing && log.taken) || false;
  };

  const handleToggle = (supplement: SupplementRecommendation) => {
    const taken = !isSupplementTaken(supplement.timing);
    toggleSupplement.mutate({
      supplementName: supplement.name,
      timing: supplement.timing,
      date: today,
      taken,
    });
  };

  const takenCount = logs?.filter(l => l.taken).length || 0;
  const totalCount = recommendations.recommendations.length;
  const progress = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  // Group by timing
  const groupedByTiming = recommendations.recommendations.reduce((acc, supp) => {
    if (!acc[supp.timing]) acc[supp.timing] = [];
    acc[supp.timing].push(supp);
    return acc;
  }, {} as Record<SupplementRecommendation['timing'], SupplementRecommendation[]>);

  const timingOrder: SupplementRecommendation['timing'][] = [
    'morning',
    'pre_workout',
    'intra_workout',
    'post_workout',
    'with_meal',
    'before_bed',
  ];

  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-foreground">Suplementos</h3>
        </div>
        <span className="text-purple-400 font-bold">{takenCount}/{totalCount}</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-purple-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Supplements list by timing */}
      <div className="space-y-4">
        {timingOrder.map(timing => {
          const supps = groupedByTiming[timing];
          if (!supps || supps.length === 0) return null;

          return (
            <div key={timing}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-muted-foreground">{timingIcons[timing]}</span>
                <span className="text-sm font-medium text-muted-foreground">{timingLabels[timing]}</span>
              </div>
              <div className="space-y-2">
                {supps.map((supp, idx) => {
                  const taken = isSupplementTaken(supp.timing);
                  return (
                    <div
                      key={`${supp.name}-${idx}`}
                      className={cn(
                        "rounded-xl p-3 border flex items-center gap-3 transition-all",
                        taken ? "border-purple-400/30 bg-purple-400/5" : "border-border bg-secondary/50"
                      )}
                    >
                      <button
                        onClick={() => handleToggle(supp)}
                        disabled={toggleSupplement.isPending}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                          taken ? "bg-purple-400" : "bg-secondary"
                        )}
                      >
                        {taken ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <Pill className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-medium truncate",
                            taken ? "text-muted-foreground line-through" : "text-foreground"
                          )}>
                            {supp.name}
                          </p>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full border",
                            priorityColors[supp.priority]
                          )}>
                            {priorityLabels[supp.priority]}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {supp.brand} • {supp.dosage}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      {recommendations.recommendations.length > 0 && (
        <div className="mt-4 p-3 bg-purple-400/10 rounded-lg border border-purple-400/20">
          <p className="text-xs text-purple-300">
            💡 {recommendations.recommendations[0].reason}
          </p>
        </div>
      )}
    </div>
  );
};

export default SupplementsSection;
