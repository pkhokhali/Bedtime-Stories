import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Link,
  FileImage,
} from 'lucide-react';
import { uploadImage, ApiError } from '../utils/api';

export interface ImageUploaderProps {
  currentUrl?: string;
  onUploadSuccess: (url: string) => void;
  onUrlChange?: (url: string) => void;
  onRemove?: () => void;
  adminSecret?: string;
  onError?: (errorMessage: string) => void;
  className?: string;
  label?: string;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentUrl = '',
  onUploadSuccess,
  onUrlChange,
  onRemove,
  adminSecret,
  onError,
  className = '',
  label = 'Cover Image Artwork',
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState(currentUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds 5MB limit. Please choose a smaller image.`;
    }

    if (file.size === 0) {
      return 'Selected file is empty (0 bytes). Please choose a valid image.';
    }

    // Check extension & mime type
    const lowerName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());

    if (!hasValidExt && !hasValidMime) {
      return 'Unsupported file type. Please upload a .jpg, .jpeg, .png, or .webp image.';
    }

    return null;
  };

  const processUpload = async (file: File) => {
    setUploadError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      if (onError) onError(validationError);
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadImage(file, adminSecret);
      if (result.success && result.url) {
        onUploadSuccess(result.url);
        setManualUrl(result.url);
      } else {
        throw new Error('Upload completed without returning image URL.');
      }
    } catch (err: any) {
      let message = 'Image upload failed. Please try again.';
      if (err instanceof ApiError) {
        if (err.isUnauthorized) {
          message = 'Unauthorized: Please configure a valid Admin Secret key.';
        } else if (err.isOffline) {
          message = 'Network offline: Cannot upload images while disconnected.';
        } else if (err.status === 413) {
          message = 'File too large: Cover images must be strictly under 5MB.';
        } else {
          message = err.message;
        }
      } else if (err?.message) {
        message = err.message;
      }
      setUploadError(message);
      if (onError) onError(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUpload(files[0]);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    } else if (onUrlChange) {
      onUrlChange('');
    }
    setManualUrl('');
    setUploadError(null);
  };

  const handleManualUrlBlur = () => {
    const trimmed = manualUrl.trim();
    if (trimmed !== currentUrl && onUrlChange) {
      onUrlChange(trimmed);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header Label and Status */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon size={15} className="text-amber-600" />
          <span>{label}</span>
        </label>
        {currentUrl ? (
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 size={13} /> Cover Set
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-normal">Optional</span>
        )}
      </div>

      {/* Main Upload Box / Preview Area */}
      {currentUrl ? (
        // Preview State with Replace / Remove Actions
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Thumbnail Preview */}
            <div className="relative group w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-slate-200 overflow-hidden border border-slate-300 shadow-inner shrink-0 flex items-center justify-center">
              <img
                src={currentUrl}
                alt="Story cover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  title="Replace Image"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                  className="p-2 bg-white/90 hover:bg-white text-slate-900 rounded-lg shadow-sm transition-all"
                >
                  <RefreshCw size={14} className={isUploading ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  title="Remove Image"
                  onClick={handleRemove}
                  disabled={disabled || isUploading}
                  className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-sm transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Actions & Image Info */}
            <div className="flex-1 space-y-2.5 min-w-0 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-md flex items-center gap-1">
                  <CheckCircle2 size={12} /> Active Cover
                </span>
                <span className="text-xs text-slate-500 font-mono truncate max-w-xs">
                  {currentUrl}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 size={13} className="animate-spin text-amber-400" />
                  ) : (
                    <RefreshCw size={13} className="text-amber-400" />
                  )}
                  <span>{isUploading ? 'Uploading...' : 'Replace Image'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={disabled || isUploading}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <X size={13} />
                  <span>Remove</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1 ml-auto"
                >
                  <Link size={12} />
                  <span>{showUrlInput ? 'Hide URL' : 'Edit URL'}</span>
                </button>
              </div>

              {/* Manual URL Input dropdown */}
              {showUrlInput && (
                <div className="pt-2 animate-in fade-in duration-150">
                  <input
                    type="url"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    onBlur={handleManualUrlBlur}
                    placeholder="https://..."
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Dropzone & Upload State
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 select-none ${
            isDragging
              ? 'border-amber-500 bg-amber-50/80 scale-[1.01] shadow-md'
              : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/70 hover:border-amber-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div
              className={`p-3 rounded-full transition-colors ${
                isDragging ? 'bg-amber-100 text-amber-700' : 'bg-slate-200/80 text-slate-600'
              }`}
            >
              {isUploading ? (
                <Loader2 size={24} className="animate-spin text-amber-600" />
              ) : isDragging ? (
                <FileImage size={24} className="text-amber-600 animate-bounce" />
              ) : (
                <Upload size={24} className="text-slate-600" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800">
                {isUploading
                  ? 'Uploading cover image to Cloudflare Workers KV...'
                  : isDragging
                  ? 'Drop image here to upload'
                  : 'Drag & drop cover image here, or click to browse'}
              </p>
              <p className="text-[11px] text-slate-500">
                Supports JPG, PNG, WEBP, SVG • Maximum file size: 5MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* Direct URL Fallback Toggle when no image attached */}
      {!currentUrl && (
        <div className="pt-1">
          {!showUrlInput ? (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="text-xs text-slate-500 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors"
            >
              <Link size={12} />
              <span>Or enter direct image URL manually</span>
            </button>
          ) : (
            <div className="space-y-1 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Manual Image URL</span>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://saanjh-api.prabinkhokhali89.workers.dev/images/img_xxx.jpg"
                  className="flex-1 border border-slate-300 rounded-lg p-2 text-xs font-mono bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualUrl.trim()) {
                      onUploadSuccess(manualUrl.trim());
                      if (onUrlChange) onUrlChange(manualUrl.trim());
                    }
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message Alert */}
      {uploadError && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-rose-500 hover:text-rose-800 p-0.5"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
