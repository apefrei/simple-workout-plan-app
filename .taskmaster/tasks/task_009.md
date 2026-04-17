# Task ID: 9

**Title:** Mobile-first responsive design with bottom navigation

**Status:** pending

**Dependencies:** 1

**Priority:** medium

**Description:** Dark theme component styles, bottom navigation bar, mobile optimization, haptic feedback.

**Details:**

1. Reusable dark-themed component styles (inputs, buttons, cards) with high contrast
2. Fixed bottom nav (Home, Routines, Profile) with safe-area insets
3. Primary actions in bottom third for thumb reach, responsive breakpoints
4. Haptic feedback via Vibration API

**Test Strategy:**

Verify: Consistent dark theme, readable text, tappable buttons, bottom nav, responsive, no horizontal scroll

## Subtasks

### 9.1. Apply global dark theme component styles

**Status:** pending
**Dependencies:** None

Dark styles for inputs, buttons, cards, headers. Min 16px text. High contrast. Focus ring states.

### 9.2. Build bottom navigation bar

**Status:** pending
**Dependencies:** 9.1

BottomNav.tsx: fixed bottom, safe-area insets. Home/Routines/Profile. Active state via useLocation(). In ProtectedRoute layout.

### 9.3. Optimize for mobile and thumb reach

**Status:** pending
**Dependencies:** 9.2

Actions in bottom third. Responsive breakpoints (320px-768px+). Max-w-md on large screens. No horizontal scroll.

### 9.4. Add haptic feedback

**Status:** pending
**Dependencies:** 9.2

haptics.ts: lightTap/mediumTap/heavyTap via Vibration API. Feature detection fallback. Graceful degradation.
