
# Plan: Hacer que TODO en la Landing sea REAL

## Resumen Ejecutivo

La landing promete un sistema que **decide y actúa automáticamente**. El código actual tiene buenas bases pero le falta el "cerebro" que conecte los datos con acciones automáticas. Este plan implementa esa conexión.

---

## Fase 1: Auto-Detección de Estancamiento y Modificación de Rutina

### Problema actual
La landing dice: "Detecta estancamientos" y "Modifica ejercicios" pero el sistema solo trackea progresión sin actuar.

### Solución
Crear un servicio `stagnation-detection.ts` que:
- Analice las últimas 2-3 semanas de exercise_logs
- Detecte cuando un ejercicio no ha progresado en peso/reps
- Sugiera automáticamente ejercicios alternativos o cambios de volumen

### Archivos a crear/modificar
1. **Nuevo**: `src/services/decision-engine/stagnation-detection.ts`
2. **Modificar**: `src/hooks/useProgressionSuggestion.ts` - añadir detección de estancamiento
3. **Modificar**: `src/pages/TrainingPage.tsx` - mostrar alertas de estancamiento con sugerencias

---

## Fase 2: Alertas Proactivas Reales

### Problema actual
Las push notifications existen pero solo para recordatorios básicos, no alertas inteligentes.

### Solución
Implementar un sistema de alertas basado en datos:

1. **Alerta de estancamiento**: Cuando un ejercicio no progresa en 2+ semanas
2. **Alerta de inconsistencia**: Cuando el usuario entrena menos de lo planificado
3. **Alerta de recuperación**: Cuando detecta patrones de fatiga
4. **Alerta de nutrición**: Cuando la proteína registrada está muy por debajo del objetivo

### Archivos a crear/modificar
1. **Nuevo**: `src/services/decision-engine/proactive-alerts.ts`
2. **Modificar**: `src/pages/TodayPage.tsx` - mostrar alertas proactivas en el dashboard
3. **Nuevo**: Componente `src/components/alerts/ProactiveAlertCard.tsx`

---

## Fase 3: Auto-Ajuste de Macros por Cambio de Peso

### Problema actual
Los macros se calculan correctamente pero no se recalculan automáticamente cuando el peso cambia.

### Solución
Crear un hook que detecte cambios de peso y recalcule automáticamente:

1. Comparar peso actual vs peso de hace 1-2 semanas
2. Si hay cambio significativo (>0.5kg), recalcular macros
3. Mostrar notificación al usuario: "Tu objetivo de proteína ha cambiado a Xg"

### Archivos a modificar
1. **Modificar**: `src/hooks/useNutrition.ts` - añadir auto-recálculo
2. **Modificar**: `src/pages/NutritionPage.tsx` - mostrar cambios de objetivo

---

## Fase 4: Progresión Automática Post-Entreno

### Problema actual
El feedback de sets (easy/correct/hard) se guarda pero no afecta automáticamente el siguiente entreno.

### Solución
Después de completar un entreno:
1. Analizar todos los sets marcados como "easy"
2. Pre-calcular los pesos sugeridos para la próxima sesión
3. Guardarlos en `exercise_max_weights.should_progress`
4. Mostrar al inicio del próximo entreno: "Sugerencia: +2.5kg en Press Banca"

### Archivos a modificar
1. **Modificar**: `src/pages/ActiveWorkoutPage.tsx` - procesar feedback al completar
2. **Modificar**: `src/hooks/useExerciseMaxWeights.ts` - mejorar lógica de sugerencias
3. **Nuevo**: `src/components/workout/WeightSuggestionBadge.tsx`

---

## Fase 5: Dashboard de Progreso Real

### Problema actual
La landing menciona "Comparativa semanal" y "Tendencias" pero no existe visualización.

### Solución
Añadir sección de progreso en TodayPage con:
1. **Gráfico de volumen semanal** (series x peso total)
2. **Indicador de tendencia** (subiendo/estable/bajando)
3. **PRs de la semana** destacados
4. **Comparativa vs semana anterior**

