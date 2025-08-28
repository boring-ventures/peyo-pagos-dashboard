"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  X, 
  FileImage, 
  FileText,
  AlertCircle, 
  CheckCircle2,
  Camera,
  RefreshCw 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  processFile, 
  formatFileSize, 
  isImageFile,
  dragDropUtils,
  type ProcessedFile,
  type FileValidationResult,
  validateFile 
} from "@/lib/utils/file-upload";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocumentUploadProps {
  label: string;
  description?: string;
  required?: boolean;
  accept?: string;
  maxFiles?: number;
  documentType?: string;
  onFilesChange: (files: File[]) => void;
  onProcessedFilesChange?: (files: ProcessedFile[]) => void;
  className?: string;
  disabled?: boolean;
  existingFiles?: File[];
}

interface FileWithStatus {
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  processed?: ProcessedFile;
  error?: string;
  preview?: string;
}

export function DocumentUpload({
  label,
  description,
  required = false,
  accept = "image/*,.pdf",
  maxFiles = 5,
  documentType,
  onFilesChange,
  onProcessedFilesChange,
  className,
  disabled = false,
  existingFiles = [],
}: DocumentUploadProps) {
  const [files, setFiles] = useState<FileWithStatus[]>(() => 
    existingFiles.map(file => ({
      file,
      status: 'completed' as const,
      progress: 100,
    }))
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFileStatus = useCallback((index: number, updates: Partial<FileWithStatus>) => {
    setFiles(prev => prev.map((file, i) => i === index ? { ...file, ...updates } : file));
  }, []);

  const processUploadedFile = useCallback(async (file: File, index: number) => {
    updateFileStatus(index, { status: 'uploading', progress: 25 });

    try {
      // First upload to Supabase
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('documentType', documentType || 'document');
      uploadFormData.append('documentSide', 'front'); // Default to front

      const uploadResponse = await fetch('/api/upload-document', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload to storage failed');
      }

      const { fileName, publicUrl } = await uploadResponse.json();
      updateFileStatus(index, { status: 'processing', progress: 50 });

      // Then process the file locally for preview
      const processed = await processFile(file, documentType, {
        createPreview: true,
        compress: true,
      });

      // Add storage info to processed file
      const processedWithStorage = {
        ...processed,
        fileName,
        publicUrl,
      };

      updateFileStatus(index, {
        status: 'completed',
        progress: 100,
        processed: processedWithStorage,
        preview: processed.preview,
      });

      return processedWithStorage;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('File upload/processing error:', error);
      updateFileStatus(index, {
        status: 'error',
        progress: 0,
        error: errorMessage,
      });
      
      toast({
        title: "File processing failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    }
  }, [documentType, updateFileStatus]);

  const handleFileSelection = useCallback(async (selectedFiles: FileList | File[]) => {
    if (disabled) return;

    const fileArray = Array.from(selectedFiles);
    
    // Check file count limit
    const currentFileCount = files.length;
    const newFileCount = fileArray.length;
    const totalFiles = currentFileCount + newFileCount;

    if (totalFiles > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload up to ${maxFiles} files. Please remove some files first.`,
        variant: "destructive",
      });
      return;
    }

    // Validate all files first
    const validationResults: { file: File; validation: FileValidationResult }[] = [];
    
    for (const file of fileArray) {
      const validation = validateFile(file, documentType);
      validationResults.push({ file, validation });

      if (!validation.isValid) {
        toast({
          title: `Invalid file: ${file.name}`,
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);

    // Add files to state with initial status
    const newFiles: FileWithStatus[] = validationResults.map(({ file }) => ({
      file,
      status: 'uploading' as const,
      progress: 0,
    }));

    setFiles(prev => [...prev, ...newFiles]);

    try {
      const processedFiles: ProcessedFile[] = [];

      // Process each file
      for (let i = 0; i < newFiles.length; i++) {
        const fileIndex = currentFileCount + i;
        const file = newFiles[i].file;

        try {
          const processed = await processUploadedFile(file, fileIndex);
          processedFiles.push(processed);
        } catch (error) {
          // Error already handled in processUploadedFile
          continue;
        }
      }

      // Update parent components with new files
      const updatedFiles = files.concat(newFiles).map(f => f.file);
      onFilesChange(updatedFiles);
      onProcessedFilesChange?.(processedFiles);

    } finally {
      setIsProcessing(false);
    }
  }, [files, maxFiles, documentType, disabled, processUploadedFile, onFilesChange, onProcessedFilesChange]);

  const removeFile = useCallback((index: number) => {
    if (disabled) return;

    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      const fileArray = newFiles.map(f => f.file);
      onFilesChange(fileArray);
      
      const processedFiles = newFiles
        .filter(f => f.processed)
        .map(f => f.processed!);
      onProcessedFilesChange?.(processedFiles);
      
      return newFiles;
    });
  }, [disabled, onFilesChange, onProcessedFilesChange]);

  const retryProcessing = useCallback(async (index: number) => {
    if (disabled) return;

    const fileWithStatus = files[index];
    if (!fileWithStatus || fileWithStatus.status !== 'error') return;

    try {
      await processUploadedFile(fileWithStatus.file, index);
    } catch (error) {
      // Error already handled in processUploadedFile
    }
  }, [files, disabled, processUploadedFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    const droppedFiles = dragDropUtils.handleDrop(e);
    if (droppedFiles.length > 0) {
      handleFileSelection(droppedFiles);
    }
    setIsDragOver(false);
  }, [handleFileSelection]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    dragDropUtils.handleDragOver(e);
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    dragDropUtils.handleDragLeave(e);
    setIsDragOver(false);
  }, []);

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFileSelection]);

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Upload Area */}
      <Card
        className={cn(
          "relative transition-all duration-200",
          isDragOver && "ring-2 ring-primary border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <CardContent className="p-6">
          <div
            className={cn(
              "border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors",
              isDragOver && "border-primary bg-primary/5",
              !disabled && "hover:border-primary/50 cursor-pointer"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple={maxFiles > 1}
              onChange={handleFileInputChange}
              disabled={disabled}
              className="hidden"
            />

            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Drop files here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: Images (JPEG, PNG, WebP) and PDF
                  <br />
                  Maximum file size: 10MB each
                  {maxFiles > 1 && ` • Up to ${maxFiles} files`}
                </p>
              </div>

              {files.length === 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    openFileDialog();
                  }}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Select Files
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            Uploaded Files ({files.length}/{maxFiles})
          </h4>
          
          {files.map((fileWithStatus, index) => {
            const { file, status, progress, error, preview } = fileWithStatus;
            
            return (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* File Preview/Icon */}
                    <div className="flex-shrink-0">
                      {preview ? (
                        <img
                          src={preview}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                          {isImageFile(file) ? (
                            <FileImage className="h-6 w-6 text-muted-foreground" />
                          ) : (
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                            {fileWithStatus.processed?.metadata.compressionRatio && (
                              <span className="text-green-600 ml-2">
                                {fileWithStatus.processed.metadata.compressionRatio}% smaller
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Status Badge */}
                          <Badge
                            variant={
                              status === 'completed' ? 'default' :
                              status === 'error' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {status === 'uploading' && 'Uploading'}
                            {status === 'processing' && 'Processing'}
                            {status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                            {status === 'error' && <AlertCircle className="h-3 w-3" />}
                          </Badge>

                          {/* Actions */}
                          <div className="flex gap-1">
                            {status === 'error' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => retryProcessing(index)}
                                disabled={disabled}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              disabled={disabled}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {(status === 'uploading' || status === 'processing') && (
                        <Progress value={progress} className="h-1" />
                      )}

                      {/* Error Message */}
                      {status === 'error' && error && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            {error}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add More Files Button */}
          {files.length < maxFiles && (
            <Button
              variant="outline"
              size="sm"
              onClick={openFileDialog}
              disabled={disabled || isProcessing}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Add More Files
            </Button>
          )}
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Processing files... Please wait.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}