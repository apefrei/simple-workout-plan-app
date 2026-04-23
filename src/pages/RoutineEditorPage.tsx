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
import ExerciseItemEditor from '../components/ExerciseItemEditor'

export default function RoutineEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [routine, setRoutine] = useState<Routine | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [editingExercise, setEditingExercise] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

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
        if (import.meta.env.DEV) console.error('media upload failed:', err)
        // Exercise was still created, just without media
      }
    }

    await fetchRoutine()
    return true
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
                    <div ref={prov.innerRef} {...prov.draggableProps}>
                      <ExerciseItemEditor
                        exercise={ex}
                        isEditing={editingExercise === ex.id}
                        isDragging={snapshot.isDragging}
                        dragHandleProps={prov.dragHandleProps}
                        onEdit={() => setEditingExercise(ex.id)}
                        onSave={async (updates) => {
                          const { mediaFile, removeMedia, ...dbUpdates } = updates
                          // Handle media removal
                          if (removeMedia && ex.media_url) {
                            await deleteExerciseMedia(ex.media_url)
                            await supabase
                              .from('exercises')
                              .update({ ...dbUpdates, media_url: null })
                              .eq('id', ex.id)
                          } else if (mediaFile && user) {
                            // Handle new media upload (replaces old if exists)
                            if (ex.media_url) {
                              await deleteExerciseMedia(ex.media_url)
                            }
                            const mediaUrl = await uploadExerciseMedia(user.id, ex.id, mediaFile)
                            await supabase
                              .from('exercises')
                              .update({ ...dbUpdates, media_url: mediaUrl })
                              .eq('id', ex.id)
                          } else {
                            await supabase
                              .from('exercises')
                              .update(dbUpdates)
                              .eq('id', ex.id)
                          }
                          setEditingExercise(null)
                          await fetchRoutine()
                        }}
                        onCancel={() => setEditingExercise(null)}
                        onDelete={() => deleteExercise(ex)}
                      />
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
        {showAddForm ? (
          <div>
            <ExerciseForm onAdd={async (exercise) => {
              const ok = await addExercise(exercise)
              if (ok) setShowAddForm(false)
              return ok
            }} />
            <button
              onClick={() => setShowAddForm(false)}
              className="mt-2 w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full rounded-xl border-2 border-dashed border-gray-300 py-3 text-base font-medium text-gray-500 transition hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
          >
            + Add Exercise
          </button>
        )}
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