### Archivos a crear/modificar
1. **Nuevo**: `src/components/progress/WeeklyProgressCard.tsx`
2. **Nuevo**: `src/hooks/useWeeklyProgress.ts`
3. **Modificar**: `src/pages/TodayPage.tsx` - añadir tarjeta de progreso

---

## Fase 6: Auto-Generación de Rutina Post-Onboarding

### Problema actual
La landing dice "Plan listo en 2 minutos" pero después del onboarding el usuario aún tiene que crear manualmente la rutina.

### Solución
Al completar onboarding:
1. Generar automáticamente la rutina con IA
2. Redirigir a /hoy con rutina ya creada
3. Mostrar modal de bienvenida explicando el plan

### Archivos a modificar
1. **Modificar**: `src/pages/OnboardingPage.tsx` - auto-generar rutina al completar
2. **Nuevo**: `src/components/onboarding/WelcomeModal.tsx`

---

## Resumen de Impacto

| Promesa de la Landing | Estado Actual | Después del Plan |
|----------------------|---------------|------------------|
| "Detecta estancamientos" | ⚠️ Parcial | ✅ Completo |
| "Modifica ejercicios automáticamente" | ❌ No existe | ✅ Sugerencias automáticas |
| "Alertas proactivas" | ❌ No existe | ✅ Sistema de alertas |
| "Macros se ajustan solos" | ⚠️ Manual | ✅ Automático |
| "Comparativa semanal" | ❌ No existe | ✅ Dashboard de progreso |
| "Plan listo en 2 min" | ⚠️ 2 pasos | ✅ Automático |
| "AUTOPILOT actúa" | ❌ Pasivo | ✅ Proactivo |

---

## Orden de Implementación Recomendado

1. **Fase 6** primero - es la primera impresión del usuario
2. **Fase 4** - es lo que más usa el usuario día a día  
3. **Fase 1** - diferenciador clave vs otras apps
4. **Fase 2** - engagement y retención
5. **Fase 5** - visualización de valor
6. **Fase 3** - refinamiento del sistema

---

## Detalle Técnico por Fase

### Fase 1: Stagnation Detection Service

```text
stagnation-detection.ts
├── analyzeExerciseProgress(exerciseId, logs[]) 
│   ├── Calculate weight trend over 2-3 weeks
│   ├── Detect plateau (no increase in max weight)
│   └── Return: { isStagnant, weeksSince, suggestion }
├── suggestAlternative(exerciseId)
│   └── Return similar exercises from DB
└── suggestVolumeChange(currentSets, currentReps)
    └── Return: increase sets/reps recommendation
```

### Fase 2: Proactive Alerts

```text
proactive-alerts.ts
├── getStagnationAlerts(userId)
├── getConsistencyAlerts(userId, scheduledDays, completedDays)
├── getFatigueAlerts(userId, recentSessions)
└── getNutritionAlerts(userId, proteinLogs, target)
```

### Fase 4: Post-Workout Processing

```text
Al completar entreno:
1. Loop por cada ejercicio
2. Si feeling = 'easy' && consecutiveSessions >= 2
3. Calcular nuevo peso sugerido
4. Guardar en exercise_max_weights
5. Mostrar resumen en PostWorkoutSummary
```

### Fase 5: Weekly Progress Hook

```text
useWeeklyProgress.ts
├── Query exercise_logs last 14 days
├── Calculate:
│   ├── totalVolume (sets × weight × reps)
│   ├── weekOverWeekChange
│   ├── exercisePRs
│   └── consistencyRate
└── Return formatted data for charts
```

---

## Consideraciones de UI/UX

- Las alertas deben ser **accionables** (botón para aplicar sugerencia)
- El progreso debe ser **visual** (gráficos simples, no tablas de datos)
- Los cambios automáticos deben ser **transparentes** (mostrar qué cambió y por qué)
- El sistema debe sentirse **inteligente pero no invasivo**
