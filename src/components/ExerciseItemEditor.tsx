import { useState, useEffect } from 'react'
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import type { Exercise } from '../hooks/useRoutines'
import { triggerHaptic } from '../lib/haptics'
import MediaUpload from './MediaUpload'

interface ExerciseUpdates {
  name: string
  machine_info: string | null
  target_sets_reps: string | null
  starting_weight_kg: number | null
  mediaFile?: File
  removeMedia?: boolean
}

interface ExerciseItemEditorProps {
  exercise: Exercise
  isEditing: boolean
  isDragging: boolean
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined
  onEdit: () => void
  onSave: (updates: ExerciseUpdates) => Promise<void>
  onCancel: () => void
  onDelete: () => void
}

export default function ExerciseItemEditor({
  exercise,
  isEditing,
  isDragging,
  dragHandleProps,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: ExerciseItemEditorProps) {
  const [localName, setLocalName] = useState(exercise.name)
  const [localMachineInfo, setLocalMachineInfo] = useState(exercise.machine_info ?? '')
  const [localTargetSetsReps, setLocalTargetSetsReps] = useState(exercise.target_sets_reps ?? '')
  const [localStartingWeight, setLocalStartingWeight] = useState(exercise.starting_weight_kg?.toString() ?? '')
  const [localMediaFile, setLocalMediaFile] = useState<File | null>(null)
  const [removeMedia, setRemoveMedia] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEditing) {
      setLocalName(exercise.name)
      setLocalMachineInfo(exercise.machine_info ?? '')
      setLocalTargetSetsReps(exercise.target_sets_reps ?? '')
      setLocalStartingWeight(exercise.starting_weight_kg?.toString() ?? '')
      setLocalMediaFile(null)
      setRemoveMedia(false)
    }
  }, [isEditing, exercise])

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      name: localName.trim() || exercise.name,
      machine_info: localMachineInfo.trim() || null,
      target_sets_reps: localTargetSetsReps.trim() || null,
      starting_weight_kg: localStartingWeight ? parseFloat(localStartingWeight) : null,
      mediaFile: localMediaFile ?? undefined,
      removeMedia,
    })
    setSaving(false)
  }

  if (isEditing) {
    return (
      <div className="rounded-lg border-2 border-blue-400 bg-blue-50 p-3 dark:bg-blue-900/20">
        <div className="space-y-2">
          <input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Übungsname"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            autoFocus
          />
          <input
            value={localMachineInfo}
            onChange={(e) => setLocalMachineInfo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Gerät / Maschine"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
          <input
            value={localTargetSetsReps}
            onChange={(e) => setLocalTargetSetsReps(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Sätze/Wdh. (z.B. 3×12)"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
          <input
            type="number"
            step="0.5"
            min="0"
            value={localStartingWeight}
            onChange={(e) => setLocalStartingWeight(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Startgewicht (kg)"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
          <MediaUpload
            currentUrl={removeMedia ? null : exercise.media_url}
            onFileSelected={(file) => { setLocalMediaFile(file); setRemoveMedia(false) }}
            onClear={() => { setLocalMediaFile(null); setRemoveMedia(true) }}
            disabled={saving}
          />
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
            <button
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border bg-white p-3 dark:bg-gray-800 ${
        isDragging
          ? 'border-blue-400 shadow-lg'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div
        {...dragHandleProps}
        className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        title="Drag to reorder"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
        </svg>
      </div>
      {exercise.media_url && (
        <div className="flex-shrink-0">
          <img
            src={exercise.media_url}
            alt={exercise.name}
            className="h-10 w-10 rounded object-cover"
          />
        </div>
      )}
      <div
        className="min-w-0 flex-1 cursor-pointer"
        onClick={() => { triggerHaptic('light'); onEdit() }}
        title="Tippen zum Bearbeiten"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{exercise.name}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            {exercise.muscle_group.replace('_', ' ')}
          </span>
        </div>
        <div className="mt-0.5 flex gap-3 text-xs text-gray-500 dark:text-gray-400">
          {exercise.target_sets_reps && <span>{exercise.target_sets_reps}</span>}
          {exercise.machine_info && <span>{exercise.machine_info}</span>}
          {exercise.starting_weight_kg != null && <span>{exercise.starting_weight_kg} kg</span>}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
        title="Remove exercise"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}
