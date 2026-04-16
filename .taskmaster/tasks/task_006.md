# Task ID: 6

**Title:** Build exercise media upload and management system

**Status:** pending

**Dependencies:** 4

**Priority:** medium

**Description:** Create interface for uploading JPG/GIF exercise demonstration media to Supabase Storage with preview

**Details:**

1. Create src/components/MediaUpload.tsx component accepting exercise_id prop
2. Implement file input with accept='image/jpeg,image/jpg,image/gif' restriction
3. Add file size validation (max 10MB) and dimensions check (recommended 1080px width)
4. Create upload function: supabase.storage.from('exercise-media').upload(`${user_id}/${exercise_id}/${file.name}`, file)
5. On successful upload, retrieve public URL and update exercises.media_url
6. Show image/GIF preview using <img> or React component
7. Add delete media functionality with confirmation
8. Implement loading spinner during upload with progress percentage
9. Handle errors gracefully (network failure, quota exceeded, invalid format)
10. Style with Tailwind: drag-and-drop zone with border-dashed, hover states

**Test Strategy:**

Test: Upload JPG displays correctly in exercise card, upload GIF plays in workout session, file size over 10MB shows error, invalid format rejected, delete media removes from Storage and clears media_url, upload progress shows percentage, works offline (queues upload)

## Subtasks

### 6.1. Create MediaUpload.tsx component with file input and validation logic

**Status:** pending  
**Dependencies:** None  

Build the base MediaUpload component accepting exercise_id and user_id props, implement file input with MIME type restrictions, and add client-side validation for file size and dimensions

**Details:**

1. Create src/components/MediaUpload.tsx file and import React hooks: import { useState, useRef, ChangeEvent } from 'react'
2. Import Supabase client: import { supabase } from '@/services/supabase'
3. Define TypeScript interface for props:
   interface MediaUploadProps {
     exerciseId: string;
     userId: string;
     currentMediaUrl?: string | null;
     onUploadSuccess: (url: string) => void;
   }
4. Create component with state management:
   - const [uploading, setUploading] = useState(false)
   - const [progress, setProgress] = useState(0)
   - const [error, setError] = useState<string | null>(null)
   - const [previewUrl, setPreviewUrl] = useState<string | null>(currentMediaUrl || null)
   - const fileInputRef = useRef<HTMLInputElement>(null)
5. Implement file validation function:
   const validateFile = (file: File): string | null => {
     // Check MIME type
     const allowedTypes = ['image/jpeg', 'image/jpg', 'image/gif']
     if (!allowedTypes.includes(file.type)) return 'Only JPG and GIF files are allowed'
     // Check file size (10MB max)
     const maxSize = 10 * 1024 * 1024 // 10MB in bytes
     if (file.size > maxSize) return 'File size must be under 10MB'
     return null // Valid
   }
6. Implement dimension check function using Image API:
   const checkDimensions = (file: File): Promise<{ width: number; height: number }> => {
     return new Promise((resolve, reject) => {
       const img = new Image()
       img.onload = () => resolve({ width: img.width, height: img.height })
       img.onerror = reject
       img.src = URL.createObjectURL(file)
     })
   }
7. Create handleFileChange event handler:
   const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0]
     if (!file) return
     // Validate file
     const validationError = validateFile(file)
     if (validationError) {
       setError(validationError)
       return
     }
     // Check dimensions and show warning if not recommended size
     const { width } = await checkDimensions(file)
     if (width > 1920) {
       setError('Recommended width is 1080px, larger images may be slow to load')
     }
     // Generate preview
     setPreviewUrl(URL.createObjectURL(file))
     setError(null)
   }
8. Create file input JSX with accept attribute:
   <input
     ref={fileInputRef}
     type="file"
     accept="image/jpeg,image/jpg,image/gif"
     onChange={handleFileChange}
     className="hidden"
   />
9. Add TypeScript types for all event handlers and state
10. Export component: export default MediaUpload

### 6.2. Implement Supabase Storage upload function with progress tracking

**Status:** pending  
**Dependencies:** 6.1  

Create the upload logic that uploads files to the exercise-media bucket in Supabase Storage using the user_id/exercise_id/filename path structure, with real-time upload progress percentage

