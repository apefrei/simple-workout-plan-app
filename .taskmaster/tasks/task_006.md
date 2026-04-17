# Task ID: 6

**Title:** Build exercise media upload system

**Status:** pending

**Dependencies:** 4

**Priority:** medium

**Description:** Upload JPG/GIF exercise media to Supabase Storage with preview, drag-and-drop, and delete.

**Details:**

1. MediaUpload component: file input (JPG/GIF, max 10MB), validation, preview
2. Upload to Supabase Storage, update exercises.media_url
3. Drag-and-drop zone with react-dropzone
4. Delete media (Storage + DB) with confirmation

**Test Strategy:**

Verify: Upload works, preview displays, validation blocks invalid files, delete clears file and DB

## Subtasks

### 6.1. Create MediaUpload component with validation

**Status:** pending
**Dependencies:** None

MediaUpload.tsx: accept JPG/GIF, validate size (10MB max), generate local preview.

### 6.2. Implement upload to Supabase Storage

**Status:** pending
**Dependencies:** 6.1

Upload to exercise-media/{user_id}/{exercise_id}/{timestamp.ext}. Get public URL, update media_url. Progress + error handling.

### 6.3. Build drag-and-drop UI with preview

**Status:** pending
**Dependencies:** 6.1

Install react-dropzone. Drag-and-drop zone, image preview, upload button, loading spinner, error display.

### 6.4. Add delete media functionality

**Status:** pending
**Dependencies:** 6.2, 6.3

Delete with confirmation. Remove from Storage + clear media_url in DB.
