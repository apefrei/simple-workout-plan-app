# Task ID: 5

**Title:** Implement swipe-based workout session interface

**Status:** pending

**Dependencies:** 4

**Priority:** high

**Description:** Mobile-first workout mode with Swiper for horizontal exercise navigation, weight/reps/comment inputs, save-on-slide-change.

**Details:**

1. Install Swiper, create WorkoutSession.tsx with routineId param
2. Fetch exercises by sort_order, pre-fill from last workout_logs
3. Each slide: exercise info, media, weight/reps/comment inputs
4. Save-on-slide-change (INSERT new, UPDATE revisited via Map<exerciseId, logId>)
5. Progress indicator + "Complete Workout" button on last slide

**Test Strategy:**

Verify: Swipe navigates, pre-fill works, slide-change saves, complete flushes and navigates

## Subtasks

### 5.1. Set up WorkoutSession with Swiper

**Status:** pending
**Dependencies:** None

Install Swiper. Create WorkoutSession.tsx with useParams. Basic layout with loading/error states.

### 5.2. Fetch exercises and pre-fill from last workout

**Status:** pending
**Dependencies:** 5.1

Fetch exercises ordered by sort_order. For each, fetch last workout_log values. Promise.all for parallel fetch.

### 5.3. Render exercise slides with inputs

**Status:** pending
**Dependencies:** 5.2

SwiperSlides: exercise info, media, numeric weight/reps inputs, comment textarea. Mobile-first with large touch targets.

### 5.4. Implement save-on-slide-change

**Status:** pending
**Dependencies:** 5.3

onSlideChange: save previous slide. Track in Map<exerciseId, logId> (INSERT if new, UPDATE if revisited). Progress indicator.

### 5.5. Add "Complete Workout" button

**Status:** pending
**Dependencies:** 5.4

Last slide: flush all pending saves, navigate to /routines with success message. Error handling with retry.
