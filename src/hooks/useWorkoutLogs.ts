import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface WorkoutLog {
  id: string
  user_id: string
  exercise_id: string
  weight_kg: number
  reps: number
  comment: string | null
  logged_at: string
}

export function useLatestLogs(exerciseIds: string[]) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['latestLogs', user?.id, exerciseIds],
    queryFn: async () => {
      if (!user || exerciseIds.length === 0) return new Map<string, WorkoutLog>()

      // Fetch the most recent log for each exercise
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('exercise_id', exerciseIds)
        .order('logged_at', { ascending: false })

      if (error) throw error

      // Keep only the latest log per exercise
      const latestByExercise = new Map<string, WorkoutLog>()
      for (const log of (data ?? []) as WorkoutLog[]) {
        if (!latestByExercise.has(log.exercise_id)) {
          latestByExercise.set(log.exercise_id, log)
        }
      }
      return latestByExercise
    },
    enabled: !!user && exerciseIds.length > 0,
  })
}

export function useSaveLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['saveLog'],
    mutationFn: async (log: { exercise_id: string; weight_kg: number; reps: number; comment?: string }) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('workout_logs')
        .upsert(
          {
            user_id: user.id,
            exercise_id: log.exercise_id,
            weight_kg: log.weight_kg,
            reps: log.reps,
            comment: log.comment ?? null,
            logged_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,exercise_id,logged_at' },
        )
        .select()
        .single()

      if (error) throw error
      return data as WorkoutLog
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latestLogs'] })
    },
  })
}
