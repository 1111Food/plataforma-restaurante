'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Upload, Palette, Image as ImageIcon, Save, RefreshCw, Layout, AlignLeft, AlignCenter, AlignRight, Trash2, MapPin } from 'lucide-react'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

import { updateRestaurantSettings } from '@/app/actions/restaurant'

import Modal from '../../ui/Modal'
import ImageCropper from '../../ui/ImageCropper'

// ... imports remain the same

export default function ConfigTab({ restaurant }: { restaurant: any }) {
    const [settings, setSettings] = useState({
        primary_color: restaurant.primary_color || '#FFB800',
        background_color: restaurant.background_color || '#0D0D0D',
        text_color: restaurant.text_color || '#F5F5F5',
        logo_url: restaurant.logo_url || null,
        logo_height: restaurant.logo_height || 80, // Default 80px
        logo_alignment: restaurant.logo_alignment || 'left', // 'left', 'center', 'right'
        promo_banner_url: restaurant.promo_banner_url || null,
        promo_banner_url_2: restaurant.promo_banner_url_2 || null, // New
        promo_banner_url_3: restaurant.promo_banner_url_3 || null,
        card_color: restaurant.card_color || null,
        template_style: restaurant.template_style || 'classic-grid',
        delivery_zones: restaurant.delivery_zones || [] // New: Array of strings
    })
    const [isSaving, setIsSaving] = useState(false)
    const [logoFile, setLogoFile] = useState<File | null>(null)

    // Manage 3 banner files
    const [bannerFiles, setBannerFiles] = useState<{ [key: string]: File | null }>({
        banner1: null,
        banner2: null,
        banner3: null
    })

    // CROPPING STATE
    const [isCropperOpen, setIsCropperOpen] = useState(false)
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
    const [cropTargetSlot, setCropTargetSlot] = useState<'logo' | 'banner1' | 'banner2' | 'banner3' | null>(null)

    // Helper: Initialize Crop functionality when a file is selected
    const handleFileSelect = (file: File, slot: 'logo' | 'banner1' | 'banner2' | 'banner3') => {
        const reader = new FileReader()
        reader.addEventListener('load', () => {
            setCropImageSrc(reader.result?.toString() || null)
            setCropTargetSlot(slot)
            setIsCropperOpen(true)
        })
        reader.readAsDataURL(file)
    }

    // Helper: Finalize Crop
    const handleCropComplete = (croppedBlob: Blob) => {
        const fileName = `crop_${Date.now()}.jpg`
        const croppedFile = new File([croppedBlob], fileName, { type: 'image/jpeg' })

        if (cropTargetSlot === 'logo') {
            setLogoFile(croppedFile)
        } else if (cropTargetSlot === 'banner1') {
            setBannerFiles(prev => ({ ...prev, banner1: croppedFile }))
        } else if (cropTargetSlot === 'banner2') {
            setBannerFiles(prev => ({ ...prev, banner2: croppedFile }))
        } else if (cropTargetSlot === 'banner3') {
            setBannerFiles(prev => ({ ...prev, banner3: croppedFile }))
        }

        // Close Cropper
        setIsCropperOpen(false)
        setCropImageSrc(null)
        setCropTargetSlot(null)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            let logoUrl = settings.logo_url
            let bannerUrl1 = settings.promo_banner_url
            let bannerUrl2 = settings.promo_banner_url_2
            let bannerUrl3 = settings.promo_banner_url_3

            // Upload Logo if new
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop()
                const fileName = `logos/${restaurant.id}/${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('restaurant-assets')
                    .upload(fileName, logoFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('restaurant-assets')
                    .getPublicUrl(fileName)
                logoUrl = publicUrl
            }

            // Helper to upload banner
            const uploadBanner = async (file: File | null, existingUrl: string | null) => {
                if (!file) return existingUrl;
                const fileExt = file.name.split('.').pop()
                const fileName = `banners/${restaurant.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('restaurant-assets')
                    .upload(fileName, file)

                if (uploadError) throw uploadError
                const { data: { publicUrl } } = supabase.storage
                    .from('restaurant-assets')
                    .getPublicUrl(fileName)
                return publicUrl;
            }

            // Upload all banners
            bannerUrl1 = await uploadBanner(bannerFiles.banner1, bannerUrl1)
            bannerUrl2 = await uploadBanner(bannerFiles.banner2, bannerUrl2)
            bannerUrl3 = await uploadBanner(bannerFiles.banner3, bannerUrl3)

            // Use Server Action for the database update & revalidation
            const updateData = {
                primary_color: settings.primary_color,
                background_color: settings.background_color,
                text_color: settings.text_color,
                logo_url: logoUrl,
                logo_height: settings.logo_height,
                logo_alignment: settings.logo_alignment,
                promo_banner_url: bannerUrl1,
                promo_banner_url_2: bannerUrl2,
                promo_banner_url_3: bannerUrl3,
                card_color: settings.card_color,
                template_style: settings.template_style,
                delivery_zones: settings.delivery_zones
            }

            const result = await updateRestaurantSettings(restaurant.id, restaurant.slug, updateData)

            if (!result.success) throw new Error('Failed to update settings on server')

            alert('¡Configuración guardada y actualizada!')
            setSettings(prev => ({
                ...prev,
                logo_url: logoUrl,
                promo_banner_url: bannerUrl1,
                promo_banner_url_2: bannerUrl2,
                promo_banner_url_3: bannerUrl3
            }))
            setLogoFile(null)
            setBannerFiles({ banner1: null, banner2: null, banner3: null })

        } catch (error: any) {
            console.error('Error saving settings:', error)
            alert('Error al guardar: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const deleteBanner = async (slot: number) => {
        if (!confirm("¿Estás seguro de eliminar este banner?")) return;

        // Determine which field to clear
        const key = slot === 1 ? 'promo_banner_url' : `promo_banner_url_${slot}` as any;

        // Optimistic update
        setSettings(prev => ({ ...prev, [key]: null }));
        setBannerFiles(prev => ({ ...prev, [`banner${slot}`]: null }));

        try {
            await updateRestaurantSettings(restaurant.id, restaurant.slug, { [key]: null })
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            {/* Branding Section */}
            <div className="bg-[#1a1a1a]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
                    <div className="p-2 bg-[#FFB800]/10 rounded-lg">
                        <Palette className="text-[#FFB800]" size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-[#F5F5F5]">Diseño y Marca</h3>
                        <p className="text-xs text-[#888] uppercase tracking-wide">Personaliza la identidad visual de tu menú</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Visual Identity Column */}
                    <div className="space-y-8">
                        {/* Logo Upload */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#888] mb-2 flex justify-between">
                                <span>Logotipo</span>
                                {settings.logo_url && <span className="text-[#FFB800]">Activo</span>}
                            </label>
                            <div className="relative group w-full h-40 bg-[#0D0D0D] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all hover:border-[#FFB800]/50 hover:bg-[#FFB800]/5">
                                {settings.logo_url || logoFile ? (
                                    <img
                                        src={logoFile ? URL.createObjectURL(logoFile) : settings.logo_url!}
                                        className="h-full w-full object-contain p-4"
                                        alt="Logo Preview"
                                    />
                                ) : (
                                    <div className="text-center p-4">
                                        <ImageIcon className="mx-auto text-[#444] mb-2" size={32} />
                                        <p className="text-xs text-[#666]">Arrastra o haz click para subir</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/gif, image/svg+xml"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            handleFileSelect(e.target.files[0], 'logo')
                                            e.target.value = ''
                                        }
                                    }}
                                />
                                {(settings.logo_url || logoFile) && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <RefreshCw className="text-white" size={24} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Multi-Banner Upload */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#888] mb-2">
                                Banners Publicitarios (Máx 3)
                            </label>

                            <div className="grid grid-cols-1 gap-4">
                                {[1, 2, 3].map((slot) => {
                                    const currentUrl = slot === 1 ? settings.promo_banner_url : (settings as any)[`promo_banner_url_${slot}`]
                                    const currentFile = (bannerFiles as any)[`banner${slot}`]

                                    return (
                                        <div key={slot} className="relative group w-full h-32 bg-[#0D0D0D] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all hover:border-[#FFB800]/50 hover:bg-[#FFB800]/5">
                                            {currentUrl || currentFile ? (
                                                <>
                                                    <img
                                                        src={currentFile ? URL.createObjectURL(currentFile) : currentUrl!}
                                                        className="h-full w-full object-cover opacity-80"
                                                        alt={`Banner Slot ${slot}`}
                                                    />
                                                    <div className="absolute top-2 right-2 flex gap-2">
                                                        <div className="bg-black/60 text-white text-[10px] px-2 py-1 rounded font-bold uppercase backdrop-blur-sm">
                                                            Slot {slot}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                deleteBanner(slot);
                                                            }}
                                                            className="bg-red-500/80 hover:bg-red-500 text-white p-1 rounded transition-colors z-20"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-4">
                                                    <Layout className="mx-auto text-[#444] mb-2" size={24} />
                                                    <p className="text-xs text-[#666]">Slot {slot}: Cargar Banner</p>
                                                </div>
                                            )}

                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg, image/gif"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        const slotKey = `banner${slot}` as 'banner1' | 'banner2' | 'banner3';
                                                        handleFileSelect(e.target.files[0], slotKey)
                                                        e.target.value = ''
                                                    }
                                                }}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                            <p className="text-[10px] text-[#555]">Aparecerán rotando arriba del menú. Formato horizontal recomendado.</p>
                        </div>
                    </div>

                    {/* Controls Column */}
                    <div className="space-y-8">
                        {/* Logo Controls */}
                        <div className="bg-[#000]/20 p-6 rounded-xl border border-white/5 space-y-6">
                            <h4 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                                <Layout size={16} /> Ajustes de Logo
                            </h4>

                            {/* Height Slider */}
                            <div>
                                <div className="flex justify-between text-xs text-[#888] mb-2 uppercase font-bold">
                                    <span>Tamaño</span>
                                    <span>{settings.logo_height}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="40"
                                    max="200"
                                    value={settings.logo_height}
                                    onChange={(e) => setSettings({ ...settings, logo_height: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#FFB800]"
                                />
                            </div>

                            {/* Alignment */}
                            <div>
                                <label className="block text-xs text-[#888] mb-2 uppercase font-bold">Alineación</label>
                                <div className="flex bg-[#0D0D0D] rounded-lg p-1 border border-white/10">
                                    {['left', 'center', 'right'].map((align) => (
                                        <button
                                            key={align}
                                            onClick={() => setSettings({ ...settings, logo_alignment: align })}
                                            className={`flex-1 py-2 rounded-md flex justify-center transition-all ${settings.logo_alignment === align ? 'bg-[#FFB800] text-black shadow-lg' : 'text-[#666] hover:text-white'}`}
                                        >
                                            {align === 'left' && <AlignLeft size={18} />}
                                            {align === 'center' && <AlignCenter size={18} />}
                                            {align === 'right' && <AlignRight size={18} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Template Selector */}
                        <div className="bg-[#000]/20 p-6 rounded-xl border border-white/5 space-y-4">
                            <h4 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                                <Layout size={16} /> Diseño del Menú
                            </h4>
                            <p className="text-[10px] text-[#888]">Elige la estructura visual de tu menú.</p>

                            <div className="space-y-2">
                                {[
                                    { id: 'classic-grid', label: 'Clásico (Grid)', desc: 'Equilibrado y estándar.' },
                                    { id: 'urban-grid', label: 'Urbano / Street', desc: 'Cuadrícula compacta tipo app.' },
                                    { id: 'minimal-list', label: 'Minimalista (Fresh)', desc: 'Lista limpia horizontal.' },
                                    { id: 'luxury-showcase', label: 'Luxury (Showcase)', desc: 'Fotos gigantes y elegancia.' },
                                    { id: 'premium-luxe', label: 'Premium Luxe', desc: 'Exclusivo. Full screen y gradientes.' }
                                ].map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => setSettings({ ...settings, template_style: template.id })}
                                        className={`w-full text-left p-3 rounded-lg border transition-all flex justify-between items-center ${settings.template_style === template.id
                                            ? 'bg-[#FFB800]/10 border-[#FFB800] text-white'
                                            : 'bg-[#0D0D0D] border-white/5 text-[#888] hover:bg-white/5'
                                            }`}
                                    >
                                        <div>
                                            <span className={`block text-xs font-bold ${settings.template_style === template.id ? 'text-[#FFB800]' : 'text-white'}`}>
                                                {template.label}
                                            </span>
                                            <span className="text-[10px] opacity-70">{template.desc}</span>
                                        </div>
                                        {settings.template_style === template.id && (
                                            <div className="w-2 h-2 rounded-full bg-[#FFB800] shadow-[0_0_10px_#FFB800]"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color Pickers (Condensed) */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-[#F5F5F5]">Colores Principales</h4>
                            {[
                                { label: 'Fondo', key: 'background_color', desc: 'Base de la app' },
                                { label: 'Acento', key: 'primary_color', desc: 'Botones y destacados' },
                                { label: 'Texto', key: 'text_color', desc: 'Lectura general' },
                                { label: 'Tarjetas', key: 'card_color', desc: 'Fondo de Platillos' } // New
                            ].map((color) => (
                                <div key={color.key} className="flex items-center gap-4 bg-[#0D0D0D] p-2 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                    <input
                                        type="color"
                                        value={(settings as any)[color.key] || '#000000'} // Fallback for color input
                                        onChange={(e) => setSettings({ ...settings, [color.key]: e.target.value })}
                                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-bold text-[#F5F5F5] uppercase">{color.label}</p>
                                            {/* Allow clearing card color to restore default glass effect */}
                                            {color.key === 'card_color' && (settings as any)[color.key] && (
                                                <button
                                                    onClick={() => setSettings({ ...settings, card_color: null })}
                                                    className="text-[9px] text-red-500 hover:text-red-400 uppercase font-bold"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-[#666] font-mono">{(settings as any)[color.key] || 'Default (Glass)'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Logistics Section */}
                <div className="mt-10 pt-10 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <MapPin className="text-green-500" size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-[#F5F5F5]">Logística y Entregas</h3>
                            <p className="text-xs text-[#888] uppercase tracking-wide">Configura tus zonas de cobertura</p>
                        </div>
                    </div>

                    <div className="bg-[#000]/20 p-6 rounded-xl border border-white/5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#888] mb-2">
                            Zonas de Cobertura (Separadas por comas)
                        </label>
                        <textarea
                            defaultValue={settings.delivery_zones?.join(', ') || ''}
                            onChange={(e) => {
                                // Allow free typing, parse on change but store raw as well if we had local state.
                                // Since we are using 'settings' as source of truth for saving, we can arguably just split by comma
                                // BUT to allow typing "Zona 1, Zona 2", we need to NOT re-render the value from the array immediately if it kills the comma.
                                // Actually, simpler solution: Don't map/filter inside onChange for the VALUE, only for the STATE to be saved.
                                // But if 'settings' drives the value...
                                // Let's try parsing loosely.
                                const val = e.target.value;
                                const zones = val.split(','); // Don't trim/filter here to preserve structure? 
                                // NO, we must use a local variable or just 'defaultValue' and let React handle the uncontrolled-ish input?
                                // Let's switch to fully uncontrolled with 'defaultValue' and update state on Blur or Change?
                                // If I use 'defaultValue', I can update state on Change.
                                // Updating state doesn't re-render the textarea if value is not bound?
                                // Yes!
                                const cleanZones = val.split(',').map(z => z.trim()).filter(z => z.length > 0);
                                setSettings({ ...settings, delivery_zones: cleanZones });
                            }}
                            className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg p-4 text-[#F5F5F5] focus:outline-none focus:border-green-500 transition-colors h-24 text-sm"
                            placeholder="Ej: Zona 10, Zona 14, Carretera a El Salvador, Zona 4..."
                        />
                        <p className="text-[10px] text-[#666] mt-2">
                            Estas opciones aparecerán en el checkout cuando el cliente elija "A Domicilio".
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end border-t border-white/5 pt-6 sticky bottom-0 bg-[#1a1a1a]/95 backdrop-blur py-4 -mb-8 rounded-b-2xl z-40">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-[#FFB800] text-black font-bold py-3 px-8 rounded-xl hover:bg-white transition-all transform hover:scale-105 shadow-xl shadow-[#FFB800]/20"
                    >
                        {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>

            {/* CROPPER OVERLAY */}
            {isCropperOpen && cropImageSrc && (
                <ImageCropper
                    imageSrc={cropImageSrc}
                    onCancel={() => {
                        setIsCropperOpen(false)
                        setCropImageSrc(null)
                        setCropTargetSlot(null)
                    }}
                    onCropComplete={handleCropComplete}
                    aspect={cropTargetSlot === 'logo' ? 1 : (16 / 9)}
                />
            )}
        </div>
    )
}
