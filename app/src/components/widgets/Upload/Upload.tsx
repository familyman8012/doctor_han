"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { Upload as UploadIcon, X, File, CheckCircle, AlertCircle } from "lucide-react";

export interface UploadedFile {
    file: File;
    preview?: string;
    status: "pending" | "uploading" | "success" | "error";
    progress?: number;
    error?: string;
}

export interface UploadProps {
    /** 파일 업로드 시 호출되는 콜백 */
    onFileUpload?: (files: File[]) => void;
    /** 파일 선택 시 호출되는 콜백 */
    onFilesChange?: (files: UploadedFile[]) => void;
    /** 다중 파일 업로드 허용 */
    multiple?: boolean;
    /** 허용할 파일 타입 */
    accept?: DropzoneOptions["accept"];
    /** 최대 파일 크기 (bytes) */
    maxSize?: number;
    /** 최대 파일 개수 */
    maxFiles?: number;
    /** 비활성화 상태 */
    disabled?: boolean;
    /** 미리보기 표시 여부 */
    showPreview?: boolean;
    /** 업로드된 파일 목록 표시 */
    showFileList?: boolean;
}

const Upload: React.FC<UploadProps> = ({
    onFileUpload,
    onFilesChange,
    multiple = false,
    accept,
    maxSize = 5 * 1024 * 1024, // 5MB
    maxFiles = 10,
    disabled = false,
    showPreview = true,
    showFileList = true,
}) => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [rejectedFiles, setRejectedFiles] = useState<any[]>([]);

    const onDrop = useCallback(
        (acceptedFiles: File[], fileRejections: any[]) => {
            // 거부된 파일 처리
            if (fileRejections.length > 0) {
                setRejectedFiles(fileRejections);
                setTimeout(() => setRejectedFiles([]), 5000); // 5초 후 에러 메시지 제거
            }

            // 허용된 파일 처리
            if (acceptedFiles.length > 0) {
                const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
                    file,
                    preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
                    status: "pending" as const,
                }));

                setUploadedFiles((prev) => [...prev, ...newFiles]);

                if (onFileUpload) {
                    onFileUpload(acceptedFiles);
                }

                if (onFilesChange) {
                    onFilesChange([...uploadedFiles, ...newFiles]);
                }
            }
        },
        [onFileUpload, onFilesChange, uploadedFiles],
    );

    const removeFile = (index: number) => {
        const newFiles = uploadedFiles.filter((_, i) => i !== index);
        setUploadedFiles(newFiles);

        if (onFilesChange) {
            onFilesChange(newFiles);
        }

        // Clean up preview URL
        if (uploadedFiles[index].preview) {
            URL.revokeObjectURL(uploadedFiles[index].preview!);
        }
    };

    const clearAll = () => {
        // Clean up all preview URLs
        uploadedFiles.forEach((file) => {
            if (file.preview) {
                URL.revokeObjectURL(file.preview);
            }
        });

        setUploadedFiles([]);
        setRejectedFiles([]);

        if (onFilesChange) {
            onFilesChange([]);
        }
    };

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        multiple,
        accept,
        maxSize,
        maxFiles,
        disabled,
    });

    const formatFileSize = (size: number) => {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="upload-container">
            <div
                {...getRootProps()}
                className={`
          dropzone 
          ${isDragActive ? "dragging" : ""} 
          ${isDragReject ? "reject" : ""}
          ${disabled ? "disabled" : ""}
        `}
            >
                <input {...getInputProps()} />

                <div className="dropzone-content">
                    <UploadIcon size={28} className="icon" />

                    {isDragActive ? (
                        <p className="message">파일을 놓으세요...</p>
                    ) : (
                        <>
                            <p className="message">파일을 드래그하거나 클릭하여 선택하세요</p>
                            <p className="hint">
                                {multiple ? "여러 파일을 선택할 수 있습니다" : "파일 1개를 선택하세요"}
                                {maxSize && ` (최대 ${formatFileSize(maxSize)})`}
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* 거부된 파일 에러 메시지 */}
            {rejectedFiles.length > 0 && (
                <div className="rejected-files">
                    {rejectedFiles.map(({ file, errors }) => (
                        <div key={file.name} className="error-item">
                            <AlertCircle size={16} />
                            <span>{file.name}: </span>
                            {errors.map((error: any) => (
                                <span key={error.code}>
                                    {error.code === "file-too-large" && "파일이 너무 큽니다"}
                                    {error.code === "file-invalid-type" && "허용되지 않는 파일 형식입니다"}
                                    {error.code === "too-many-files" && "파일 개수가 초과되었습니다"}
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* 업로드된 파일 목록 */}
            {showFileList && uploadedFiles.length > 0 && (
                <div className="file-list">
                    <div className="file-list-header">
                        <h4>업로드된 파일 ({uploadedFiles.length})</h4>
                        <button type="button" onClick={clearAll} className="clear-button">
                            모두 지우기
                        </button>
                    </div>

                    {uploadedFiles.map((uploadedFile, index) => (
                        <div key={index} className="file-item">
                            <div className="file-info">
                                {showPreview && uploadedFile.preview ? (
                                    <img
                                        src={uploadedFile.preview}
                                        alt={uploadedFile.file.name}
                                        className="file-preview"
                                    />
                                ) : (
                                    <File size={24} className="file-icon" />
                                )}

                                <div className="file-details">
                                    <p className="file-name">{uploadedFile.file.name}</p>
                                    <p className="file-size">{formatFileSize(uploadedFile.file.size)}</p>
                                </div>
                            </div>

                            <div className="file-actions">
                                {uploadedFile.status === "success" && (
                                    <CheckCircle size={20} className="success-icon" />
                                )}
                                {uploadedFile.status === "error" && <AlertCircle size={20} className="error-icon" />}
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="remove-button"
                                    aria-label="파일 제거"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
        .upload-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem;
          border: 2px dashed #e5e7eb;
          border-radius: 8px;
          background-color: #fafbfc;
          cursor: pointer;
          transition: all 0.15s ease;
          outline: none;
        }

        .dropzone:hover:not(.disabled) {
          border-color: #62e3d5;
          background-color: rgba(98, 227, 213, 0.05);
        }

        .dropzone:focus:not(.disabled) {
          border-color: #62e3d5;
          box-shadow: 0 0 0 2px rgba(98, 227, 213, 0.2);
        }

        .dropzone.dragging {
          border-color: #62e3d5;
          background-color: rgba(98, 227, 213, 0.05);
        }

        .dropzone.reject {
          border-color: #ef4444;
          background-color: #fef2f2;
        }

        .dropzone.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .dropzone-content .icon {
          color: #5a6376;
          margin-bottom: 0.75rem;
        }

        .dropzone.dragging .icon {
          color: #62e3d5;
        }

        .dropzone.reject .icon {
          color: #ef4444;
        }

        .message {
          font-size: 14px;
          color: #0a3b41;
          margin-bottom: 0.5rem;
        }

        .hint {
          font-size: 12px;
          color: #5a6376;
        }

        .rejected-files {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 0.75rem;
        }

        .error-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #dc2626;
          font-size: 12px;
          margin-bottom: 0.25rem;
        }

        .error-item:last-child {
          margin-bottom: 0;
        }

        .file-list {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
        }

        .file-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .file-list-header h4 {
          font-size: 14px;
          font-weight: 600;
          color: #0a3b41;
          margin: 0;
        }

        .clear-button {
          font-size: 12px;
          color: #5a6376;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .clear-button:hover {
          background-color: #f3f4f6;
          color: #0a3b41;
        }

        .file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background-color: #fafbfc;
          border-radius: 6px;
          margin-bottom: 0.5rem;
        }

        .file-item:last-child {
          margin-bottom: 0;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .file-preview {
          width: 36px;
          height: 36px;
          object-fit: cover;
          border-radius: 4px;
        }

        .file-icon {
          color: #5a6376;
        }

        .file-details {
          display: flex;
          flex-direction: column;
        }

        .file-name {
          font-size: 13px;
          color: #0a3b41;
          margin: 0;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 11px;
          color: #5a6376;
          margin: 0;
        }

        .file-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .success-icon {
          color: #62e3d5;
        }

        .error-icon {
          color: #ef4444;
        }

        .remove-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #5a6376;
          border-radius: 4px;
          transition: all 0.15s;
        }

        .remove-button:hover {
          color: #ef4444;
          background-color: #fee2e2;
        }
      `}</style>
        </div>
    );
};

export default Upload;
