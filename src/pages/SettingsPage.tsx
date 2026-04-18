import { useAuth } from '../contexts/AuthContext'

export default function SettingsPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="mx-auto max-w-lg p-4">
      <h2 className="text-xl font-bold">Settings</h2>

      <div className="mt-6 space-y-4">
        {/* Account section */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-base font-semibold text-gray-600 dark:text-gray-300">Account</h3>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
              <span className="text-sm font-medium">{user?.email}</span>
            </div>
          </div>
        </section>

        {/* About section */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-base font-semibold text-gray-600 dark:text-gray-300">About</h3>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Version</span>
              <span className="text-sm font-medium">0.1.0</span>
            </div>
          </div>
        </section>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full rounded-xl bg-red-600 py-3 text-base font-semibold text-white transition hover:bg-red-700 active:scale-[0.98]"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
