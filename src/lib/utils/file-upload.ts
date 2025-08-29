import { SUPPORTED_IMAGE_TYPES, SUPPORTED_DOCUMENT_TYPES, MAX_FILE_SIZE } from '@/types/customer';

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * File processing result
 */
export interface ProcessedFile {
  file: File;
  preview?: string;
  base64?: string;
  compressed?: File;
  metadata: FileMetadata;
  fileName?: string;
  publicUrl?: string;
}

/**
 * File metadata
 */
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  dimensions?: {
    width: number;
    height: number;
  };
  compressionRatio?: number;
}

/**
 * Image compression options
 */
export interface ImageCompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  maxSizeKB: number;
}

/**
 * Default compression settings for different document types
 */
const DEFAULT_COMPRESSION_OPTIONS: Record<string, ImageCompressionOptions> = {
  'passport': {
    maxWidth: 2000,
    maxHeight: 2000,
    quality: 0.8,
    maxSizeKB: 2048, // 2MB
  },
  'drivers_license': {
    maxWidth: 1600,
    maxHeight: 1200,
    quality: 0.8,
    maxSizeKB: 1536, // 1.5MB
  },
  'national_id': {
    maxWidth: 1600,
    maxHeight: 1200,
    quality: 0.8,
    maxSizeKB: 1536,
  },
  'business_document': {
    maxWidth: 2400,
    maxHeight: 3200,
    quality: 0.9,
    maxSizeKB: 3072, // 3MB
  },
  'default': {
    maxWidth: 2000,
    maxHeight: 2000,
    quality: 0.85,
    maxSizeKB: 2048,
  },
};

/**
 * Validate file for upload
 */
