# Task ID: 9

**Title:** Implement dark mode UI with mobile-first responsive design

**Status:** pending

**Dependencies:** 1

**Priority:** medium

**Description:** Apply comprehensive dark theme styling with Tailwind CSS, optimize for mobile touch interactions and one-handed use

**Details:**

1. Configure Tailwind darkMode: 'class' in tailwind.config.js
2. Create src/contexts/ThemeContext.tsx to manage dark mode state (default: dark)
3. Apply dark mode classes globally: bg-gray-900, text-gray-100, border-gray-700
4. Style components with dark variants: input fields (bg-gray-800, focus:ring-blue-500), buttons (bg-blue-600 hover:bg-blue-700), cards (bg-gray-800 shadow-lg)
5. Use high contrast for readability in gym environments: text at least 16px, bold headings
6. Implement bottom navigation bar (fixed bottom-0) for primary actions: Home, Routines, Profile
7. Add large touch targets: buttons min-h-12, swipeable areas full width
8. Optimize for one-handed thumb reach: place primary actions in bottom third of screen
9. Add haptic feedback using Vibration API on button taps and swipes
10. Test on various screen sizes: 320px (iPhone SE), 390px (iPhone 14), 428px (iPhone 14 Pro Max)

**Test Strategy:**

Test: Dark mode applies consistently across all pages, text is readable in low-light conditions, buttons are easily tappable with thumb, bottom nav accessible without stretching, haptic feedback triggers on interactions, responsive breakpoints work on iPhone SE to iPad, no horizontal scroll on any screen size

## Subtasks

### 9.1. Configure Tailwind CSS dark mode and create ThemeContext provider

**Status:** pending  
**Dependencies:** None  

Set up Tailwind CSS darkMode: 'class' configuration and create a React Context to manage theme state with dark mode as default

**Details:**

1. Open or create tailwind.config.js and set darkMode: 'class' to enable class-based dark mode toggling
2. Extend theme with custom dark color palette: colors: { background: { dark: '#111827', light: '#F9FAFB' }, surface: { dark: '#1F2937', light: '#FFFFFF' } }
3. Create src/contexts/ThemeContext.tsx with React Context API
4. Define ThemeContextType interface: { isDarkMode: boolean; toggleTheme: () => void }
5. Implement ThemeProvider component with useState defaulting to dark mode (true)
6. Use useEffect to persist theme preference to localStorage and apply 'dark' class to document.documentElement
7. On mount, check localStorage for saved preference, default to dark if none exists
8. Export useTheme custom hook for consuming theme context
9. Wrap application root in ThemeProvider in main.tsx
10. Add dark class to <html> element by default in index.html

### 9.2. Apply global dark theme styles and component styling patterns

**Status:** pending  
**Dependencies:** 9.1  

Implement consistent dark mode styling across all UI components including inputs, buttons, cards, and containers with high contrast for gym readability

**Details:**

1. Update src/index.css to set dark theme as base: body { @apply bg-gray-900 text-gray-100; }
2. Create Tailwind component classes or utility patterns for reusable dark UI elements:
   - Input fields: bg-gray-800 border-gray-700 focus:ring-blue-500 focus:border-blue-500 text-gray-100
   - Primary buttons: bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white
   - Secondary buttons: bg-gray-700 hover:bg-gray-600 text-gray-200
   - Danger buttons: bg-red-600 hover:bg-red-700 text-white
   - Cards: bg-gray-800 border-gray-700 shadow-lg rounded-lg
   - Headers: bg-gray-800 border-b border-gray-700
3. Set minimum font size of 16px for body text for gym readability: text-base or larger
4. Use font-bold for headings with high contrast: text-white
5. Apply border-gray-700 for dividers and separators throughout the app
6. Configure focus states with visible ring for accessibility: focus:ring-2 focus:ring-blue-500
7. Update existing placeholder components (Auth.tsx, Routines.tsx, etc.) to use dark theme classes
8. Test contrast ratios meet WCAG AA standards (4.5:1 for normal text)

### 9.3. Implement bottom navigation bar with mobile-optimized touch targets

**Status:** pending  
**Dependencies:** 9.2  

