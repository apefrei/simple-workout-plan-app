# Task ID: 10

**Title:** Configure PWA offline functionality and deployment to Vercel

**Status:** pending

**Dependencies:** 1, 5, 7

**Priority:** high

**Description:** Finalize PWA service worker configuration for offline data sync, cache strategies, and deploy production build to Vercel. This task is the SINGLE SOURCE OF TRUTH for all offline/PWA functionality - all other tasks (Task 5, Task 7) should import and use utilities created here.

**Details:**

CONSOLIDATION NOTICE: This task is the central implementation for ALL offline functionality. Task 10.4 (IndexedDB) creates the CENTRAL offline data layer used by ALL components (workout logging in Task 5, exercise logger in Task 7, routine management). Task 10.2 (background sync) is the SINGLE implementation for syncing workout_logs - no other task should implement parallel sync logic. Other tasks should import utilities from src/utils/db.ts and src/lib/offlineStorage.ts.

1. Configure vite-plugin-pwa with workbox strategies:
   - NetworkFirst for API calls (supabase.co/*)
   - CacheFirst for static assets (images, fonts)
   - StaleWhileRevalidate for exercise media
2. Implement background sync queue for workout_logs using workbox-background-sync (SINGLE IMPLEMENTATION)
3. Add offline indicator UI component showing connection status (GLOBAL COMPONENT)
4. Create custom service worker logic in src/sw.ts for handling failed requests
5. Set up IndexedDB for local data persistence using idb library: `npm install idb` (CENTRAL DATA LAYER - used by Task 5.4, Task 7.5)
   - Create src/utils/db.ts with CRUD functions for routines, exercises, workout_logs
   - Create src/lib/offlineStorage.ts with queue management functions
   - Export functions: saveRoutineLocally(), saveExerciseLocally(), saveWorkoutLogLocally(), getQueuedLogs(), syncOfflineLogs()
6. Test offline scenarios: log workout without internet, create routine offline, media upload queuing
7. Create Vercel account and install Vercel CLI: `npm install -g vercel`
8. Configure vercel.json with build settings: { "buildCommand": "npm run build", "outputDirectory": "dist" }
9. Set environment variables in Vercel dashboard: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
10. Deploy: `vercel --prod`, verify PWA installation works on mobile devices
11. Test PWA 'Add to Home Screen' on iOS Safari and Android Chrome
12. Configure custom domain if needed and enable HTTPS

INTEGRATION POINTS:
- Task 5.4 (workout session auto-save): Use saveWorkoutLogLocally() from src/utils/db.ts created in Task 10.4
- Task 7.5 (exercise logger offline): Use saveWorkoutLogLocally() and syncOfflineLogs() from Task 10.4
- Task 7 (general): Remove duplicate IndexedDB/offline implementation, import from Task 10

**Test Strategy:**

Test: PWA installs successfully on mobile home screen, app works completely offline (view routines, log workouts), background sync uploads logs when online (verify via DevTools > Application > Background Sync), offline indicator shows accurate status globally, static assets load from cache, vercel deployment accessible via URL, HTTPS enabled, Lighthouse PWA score > 90. INTEGRATION TEST: Task 5 workout logging uses Task 10.4 utilities correctly, Task 7 exercise logger imports Task 10.4 functions, no duplicate sync implementations exist, all offline data flows through Task 10.4 IndexedDB layer.

## Subtasks

### 10.1. Configure vite-plugin-pwa with Workbox caching strategies for offline support

**Status:** pending  
**Dependencies:** None  

Set up comprehensive PWA service worker configuration with cache-first, network-first, and stale-while-revalidate strategies for different resource types

**Details:**

1. Install workbox dependencies: `npm install -D workbox-window workbox-core workbox-routing workbox-strategies workbox-expiration workbox-cacheable-response`
2. Open vite.config.ts and enhance VitePWA configuration with workbox options
3. Configure NetworkFirst strategy for Supabase API calls:
   - Add runtimeCaching entry with urlPattern matching 'https://*.supabase.co/*'
   - Set handler: 'NetworkFirst' with networkTimeoutSeconds: 10
   - Configure cacheName: 'supabase-api-cache'
   - Add expiration: maxEntries: 50, maxAgeSeconds: 86400 (24 hours)
4. Configure CacheFirst strategy for static assets:
   - urlPattern for images: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/
   - handler: 'CacheFirst'
   - cacheName: 'static-images-cache'
   - Add cacheableResponse: { statuses: [0, 200] }
   - expiration: maxEntries: 100, maxAgeSeconds: 2592000 (30 days)
5. Configure CacheFirst for fonts:
   - urlPattern: /\.(woff|woff2|ttf|eot)$/
   - handler: 'CacheFirst'
   - cacheName: 'fonts-cache'
   - expiration: maxEntries: 20, maxAgeSeconds: 31536000 (1 year)
6. Configure StaleWhileRevalidate for exercise media from Supabase Storage:
   - urlPattern: /https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/exercise-media\/.*/
   - handler: 'StaleWhileRevalidate'
   - cacheName: 'exercise-media-cache'
   - expiration: maxEntries: 200, maxAgeSeconds: 604800 (7 days)
7. Add precaching configuration:
   - workbox.globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
   - workbox.cleanupOutdatedCaches: true
8. Set registerType: 'autoUpdate' to auto-update service worker on changes
9. Add devOptions: { enabled: true, type: 'module' } for testing in development
10. Test service worker registration in browser DevTools > Application > Service Workers

### 10.2. Implement background sync queue for workout_logs with workbox-background-sync (SINGLE IMPLEMENTATION)

**Status:** pending  
**Dependencies:** 10.1  

Set up background sync to queue failed workout log submissions when offline and automatically retry when connection is restored. This is the ONLY implementation of workout log syncing - Task 5.4 and Task 7.5 will import these utilities.

**Details:**

CRITICAL: This subtask creates the SINGLE, CENTRAL implementation for syncing workout_logs. Task 5 (workout session) and Task 7 (exercise logger) must import and use these functions - they should NOT implement their own sync logic.

1. Install background sync dependency: `npm install workbox-background-sync`
2. Create src/sw.ts custom service worker file for advanced sync logic
3. Import workbox modules in sw.ts:
   - import { BackgroundSyncPlugin } from 'workbox-background-sync'
   - import { registerRoute } from 'workbox-routing'
   - import { NetworkOnly } from 'workbox-strategies'
4. Create BackgroundSyncPlugin instance for workout logs:
   - const workoutLogsSyncPlugin = new BackgroundSyncPlugin('workout-logs-queue', { maxRetentionTime: 24 * 60 // Retry for 24 hours })
5. Register route for workout_logs POST/PUT requests:
   - registerRoute(
       ({url, request}) => url.pathname.includes('/rest/v1/workout_logs') && (request.method === 'POST' || request.method === 'PATCH'),
       new NetworkOnly({ plugins: [workoutLogsSyncPlugin] }),
       'POST'
     )
6. Configure vite.config.ts to inject custom service worker:
   - Add strategies: 'injectManifest' to VitePWA config
   - Set srcDir: 'src', filename: 'sw.ts', and outDir: 'dist'
7. Add sync event listener in sw.ts to handle background sync:
   - self.addEventListener('sync', (event) => { if (event.tag === 'workout-logs-queue') { event.waitUntil(replaySyncQueue()) } })
8. Create src/lib/syncUtils.ts with export functions:
   - export async function syncWorkoutLogs(): Promise<void> - main sync coordinator
   - export async function replaySyncQueue(): Promise<void> - replays queued requests
9. Add window listener for 'online' event to trigger manual sync as fallback
10. INTEGRATION: Export syncWorkoutLogs() for use by Task 5 and Task 7 components

REFERENCES:
- Task 5.4 (WorkoutSession auto-save): Import saveWorkoutLogLocally() and syncWorkoutLogs() from this task
- Task 7.5 (ExerciseLogger offline): Import saveWorkoutLogLocally() and syncWorkoutLogs() from this task

### 10.3. Build offline indicator UI component with real-time connection status (GLOBAL COMPONENT)

**Status:** pending  
**Dependencies:** 10.2  

Create a visual component that displays online/offline status prominently and shows sync progress for queued operations. This component should be globally available to all pages.

**Details:**

1. Create src/components/OfflineIndicator.tsx component (GLOBAL COMPONENT)
2. Import dependencies: import { useEffect, useState } from 'react'; import { useOnlineStatus } from '@/hooks/useOnlineStatus'
3. Create custom hook src/hooks/useOnlineStatus.ts:
   - const [isOnline, setIsOnline] = useState(navigator.onLine)
   - Add event listeners: window.addEventListener('online', () => setIsOnline(true))
   - window.addEventListener('offline', () => setIsOnline(false))
   - Return cleanup function to remove listeners
4. Add sync queue status tracking:
   - Query IndexedDB for queued logs count from 'workout_logs', 'routines', 'exercises' stores
   - Update count in real-time when logs are queued or synced
5. Design offline banner component:
   - Fixed position at top: fixed top-0 left-0 right-0 z-50
   - Show when offline: {!isOnline && <div className="bg-yellow-600 text-white px-4 py-2">}
   - Display icon: ⚠️ or offline SVG icon
   - Message: 'You are offline. Changes will sync when connection is restored.'
6. Add sync progress indicator when online but syncing:
   - Show: {isOnline && queuedCount > 0 && <div className="bg-blue-600 text-white px-4 py-2">Syncing {queuedCount} workout logs...</div>}
7. Add success message after sync completes:
   - Brief animation and checkmark: ✅ 'All changes synced'
   - Auto-hide after 3 seconds
8. Style with Tailwind transitions: transition-all duration-300 ease-in-out
9. Add slide-down animation using Framer Motion (optional): `npm install framer-motion`
10. Include OfflineIndicator in App.tsx or ProtectedRoute layout so it appears globally across all pages (Task 5, Task 7, etc.)

### 10.4. Set up IndexedDB for local data persistence (CENTRAL DATA LAYER - used by Task 5, Task 7)

**Status:** pending  
**Dependencies:** 10.2  

Implement comprehensive local database layer using IndexedDB to store routines, exercises, and workout logs for full offline functionality. This is the SINGLE, CENTRAL offline data layer - all components must use these utilities.

**Details:**

CRITICAL: This subtask creates the CENTRAL offline data layer for the ENTIRE application. Task 5.4 (workout session auto-save), Task 7.5 (exercise logger offline), and any other offline features MUST import and use functions from src/utils/db.ts and src/lib/offlineStorage.ts created here. NO other task should implement parallel IndexedDB logic.

1. Create src/utils/db.ts as the central IndexedDB management module
2. Import idb library: import { openDB, DBSchema, IDBPDatabase } from 'idb'
3. Define TypeScript database schema interface:
   - interface WorkoutPlanDB extends DBSchema {
       routines: { key: string; value: RoutineData; indexes: { 'by-user': string } }
       exercises: { key: string; value: ExerciseData; indexes: { 'by-routine': string } }
       workout_logs: { key: string; value: WorkoutLogData; indexes: { 'by-date': string; 'by-exercise': string } }
       sync_queue: { key: number; value: SyncQueueItem; indexes: { 'by-status': string } }
     }
4. Implement database initialization function:
   - export const initDB = async (): Promise<IDBPDatabase<WorkoutPlanDB>> => {
   - openDB<WorkoutPlanDB>('workout-plan-db', 1, {
       upgrade(db) {
         const routinesStore = db.createObjectStore('routines', { keyPath: 'id' })
         routinesStore.createIndex('by-user', 'user_id')
         const exercisesStore = db.createObjectStore('exercises', { keyPath: 'id' })
         exercisesStore.createIndex('by-routine', 'routine_id')
         const workoutLogsStore = db.createObjectStore('workout_logs', { keyPath: 'id' })
         workoutLogsStore.createIndex('by-date', 'date')
         workoutLogsStore.createIndex('by-exercise', 'exercise_id')
         const syncQueueStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
         syncQueueStore.createIndex('by-status', 'status')
       }
     })
5. Create CRUD helper functions for each store (EXPORTED for use by Task 5 and Task 7):
   - export async function saveRoutineLocally(routine: RoutineData): Promise<void>
   - export async function getRoutinesByUser(userId: string): Promise<RoutineData[]>
   - export async function saveExerciseLocally(exercise: ExerciseData): Promise<void>
   - export async function getExercisesByRoutine(routineId: string): Promise<ExerciseData[]>
   - export async function saveWorkoutLogLocally(log: WorkoutLogData): Promise<void>
   - export async function getWorkoutLogsByDate(date: string): Promise<WorkoutLogData[]>
   - export async function getWorkoutLogsByExercise(exerciseId: string): Promise<WorkoutLogData[]>
6. Implement sync queue management:
   - export async function addToSyncQueue(operation: 'INSERT' | 'UPDATE' | 'DELETE', tableName: string, data: any): Promise<void>
   - export async function getSyncQueue(): Promise<SyncQueueItem[]>
   - export async function clearSyncQueueItem(id: number): Promise<void>
7. Create src/lib/offlineStorage.ts for higher-level offline logic:
   - export async function queueOfflineLog(log: WorkoutLogData): Promise<void> - wrapper for saveWorkoutLogLocally + addToSyncQueue
   - export async function syncOfflineLogs(): Promise<void> - fetches from IndexedDB, POSTs to Supabase, handles conflicts
   - export async function syncLocalToRemote(): Promise<void> - sync all queued items
   - export async function syncRemoteToLocal(): Promise<void> - fetch from Supabase, save to IndexedDB
8. Update Supabase service functions (src/services/supabase.ts or workoutLogService.ts) to:
   - Check navigator.onLine before operations
   - If offline: call saveWorkoutLogLocally() and addToSyncQueue()
   - If online: POST to Supabase then update IndexedDB as cache
9. Add periodic sync check (every 5 minutes when online) using setInterval in App.tsx
10. Handle data conflicts: use last-write-wins strategy with timestamp comparison

EXPORTS FOR OTHER TASKS:
- Task 5.4: Import saveWorkoutLogLocally() and syncOfflineLogs()
- Task 7.5: Import saveWorkoutLogLocally(), queueOfflineLog(), syncOfflineLogs()
- Task 7.3: Remove duplicate IndexedDB initialization, import from here instead

FILE REFERENCES:
- src/utils/db.ts (created here): central IndexedDB CRUD operations
- src/lib/offlineStorage.ts (created here): higher-level sync coordination
- src/services/workoutLogService.ts (Task 7): should import saveWorkoutLogLocally() from src/utils/db.ts

### 10.5. Deploy production build to Vercel with environment variables and PWA verification

**Status:** pending  
**Dependencies:** 10.1, 10.3, 10.4  

Configure Vercel deployment settings, set up environment variables securely, deploy the production build, and verify PWA installation works on mobile devices

**Details:**

1. Create Vercel account at vercel.com using GitHub authentication
2. Install Vercel CLI globally: `npm install -g vercel`
3. Login to Vercel CLI: `vercel login` and authenticate
4. Create vercel.json in project root with build configuration:
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite",
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
5. Link project to Vercel: `vercel link` and follow prompts to create new project or link existing
6. Set environment variables in Vercel dashboard:
   - Navigate to Project Settings > Environment Variables
   - Add VITE_SUPABASE_URL (copy from .env.local)
   - Add VITE_SUPABASE_ANON_KEY (copy from .env.local)
   - Select 'Production', 'Preview', 'Development' scopes
7. Configure HTTPS and headers in vercel.json:
   - Add headers for PWA: { "source": "/manifest.webmanifest", "headers": [{ "key": "Content-Type", "value": "application/manifest+json" }] }
   - Add service worker headers: { "source": "/sw.js", "headers": [{ "key": "Service-Worker-Allowed", "value": "/" }] }
8. Deploy to production: `vercel --prod`
9. Verify deployment:
   - Access deployment URL (e.g., https://workout-plan-pwa.vercel.app)
   - Open on mobile device (iOS Safari and Android Chrome)
   - Verify HTTPS certificate is valid
10. Test PWA installation:
    - On iOS Safari: tap Share > Add to Home Screen
    - On Android Chrome: tap menu > Install app / Add to Home Screen
    - Verify app icon appears on home screen
    - Launch app from home screen and verify standalone mode (no browser UI)
11. Run Lighthouse PWA audit:
    - Open DevTools > Lighthouse
    - Select 'Progressive Web App' category
    - Run audit and verify score > 90
    - Fix any issues flagged (manifest, service worker, HTTPS, etc.)
12. Optional: Configure custom domain in Vercel dashboard if available

VERIFICATION: Test that offline functionality from Task 10.1-10.4 works correctly on deployed Vercel app (not just localhost)
