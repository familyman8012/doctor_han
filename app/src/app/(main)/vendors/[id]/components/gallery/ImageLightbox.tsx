"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageLightboxProps {
    images: Array<{ url: string; alt?: string }>;
    currentIndex: number;
    onIndexChange: (index: number) => void;
    onClose: () => void;
}

export function ImageLightbox({ images, currentIndex, onIndexChange, onClose }: ImageLightboxProps) {
    const handlePrev = useCallback(() => {
        onIndexChange(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
    }, [currentIndex, images.length, onIndexChange]);

    const handleNext = useCallback(() => {
        onIndexChange(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
    }, [currentIndex, images.length, onIndexChange]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "ArrowRight") handleNext();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, handlePrev, handleNext]);

    const current = images[currentIndex];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
                onClick={onClose}
            >
                {/* Close button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Content area - stop propagation so clicking the image doesn't close */}
                <div
                    className="relative flex items-center justify-center max-w-5xl w-full mx-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Main image */}
                    {current?.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={current.url}
                            alt={current.alt || ""}
                            className="max-h-[85vh] max-w-full mx-auto object-contain rounded-lg"
                        />
                    )}

                    {/* Navigation buttons */}
                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={handlePrev}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                type="button"
                                onClick={handleNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}
                </div>

                {/* Counter */}
                {images.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
