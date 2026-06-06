import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutLogs as logsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export interface WorkoutLog {
  id: string;
  user_id: string;
  exercise_id: string;
  weight_kg: number;
  reps: number;
  comment: string | null;
  logged_at: string;
}

export function useLatestLogs(exerciseIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['latestLogs', user?.id, exerciseIds],
    queryFn: async () => {
      if (!user || exerciseIds.length === 0) return new Map<string, WorkoutLog>();

      const data = await logsApi.list(exerciseIds);

      // Keep only the latest log per exercise
      const latestByExercise = new Map<string, WorkoutLog>();
      for (const log of (data ?? []) as WorkoutLog[]) {
        if (!latestByExercise.has(log.exercise_id)) {
          latestByExercise.set(log.exercise_id, log);
        }
      }
      return latestByExercise;
    },
    enabled: !!user && exerciseIds.length > 0,
  });
}

export function useSaveLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['saveLog'],
    mutationFn: async (log: {
      exercise_id: string;
      weight_kg: number;
      reps: number;
      comment?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const data = await logsApi.create({
        exercise_id: log.exercise_id,
        weight_kg: log.weight_kg,
        reps: log.reps,
        comment: log.comment,
        logged_at: new Date().toISOString(),
      });

      return data as WorkoutLog;
    },
    onMutate: async (newLog) => {
      await queryClient.cancelQueries({ queryKey: ['latestLogs'] });

      const previousQueries = queryClient.getQueriesData<Map<string, WorkoutLog>>({
        queryKey: ['latestLogs'],
      });

      queryClient.setQueriesData<Map<string, WorkoutLog>>({ queryKey: ['latestLogs'] }, (old) => {
        if (!old) return old;
        const next = new Map(old);
        const existing = next.get(newLog.exercise_id);
        next.set(newLog.exercise_id, {
          id: existing?.id ?? crypto.randomUUID(),
          user_id: user?.id ?? '',
          exercise_id: newLog.exercise_id,
          weight_kg: newLog.weight_kg,
          reps: newLog.reps,
          comment: newLog.comment ?? null,
          logged_at: new Date().toISOString(),
        });
        return next;
      });

      return { previousQueries };
    },
    onError: (_err, _newLog, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['latestLogs'] });
      queryClient.invalidateQueries({ queryKey: ['workoutHistory'] });
    },
  });
}
