import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Routine, Exercise } from './useRoutines'
import type { WorkoutLog } from './useWorkoutLogs'

export interface ExerciseWithLogs {
  exercise: Exercise
  logs: WorkoutLog[]
}

export interface RoutineHistory {
  routine: Routine
  exercises: ExerciseWithLogs[]
  logDates: string[] // unique dates across all exercises, sorted DESC
}

export function useWorkoutHistory() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['workoutHistory', user?.id],
    queryFn: async (): Promise<RoutineHistory[]> => {
      if (!user) return []

      // Fetch routines
      const { data: routineRows, error: rErr } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (rErr) throw rErr
      if (!routineRows || routineRows.length === 0) return []

      // Fetch exercises for all routines
      const { data: exerciseRows, error: eErr } = await supabase
        .from('exercises')
        .select('*')
        .in('routine_id', routineRows.map((r: Routine) => r.id))
        .order('sort_order', { ascending: true })

      if (eErr) throw eErr

      const allExerciseIds = (exerciseRows ?? []).map((e: Exercise) => e.id)
      if (allExerciseIds.length === 0) {
        return (routineRows as Routine[]).map((routine) => ({
          routine,
          exercises: [],
          logDates: [],
        }))
      }

      // Fetch all workout logs for these exercises
      const { data: logRows, error: lErr } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('exercise_id', allExerciseIds)
        .order('logged_at', { ascending: false })

      if (lErr) throw lErr

      // Group logs by exercise_id
      const logsByExercise = new Map<string, WorkoutLog[]>()
      for (const log of (logRows ?? []) as WorkoutLog[]) {
        const list = logsByExercise.get(log.exercise_id) ?? []
        list.push(log)
        logsByExercise.set(log.exercise_id, list)
      }

      // Group exercises by routine_id
      const exercisesByRoutine = new Map<string, Exercise[]>()
      for (const ex of (exerciseRows ?? []) as Exercise[]) {
        const list = exercisesByRoutine.get(ex.routine_id) ?? []
        list.push(ex)
        exercisesByRoutine.set(ex.routine_id, list)
      }

      // Build the result
      return (routineRows as Routine[]).map((routine) => {
        const exercises = exercisesByRoutine.get(routine.id) ?? []
        const exercisesWithLogs: ExerciseWithLogs[] = exercises.map((exercise) => ({
          exercise,
          logs: logsByExercise.get(exercise.id) ?? [],
        }))

        // Collect unique dates across all exercises in this routine
        const dateSet = new Set<string>()
        for (const ew of exercisesWithLogs) {
          for (const log of ew.logs) {
            // Extract date portion only (YYYY-MM-DD)
            dateSet.add(log.logged_at.slice(0, 10))
          }
        }
        const logDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a))

        return { routine, exercises: exercisesWithLogs, logDates }
      })
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })
}
