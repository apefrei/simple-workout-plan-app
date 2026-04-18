import { supabase } from './supabase'

const BUCKET = 'exercise-media'

function getExtension(file: File): string {
  const parts = file.name.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : 'jpg'
}

export async function uploadExerciseMedia(
  userId: string,
  exerciseId: string,
  file: File,
): Promise<string> {
  const ext = getExtension(file)
  const path = `${userId}/${exerciseId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteExerciseMedia(mediaUrl: string): Promise<void> {
  // Extract the path after the bucket name from the public URL
  const marker = `/${BUCKET}/`
  const idx = mediaUrl.indexOf(marker)
  if (idx === -1) return

  const path = mediaUrl.slice(idx + marker.length)
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) {
    console.error('delete media:', error)
  }
}
