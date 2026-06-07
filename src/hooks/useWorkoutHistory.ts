import { useQuery } from '@tanstack/react-query';
import {
  routines as routinesApi,
  exercises as exercisesApi,
  workoutLogs as logsApi,
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Routine, Exercise } from './useRoutines';
import type { WorkoutLog } from './useWorkoutLogs';

export interface ExerciseWithLogs {
  exercise: Exercise;
  logs: WorkoutLog[];
}

export interface RoutineHistory {
  routine: Routine;
  exercises: ExerciseWithLogs[];
  logDates: string[]; // unique dates across all exercises, sorted DESC
}

export function useWorkoutHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['workoutHistory', user?.id],
    queryFn: async (): Promise<RoutineHistory[]> => {
      if (!user) return [];

      const routineRows = await routinesApi.list();
      if (!routineRows || routineRows.length === 0) return [];

      // Fetch exercises for all routines
      const exerciseResults = await Promise.all(routineRows.map((r) => exercisesApi.list(r.id)));
      const allExercises = exerciseResults.flat() as Exercise[];

      const allExerciseIds = allExercises.map((e) => e.id);
      if (allExerciseIds.length === 0) {
        return (routineRows as Routine[]).map((routine) => ({
          routine,
          exercises: [],
          logDates: [],
        }));
      }

      // Fetch all workout logs for these exercises
      const logRows = await logsApi.list(allExerciseIds);

      // Group logs by exercise_id
      const logsByExercise = new Map<string, WorkoutLog[]>();
      for (const log of (logRows ?? []) as WorkoutLog[]) {
        const list = logsByExercise.get(log.exercise_id) ?? [];
        list.push(log);
        logsByExercise.set(log.exercise_id, list);
      }

      // Group exercises by routine_id
      const exercisesByRoutine = new Map<string, Exercise[]>();
      for (const ex of allExercises) {
        const list = exercisesByRoutine.get(ex.routine_id) ?? [];
        list.push(ex);
        exercisesByRoutine.set(ex.routine_id, list);
      }

      return (routineRows as Routine[]).map((routine) => {
        const exercises = exercisesByRoutine.get(routine.id) ?? [];
        const exercisesWithLogs: ExerciseWithLogs[] = exercises.map((exercise) => ({
          exercise,
          logs: logsByExercise.get(exercise.id) ?? [],
        }));

        const dateSet = new Set<string>();
        for (const ew of exercisesWithLogs) {
          for (const log of ew.logs) {
            dateSet.add(log.logged_at.slice(0, 10));
          }
        }
        const logDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));

        return { routine, exercises: exercisesWithLogs, logDates };
      });
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
