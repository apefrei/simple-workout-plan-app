import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { importSeedData } from '../lib/importSeedData'

interface Props {
  onImported: () => void
}

export default function ImportWorkoutsButton({ onImported }: Props) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImport = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await importSeedData(user.id)
      setResult(res)
      if (res.imported > 0) {
        onImported()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-4 text-center dark:border-gray-600">
      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
        Keine Routinen? Starte mit Beispiel-Trainingsplänen.
      </p>
      <button
        onClick={handleImport}
        disabled={loading}
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Importiere...' : 'Beispiel-Workouts importieren'}
      </button>

      {result && (
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
          {result.imported} importiert, {result.skipped} übersprungen (bereits vorhanden).
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
