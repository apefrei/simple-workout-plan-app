import { useState, useRef, useCallback } from 'react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

interface MediaUploadProps {
  currentUrl?: string | null
  onFileSelected: (file: File) => void
  onClear: () => void
  disabled?: boolean
  uploading?: boolean
}

export default function MediaUpload({ currentUrl, onFileSelected, onClear, disabled, uploading }: MediaUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validate = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, and GIF files are allowed.'
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 10 MB.`
    }
    return null
  }

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validate(file)
      if (validationError) {
        setError(validationError)
        return
      }
      setError(null)
      const url = URL.createObjectURL(file)
      setPreview(url)
      onFileSelected(file)
    },
    [onFileSelected],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled || uploading) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !uploading) setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleClear = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    setError(null)
    onClear()
  }

  const displayUrl = preview ?? currentUrl

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
        Exercise Image
      </label>

      {displayUrl ? (
        <div className="relative inline-block">
          <img
            src={displayUrl}
            alt="Exercise preview"
            className="h-32 w-32 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
          {!disabled && !uploading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white shadow hover:bg-red-600"
              title="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          disabled={disabled || uploading}
          className={`flex h-32 w-32 flex-col items-center justify-center rounded-lg border-2 border-dashed text-gray-400 transition disabled:cursor-not-allowed disabled:opacity-50 ${
            dragOver
              ? 'border-blue-500 bg-blue-50 text-blue-500 dark:bg-blue-900/20'
              : 'border-gray-300 hover:border-blue-400 hover:text-blue-500 dark:border-gray-600 dark:hover:border-blue-500'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mb-1 h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">{dragOver ? 'Drop here' : 'Add Image'}</span>
          <span className="mt-0.5 text-[10px]">or drag & drop</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif"
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <p className="text-[10px] text-gray-400">JPG, PNG, or GIF. Max 10 MB.</p>
    </div>
  )
}
