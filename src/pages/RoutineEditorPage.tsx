import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import { supabase } from '../lib/supabase'
import { uploadExerciseMedia, deleteExerciseMedia } from '../lib/storage'
import { useAuth } from '../contexts/AuthContext'
import type { MuscleGroup } from '../types/database'
import type { Routine, Exercise } from '../hooks/useRoutines'
import ExerciseForm from '../components/ExerciseForm'

export default function RoutineEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [routine, setRoutine] = useState<Routine | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  const fetchRoutine = useCallback(async () => {
    if (!id || !user) return
    const { data: r } = await supabase
      .from('routines')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!r) {
      navigate('/')
      return
    }
    const routine = r as Routine
    setRoutine(routine)
    setNameInput(routine.name)

    const { data: exs } = await supabase
      .from('exercises')
      .select('*')
      .eq('routine_id', id)
      .order('sort_order', { ascending: true })

    setExercises((exs ?? []) as Exercise[])
    setLoading(false)
  }, [id, user, navigate])

  useEffect(() => {
    fetchRoutine()
  }, [fetchRoutine])

  const saveName = async () => {
    if (!routine || !nameInput.trim()) return
    await supabase
      .from('routines')
      .update({ name: nameInput.trim(), updated_at: new Date().toISOString() })
      .eq('id', routine.id)
    setRoutine({ ...routine, name: nameInput.trim() })
    setEditingName(false)
  }

  const addExercise = async (exercise: {
    name: string
    muscle_group: MuscleGroup
    machine_info?: string
    target_sets_reps?: string
    mediaFile?: File
  }) => {
    if (!routine || !user) return false

    // Insert the exercise first to get its ID
    const { data: inserted, error } = await supabase
      .from('exercises')
      .insert({
        routine_id: routine.id,
        name: exercise.name,
        muscle_group: exercise.muscle_group,
        machine_info: exercise.machine_info ?? null,
        target_sets_reps: exercise.target_sets_reps ?? null,
        sort_order: exercises.length,
      })
      .select()
      .single()

    if (error || !inserted) return false

    // Upload media if provided
    if (exercise.mediaFile) {
      try {
        const mediaUrl = await uploadExerciseMedia(user.id, inserted.id, exercise.mediaFile)
        await supabase
          .from('exercises')
          .update({ media_url: mediaUrl })
          .eq('id', inserted.id)
      } catch (err) {
        console.error('media upload failed:', err)
        // Exercise was still created, just without media
      }
    }

    await fetchRoutine()
    return true
  }

  const deleteMedia = async (exercise: Exercise) => {
    if (!exercise.media_url) return
    if (!confirm('Remove this image?')) return
    await deleteExerciseMedia(exercise.media_url)
    await supabase
      .from('exercises')
      .update({ media_url: null })
      .eq('id', exercise.id)
    await fetchRoutine()
  }

  const deleteExercise = async (exercise: Exercise) => {
    if (exercise.media_url) {
      await deleteExerciseMedia(exercise.media_url)
    }
    await supabase.from('exercises').delete().eq('id', exercise.id)
    await fetchRoutine()
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const reordered = Array.from(exercises)
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)
    setExercises(reordered)

    const updates = reordered.map((ex, i) =>
      supabase.from('exercises').update({ sort_order: i }).eq('id', ex.id),
    )
    await Promise.all(updates)
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!routine) return null

  return (
    <div className="mx-auto max-w-3xl p-4">
      <button
        onClick={() => navigate('/')}
        className="mb-4 inline-flex items-center gap-1 rounded-lg py-2 text-base text-blue-600 hover:underline dark:text-blue-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to routines
      </button>

      {editingName ? (
        <div className="mb-4 flex items-center gap-2">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveName()}
            autoFocus
            className="rounded border border-gray-300 px-3 py-1.5 text-xl font-bold focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
          />
          <button onClick={saveName} className="text-sm text-blue-600 hover:underline">Save</button>
          <button onClick={() => { setEditingName(false); setNameInput(routine.name) }} className="text-sm text-gray-500 hover:underline">Cancel</button>
        </div>
      ) : (
        <h2
          className="mb-4 cursor-pointer text-xl font-bold hover:text-blue-600"
          onClick={() => setEditingName(true)}
          title="Click to rename"
        >
          {routine.name}
        </h2>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="exercises">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {exercises.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">No exercises yet. Add one below.</p>
              )}
              {exercises.map((ex, index) => (
                <Draggable key={ex.id} draggableId={ex.id} index={index}>
                  {(prov, snapshot) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      className={`flex items-center gap-3 rounded-lg border bg-white p-3 dark:bg-gray-800 ${
                        snapshot.isDragging
                          ? 'border-blue-400 shadow-lg'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div
                        {...prov.dragHandleProps}
                        className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Drag to reorder"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                        </svg>
                      </div>
                      {ex.media_url && (
                        <div className="group relative flex-shrink-0">
                          <img
                            src={ex.media_url}
                            alt={ex.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                          <button
                            onClick={() => deleteMedia(ex)}
                            className="absolute -right-1 -top-1 hidden rounded-full bg-red-500 p-0.5 text-white shadow hover:bg-red-600 group-hover:block"
                            title="Remove image"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ex.name}</span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                            {ex.muscle_group.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-0.5 flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                          {ex.target_sets_reps && <span>{ex.target_sets_reps}</span>}
                          {ex.machine_info && <span>{ex.machine_info}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteExercise(ex)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
                        title="Remove exercise"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="mt-6">
        <ExerciseForm onAdd={addExercise} />
      </div>

      {exercises.length > 0 && (
        <button
          onClick={() => navigate(`/routines/${id}/workout`)}
          className="mt-6 w-full rounded-xl bg-green-600 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-green-700"
        >
          Start Workout
        </button>
      )}
    </div>
  )
}
