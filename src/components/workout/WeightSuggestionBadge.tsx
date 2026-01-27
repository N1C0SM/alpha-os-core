import React from 'react';
import { TrendingUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeightSuggestionBadgeProps {
  suggestedWeight: number;
  currentWeight?: number;
  reason?: string;
  shouldProgress: boolean;
  className?: string;
  onApply?: (weight: number) => void;
}

export const WeightSuggestionBadge: React.FC<WeightSuggestionBadgeProps> = ({
  suggestedWeight,
  currentWeight,
  reason,
  shouldProgress,
  className,
  onApply,
}) => {
  if (!shouldProgress || suggestedWeight <= 0) return null;

  const increase = currentWeight ? suggestedWeight - currentWeight : 0;
  const hasIncrease = increase > 0;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs',
        hasIncrease
          ? 'bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30'
          : 'bg-secondary border border-border',
        className
      )}
    >
      {hasIncrease ? (
        <TrendingUp className="w-3.5 h-3.5 text-primary" />
      ) : (
        <Check className="w-3.5 h-3.5 text-muted-foreground" />
      )}
      
      <div className="flex flex-col">
        <span className="font-semibold text-foreground">
          {suggestedWeight}kg
          {hasIncrease && (
            <span className="text-primary ml-1">
              (+{increase}kg)
            </span>
          )}
        </span>
        {reason && (
          <span className="text-muted-foreground text-[10px] leading-tight">
            {reason}
          </span>
        )}
      </div>

      {onApply && hasIncrease && (
        <button
          onClick={() => onApply(suggestedWeight)}
          className="ml-auto px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors"
        >
          Aplicar
        </button>
      )}
    </div>
  );
};

// Compact version for use in set rows
interface CompactWeightSuggestionProps {
  suggestedWeight: number;
  shouldProgress: boolean;
  className?: string;
}

export const CompactWeightSuggestion: React.FC<CompactWeightSuggestionProps> = ({
  suggestedWeight,
  shouldProgress,
  className,
}) => {
  if (!shouldProgress || suggestedWeight <= 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
        'bg-primary/20 text-primary border border-primary/30',
        className
      )}
    >
      <TrendingUp className="w-2.5 h-2.5" />
      {suggestedWeight}kg
    </span>
  );
};

export default WeightSuggestionBadge;
