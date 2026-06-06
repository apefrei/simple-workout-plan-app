import { uploadFile, deleteFile } from './api';

export async function uploadExerciseMedia(
  _userId: string,
  _exerciseId: string,
  file: File
): Promise<string> {
  return uploadFile(file);
}

export async function deleteExerciseMedia(mediaUrl: string): Promise<void> {
  try {
    await deleteFile(mediaUrl);
  } catch (err) {
    if (import.meta.env.DEV) console.error('delete media:', err);
  }
}
