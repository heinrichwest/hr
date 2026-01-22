// ============================================================
// FILE UPLOAD COMPONENT
// Reusable file upload component with drag-and-drop support
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import type { TakeOnDocument } from '../../types/takeOnSheet';
import './FileUpload.css';

interface FileUploadProps {
    /** Accepted file types (e.g., '.pdf,.jpg,.png') */
    accept: string;

    /** Maximum file size in bytes */
    maxSize: number;

    /** Callback when file is selected for upload */
    onUpload: (file: File) => void;

    /** Callback when delete is clicked */
    onDelete?: () => void;

    /** Existing uploaded file */
    value?: TakeOnDocument;

    /** Upload progress (0-100) */
    progress?: number;

    /** Error message to display */
    error?: string;

    /** Whether the component is disabled */
    disabled?: boolean;

    /** Label for the upload area */
    label?: string;
}

export function FileUpload({
    accept,
    maxSize,
    onUpload,
    onDelete,
    value,
    progress,
    error: externalError,
    disabled = false,
    label,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Parse accepted extensions for validation
    const acceptedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase());

    const validateFile = useCallback((file: File): boolean => {
        // Check file type
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isValidType = acceptedExtensions.some(ext =>
            ext === fileExtension ||
            file.type.includes(ext.replace('.', ''))
        );

        if (!isValidType) {
            setError(`Invalid file type. Accepted: ${accept}`);
            return false;
        }

        // Check file size
        if (file.size > maxSize) {
            const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
            const fileMB = (file.size / (1024 * 1024)).toFixed(2);
            setError(`File too large (${fileMB}MB). Maximum size: ${maxMB}MB`);
            return false;
        }

        setError(null);
        return true;
    }, [accept, acceptedExtensions, maxSize]);

    const handleFileSelect = useCallback((file: File) => {
        if (validateFile(file)) {
            onUpload(file);
        }
    }, [validateFile, onUpload]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [disabled, handleFileSelect]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
        // Reset input value to allow re-selecting same file
        e.target.value = '';
    }, [handleFileSelect]);

    const handleClick = useCallback(() => {
        if (!disabled && inputRef.current) {
            inputRef.current.click();
        }
    }, [disabled]);

    const handleDelete = useCallback(() => {
        if (onDelete) {
            onDelete();
        }
    }, [onDelete]);

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const displayError = externalError || error;

    // Show existing file if uploaded
    if (value) {
        return (
            <div className="file-upload file-upload--has-file">
                {label && <label className="file-upload__label">{label}</label>}
                <div className="file-upload__file-display">
                    <div className="file-upload__file-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                        </svg>
                    </div>
                    <div className="file-upload__file-info">
                        <span className="file-upload__file-name">{value.fileName}</span>
                        <span className="file-upload__file-size">{formatFileSize(value.fileSize)}</span>
                    </div>
                    <div className="file-upload__file-actions">
                        {value.downloadUrl && (
                            <a
                                href={value.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="file-upload__download-btn"
                                aria-label="Download file"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7,10 12,15 17,10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            </a>
                        )}
                        {onDelete && !disabled && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="file-upload__delete-btn"
                                aria-label="Delete file"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3,6 5,6 21,6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Show upload progress
    if (typeof progress === 'number' && progress >= 0 && progress < 100) {
        return (
            <div className="file-upload file-upload--uploading">
                {label && <label className="file-upload__label">{label}</label>}
                <div className="file-upload__progress">
                    <div className="file-upload__progress-bar">
                        <div
                            className="file-upload__progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="file-upload__progress-text">{Math.round(progress)}%</span>
                </div>
            </div>
        );
    }

    // Show dropzone
    return (
        <div className={`file-upload ${displayError ? 'file-upload--error' : ''}`}>
            {label && <label className="file-upload__label">{label}</label>}
            <div
                data-testid="file-upload-dropzone"
                className={`file-upload__dropzone ${isDragging ? 'file-upload__dropzone--dragging' : ''} ${disabled ? 'file-upload__dropzone--disabled' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleClick();
                    }
                }}
            >
                <input
                    ref={inputRef}
                    data-testid="file-upload-input"
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    className="file-upload__input"
                    disabled={disabled}
                />
                <div className="file-upload__icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17,8 12,3 7,8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                </div>
                <p className="file-upload__text">
                    <span className="file-upload__text-primary">Click to upload</span>
                    <span className="file-upload__text-secondary"> or drag and drop</span>
                </p>
                <p className="file-upload__hint">
                    {accept.replace(/\./g, '').toUpperCase()} up to {(maxSize / (1024 * 1024)).toFixed(0)}MB
                </p>
            </div>
            {displayError && (
                <p className="file-upload__error">{displayError}</p>
            )}
        </div>
    );
}
