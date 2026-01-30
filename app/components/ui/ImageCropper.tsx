'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
// Removed invalid import
import getCroppedImg from '../../utils/cropImage'
import { X, Check, ZoomIn, Loader2 } from 'lucide-react'

// Simple Slider styled for this app
const ZoomSlider = ({ value, onChange }: { value: number, onChange: (v: number) => void }) => (
    <div className="flex items-center gap-3 w-full max-w-xs mx-auto">
        <ZoomIn size={16} className="text-neutral-400" />
        <input
            type="range"
            value={value}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400"
        />
    </div>
)

type Props = {
    imageSrc: string
    onCancel: () => void
    onCropComplete: (croppedBlob: Blob) => void
    aspect?: number
}

export default function ImageCropper({ imageSrc, onCancel, onCropComplete, aspect = 1 }: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop)
    }

    const onZoomChange = (zoom: number) => {
        setZoom(zoom)
    }

    const onCropResult = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleSave = async () => {
        try {
            setIsProcessing(true)
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
            if (croppedImage) {
                onCropComplete(croppedImage)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center animate-in fade-in duration-200">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <h3 className="text-white font-bold text-lg drop-shadow-md">Ajustar Imagen</h3>
                <button
                    onClick={onCancel}
                    className="p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition backdrop-blur-sm"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Cropper Container */}
            <div className="relative w-full h-full max-h-[70vh] bg-[#0f0f0f] border-y border-white/10">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={onCropChange}
                    onCropComplete={onCropResult}
                    onZoomChange={onZoomChange}
                    showGrid={true}
                    cropShape="rect"
                    style={{
                        containerStyle: { background: '#0f0f0f' },
                        cropAreaStyle: { border: '2px solid #FFB800', boxShadow: '0 0 0 9999em rgba(0, 0, 0, 0.8)' } // Dark overlay
                    }}
                />
            </div>

            {/* Controls */}
            <div className="w-full max-w-md p-6 flex flex-col gap-6 z-50">

                {/* Zoom Control */}
                <div>
                    <p className="text-center text-xs text-neutral-400 mb-2 uppercase tracking-widest font-bold">Zoom</p>
                    <ZoomSlider value={zoom} onChange={onZoomChange} />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isProcessing}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-amber-500 text-black hover:bg-amber-400 transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,184,0,0.3)] disabled:opacity-50"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" /> : <Check />}
                        Recortar y Usar
                    </button>
                </div>
            </div>
        </div>
    )
}