Create a fixed bottom navigation component with large touch targets for primary app actions (Home, Routines, Profile) positioned in thumb-reachable zone

**Details:**

1. Create src/components/BottomNav.tsx component
2. Apply fixed positioning: fixed bottom-0 left-0 right-0 for persistent visibility
3. Set safe-area insets for notched devices: pb-safe (using safe-area-inset-bottom CSS)
4. Implement navigation items array: [{ icon: HomeIcon, label: 'Home', path: '/' }, { icon: FolderIcon, label: 'Routines', path: '/routines' }, { icon: UserIcon, label: 'Profile', path: '/profile' }]
5. Style with dark theme: bg-gray-800 border-t border-gray-700
6. Set minimum touch target height: min-h-12 (48px) or larger h-16 for each nav item
7. Use full-width layout with flex justify-around for even spacing
8. Add active state indicator: text-blue-500 for current route, text-gray-400 for inactive
9. Use useLocation() from react-router-dom to determine active route
10. Add icons using emoji or simple SVG (keep lightweight for PWA)
11. Ensure labels are visible and readable: text-xs font-medium
12. Include in ProtectedRoute layout so it appears on all authenticated pages
13. Add padding-bottom to main content area to prevent nav from overlapping content: pb-20

### 9.4. Optimize layout for one-handed thumb reach and mobile responsiveness

**Status:** pending  
**Dependencies:** 9.3  

Restructure component layouts to place primary action buttons in the bottom third of the screen and implement responsive breakpoints for various mobile screen sizes

**Details:**

1. Create mobile-first layout utility classes in index.css or as Tailwind @apply components
2. Position primary action buttons in bottom third of screen using flex-col justify-end or fixed positioning
3. Place secondary/cancel actions in top or middle areas, primary confirmations in bottom area
4. Implement swipeable areas as full-width touchable zones for workout session slides
5. Add responsive breakpoints for target devices:
   - Base (320px - iPhone SE): single column, compact padding p-4
   - sm (390px - iPhone 14): slight padding increase p-5
   - md (428px - iPhone 14 Pro Max): comfortable padding p-6
   - lg (768px+ - tablet): optional two-column layout consideration
6. Create reusable ActionButtonContainer component that positions buttons at bottom: <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-gray-900">
7. Use safe-area-inset-bottom for devices with home indicator
8. Test thumb reachability by analyzing touch zones: primary actions should be in bottom 40% of screen
9. Apply max-w-md mx-auto on larger screens to prevent overly wide layouts
10. Ensure no horizontal scrolling occurs: overflow-x-hidden on body/main container

### 9.5. Implement haptic feedback using Vibration API for touch interactions

**Status:** pending  
**Dependencies:** 9.4  

Add tactile haptic feedback on button taps, swipes, and key interactions using the Web Vibration API for enhanced mobile UX

**Details:**

1. Create src/utils/haptics.ts utility module for vibration functions
2. Check for Vibration API support: const hasVibration = 'vibrate' in navigator
3. Implement haptic patterns:
   - lightTap(): navigator.vibrate(10) - for button taps
   - mediumTap(): navigator.vibrate(20) - for confirming actions
   - heavyTap(): navigator.vibrate([30, 50, 30]) - for completing workout
   - swipeFeedback(): navigator.vibrate(5) - subtle feedback on slide change
   - errorFeedback(): navigator.vibrate([50, 100, 50]) - for errors
4. Create useHaptic custom hook that returns these functions with feature detection fallback (no-op if unsupported)
5. Add haptic feedback to:
   - All button onClick handlers (lightTap)
   - Form submission success (mediumTap)
   - Workout completion (heavyTap)
   - Swiper onSlideChange event (swipeFeedback)
   - Delete confirmations (mediumTap)
   - Error states (errorFeedback)
6. Wrap haptic calls in try-catch for robustness
7. Consider adding user preference to disable haptics in settings (store in localStorage)
8. Test that vibrations don't fire on desktop browsers (graceful degradation)
9. Note: iOS Safari has limited Vibration API support - document this limitation
10. Add TypeScript types for navigator.vibrate if needed
