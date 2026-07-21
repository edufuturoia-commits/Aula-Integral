import React, { useState, useEffect } from 'react';
import type { EventPoster } from '../types';

const EventPostersViewer: React.FC = () => {
    const [posters, setPosters] = useState<EventPoster[]>([]);
    const [selectedPoster, setSelectedPoster] = useState<EventPoster | null>(null);

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

    return (
         <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Próximos Eventos</h1>
            {posters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posters.map(poster => (
                        <div 
                            key={poster.id} 
                            onClick={() => setSelectedPoster(poster)}
                            className="bg-white border rounded-xl shadow-lg overflow-hidden flex flex-col transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer"
                        >
                            <img src={poster.imageUrl} alt={poster.title} className="w-full h-56 object-cover"/>
                            <div className="p-6 flex-grow flex flex-col">
                                <h2 className="text-xl font-bold text-gray-800 flex-grow">{poster.title}</h2>
                                <p className="mt-4 text-primary font-semibold">
                                    {new Date(poster.eventDate + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 px-8 bg-white rounded-lg shadow-md border border-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h2 className="mt-2 text-xl font-semibold text-gray-700">No hay eventos programados</h2>
                    <p className="mt-1 text-gray-500">Revisa más tarde para ver los próximos eventos de la institución.</p>
                </div>
            )}
            
            {selectedPoster && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in"
                    onClick={() => setSelectedPoster(null)}
                >
                    <div 
                        className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-auto flex flex-col max-h-[90vh] animate-zoom-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <img src={selectedPoster.imageUrl} alt={selectedPoster.title} className="w-full rounded-t-lg object-contain" style={{ maxHeight: 'calc(90vh - 100px)' }}/>
                        <div className="p-6 text-center">
                            <h2 className="text-2xl font-bold text-gray-800">{selectedPoster.title}</h2>
                            <p className="mt-2 text-primary font-semibold">
                                {new Date(selectedPoster.eventDate + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedPoster(null)}
                        className="absolute top-4 right-4 bg-white/70 text-black rounded-full p-2 hover:bg-white transition-colors"
                        aria-label="Cerrar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default EventPostersViewer;