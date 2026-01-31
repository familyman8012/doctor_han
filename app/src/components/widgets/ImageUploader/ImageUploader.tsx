"use client";

import { type FC, useState, type ChangeEvent, useRef } from "react";
import NextImage from "next/image";
import { Image as ImageIcon, Plus, Edit2 } from "lucide-react";

export interface ImageUploaderProps {
    /** 페이지 모드 (add | edit) */
    pageMode?: "add" | "edit";
    /** 읽기 전용 모드 */
    isReadOnly?: boolean;
    /** 초기 이미지 URL 또는 경로 */
    productImage?: string | null;
    /** 이미지 변경 시 콜백 */
    onImageChange?: (file: File) => void;
    /** 이미지 업로드 최대 사이즈 (MB) */
    maxSizeMB?: number;
    /** 허용할 이미지 타입 */
    acceptTypes?: string;
    /** 컨테이너 최대 너비 */
    maxWidth?: string;
    /** 컨테이너 높이 */
    height?: string;
}

const ImageUploader: FC<ImageUploaderProps> = ({
    pageMode = "add",
    isReadOnly = false,
    productImage = null,
    onImageChange,
    maxSizeMB = 2,
    acceptTypes = "image/*",
    maxWidth = "40rem",
    height = "24.8rem",
}) => {
    const [image, setImage] = useState<string | null>(
        pageMode === "add" || !productImage || productImage === "null" ? null : productImage,
    );
    const [error, setError] = useState<string>("");
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // 파일 타입 체크
        if (!file.type.startsWith("image/")) {
            setError("이미지 파일만 업로드 가능합니다.");
            return;
        }

        // 파일 사이즈 체크
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            setError(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
            return;
        }

        setError("");
        const imageUrl = URL.createObjectURL(file);
        setImage(imageUrl);
        if (onImageChange) {
            onImageChange(file);
        }
    };

    const handleImageClick = () => {
        if (!isReadOnly) {
            imageInputRef.current?.click();
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
        setError("");
    };

    return (
        <div className="image-uploader-container">
            <div
                className={`image-uploader-box ${image ? "has-image" : ""} ${isReadOnly ? "readonly" : ""}`}
                onClick={handleImageClick}
                style={{ maxWidth, height }}
            >
                <input
                    type="file"
                    ref={imageInputRef}
                    id="imageInput"
                    accept={acceptTypes}
                    onChange={handleImageChange}
                    disabled={isReadOnly}
                    className="hidden"
                />

                {image ? (
                    <NextImage src={image} alt="Uploaded" fill className="uploaded-image" unoptimized />
                ) : (
                    <div className="placeholder-content">
                        <ImageIcon size={32} className="icon" />
                        <p className="help-text">권장 용량 최대 {maxSizeMB}MB</p>
                    </div>
                )}
            </div>

            {error && <div className="error-message">{error}</div>}

            {!isReadOnly && (
                <div className="action-buttons">
                    <button type="button" onClick={handleImageClick} className="action-button primary">
                        {image ? (
                            <>
                                <Edit2 size={16} />
                                <span>이미지 수정</span>
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                <span>이미지 추가</span>
                            </>
                        )}
                    </button>
                    {image && (
                        <button type="button" onClick={handleRemoveImage} className="action-button danger">
                            이미지 제거
                        </button>
                    )}
                </div>
            )}

            <style jsx>{`
        .image-uploader-container {
          display: flex;
          flex-direction: column;
        }

        .image-uploader-box {
          overflow: hidden;
          width: 100%;
          background: #fafbfc;
          box-shadow: 0px 1px 2px 0px rgba(16, 24, 40, 0.05);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          cursor: pointer;
          border: 2px dashed #e5e7eb;
          transition: all 0.15s ease;
        }

        .image-uploader-box:hover:not(.readonly) {
          border-color: #62e3d5;
          background: rgba(98, 227, 213, 0.05);
        }

        .image-uploader-box.has-image {
          background: transparent;
          border-style: solid;
          border-color: #e5e7eb;
        }

        .image-uploader-box.readonly {
          cursor: default;
        }

        .uploaded-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .placeholder-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .placeholder-content .icon {
          color: #5a6376;
          margin-bottom: 1rem;
        }

        .help-text {
          color: #5a6376;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.5;
          text-align: center;
          margin: 0;
        }

        .error-message {
          color: #ef4444;
          font-size: 12px;
          margin-top: 0.5rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .action-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0 1rem;
          height: 32px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 6px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-button.primary {
          color: #fff;
          background: #62e3d5;
          border-color: #62e3d5;
        }

        .action-button.primary:hover {
          background: #4dd4c5;
        }

        .action-button.danger {
          color: #0a3b41;
          background: white;
          border-color: #e5e7eb;
        }

        .action-button.danger:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .hidden {
          display: none;
        }
      `}</style>
        </div>
    );
};

export default ImageUploader;
