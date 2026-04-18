import { useSyncExternalStore } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { usePendingMutations } from '../hooks/usePendingMutations'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot() {
  return navigator.onLine
}

export default function OfflineIndicator() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot)
  const pendingCount = usePendingMutations()
  const isSyncing = useIsMutating() > 0 && isOnline && pendingCount > 0

  // Nothing to show
  if (isOnline && pendingCount === 0) return null

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 text-white ${
        isSyncing ? 'bg-blue-600' : isOnline ? 'bg-green-600' : 'bg-yellow-600'
      }`}
    >
      {!isOnline && (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01"
            />
          </svg>
          You are offline
          {pendingCount > 0 && (
            <span className="ml-1 bg-yellow-700 px-2 py-0.5 rounded-full text-xs">
              {pendingCount} pending
            </span>
          )}
        </>
      )}
      {isSyncing && (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Syncing {pendingCount} {pendingCount === 1 ? 'change' : 'changes'}...
        </>
      )}
    </div>
  )
}
