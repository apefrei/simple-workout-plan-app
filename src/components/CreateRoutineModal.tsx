import { useState } from 'react'

interface CreateRoutineModalProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string) => Promise<unknown>
}

export default function CreateRoutineModal({ open, onClose, onCreate }: CreateRoutineModalProps) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    await onCreate(trimmed)
    setSaving(false)
    setName('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">New Routine</h2>
        <form onSubmit={handleSubmit} className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Routine name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push Day, Leg Day"
            autoFocus
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-base font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
