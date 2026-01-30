'use client';

import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[]; // URLs of images to show
}

export default function Lightbox({ isOpen, onClose, images }: LightboxProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Reset index when opening
    useEffect(() => {
        if (isOpen) {
            setActiveIndex(0);
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        } else {
            document.body.style.overflow = 'unset';
            setActiveIndex(0); // Reset for next time
        }
        return () => { document.body.style.overflow = 'unset'; }
    }, [isOpen]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeIndex]);

    if (!isOpen || images.length === 0) return null;

    const nextImage = () => {
        if (activeIndex < images.length - 1) setActiveIndex(activeIndex + 1);
    };

    const prevImage = () => {
        if (activeIndex > 0) setActiveIndex(activeIndex - 1);
    };

    // Swipe handlers
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && activeIndex < images.length - 1) nextImage();
        if (isRightSwipe && activeIndex > 0) prevImage();
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in touch-none p-4"
            onClick={onClose} // Backdrop closes
        >

            {/* Modal Container */}
            <div
                className="relative w-full max-w-lg md:max-w-2xl bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()} // Prevent setting close on modal click
                style={{ maxHeight: '80vh' }}
            >
                {/* Top Toolbar (Inside Modal) */}
                <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center z-50 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-full text-white/90 text-xs font-bold tracking-widest uppercase pointer-events-auto">
                        {activeIndex + 1} / {images.length}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 bg-black/40 backdrop-blur-md hover:bg-white/20 rounded-full text-white transition-all pointer-events-auto"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Main Image Area with Gestures */}
                <div
                    className="w-full flex-1 relative bg-black flex items-center justify-center overflow-hidden"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    style={{ aspectRatio: '4/5' }} // Enforce a portrait-ish or square aspect ratio for consistency if desired, or let it flow
                >

                    {/* Desktop Arrows */}
                    {activeIndex > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all z-10"
                        >
                            <ChevronLeft size={32} />
                        </button>
                    )}

                    {/* Image */}
                    <img
                        src={images[activeIndex]}
                        alt={`Gallery ${activeIndex}`}
                        className="w-full h-full object-contain select-none"
                    />

                    {activeIndex < images.length - 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all z-10"
                        >
                            <ChevronRight size={32} />
                        </button>
                    )}
                </div>

                {/* Bottom Indicators */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-50 pointer-events-none">
                    {images.map((_, idx) => (
                        <div
                            key={idx}
                            className={`transition-all duration-300 rounded-full shadow-sm ${idx === activeIndex ? 'w-2.5 h-2.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
