import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/pagination'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLatestLogs, useSaveLog } from '../hooks/useWorkoutLogs'
import type { Exercise } from '../hooks/useRoutines'

interface ExerciseEntry {
  exercise_id: string
  weight_kg: number
  reps: number
  comment: string
  dirty: boolean
}

export default function WorkoutSessionPage() {
  const { id: routineId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const swiperRef = useRef<SwiperType | null>(null)

  const [routineName, setRoutineName] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [entries, setEntries] = useState<Map<string, ExerciseEntry>>(new Map())
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [saveFlash, setSaveFlash] = useState<string | null>(null)

  const exerciseIds = exercises.map((e) => e.id)
  const { data: latestLogs } = useLatestLogs(exerciseIds)
  const saveLog = useSaveLog()

  // Fetch routine + exercises
  useEffect(() => {
    if (!routineId || !user) return
    ;(async () => {
      const [{ data: routine }, { data: exRows }] = await Promise.all([
        supabase.from('routines').select('name').eq('id', routineId).single(),
        supabase.from('exercises').select('*').eq('routine_id', routineId).order('sort_order', { ascending: true }),
      ])
      setRoutineName(routine?.name ?? 'Workout')
      setExercises((exRows ?? []) as Exercise[])
      setLoading(false)
    })()
  }, [routineId, user])

  // Pre-fill from latest logs once loaded
  useEffect(() => {
    if (!latestLogs || exercises.length === 0) return
    setEntries((prev) => {
      const next = new Map(prev)
      for (const ex of exercises) {
        if (!next.has(ex.id)) {
          const last = latestLogs.get(ex.id)
          next.set(ex.id, {
            exercise_id: ex.id,
            weight_kg: last?.weight_kg ?? 0,
            reps: last?.reps ?? 0,
            comment: last?.comment ?? '',
            dirty: false,
          })
        }
      }
      return next
    })
  }, [latestLogs, exercises])

  const updateEntry = useCallback((exerciseId: string, field: keyof ExerciseEntry, value: number | string) => {
    setEntries((prev) => {
      const next = new Map(prev)
      const entry = next.get(exerciseId)
      if (entry) {
        next.set(exerciseId, { ...entry, [field]: value, dirty: true })
      }
      return next
    })
  }, [])

  const saveEntry = useCallback(
    async (exerciseId: string) => {
      const entry = entries.get(exerciseId)
      if (!entry || !entry.dirty) return

      try {
        await saveLog.mutateAsync({
          exercise_id: entry.exercise_id,
          weight_kg: entry.weight_kg,
          reps: entry.reps,
          comment: entry.comment || undefined,
        })
        setEntries((prev) => {
          const next = new Map(prev)
          const e = next.get(exerciseId)
          if (e) next.set(exerciseId, { ...e, dirty: false })
          return next
        })
        // Flash animation
        setSaveFlash(exerciseId)
        setTimeout(() => setSaveFlash(null), 800)
      } catch (err) {
        console.error('Save failed:', err)
      }
    },
    [entries, saveLog],
  )

  // Save on slide change
  const handleSlideChange = useCallback(
    (swiper: SwiperType) => {
      const prevIndex = activeIndex
      setActiveIndex(swiper.activeIndex)
      const prevExercise = exercises[prevIndex]
      if (prevExercise) {
        saveEntry(prevExercise.id)
      }
    },
    [activeIndex, exercises, saveEntry],
  )

  // Save all dirty entries and navigate back
  const handleComplete = useCallback(async () => {
    const dirtyEntries = Array.from(entries.values()).filter((e) => e.dirty)
    await Promise.all(
      dirtyEntries.map((entry) =>
        saveLog.mutateAsync({
          exercise_id: entry.exercise_id,
          weight_kg: entry.weight_kg,
          reps: entry.reps,
          comment: entry.comment || undefined,
        }),
      ),
    )
    navigate(`/routines/${routineId}`)
  }, [entries, saveLog, navigate, routineId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (exercises.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">No exercises in this routine. Add some first!</p>
        <button
          onClick={() => navigate(`/routines/${routineId}`)}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Back to Routine
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(`/routines/${routineId}`)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">{routineName}</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {activeIndex + 1}/{exercises.length}
        </span>
      </div>

      {/* Swiper */}
      <Swiper
        modules={[Pagination]}
        pagination={{ clickable: true }}
        spaceBetween={16}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        onSlideChange={handleSlideChange}
        className="workout-swiper"
      >
        {exercises.map((exercise) => {
          const entry = entries.get(exercise.id)
          const isSaving = saveFlash === exercise.id

          return (
            <SwiperSlide key={exercise.id}>
              <div
                className={`relative rounded-xl border bg-white p-6 shadow-sm transition-all dark:bg-gray-800 ${
                  isSaving
                    ? 'border-green-400 shadow-green-200 dark:border-green-500 dark:shadow-green-900/30'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Save flash overlay */}
                {isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-green-500/10">
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Saved!</span>
                  </div>
                )}

                {/* Exercise name & info */}
                <h2 className="text-xl font-semibold">{exercise.name}</h2>
                <div className="mt-1 flex gap-2">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {exercise.muscle_group.replace('_', ' ')}
                  </span>
                  {exercise.machine_info && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{exercise.machine_info}</span>
                  )}
                </div>
                {exercise.target_sets_reps && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Target: {exercise.target_sets_reps}</p>
                )}

                {/* Weight input */}
                <div className="mt-6">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Weight (kg)</label>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      onClick={() => updateEntry(exercise.id, 'weight_kg', Math.max(0, (entry?.weight_kg ?? 0) - 2.5))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      min="0"
                      value={entry?.weight_kg ?? 0}
                      onChange={(e) => updateEntry(exercise.id, 'weight_kg', parseFloat(e.target.value) || 0)}
                      className="h-10 w-24 rounded-lg border border-gray-300 bg-white text-center text-lg font-semibold dark:border-gray-600 dark:bg-gray-700"
                    />
                    <button
                      onClick={() => updateEntry(exercise.id, 'weight_kg', (entry?.weight_kg ?? 0) + 2.5)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Reps input */}
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Reps</label>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      onClick={() => updateEntry(exercise.id, 'reps', Math.max(0, (entry?.reps ?? 0) - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      step="1"
                      min="0"
                      value={entry?.reps ?? 0}
                      onChange={(e) => updateEntry(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                      className="h-10 w-24 rounded-lg border border-gray-300 bg-white text-center text-lg font-semibold dark:border-gray-600 dark:bg-gray-700"
                    />
                    <button
                      onClick={() => updateEntry(exercise.id, 'reps', (entry?.reps ?? 0) + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Comment */}
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Comment</label>
                  <input
                    type="text"
                    placeholder="Optional note..."
                    value={entry?.comment ?? ''}
                    onChange={(e) => updateEntry(exercise.id, 'comment', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
              </div>
            </SwiperSlide>
          )
        })}
      </Swiper>

      {/* Complete button */}
      <button
        onClick={handleComplete}
        disabled={saveLog.isPending}
        className="mt-8 w-full rounded-xl bg-green-600 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-green-700 disabled:opacity-50"
      >
        {saveLog.isPending ? 'Saving...' : 'Complete Workout'}
      </button>
    </div>
  )
}
