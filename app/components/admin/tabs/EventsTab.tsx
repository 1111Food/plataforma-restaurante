'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Calendar, Users, Clock, Trash2, Edit2, X } from 'lucide-react'

// ...

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Event = {
    id: string
    title: string
    description: string
    event_type: string
    pax_count: number // Updated from capacity
    duration_hours: number // Updated from schedule
    image_url?: string | null
}

export default function EventsTab({ restaurant }: { restaurant: any }) {
    // Map initial events to match new structure if needed, or assume they come correctly from DB
    // Ideally the data fetching should have returned correct columns.
    // Since we can't change the fetch passed via props easily here without changing the parent, 
    // we'll assume the prop might have mismatched keys if the fetched data was different.
    // But since the DB has these columns, the select('*') in parent should have fetched them.
    // We just need to use them in the UI.

    const [events, setEvents] = useState<Event[]>(restaurant.restaurant_events || [])
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_type: '',
        pax_count: '', // Form input is string, will parse to int
        duration_hours: '', // Form input is string, will parse to float/int
        event_date: ''
    })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [editingEventId, setEditingEventId] = useState<string | null>(null)
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            let finalImageUrl = currentImageUrl

            // 1. Upload File if selected (Replaces old one)
            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop()
                const fileName = `events/${restaurant.id}/${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('restaurant-assets')
                    .upload(fileName, selectedFile)

                if (uploadError) {
                    console.error('Error uploading file:', uploadError)
                    alert('Error subiendo archivo, pero intentaremos guardar el evento.')
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('restaurant-assets')
                        .getPublicUrl(fileName)
                    finalImageUrl = publicUrl
                }
            }

            const payload = {
                title: formData.title,
                description: formData.description || null,
                event_type: formData.event_type || 'Social',
                pax_count: Number(formData.pax_count) || 0,
                duration_hours: Number(formData.duration_hours) || 0,
                image_url: finalImageUrl,
                event_date: formData.event_date ? formData.event_date : null,
                // Only add restaurant_id on create to avoid policy errors if not needed?
                // Actually restaurant_id is usually constant, but good practice.
                ...(editingEventId ? {} : { restaurant_id: restaurant.id })
            }

            let resultData;

            if (editingEventId) {
                // UPDATE
                const { data, error } = await supabase
                    .from('restaurant_events')
                    .update(payload)
                    .eq('id', editingEventId)
                    .select()

                if (error) throw error
                resultData = data[0]

                // Optimistic Update
                setEvents(events.map(ev => ev.id === editingEventId ? resultData : ev))
                alert('Evento actualizado correctamente')

            } else {
                // CREATE
                const { data, error } = await supabase
                    .from('restaurant_events')
                    .insert([payload])
                    .select()

                if (error) throw error
                resultData = data[0]
                setEvents([...events, resultData])
                alert('Evento publicado correctamente')
            }

            // Reset Form
            handleCancelEdit()

        } catch (err: any) {
            console.error("Error:", err)
            alert('Error al guardar el evento: ' + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditEvent = (event: Event) => {
        setEditingEventId(event.id)
        setFormData({
            title: event.title,
            description: event.description,
            event_type: event.event_type,
            pax_count: event.pax_count.toString(),
            duration_hours: event.duration_hours.toString(),
            event_date: '' // Not used in UI yet but kept for structure
        })
        setCurrentImageUrl(event.image_url || null)
        setSelectedFile(null)
        // Scroll to form?
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleCancelEdit = () => {
        setEditingEventId(null)
        setFormData({ title: '', description: '', event_type: '', pax_count: '', duration_hours: '', event_date: '' })
        setSelectedFile(null)
        setCurrentImageUrl(null)
    }

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este evento permanentemente?')) return

        const { error } = await supabase
            .from('restaurant_events')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Error eliminando evento')
        } else {
            setEvents(events.filter(e => e.id !== id))
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulario de Creación */}
            <div className="bg-[#1a1a1a]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 h-fit">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-[#F5F5F5]">
                    <Calendar className="text-[#FFB800]" size={20} />
                    Nuevo Evento
                </h3>

                <form onSubmit={handleSaveEvent} className="space-y-4">
                    <div>
                        <label className="block text-xs text-[#888] mb-1 uppercase tracking-wider font-bold">Título del Evento</label>
                        <input
                            required
                            className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg p-3 text-white focus:border-[#FFB800] outline-none transition-colors"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ej. Noche de Jazz & Vino"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-[#888] mb-1 uppercase tracking-wider font-bold">Descripción</label>
                        <textarea
                            required
                            className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg p-3 text-white focus:border-[#FFB800] outline-none h-24 resize-none transition-colors"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalles del evento..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-[#888] mb-1 uppercase tracking-wider font-bold">Tipo</label>
                            <select
                                required
                                className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg p-3 text-white focus:border-[#FFB800] outline-none transition-colors"
                                value={formData.event_type}
                                onChange={e => setFormData({ ...formData, event_type: e.target.value })}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Social">Social</option>
                                <option value="Corporativo">Corporativo</option>
                                <option value="Temático">Temático</option>
                                <option value="Privado">Privado</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs text-[#888] mb-1 uppercase tracking-wider font-bold">Capacidad (Pax)</label>
                            <input
                                required
                                type="number"
                                className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg p-3 text-white focus:border-[#FFB800] outline-none transition-colors"
                                value={formData.pax_count}
                                onChange={e => setFormData({ ...formData, pax_count: e.target.value })}
                                placeholder="Ej. 50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-[#888] mb-1 uppercase tracking-wider font-bold">Duración (Horas)</label>
                        <input
                            required
                            type="number"
                            step="0.5"
                            className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg p-3 text-white focus:border-[#FFB800] outline-none transition-colors"
                            value={formData.duration_hours}
                            onChange={e => setFormData({ ...formData, duration_hours: e.target.value })}
                            placeholder="Ej. 4"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-[#888] mb-1 uppercase tracking-wider font-bold">Multimedia (Opcional)</label>

                        {/* Show current image if editing */}
                        {editingEventId && currentImageUrl && !selectedFile && (
                            <div className="mb-2 relative w-full h-32 bg-black rounded-lg overflow-hidden border border-white/10 group">
                                <img src={currentImageUrl} className="w-full h-full object-cover opacity-60" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">Imagen Actual</span>
                                </div>
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/gif, video/mp4"
                            onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                            className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg p-3 text-white focus:border-[#FFB800] outline-none file:bg-[#333] file:text-white file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-2 file:text-xs transition-colors"
                        />
                        <p className="text-[10px] text-[#666] mt-1">Soporta Imágenes, GIFs y Video MP4.</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            disabled={isSubmitting}
                            className="flex-1 bg-[#FFB800] text-black font-bold py-3 rounded-xl hover:bg-white transition-colors uppercase tracking-wide text-sm"
                        >
                            {isSubmitting ? 'Guardando...' : (editingEventId ? 'Actualizar Evento' : 'Publicar Evento')}
                        </button>

                        {editingEventId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-4 py-3 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Lista de Eventos */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg mb-2 text-[#888]">Eventos Activos</h3>

                {events.length === 0 && (
                    <div className="text-center py-10 border border-dashed border-[#333] rounded-xl bg-[#0D0D0D]">
                        <p className="text-[#666]">No hay eventos publicados.</p>
                    </div>
                )}

                {events.map((event) => (
                    <div key={event.id} className="bg-[#1a1a1a]/60 border border-white/5 rounded-2xl p-5 relative group hover:border-[#FFB800]/30 transition-colors">
                        <div className="absolute top-4 right-4 flex gap-2 z-10">
                            <button
                                onClick={() => handleEditEvent(event)}
                                className="text-[#FFB800] bg-[#FFB800]/10 p-2 rounded-lg hover:bg-[#FFB800]/20 transition"
                                title="Editar Evento"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="text-red-500 bg-red-500/10 p-2 rounded-lg hover:bg-red-500/20 transition"
                                title="Eliminar Evento"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="flex justify-between items-start mb-2 pr-20">
                            <h4 className="font-bold text-lg text-[#F5F5F5]">{event.title}</h4>
                            <span className="text-[10px] bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20 px-2 py-1 rounded uppercase tracking-wider font-bold">
                                {event.event_type}
                            </span>
                        </div>

                        <p className="text-sm text-[#888] mb-4 line-clamp-2">{event.description}</p>

                        {event.image_url && (
                            <div className="mb-4">
                                <span className="text-[10px] text-[#FFB800] border border-[#FFB800]/30 px-2 py-0.5 rounded uppercase tracking-wider">Multimedia Adjunto</span>
                            </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-[#666] font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1">
                                <Users size={14} /> {event.pax_count} Pax
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={14} /> {event.duration_hours} Hrs
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div >
    )
}