**Details:**

1. In MediaUpload.tsx, create upload function:
   const uploadFile = async (file: File) => {
     try {
       setUploading(true)
       setProgress(0)
       setError(null)
       // Generate unique filename with timestamp to prevent collisions
       const fileExt = file.name.split('.').pop()
       const timestamp = Date.now()
       const fileName = `${timestamp}.${fileExt}`
       const filePath = `${userId}/${exerciseId}/${fileName}`
       
       // Upload to Supabase Storage
       const { data, error: uploadError } = await supabase.storage
         .from('exercise-media')
         .upload(filePath, file, {
           cacheControl: '3600',
           upsert: false
         })
       
       if (uploadError) throw uploadError
       
       // Get public URL
       const { data: { publicUrl } } = supabase.storage
         .from('exercise-media')
         .getPublicUrl(filePath)
       
       setProgress(100)
       return publicUrl
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Upload failed')
       return null
     } finally {
       setUploading(false)
     }
   }
2. Add progress simulation (Supabase doesn't provide native progress events):
   - Use setInterval to increment progress from 0 to 90% during upload
   - Set to 100% only after successful upload
   - Clear interval on error or completion
3. Create wrapper function that handles full upload flow:
   const handleUpload = async () => {
     const file = fileInputRef.current?.files?.[0]
     if (!file) return
     
     const publicUrl = await uploadFile(file)
     if (!publicUrl) return
     
     // Update exercise media_url in database
     const { error: updateError } = await supabase
       .from('exercises')
       .update({ media_url: publicUrl })
       .eq('id', exerciseId)
     
     if (updateError) {
       setError('Upload succeeded but database update failed')
       return
     }
     
     // Call success callback
     onUploadSuccess(publicUrl)
     setPreviewUrl(publicUrl)
   }
4. Handle network errors gracefully:
   - Catch network failures with try/catch
   - Show user-friendly error messages (e.g., 'Network error, please check your connection')
   - Retry logic for transient failures (optional enhancement)
5. Handle quota exceeded errors from Supabase:
   - Detect error.message containing 'quota' or 'storage limit'
   - Display specific message: 'Storage quota exceeded, please delete old media'
6. Add cleanup for object URLs to prevent memory leaks:
   useEffect(() => {
     return () => {
       if (previewUrl && previewUrl.startsWith('blob:')) {
         URL.revokeObjectURL(previewUrl)
       }
     }
   }, [previewUrl])
7. Implement error boundary for upload failures
8. Add console logging for debugging upload flow
9. Test upload with various file sizes to verify progress tracking
10. Verify public URL format: https://xxxxx.supabase.co/storage/v1/object/public/exercise-media/{userId}/{exerciseId}/{filename}

### 6.3. Build UI with drag-and-drop zone and image/GIF preview display

**Status:** pending  
**Dependencies:** 6.1  

Create Tailwind-styled upload interface with drag-and-drop functionality, visual preview for uploaded media (supporting both static JPG and animated GIF), and responsive layout

**Details:**

1. Install react-dropzone for drag-and-drop: `npm install react-dropzone`
2. Import useDropzone hook: import { useDropzone } from 'react-dropzone'
3. Configure dropzone in component:
   const { getRootProps, getInputProps, isDragActive } = useDropzone({
     accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/gif': ['.gif'] },
     maxSize: 10 * 1024 * 1024,
     multiple: false,
     onDrop: (acceptedFiles) => {
       if (acceptedFiles[0]) {
         const file = acceptedFiles[0]
         handleFileChange({ target: { files: [file] } } as any)
       }
     }
   })
4. Create drag-and-drop zone JSX with Tailwind classes:
   <div
     {...getRootProps()}
     className={`
       relative border-2 border-dashed rounded-lg p-8
       transition-colors duration-200 cursor-pointer
       ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'}
       ${uploading ? 'pointer-events-none opacity-50' : ''}
     `}
   >
     <input {...getInputProps()} />
     {!previewUrl && (
       <div className="text-center">
         <p className="text-gray-400">Drag & drop exercise media here</p>
         <p className="text-sm text-gray-500 mt-2">or click to select file</p>
         <p className="text-xs text-gray-600 mt-1">JPG or GIF, max 10MB</p>
       </div>
     )}
   </div>
5. Add image/GIF preview display:
   {previewUrl && (
     <div className="mt-4 relative">
       <img
         src={previewUrl}
         alt="Exercise preview"
         className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
       />
       {previewUrl.endsWith('.gif') && (
         <span className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
           GIF
         </span>
       )}
     </div>
   )}
6. Add loading spinner overlay during upload:
   {uploading && (
     <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
       <div className="text-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
         <p className="text-white mt-2">{progress}%</p>
       </div>
     </div>
   )}
7. Add error message display:
   {error && (
     <div className="mt-2 p-3 bg-red-500/10 border border-red-500 rounded text-red-400 text-sm">
       {error}
     </div>
   )}
8. Add upload button (shown when preview exists):
   {previewUrl && !currentMediaUrl && (
     <button
       onClick={handleUpload}
       disabled={uploading}
       className="mt-4 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors"
     >
       {uploading ? 'Uploading...' : 'Upload Media'}
     </button>
   )}
9. Style hover states with Tailwind: hover:bg-gray-800, hover:border-blue-400
10. Ensure responsive design: use max-w-lg mx-auto for container, responsive padding classes

### 6.4. Add delete media functionality with confirmation dialog

**Status:** pending  
**Dependencies:** 6.2, 6.3  

Implement delete button for existing media, create confirmation modal to prevent accidental deletions, and handle deletion from both Storage bucket and database

**Details:**

1. Add delete state management:
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
   const [deleting, setDeleting] = useState(false)
2. Create deleteMedia function:
   const deleteMedia = async () => {
     try {
       setDeleting(true)
       setError(null)
       
       // Extract file path from currentMediaUrl
       // Format: https://xxxxx.supabase.co/storage/v1/object/public/exercise-media/{userId}/{exerciseId}/{filename}
       const urlParts = currentMediaUrl.split('/exercise-media/')
       const filePath = urlParts[1] // userId/exerciseId/filename
       
       // Delete from Storage
       const { error: deleteError } = await supabase.storage
         .from('exercise-media')
         .remove([filePath])
       
       if (deleteError) throw deleteError
       
       // Update database to clear media_url
       const { error: updateError } = await supabase
         .from('exercises')
         .update({ media_url: null })
         .eq('id', exerciseId)
       
       if (updateError) throw updateError
       
       // Clear preview and close confirmation
       setPreviewUrl(null)
       setShowDeleteConfirm(false)
       onUploadSuccess(null) // Notify parent of deletion
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Delete failed')
     } finally {
       setDeleting(false)
     }
   }
3. Create confirmation modal component:
   {showDeleteConfirm && (
     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
       <div className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
         <h3 className="text-xl font-semibold text-white mb-2">Delete Media?</h3>
         <p className="text-gray-400 mb-4">This action cannot be undone. The media file will be permanently deleted.</p>
         <div className="flex gap-2">
           <button
             onClick={() => setShowDeleteConfirm(false)}
             disabled={deleting}
             className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded"
           >
             Cancel
           </button>
           <button
             onClick={deleteMedia}
             disabled={deleting}
             className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded"
           >
             {deleting ? 'Deleting...' : 'Delete'}
           </button>
         </div>
       </div>
     </div>
   )}
4. Add delete button (shown when media exists):
   {currentMediaUrl && previewUrl && (
     <button
       onClick={() => setShowDeleteConfirm(true)}
       className="mt-2 w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500 text-red-400 font-semibold py-2 px-4 rounded transition-colors"
     >
       Delete Media
     </button>
   )}
5. Handle edge case: file deleted from Storage but not database
   - Check if file exists before attempting delete
   - Clear media_url even if Storage delete fails (with warning)
6. Add keyboard support for modal: ESC key closes confirmation
   useEffect(() => {
     const handleEsc = (e: KeyboardEvent) => {
       if (e.key === 'Escape') setShowDeleteConfirm(false)
     }
     if (showDeleteConfirm) {
       window.addEventListener('keydown', handleEsc)
       return () => window.removeEventListener('keydown', handleEsc)
     }
   }, [showDeleteConfirm])
7. Prevent body scroll when modal is open:
   useEffect(() => {
     if (showDeleteConfirm) {
       document.body.style.overflow = 'hidden'
       return () => { document.body.style.overflow = 'unset' }
     }
   }, [showDeleteConfirm])
8. Add ARIA attributes for accessibility: aria-modal="true", role="dialog"
9. Test deletion flow thoroughly to ensure no orphaned files
10. Log deletion events for debugging

### 6.5. Integrate MediaUpload component into exercise management workflow and add error handling

**Status:** pending  
**Dependencies:** 6.4  

Connect MediaUpload component to the routine/exercise editor pages, implement comprehensive error handling for offline scenarios and quota limits, and add usage documentation

**Details:**

1. Identify where MediaUpload should be integrated:
   - Likely in src/pages/RoutineEditor.tsx or similar exercise edit view
   - Should appear as a section within exercise edit form
2. Import MediaUpload component:
   import MediaUpload from '@/components/MediaUpload'
3. Add MediaUpload to exercise edit form (example integration):
   <div className="mb-6">
     <label className="block text-sm font-semibold text-gray-300 mb-2">Exercise Media</label>
     <MediaUpload
       exerciseId={exercise.id}
       userId={user.id}
       currentMediaUrl={exercise.media_url}
       onUploadSuccess={(url) => {
         // Update local state
         setExercise({ ...exercise, media_url: url })
         // Optionally show toast notification
         console.log('Media updated:', url)
       }}
     />
   </div>
4. Add offline detection and queue upload for later:
   const [isOnline, setIsOnline] = useState(navigator.onLine)
   useEffect(() => {
     const handleOnline = () => setIsOnline(true)
     const handleOffline = () => setIsOnline(false)
     window.addEventListener('online', handleOnline)
     window.addEventListener('offline', handleOffline)
     return () => {
       window.removeEventListener('online', handleOnline)
       window.removeEventListener('offline', handleOffline)
     }
   }, [])
   // Show warning banner when offline
   {!isOnline && (
     <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500 rounded text-yellow-400 text-sm">
       You are offline. Uploads will be queued until connection is restored.
     </div>
   )}
5. Implement upload queue using localStorage for offline resilience:
   interface QueuedUpload {
     file: File; // Note: Files can't be serialized, use FileReader to convert to base64
     exerciseId: string;
     userId: string;
     timestamp: number;
   }
   // Store pending uploads in localStorage
   // Process queue when back online
6. Add quota limit detection and user-friendly messaging:
   if (error.message.includes('quota') || error.message.includes('storage limit')) {
     setError('Storage quota exceeded. Delete old media to free up space.')
   } else if (error.message.includes('network') || error.message.includes('fetch')) {
     setError('Network error. Check your connection and try again.')
   } else if (error.message.includes('permission') || error.message.includes('policy')) {
     setError('Permission denied. You may not have access to modify this exercise.')
   } else {
     setError('Upload failed. Please try again.')
   }
7. Add toast notifications for success/error (optional, install react-hot-toast: npm install react-hot-toast):
   import toast from 'react-hot-toast'
   // On success:
   toast.success('Media uploaded successfully!')
   // On error:
   toast.error(error)
8. Create TypeScript types file: src/types/media.types.ts
   export interface MediaUploadProps {
     exerciseId: string;
     userId: string;
     currentMediaUrl?: string | null;
     onUploadSuccess: (url: string | null) => void;
   }
9. Add component documentation in JSDoc comments:
   /**
    * MediaUpload Component
    * 
    * Handles uploading JPG/GIF exercise demonstration media to Supabase Storage.
    * Features: drag-and-drop, file validation, progress tracking, preview, delete.
    * 
    * @param exerciseId - ID of the exercise to attach media to
    * @param userId - ID of authenticated user (for Storage path)
    * @param currentMediaUrl - Existing media URL (if any)
    * @param onUploadSuccess - Callback when upload/delete succeeds
    */
10. Add README section documenting MediaUpload usage for other developers
