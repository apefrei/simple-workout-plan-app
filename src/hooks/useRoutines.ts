import { useEffect, useState, useCallback } from 'react';
import { routines as routinesApi, exercises as exercisesApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { MuscleGroup } from '../types/database';

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  routine_id: string;
  name: string;
  muscle_group: MuscleGroup;
  machine_info: string | null;
  target_sets_reps: string | null;
  media_url: string | null;
  starting_weight_kg: number | null;
  sort_order: number;
  created_at: string;
}

export type RoutineWithExercises = Routine & { exercises: Exercise[] };

export function useRoutines() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoutines = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const routineRows = await routinesApi.list();

      if (!routineRows || routineRows.length === 0) {
        setRoutines([]);
        setLoading(false);
        return;
      }

      const allIds = routineRows.map((r) => r.id);

      // Fetch exercises for all routines in parallel
      const exerciseResults = await Promise.all(allIds.map((id) => exercisesApi.list(id)));
      const allExercises = exerciseResults.flat() as Exercise[];

      const exercisesByRoutine = new Map<string, Exercise[]>();
      for (const ex of allExercises) {
        const list = exercisesByRoutine.get(ex.routine_id) ?? [];
        list.push(ex);
        exercisesByRoutine.set(ex.routine_id, list);
      }

      setRoutines(
        routineRows.map((r) => ({
          ...r,
          exercises: exercisesByRoutine.get(r.id) ?? [],
        })) as RoutineWithExercises[]
      );
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetch routines:', err);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    // Data-fetch effect; fetchRoutines manages its own loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRoutines();
  }, [fetchRoutines]);

  const createRoutine = async (name: string) => {
    if (!user) return null;
    try {
      const data = await routinesApi.create(name);
      await fetchRoutines();
      return data as Routine;
    } catch (err) {
      if (import.meta.env.DEV) console.error('create routine:', err);
      return null;
    }
  };

  const updateRoutine = async (id: string, name: string) => {
    try {
      await routinesApi.update(id, name);
      await fetchRoutines();
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('update routine:', err);
      return false;
    }
  };

  const deleteRoutine = async (id: string) => {
    try {
      await routinesApi.delete(id);
      await fetchRoutines();
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('delete routine:', err);
      return false;
    }
  };

  const addExercise = async (
    routineId: string,
    exercise: {
      name: string;
      muscle_group: MuscleGroup;
      machine_info?: string;
      target_sets_reps?: string;
    }
  ) => {
    const routine = routines.find((r) => r.id === routineId);
    const sortOrder = routine ? routine.exercises.length : 0;

    try {
      await exercisesApi.create({
        routine_id: routineId,
        name: exercise.name,
        muscle_group: exercise.muscle_group,
        machine_info: exercise.machine_info ?? null,
        target_sets_reps: exercise.target_sets_reps ?? null,
        sort_order: sortOrder,
      });
      await fetchRoutines();
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('add exercise:', err);
      return false;
    }
  };

  const updateExercise = async (
    id: string,
    updates: {
      name?: string;
      muscle_group?: MuscleGroup;
      machine_info?: string | null;
      target_sets_reps?: string | null;
    }
  ) => {
    try {
      await exercisesApi.update(id, updates);
      await fetchRoutines();
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('update exercise:', err);
      return false;
    }
  };

  const deleteExercise = async (id: string) => {
    try {
      await exercisesApi.delete(id);
      await fetchRoutines();
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('delete exercise:', err);
      return false;
    }
  };

  const reorderExercises = async (_routineId: string, exerciseIds: string[]) => {
    try {
      await exercisesApi.reorder(exerciseIds);
      await fetchRoutines();
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('reorder exercises:', err);
      return false;
    }
  };

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
  };
}
