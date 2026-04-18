import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoutines } from '../hooks/useRoutines'
import RoutineCard from '../components/RoutineCard'
import CreateRoutineModal from '../components/CreateRoutineModal'
import ImportWorkoutsButton from '../components/ImportWorkoutsButton'

export default function RoutinesPage() {
  const { routines, loading, createRoutine, deleteRoutine, refetch } = useRoutines()
  const [showCreate, setShowCreate] = useState(false)
  const navigate = useNavigate()

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this routine and all its exercises?')) return
    await deleteRoutine(id)
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">My Routines</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Routine
        </button>
      </div>

      {routines.length === 0 ? (
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg">No routines yet</p>
          <p className="mt-1 text-sm">Create your first workout routine to get started.</p>
          <ImportWorkoutsButton onImported={refetch} />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onOpen={(id) => navigate(`/routines/${id}`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CreateRoutineModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createRoutine}
      />
    </div>
  )
}
