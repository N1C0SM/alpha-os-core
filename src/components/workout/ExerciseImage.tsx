import React from 'react';
import { Dumbbell } from 'lucide-react';
import { useExerciseImage } from '@/hooks/useExerciseImage';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ExerciseImageProps {
  exerciseName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
};

const iconSizes = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const ExerciseImage: React.FC<ExerciseImageProps> = ({
  exerciseName,
  size = 'md',
  className,
}) => {
  const { imageUrl, isLoading } = useExerciseImage(exerciseName);

  if (isLoading) {
    return (
      <Skeleton 
        className={cn(
          sizeClasses[size],
          'rounded-lg flex-shrink-0',
          className
        )} 
      />
    );
  }

  if (imageUrl) {
    return (
      <div
        className={cn(
          sizeClasses[size],
          'rounded-lg overflow-hidden bg-secondary flex-shrink-0',
          className
        )}
      >
        <img
          src={imageUrl}
          alt={exerciseName}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            // If image fails to load, hide it
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Fallback icon
  return (
    <div
      className={cn(
        sizeClasses[size],
        'rounded-lg bg-secondary flex items-center justify-center flex-shrink-0',
        className
      )}
    >
      <Dumbbell className={cn(iconSizes[size], 'text-muted-foreground')} />
    </div>
  );
};

export default ExerciseImage;