export function validateFile(file: File, documentType?: string): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if file exists
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors, warnings };
  }

  // Check file size
  if (file.size === 0) {
    errors.push('File is empty');
  } else if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum limit of ${formatFileSize(MAX_FILE_SIZE)}`);
  }

  // Check file type
  const isImageFile = SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number]);
  const isDocumentFile = SUPPORTED_DOCUMENT_TYPES.includes(file.type as typeof SUPPORTED_DOCUMENT_TYPES[number]);

  if (!isImageFile && !isDocumentFile) {
    errors.push(`File type '${file.type}' is not supported. Supported formats: ${SUPPORTED_DOCUMENT_TYPES.join(', ')}`);
  }

  // Warnings for large files
  if (file.size > 5 * 1024 * 1024) { // 5MB
    warnings.push('Large file detected. Consider compressing the image for faster upload.');
  }

  // Document-specific validations
  if (documentType) {
    if (documentType.includes('license') || documentType.includes('id')) {
      if (file.type === 'application/pdf') {
        warnings.push('PDF format detected. Image formats (JPEG, PNG) are preferred for ID documents.');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get file metadata including dimensions for images
 */
export async function getFileMetadata(file: File): Promise<FileMetadata> {
  const metadata: FileMetadata = {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  };

  // Get image dimensions if it's an image file
  if (SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number])) {
    try {
      metadata.dimensions = await getImageDimensions(file);
    } catch (error) {
      console.warn('Could not determine image dimensions:', error);
    }
  }

  return metadata;
}

/**
 * Get image dimensions
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Create file preview (for images)
 */
export function createFilePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number])) {
      reject(new Error('File type not supported for preview'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error('Failed to create file preview'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compress image file
 */
export async function compressImage(
  file: File, 
  documentType?: string,
  customOptions?: Partial<ImageCompressionOptions>
): Promise<File> {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number])) {
    throw new Error('File type not supported for compression');
  }

  const options = {
    ...DEFAULT_COMPRESSION_OPTIONS[documentType || 'default'],
    ...customOptions,
  };

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const url = URL.createObjectURL(file);

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      URL.revokeObjectURL(url);

      try {
        // Calculate new dimensions
        const { width, height } = calculateCompressedDimensions(
          img.naturalWidth,
          img.naturalHeight,
          options.maxWidth,
          options.maxHeight
        );

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Check if compression was effective
            if (blob.size > options.maxSizeKB * 1024) {
              // Try with lower quality
              const lowerQuality = Math.max(0.1, options.quality - 0.2);
              canvas.toBlob(
                (secondBlob) => {
                  if (!secondBlob) {
                    reject(new Error('Failed to compress image with lower quality'));
                    return;
                  }

                  const compressedFile = new File([secondBlob], file.name, {
                    type: file.type,
                    lastModified: Date.now(),
                  });

                  resolve(compressedFile);
                },
                file.type,
                lowerQuality
              );
            } else {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            }
          },
          file.type,
          options.quality
        );
      } catch (error) {
        reject(new Error(`Image compression failed: ${error}`));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = url;
  });
}

/**
 * Calculate compressed dimensions while maintaining aspect ratio
 */
function calculateCompressedDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const width = originalWidth;
  const height = originalHeight;

  // Calculate scale factor
  const scaleX = maxWidth / width;
  const scaleY = maxHeight / height;
  const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/**
 * Convert file to base64
 */
export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };

    reader.onerror = () => {
      reject(new Error('Failed to convert file to base64'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Process file for upload (validate, compress if needed, create preview)
 */
export async function processFile(
  file: File,
  documentType?: string,
  options?: {
    createPreview?: boolean;
    compress?: boolean;
    compressionOptions?: Partial<ImageCompressionOptions>;
  }
): Promise<ProcessedFile> {
  const { createPreview = true, compress = true, compressionOptions } = options || {};

  // Validate file
  const validation = validateFile(file, documentType);
  if (!validation.isValid) {
    throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
  }

  // Get metadata
  const metadata = await getFileMetadata(file);

  const result: ProcessedFile = {
    file,
    metadata,
  };

  // Create preview if requested and file is an image
  if (createPreview && SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number])) {
    try {
      result.preview = await createFilePreview(file);
    } catch (error) {
      console.warn('Failed to create preview:', error);
    }
  }

  // Compress image if requested and beneficial
  if (compress && SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number]) && file.size > 1024 * 1024) {
    try {
      const compressed = await compressImage(file, documentType, compressionOptions);
      
      // Only use compressed version if it's significantly smaller
      if (compressed.size < file.size * 0.8) {
        result.compressed = compressed;
        result.metadata.compressionRatio = Math.round((1 - compressed.size / file.size) * 100);
      }
    } catch (error) {
      console.warn('Failed to compress image:', error);
    }
  }

  // Convert to base64 (use compressed version if available)
  const fileToConvert = result.compressed || result.file;
  try {
    result.base64 = await convertFileToBase64(fileToConvert);
  } catch (error) {
    console.warn('Failed to convert to base64:', error);
  }

  return result;
}

/**
 * Process multiple files
 */
export async function processFiles(
  files: File[],
  documentType?: string,
  options?: {
    createPreview?: boolean;
    compress?: boolean;
    compressionOptions?: Partial<ImageCompressionOptions>;
    onProgress?: (processed: number, total: number, fileName: string) => void;
  }
): Promise<ProcessedFile[]> {
  const results: ProcessedFile[] = [];
  const { onProgress } = options || {};

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i, files.length, file.name);

    try {
      const processed = await processFile(file, documentType, options);
      results.push(processed);
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error);
      throw error;
    }
  }

  onProgress?.(files.length, files.length, 'Complete');
  return results;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get file extension from filename or MIME type
 */
export function getFileExtension(file: File): string {
  // Try to get from filename first
  const nameExtension = file.name.split('.').pop()?.toLowerCase();
  if (nameExtension) {
    return nameExtension;
  }

  // Fallback to MIME type
  const mimeToExtension: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  };

  return mimeToExtension[file.type] || 'unknown';
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number]);
}

/**
 * Check if file needs compression
 */
export function shouldCompressFile(file: File, threshold = 1024 * 1024): boolean {
  return isImageFile(file) && file.size > threshold;
}

/**
 * Utilities for drag and drop file handling
 */
export const dragDropUtils = {
  /**
   * Handle drag over event
   */
  handleDragOver: (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  },

  /**
   * Handle drag enter event
   */
  handleDragEnter: (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  },

  /**
   * Handle drag leave event
   */
  handleDragLeave: (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  },

  /**
   * Handle drop event and extract files
   */
  handleDrop: (event: DragEvent): File[] => {
    event.preventDefault();
    event.stopPropagation();

    const files: File[] = [];
    
    if (event.dataTransfer?.files) {
      Array.from(event.dataTransfer.files).forEach(file => {
        files.push(file);
      });
    }

    return files;
  },

  /**
   * Check if dragged items contain files
   */
  hasFiles: (event: DragEvent): boolean => {
    return event.dataTransfer?.types.includes('Files') || false;
  },
};