# Task ID: 10

**Title:** Configure PWA offline functionality and deploy to Vercel

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** PWA service worker (Workbox), background sync for workout_logs, IndexedDB offline data layer (SINGLE SOURCE OF TRUTH), deploy to Vercel.

**Details:**

1. vite-plugin-pwa with injectManifest, PWA manifest
2. Custom service worker (src/sw.ts) with Workbox caching + background sync
3. IndexedDB data layer (src/utils/db.ts) -- central for all tasks
4. src/lib/offlineStorage.ts with sync functions
5. OfflineIndicator global component
6. Deploy to Vercel

**Test Strategy:**

Verify: PWA installs, offline works, background sync, Lighthouse > 90, no duplicate offline logic

## Subtasks

### 10.1. Configure vite-plugin-pwa

**Status:** pending
**Dependencies:** None

Install vite-plugin-pwa + workbox. injectManifest strategy with src/sw.ts. PWA manifest, placeholder icons, theme-color meta.

### 10.2. Create service worker with caching and background sync

**Status:** pending
**Dependencies:** 10.1

src/sw.ts: precacheAndRoute, NetworkFirst (API), StaleWhileRevalidate (media), CacheFirst (static). BackgroundSyncPlugin for workout_logs (24h retry).

### 10.3. Build offline indicator

**Status:** pending
**Dependencies:** 10.2

OfflineIndicator.tsx + useOnlineStatus hook. Yellow offline banner, blue syncing, green success. Global in App.tsx.

### 10.4. Set up IndexedDB data layer (CENTRAL)

**Status:** pending
**Dependencies:** 10.2

Install idb. src/utils/db.ts: WorkoutPlanDB stores + CRUD exports. src/lib/offlineStorage.ts: queueOfflineLog, syncOfflineLogs. Online/offline routing. Last-write-wins.

### 10.5. Deploy to Vercel

**Status:** pending
**Dependencies:** 10.1

Vercel CLI, vercel.json, env vars. Deploy. Test PWA install on iOS + Android. Verify HTTPS.
