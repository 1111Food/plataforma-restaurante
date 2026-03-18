'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Upload, Palette, Image as ImageIcon, Save, RefreshCw, Layout, AlignLeft, AlignCenter, AlignRight, Trash2, MapPin, Maximize2, Calendar, Check, Video, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

import { updateRestaurantSettings } from '@/app/actions/restaurant'

import Modal from '../../ui/Modal'
import ImageCropper from '../../ui/ImageCropper'
import UnifiedProductCard from '../../UnifiedProductCard'; // Import Preview Component

// Mock Item for Preview
const PREVIEW_ITEM = {
    id: 'preview-1',
    name: 'Truffle Burger Deluxe',
    description: 'Black angus, queso suizo, aceite de trufa y champiñones horneados en pan brioche artesanal.',
    price: 85,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    category: 'Burgers',
    is_available: true,
    item_modifiers: []
};

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
        delivery_zones: restaurant.delivery_zones || [],

        // Dynamic Theme Config
        theme_config: restaurant.theme_config || {
            templateId: restaurant.template_style || 'classic-grid',
            primaryColor: restaurant.primary_color || '#FFB800',
            imageSize: 'medium', // 'small', 'medium', 'large'
            fontFamily: restaurant.theme_config?.fontFamily || 'inter'
        },
        schedule_config: restaurant.schedule_config || {
            active: false,
            slots: [
                { id: "morning", label: "Mañana (Desayuno)", isActive: true, start: "06:00", end: "11:59", templateId: "editorial-chalkboard", categoryMatch: "desayuno" },
                { id: "afternoon", label: "Tarde (Almuerzo)", isActive: true, start: "12:00", end: "17:59", templateId: "classic-grid", categoryMatch: "almuerzo" },
                { id: "evening", label: "Noche (Cena)", isActive: true, start: "18:00", end: "05:59", templateId: "premium-luxe", categoryMatch: "cena" }
            ]
        },
        restaurant_gallery: {
            active: restaurant.restaurant_gallery?.active || false,
            albums: (restaurant.restaurant_gallery?.albums && restaurant.restaurant_gallery.albums.length > 0)
                ? restaurant.restaurant_gallery.albums
                : [
                    { id: "album1", name: "Ambiente", media: [] },
                    { id: "album2", name: "Platillos", media: [] }
                ]
        }
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

            // ... (logo upload logic)
            // ... (banner upload logic)
            // ... (bannerUrl assignments)

            // Construct new theme_config
            const newThemeConfig = {
                ...settings.theme_config,
                templateId: settings.template_style,
                primaryColor: settings.primary_color,
                // imageSize is updated directly in settings.theme_config via UI
            };

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
                delivery_zones: settings.delivery_zones,
                theme_config: newThemeConfig,
                restaurant_gallery: settings.restaurant_gallery
            }

            const result = await updateRestaurantSettings(restaurant.id, restaurant.slug, updateData)

            if (!result.success) throw new Error('Failed to update settings on server')

            alert('¡Configuración guardada y actualizada!')
            setSettings(prev => ({
                ...prev,
                logo_url: logoUrl,
                promo_banner_url: bannerUrl1,
                promo_banner_url_2: bannerUrl2,
                promo_banner_url_3: bannerUrl3,
                theme_config: newThemeConfig
            }))
            // ... clean up

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

    // Theme Presets State
    const [themePresets, setThemePresets] = useState(restaurant.theme_presets || { A: null, B: null, C: null });

    // Gallery Upload Helper
    const handleGalleryUpload = async (file: File, albumIndex: number, type: 'image' | 'video') => {
        const loadingToast = toast.loading('Subiendo archivo...');
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${restaurant.id}/gallery/${Date.now()}.${fileExt}`;
            const { data, error } = await supabase.storage.from('restaurant-assets').upload(fileName, file); // Use generic bucket

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage.from('restaurant-assets').getPublicUrl(fileName);

            const newGallery = { ...settings.restaurant_gallery };
            if (!newGallery.albums) newGallery.albums = []; // Safety check
            if (!newGallery.albums[albumIndex]) return;

            if (type === 'video') {
                newGallery.albums[albumIndex].video = publicUrl;
            } else {
                newGallery.albums[albumIndex].media.push(publicUrl);
            }

            setSettings({ ...settings, restaurant_gallery: newGallery });
            toast.dismiss(loadingToast);
            toast.success('Archivo subido');
        } catch (e: any) {
            toast.dismiss(loadingToast);
            toast.error('Error al subir: ' + e.message);
        }
    };

    const handleSavePreset = async (slot: 'A' | 'B' | 'C') => {
        if (!confirm(`¿Guardar configuración actual en el Perfil ${slot}? Esto sobrescribirá lo que haya antes.`)) return;

        // Create snapshot of current visual settings
        const snapshot = {
            template_style: settings.template_style,
            primary_color: settings.primary_color,
            background_color: settings.background_color,
            text_color: settings.text_color,
            card_color: settings.card_color,
            theme_config: settings.theme_config,
            logo_height: settings.logo_height,
            logo_alignment: settings.logo_alignment
        };

        const newPresets = { ...themePresets, [slot]: snapshot };
        setThemePresets(newPresets); // Optimistic Update

        try {
            await updateRestaurantSettings(restaurant.id, restaurant.slug, { theme_presets: newPresets });
            toast.success(`Perfil ${slot} guardado correctamente`);
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el perfil");
        }
    };

    const handleLoadPreset = (slot: 'A' | 'B' | 'C') => {
        const preset = themePresets[slot];
        if (!preset) return;

        if (!confirm(`¿Cargar Perfil ${slot}? Los cambios no guardados se perderán.`)) return;

        setSettings(prev => ({
            ...prev,
            ...preset
        }));
        toast.success(`Perfil ${slot} cargado. Dale a 'Guardar Cambios' para aplicar.`);
    };

    // ... (rest of the file content)

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

                {/* --- DESIGN PROFILES SELECTOR --- */}
                <div className="mb-8 bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                            <Layout size={14} className="text-[#FFB800]" /> Perfiles de Diseño Guardados
                        </h4>
                        <span className="text-[10px] text-[#666]">Guarda tus configuraciones favoritas</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {(['A', 'B', 'C'] as const).map(slot => {
                            const isOccupied = !!themePresets[slot];
                            const data = themePresets[slot];
                            return (
                                <div key={slot} className="relative group bg-[#0D0D0D] border border-white/10 rounded-lg p-3 flex flex-col justify-between h-24 transition-all hover:border-[#FFB800]/30">
                                    <div className="flex justify-between items-start">
                                        <span className="font-black text-xs text-[#444] group-hover:text-[#FFB800] transition-colors">{slot}</span>
                                        {isOccupied && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_lime]"></div>}
                                    </div>

                                    {isOccupied ? (
                                        <div className="text-[10px] text-[#888] leading-tight mb-1 line-clamp-2">
                                            {data.template_style?.replace('-', ' ')}
                                            <br />
                                            <span style={{ color: data.primary_color }}>Color: {data.primary_color}</span>
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-[#444] py-1">Vacío</div>
                                    )}

                                    <div className="flex gap-2 mt-auto">
                                        <button
                                            onClick={() => handleSavePreset(slot)}
                                            className="flex-1 bg-white/5 hover:bg-white/10 text-[9px] text-white py-1 rounded border border-transparent hover:border-white/20 transition-all uppercase font-bold"
                                            title="Guardar Configuración Actual Aquí"
                                        >
                                            Guardar
                                        </button>
                                        {isOccupied && (
                                            <button
                                                onClick={() => handleLoadPreset(slot)}
                                                className="flex-1 bg-[#FFB800]/10 hover:bg-[#FFB800] hover:text-black text-[9px] text-[#FFB800] py-1 rounded border border-[#FFB800]/20 transition-all uppercase font-bold"
                                                title="Cargar este Perfil"
                                            >
                                                Cargar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
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
                        {/* --- LIVE PREVIEW --- */}
                        <div className="sticky top-6 z-30">
                            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="bg-[#1a1a1a] px-4 py-2 border-b border-white/5 flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase text-[#666] tracking-widest">Vista Previa en Vivo</span>
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                                        <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                                        <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                                    </div>
                                </div>
                                <div
                                    className="p-6 relative transition-all duration-500"
                                    style={{
                                        fontFamily: `var(--font-${settings.theme_config?.fontFamily || 'inter'})`,
                                        backgroundColor: settings.background_color || '#000'
                                    }}
                                >
                                    {/* Mock Unified Card */}
                                    <UnifiedProductCard
                                        item={PREVIEW_ITEM}
                                        variant={
                                            settings.template_style === 'urban-burger' ? 'overlap' :
                                                (settings.template_style === 'premium-luxe' || settings.template_style === 'luxury-showcase') ? 'luxe' :
                                                    settings.template_style === 'editorial-chalkboard' ? 'editorial' :
                                                        'classic'
                                        }
                                        themeConfig={{
                                            ...settings.theme_config,
                                            primaryColor: settings.primary_color,
                                            cardColor: settings.card_color,
                                            imageSize: settings.theme_config?.imageSize || 'medium',
                                            fontFamily: settings.theme_config?.fontFamily
                                        }}
                                        qty={0}
                                        onAdd={() => { }}
                                        onRemove={() => { }}
                                    />
                                </div>
                            </div>
                            <p className="text-center text-[10px] text-[#444] mt-2">Así se verá tu platillo con la configuración actual.</p>
                        </div>

                        {/* Logo Controls */}
                        <div className="bg-[#000]/20 p-6 rounded-xl border border-white/5 space-y-6">
                            <h4 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                                <Maximize2 size={16} /> Ajustes de Logo (Tamaño: {settings.logo_height}px)
                            </h4>

                            {/* Height Slider */}
                            <div>
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

                        {/* Typography Selector */}
                        <div className="bg-[#000]/20 p-6 rounded-xl border border-white/5 space-y-4">
                            <h4 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                                <span className="text-xl">Aa</span> Tipografía
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'inter', label: 'Modern Sans', font: 'var(--font-inter)' },
                                    { id: 'playfair', label: 'Classic Serif', font: 'var(--font-playfair)' },
                                    { id: 'anton', label: 'Urban Impact', font: 'var(--font-anton)' },
                                    { id: 'caveat', label: 'Handwritten', font: 'var(--font-caveat)' }
                                ].map((font) => (
                                    <button
                                        key={font.id}
                                        onClick={() => setSettings({
                                            ...settings,
                                            theme_config: { ...settings.theme_config, fontFamily: font.id }
                                        })}
                                        className={`p-3 rounded-lg text-sm transition-all border ${settings.theme_config?.fontFamily === font.id
                                            ? 'bg-white text-black border-white'
                                            : 'bg-[#0D0D0D] text-[#888] border-white/5 hover:border-white/20'
                                            }`}
                                        style={{ fontFamily: font.font }}
                                    >
                                        {font.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Image Size Selector (New) */}
                        <div className="bg-[#000]/20 p-6 rounded-xl border border-white/5 space-y-4">
                            <h4 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                                <ImageIcon size={16} /> Tamaño de Imágenes
                            </h4>
                            <div className="flex gap-2">
                                {['small', 'medium', 'large'].map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSettings({
                                            ...settings,
                                            theme_config: { ...settings.theme_config, imageSize: size as 'small' | 'medium' | 'large' }
                                        })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${settings.theme_config.imageSize === size
                                            ? 'bg-white text-black shadow-lg'
                                            : 'bg-[#0D0D0D] text-[#888] hover:bg-white/5'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Schedule Configurator (New) */}
                        <div className="bg-[#000]/20 p-6 rounded-xl border border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                                    <Calendar size={16} /> Menú Dinámico por Horario
                                </h4>
                                <button
                                    onClick={() => setSettings({
                                        ...settings,
                                        schedule_config: { ...settings.schedule_config, active: !settings.schedule_config.active }
                                    })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.schedule_config?.active ? 'bg-green-500' : 'bg-gray-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.schedule_config?.active ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {settings.schedule_config?.active && (
                                <div className="space-y-4 mt-4 animate-fade-in">
                                    {settings.schedule_config.slots.map((slot: any, idx: number) => {
                                        // Ensure isActive exists (migration fallback)
                                        const isSlotActive = slot.isActive !== false;

                                        return (
                                            <div key={slot.id} className={`p-3 rounded-lg border transition-all ${isSlotActive ? 'bg-[#0D0D0D] border-white/10' : 'bg-[#050505] border-white/5 opacity-50'}`}>
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-3">
                                                        {/* Slot Toggle */}
                                                        <button
                                                            onClick={() => {
                                                                const newSlots = [...settings.schedule_config.slots];
                                                                newSlots[idx].isActive = !isSlotActive;
                                                                setSettings({
                                                                    ...settings,
                                                                    schedule_config: { ...settings.schedule_config, slots: newSlots }
                                                                });
                                                            }}
                                                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSlotActive ? 'bg-green-500 border-green-500' : 'border-[#666] hover:border-white'}`}
                                                        >
                                                            {isSlotActive && <Check size={10} className="text-black" />}
                                                        </button>
                                                        <span className={`text-xs font-bold uppercase ${isSlotActive ? 'text-[#FFB800]' : 'text-[#666]'}`}>{slot.label}</span>
                                                    </div>
                                                </div>

                                                {isSlotActive && (
                                                    <div className="space-y-3 animate-fade-in">
                                                        {/* Time Range */}
                                                        <div className="flex gap-2 items-center">
                                                            <div className="flex-1">
                                                                <label className="text-[9px] text-[#666] uppercase block mb-1">Inicio</label>
                                                                <input
                                                                    type="time"
                                                                    value={slot.start}
                                                                    onChange={(e) => {
                                                                        const newSlots = [...settings.schedule_config.slots];
                                                                        newSlots[idx].start = e.target.value;
                                                                        setSettings({
                                                                            ...settings,
                                                                            schedule_config: { ...settings.schedule_config, slots: newSlots }
                                                                        });
                                                                    }}
                                                                    className="w-full bg-[#1a1a1a] text-xs text-white rounded border border-white/10 p-1.5 focus:border-[#FFB800] outline-none text-center"
                                                                />
                                                            </div>
                                                            <span className="text-[#666]">-</span>
                                                            <div className="flex-1">
                                                                <label className="text-[9px] text-[#666] uppercase block mb-1">Fin</label>
                                                                <input
                                                                    type="time"
                                                                    value={slot.end}
                                                                    onChange={(e) => {
                                                                        const newSlots = [...settings.schedule_config.slots];
                                                                        newSlots[idx].end = e.target.value;
                                                                        setSettings({
                                                                            ...settings,
                                                                            schedule_config: { ...settings.schedule_config, slots: newSlots }
                                                                        });
                                                                    }}
                                                                    className="w-full bg-[#1a1a1a] text-xs text-white rounded border border-white/10 p-1.5 focus:border-[#FFB800] outline-none text-center"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2">
                                                            {/* Template Selector for Slot */}
                                                            <div>
                                                                <label className="text-[9px] text-[#666] uppercase block mb-1">Estilo Visual</label>
                                                                <select
                                                                    value={slot.templateId}
                                                                    onChange={(e) => {
                                                                        const newSlots = [...settings.schedule_config.slots];
                                                                        newSlots[idx].templateId = e.target.value;
                                                                        setSettings({
                                                                            ...settings,
                                                                            schedule_config: { ...settings.schedule_config, slots: newSlots }
                                                                        });
                                                                    }}
                                                                    className="w-full bg-[#1a1a1a] text-xs text-white rounded border border-white/10 p-1.5 focus:border-[#FFB800] outline-none"
                                                                >
                                                                    <option value="classic-grid">Clásico</option>
                                                                    <option value="editorial-chalkboard">Editorial</option>
                                                                    <option value="urban-burger">Urban Burger</option>
                                                                    <option value="premium-luxe">Luxury</option>
                                                                </select>
                                                            </div>
                                                            {/* Category Match */}
                                                            <div>
                                                                <label className="text-[9px] text-[#666] uppercase block mb-1">Categoría</label>
                                                                <input
                                                                    type="text"
                                                                    value={slot.categoryMatch}
                                                                    onChange={(e) => {
                                                                        const newSlots = [...settings.schedule_config.slots];
                                                                        newSlots[idx].categoryMatch = e.target.value;
                                                                        setSettings({
                                                                            ...settings,
                                                                            schedule_config: { ...settings.schedule_config, slots: newSlots }
                                                                        });
                                                                    }}
                                                                    className="w-full bg-[#1a1a1a] text-xs text-white rounded border border-white/10 p-1.5 focus:border-[#FFB800] outline-none"
                                                                    placeholder="Ej: desayuno"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* EXPERIENCE GALLERY CONFIGURATOR */}
                        <div className="bg-[#000]/20 p-6 rounded-xl border border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                                    <ImageIcon size={16} /> Galería de Experiencia
                                </h4>
                                <button
                                    onClick={() => {
                                        const active = !settings.restaurant_gallery?.active;
                                        setSettings({
                                            ...settings,
                                            restaurant_gallery: { ...settings.restaurant_gallery, active }
                                        });
                                    }}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.restaurant_gallery?.active ? 'bg-green-500' : 'bg-gray-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.restaurant_gallery?.active ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {settings.restaurant_gallery?.active && (
                                <div className="space-y-6 mt-4 animate-fade-in">
                                    {(settings.restaurant_gallery.albums || []).map((album: any, idx: number) => (
                                        <div key={album.id} className="bg-[#0D0D0D] p-4 rounded-lg border border-white/5 relative">
                                            <div className="mb-4">
                                                <label className="text-[10px] text-[#666] uppercase font-bold mb-1 block">Nombre del Álbum</label>
                                                <input
                                                    value={album.name}
                                                    onChange={(e) => {
                                                        const newGallery = { ...settings.restaurant_gallery };
                                                        newGallery.albums[idx].name = e.target.value;
                                                        setSettings({ ...settings, restaurant_gallery: newGallery });
                                                    }}
                                                    className="w-full bg-transparent border-b border-white/10 text-sm font-bold text-white focus:border-[#FFB800] outline-none py-1"
                                                />
                                            </div>

                                            <div className="grid grid-cols-4 gap-2">
                                                {/* Video Slot */}
                                                <div className="aspect-square bg-black border border-dashed border-white/10 rounded flex items-center justify-center relative group overflow-hidden">
                                                    {album.video ? (
                                                        <>
                                                            <video src={album.video} className="w-full h-full object-cover opacity-60" />
                                                            <button
                                                                onClick={() => {
                                                                    const newGallery = { ...settings.restaurant_gallery };
                                                                    newGallery.albums[idx].video = null;
                                                                    setSettings({ ...settings, restaurant_gallery: newGallery });
                                                                }}
                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 z-20 hover:scale-110 transition-transform"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                <Video size={24} className="text-white drop-shadow-lg" />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1 text-[#444]">
                                                            <Video size={20} />
                                                            <span className="text-[8px] uppercase font-bold">Video</span>
                                                            <input
                                                                type="file"
                                                                accept="video/*"
                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                                onChange={(e) => {
                                                                    if (e.target.files?.[0]) handleGalleryUpload(e.target.files[0], idx, 'video');
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Photos */}
                                                {album.media.map((url: string, i: number) => (
                                                    <div key={i} className="aspect-square relative group rounded overflow-hidden">
                                                        <img src={url} className="w-full h-full object-cover" />
                                                        <button
                                                            onClick={() => {
                                                                const newGallery = { ...settings.restaurant_gallery };
                                                                newGallery.albums[idx].media = newGallery.albums[idx].media.filter((_: any, index: number) => index !== i);
                                                                setSettings({ ...settings, restaurant_gallery: newGallery });
                                                            }}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* Add Photo Button */}
                                                {album.media.length < 20 && (
                                                    <div className="aspect-square bg-white/5 border border-dashed border-white/10 rounded flex items-center justify-center relative hover:bg-white/10 transition-colors cursor-pointer group">
                                                        <Plus size={20} className="text-[#666] group-hover:text-white transition-colors" />
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                            onChange={(e) => {
                                                                if (e.target.files) {
                                                                    Array.from(e.target.files).forEach(file => handleGalleryUpload(file, idx, 'image'));
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-[#444] mt-2 text-right">{album.media.length}/20 Fotos • {album.video ? '1' : '0'}/1 Video</p>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                                    { id: 'premium-luxe', label: 'Premium Luxe', desc: 'Exclusivo. Full screen y gradientes.' },
                                    { id: 'editorial-chalkboard', label: 'Editorial / Pizarra', desc: 'Estilo revista, fondo oscuro.' },
                                    { id: 'urban-burger', label: 'Urban Burger', desc: 'Impacto, colores fuertes y asimetría.' }
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
