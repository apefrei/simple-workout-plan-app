import { useState } from 'react'
import type { MuscleGroup } from '../types/database'
import MediaUpload from './MediaUpload'

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'glutes', 'abs', 'forearms', 'calves', 'full_body',
]

interface ExerciseFormProps {
  onAdd: (exercise: {
    name: string
    muscle_group: MuscleGroup
    machine_info?: string
    target_sets_reps?: string
    mediaFile?: File
  }) => Promise<boolean>
}

export default function ExerciseForm({ onAdd }: ExerciseFormProps) {
  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('chest')
  const [machineInfo, setMachineInfo] = useState('')
  const [targetSetsReps, setTargetSetsReps] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    const ok = await onAdd({
      name: trimmed,
      muscle_group: muscleGroup,
      machine_info: machineInfo.trim() || undefined,
      target_sets_reps: targetSetsReps.trim() || undefined,
      mediaFile: mediaFile ?? undefined,
    })
    if (ok) {
      setName('')
      setMachineInfo('')
      setTargetSetsReps('')
      setMediaFile(null)
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-600">
      <h4 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Add Exercise</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bench Press"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Muscle Group</label>
          <select
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          >
            {MUSCLE_GROUPS.map((mg) => (
              <option key={mg} value={mg}>
                {mg.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Machine / Equipment</label>
          <input
            type="text"
            value={machineInfo}
            onChange={(e) => setMachineInfo(e.target.value)}
            placeholder="e.g. Cable machine, Dumbbells"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Target Sets x Reps</label>
          <input
            type="text"
            value={targetSetsReps}
            onChange={(e) => setTargetSetsReps(e.target.value)}
            placeholder="e.g. 3x12"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>
      </div>
      <div className="mt-3">
        <MediaUpload
          onFileSelected={setMediaFile}
          onClear={() => setMediaFile(null)}
          disabled={saving}
        />
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="rounded-lg bg-green-600 px-4 py-2.5 text-base font-medium text-white transition hover:bg-green-700 active:scale-[0.97] disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add Exercise'}
        </button>
      </div>
    </form>
  )
}
