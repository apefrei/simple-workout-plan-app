import { useAuth } from '../contexts/AuthContext'

export default function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
      <h1 className="text-xl font-bold">Workout Planner</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {user?.email}
        </span>
        <button
          onClick={signOut}
          className="rounded bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
