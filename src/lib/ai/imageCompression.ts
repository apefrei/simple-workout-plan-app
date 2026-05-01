export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface CompressedImage {
  base64: string;
  mimeType: string;
  sizeKB: number;
}

const DEFAULTS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 2048,
  quality: 0.8,
  mimeType: 'image/jpeg' as const,
  minQuality: 0.3,
  qualityStep: 0.1,
};

export async function compressImage(file: File, options?: CompressionOptions): Promise<CompressedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }

  const maxSizeMB = options?.maxSizeMB ?? DEFAULTS.maxSizeMB;
  const maxWidthOrHeight = options?.maxWidthOrHeight ?? DEFAULTS.maxWidthOrHeight;
  const mimeType = options?.mimeType ?? DEFAULTS.mimeType;
  let quality = options?.quality ?? DEFAULTS.quality;

  const img = await loadImage(file);
  const { width, height } = calculateDimensions(img.naturalWidth, img.naturalHeight, maxWidthOrHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');
  ctx.drawImage(img, 0, 0, width, height);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  while (quality >= DEFAULTS.minQuality) {
    const base64 = canvas.toDataURL(mimeType, quality);
    const sizeBytes = base64SizeBytes(base64);

    if (sizeBytes <= maxSizeBytes) {
      return { base64: stripDataURLPrefix(base64), mimeType, sizeKB: Math.round(sizeBytes / 1024) };
    }
    quality -= DEFAULTS.qualityStep;
  }

  // Final attempt at minimum quality
  const base64 = canvas.toDataURL(mimeType, DEFAULTS.minQuality);
  const sizeBytes = base64SizeBytes(base64);

  if (sizeBytes > maxSizeBytes) {
    throw new Error(`Could not compress image below ${maxSizeMB}MB (got ${Math.round(sizeBytes / 1024)}KB at minimum quality)`);
  }

  return { base64: stripDataURLPrefix(base64), mimeType, sizeKB: Math.round(sizeBytes / 1024) };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

function calculateDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  const ratio = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function base64SizeBytes(dataURL: string): number {
  const base64 = dataURL.split(',')[1] ?? '';
  return Math.ceil((base64.length * 3) / 4);
}

function stripDataURLPrefix(dataURL: string): string {
  return dataURL.split(',')[1] ?? '';
}
