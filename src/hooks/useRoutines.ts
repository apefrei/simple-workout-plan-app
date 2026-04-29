import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { MuscleGroup } from '../types/database'

export interface Routine {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Exercise {
  id: string
  routine_id: string
  name: string
  muscle_group: MuscleGroup
  machine_info: string | null
  target_sets_reps: string | null
  media_url: string | null
  starting_weight_kg: number | null
  sort_order: number
  created_at: string
}

export type RoutineWithExercises = Routine & { exercises: Exercise[] }

export function useRoutines() {
  const { user } = useAuth()
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRoutines = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: routineRows, error: rErr } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (rErr) {
      if (import.meta.env.DEV) console.error('fetch routines:', rErr)
      setLoading(false)
      return
    }

    if (!routineRows || routineRows.length === 0) {
      setRoutines([])
      setLoading(false)
      return
    }

    const { data: exerciseRows, error: eErr } = await supabase
      .from('exercises')
      .select('*')
      .in(
        'routine_id',
        routineRows.map((r: Routine) => r.id),
      )
      .order('sort_order', { ascending: true })

    if (eErr) {
      if (import.meta.env.DEV) console.error('fetch exercises:', eErr)
    }

    const exercisesByRoutine = new Map<string, Exercise[]>()
    for (const ex of (exerciseRows ?? []) as Exercise[]) {
      const list = exercisesByRoutine.get(ex.routine_id) ?? []
      list.push(ex)
      exercisesByRoutine.set(ex.routine_id, list)
    }

    setRoutines(
      (routineRows as Routine[]).map((r) => ({
        ...r,
        exercises: exercisesByRoutine.get(r.id) ?? [],
      })),
    )
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchRoutines()
  }, [fetchRoutines])

  const createRoutine = async (name: string) => {
    if (!user) return null
    const { data, error } = await supabase
      .from('routines')
      .insert({ name, user_id: user.id })
      .select()
      .single()
    if (error) {
      if (import.meta.env.DEV) console.error('create routine:', error)
      return null
    }
    await fetchRoutines()
    return data as Routine
  }

  const updateRoutine = async (id: string, name: string) => {
    const { error } = await supabase
      .from('routines')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      if (import.meta.env.DEV) console.error('update routine:', error)
      return false
    }
    await fetchRoutines()
    return true
  }

  const deleteRoutine = async (id: string) => {
    const { error } = await supabase.from('routines').delete().eq('id', id)
    if (error) {
      if (import.meta.env.DEV) console.error('delete routine:', error)
      return false
    }
    await fetchRoutines()
    return true
  }

  const addExercise = async (
    routineId: string,
    exercise: {
      name: string
      muscle_group: MuscleGroup
      machine_info?: string
      target_sets_reps?: string
    },
  ) => {
    const routine = routines.find((r) => r.id === routineId)
    const sortOrder = routine ? routine.exercises.length : 0

    const { error } = await supabase.from('exercises').insert({
      routine_id: routineId,
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      machine_info: exercise.machine_info ?? null,
      target_sets_reps: exercise.target_sets_reps ?? null,
      sort_order: sortOrder,
    })
    if (error) {
      if (import.meta.env.DEV) console.error('add exercise:', error)
      return false
    }
    await fetchRoutines()
    return true
  }

  const updateExercise = async (
    id: string,
    updates: {
      name?: string
      muscle_group?: MuscleGroup
      machine_info?: string | null
      target_sets_reps?: string | null
    },
  ) => {
    const { error } = await supabase
      .from('exercises')
      .update(updates)
      .eq('id', id)
    if (error) {
      if (import.meta.env.DEV) console.error('update exercise:', error)
      return false
    }
    await fetchRoutines()
    return true
  }

  const deleteExercise = async (id: string) => {
    const { error } = await supabase.from('exercises').delete().eq('id', id)
    if (error) {
      if (import.meta.env.DEV) console.error('delete exercise:', error)
      return false
    }
    await fetchRoutines()
    return true
  }

  const reorderExercises = async (_routineId: string, exerciseIds: string[]) => {
    const updates = exerciseIds.map((id, index) =>
      supabase.from('exercises').update({ sort_order: index }).eq('id', id),
    )
    const results = await Promise.all(updates)
    const failed = results.find((r) => r.error)
    if (failed?.error) {
      if (import.meta.env.DEV) console.error('reorder exercises:', failed.error)
      return false
    }
    await fetchRoutines()
    return true
  }

  return {
    routines,
    loading,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    addExercise,
    updateExercise,
    deleteExercise,
    reorderExercises,
    refetch: fetchRoutines,
  }
}
