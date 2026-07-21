import React, { useState, useEffect } from 'react';
import type { EventPoster } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const EventPosterManager: React.FC = () => {
    const [posters, setPosters] = useState<EventPoster[]>([]);
    const [title, setTitle] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const savedPosters = localStorage.getItem('eventPosters');
            if (savedPosters && savedPosters !== 'undefined') {
                setPosters(JSON.parse(savedPosters));
            }
        } catch (e) {
            console.error("Failed to load event posters from localStorage", e);
            localStorage.removeItem('eventPosters');
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError("La imagen no puede superar los 2MB.");
                return;
            }
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleAddPoster = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !eventDate || !imageFile) {
            setError("Todos los campos son obligatorios.");
            return;
        }

        try {
            const imageUrl = await fileToBase64(imageFile);
            const newPoster: EventPoster = {
                id: `poster_${Date.now()}`,
                title,
                imageUrl,
                eventDate,
                createdAt: new Date().toISOString(),
            };
            const updatedPosters = [...posters, newPoster].sort((a,b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
            setPosters(updatedPosters);
            localStorage.setItem('eventPosters', JSON.stringify(updatedPosters));
            
            // Reset form
            setTitle('');
            setEventDate('');
            setImageFile(null);
            setPreviewUrl(null);
            setError(null);
            if (e.target instanceof HTMLFormElement) e.target.reset();

        } catch (err) {
            setError("Error al procesar la imagen. Inténtelo de nuevo.");
            console.error(err);
        }
    };
    
    const handleDeletePoster = (id: string) => {
        if(window.confirm("¿Estás seguro de que quieres eliminar este póster?")) {
            const updatedPosters = posters.filter(p => p.id !== id);
            setPosters(updatedPosters);
            localStorage.setItem('eventPosters', JSON.stringify(updatedPosters));
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Añadir Nuevo Póster</h3>
                <form onSubmit={handleAddPoster} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagen del Póster</label>
                        <input type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                        {previewUrl && <img src={previewUrl} alt="Vista previa" className="mt-4 w-full h-auto rounded-lg object-cover" />}
                    </div>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título del Evento</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100" required />
                    </div>
                     <div>
                        <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha del Evento</label>
                        <input type="date" id="eventDate" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100" required />
                    </div>
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <button type="submit" className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors">Publicar Póster</button>
                </form>
            </div>
             <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Portal de Eventos Publicados ({posters.length})</h3>
                {posters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-2">
                        {posters.map(poster => (
                            <div key={poster.id} className="bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
                                <img src={poster.imageUrl} alt={poster.title} className="w-full h-48 object-cover"/>
                                <div className="p-4 flex-grow">
                                    <h4 className="font-bold text-gray-800 dark:text-gray-100">{poster.title}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">Fecha: {new Date(poster.eventDate + 'T00:00:00').toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <div className="p-2 bg-gray-100 dark:bg-gray-700/50 border-t dark:border-gray-700 text-right">
                                    <button onClick={() => handleDeletePoster(poster.id)} className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold">Eliminar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-16">No hay pósteres publicados. Añade uno para empezar.</p>
                )}
            </div>
        </div>
    );
};

export default EventPosterManager;