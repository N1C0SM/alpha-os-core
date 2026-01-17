import { useState, useEffect } from 'react';

interface WgerExerciseImage {
  id: number;
  image: string;
  is_main: boolean;
}

interface WgerExerciseInfo {
  id: number;
  name: string;
  images: WgerExerciseImage[];
}

// Cache to avoid repeated API calls
const imageCache = new Map<string, string | null>();

// Map common exercise names to Wger search terms (Spanish to English for better API results)
const exerciseNameMap: Record<string, string> = {
  'press banca': 'bench press',
  'press de banca': 'bench press',
  'sentadilla': 'squat',
  'sentadillas': 'squat',
  'peso muerto': 'deadlift',
  'dominadas': 'pull up',
  'fondos': 'dips',
  'curl biceps': 'bicep curl',
  'curl de biceps': 'bicep curl',
  'press militar': 'military press',
  'press hombro': 'shoulder press',
  'remo': 'row',
  'remo con barra': 'barbell row',
  'elevaciones laterales': 'lateral raise',
  'extensiones triceps': 'tricep extension',
  'zancadas': 'lunges',
  'prensa': 'leg press',
  'prensa de piernas': 'leg press',
  'curl femoral': 'leg curl',
  'extension cuadriceps': 'leg extension',
  'hip thrust': 'hip thrust',
  'jalón': 'lat pulldown',
  'jalon al pecho': 'lat pulldown',
  'face pull': 'face pull',
  'crunch': 'crunch',
  'plancha': 'plank',
  'abdominales': 'crunch',
  'press inclinado': 'incline bench press',
  'aperturas': 'chest fly',
  'encogimientos': 'shrugs',
  'gemelos': 'calf raise',
  'elevacion de gemelos': 'calf raise',
  'patada de triceps': 'tricep kickback',
  'curl martillo': 'hammer curl',
};

const normalizeExerciseName = (name: string): string => {
  const lowerName = name.toLowerCase().trim();
  return exerciseNameMap[lowerName] || lowerName;
};

export const useExerciseImage = (exerciseName: string) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      if (!exerciseName) {
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = exerciseName.toLowerCase();
      if (imageCache.has(cacheKey)) {
        setImageUrl(imageCache.get(cacheKey) || null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const searchTerm = normalizeExerciseName(exerciseName);
        
        // Search in English for better results
        const response = await fetch(
          `https://wger.de/api/v2/exerciseinfo/?language=2&limit=5&name=${encodeURIComponent(searchTerm)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch from Wger API');
        }

        const data = await response.json();
        
        let foundImage: string | null = null;

        // Try to find an exercise with images
        if (data.results && data.results.length > 0) {
          for (const exercise of data.results) {
            if (exercise.images && exercise.images.length > 0) {
              // Prefer main image
              const mainImage = exercise.images.find((img: WgerExerciseImage) => img.is_main);
              foundImage = mainImage?.image || exercise.images[0].image;
              break;
            }
          }
        }

        // If no results in Spanish, try English
        if (!foundImage) {
          const englishResponse = await fetch(
            `https://wger.de/api/v2/exerciseinfo/?language=2&limit=10&name=${encodeURIComponent(searchTerm)}`
          );
          
          if (englishResponse.ok) {
            const englishData = await englishResponse.json();
            if (englishData.results && englishData.results.length > 0) {
              for (const exercise of englishData.results) {
                if (exercise.images && exercise.images.length > 0) {
                  const mainImage = exercise.images.find((img: WgerExerciseImage) => img.is_main);
                  foundImage = mainImage?.image || exercise.images[0].image;
                  break;
                }
              }
            }
          }
        }

        // Cache the result
        imageCache.set(cacheKey, foundImage);
        setImageUrl(foundImage);
      } catch (err) {
        console.error('Error fetching exercise image:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        imageCache.set(cacheKey, null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [exerciseName]);

  return { imageUrl, isLoading, error };
};

// Prefetch images for a list of exercises
export const prefetchExerciseImages = async (exerciseNames: string[]) => {
  const uncached = exerciseNames.filter(name => !imageCache.has(name.toLowerCase()));
  
  await Promise.allSettled(
    uncached.map(async (name) => {
      const searchTerm = normalizeExerciseName(name);
      try {
        const response = await fetch(
          `https://wger.de/api/v2/exerciseinfo/?language=2&limit=5&name=${encodeURIComponent(searchTerm)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          let foundImage: string | null = null;
          
          if (data.results) {
            for (const exercise of data.results) {
              if (exercise.images && exercise.images.length > 0) {
                const mainImage = exercise.images.find((img: WgerExerciseImage) => img.is_main);
                foundImage = mainImage?.image || exercise.images[0].image;
                break;
              }
            }
          }
          
          imageCache.set(name.toLowerCase(), foundImage);
        }
      } catch (err) {
        console.error(`Error prefetching image for ${name}:`, err);
        imageCache.set(name.toLowerCase(), null);
      }
    })
  );
};
