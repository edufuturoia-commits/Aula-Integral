
import React, { useState, useMemo } from 'react';
import { SUBJECT_AREAS, RESOURCE_TYPES } from '../constants';
import type { Resource, ResourceType } from '../types';
import { addResource, removeResource } from '../db';
import ResourceCreator from '../components/ResourceCreator';

interface ResourcesProps {
    resources: Resource[];
    downloadedIds: Set<string>;
    onUpdate: () => void;
}

const ICONS: Record<ResourceType, JSX.Element> = {
    PDF: <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 11-2 0V4h-3v9a1 1 0 11-2 0V4H6v12a1 1 0 11-2 0V4zm4-2a1 1 0 00-1 1v1h2V3a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
    Video: <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14.553 1.398l-3.267 3.267c-.24.24-.24.63 0 .87l3.267 3.267A.5.5 0 0018 13.5V6.5a.5.5 0 00-.447-.498z" /></svg>,
    Imagen: <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>,
    Documento: <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>,
};

const ResourceCard: React.FC<{
    resource: Resource;
    isDownloaded: boolean;
    onDownload: (res: Resource) => void;
    onDelete: (id: string) => void;
    onView: (res: Resource) => void;
}> = ({ resource, isDownloaded, onDownload, onDelete, onView }) => {
    const isAiGenerated = !!resource.content;

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col overflow-hidden">
            <div className={`h-24 w-full flex items-center justify-center p-6 ${
                resource.type === 'PDF' ? 'bg-red-100 text-red-600' :
                resource.type === 'Video' ? 'bg-blue-100 text-blue-600' :
                resource.type === 'Imagen' ? 'bg-purple-100 text-purple-600' :
                'bg-yellow-100 text-yellow-700'
            }`}>
                {ICONS[resource.type]}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-gray-800 truncate">{resource.title}</h3>
                <p className="text-xs text-gray-500 mb-2">{resource.subjectArea}</p>
                <p className="text-sm text-gray-600 flex-grow">{resource.description}</p>
                 {isDownloaded && !isAiGenerated && (
                    <div className="mt-3 flex items-center text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full w-fit">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        Disponible offline
                    </div>
                )}
                 {(isAiGenerated || (isDownloaded && resource.content)) && (
                    <div className="mt-3 flex items-center text-xs text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full w-fit">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        Generado con IA
                    </div>
                )}
            </div>
            <div className="p-4 bg-gray-50 border-t">
                {isAiGenerated ? (
                     <button onClick={() => onView(resource)} className="w-full bg-secondary text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors text-sm">
                        Ver Contenido
                    </button>
                ) : isDownloaded ? (
                    <button onClick={() => onDelete(resource.id)} className="w-full bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm">
                        Eliminar de Descargas
                    </button>
                ) : (
                    <button onClick={() => onDownload(resource)} className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors text-sm">
                        Descargar
                    </button>
                )}
            </div>
        </div>
    );
};


const ResourceViewerModal: React.FC<{ resource: Resource; onClose: () => void }> = ({ resource, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex-shrink-0">{resource.title}</h2>
            <div className="prose max-w-none overflow-y-auto p-4 bg-gray-50 rounded-md border">
                <p className="text-sm italic text-gray-600 mb-4">{resource.description}</p>
                <div dangerouslySetInnerHTML={{ __html: resource.content?.replace(/\n/g, '<br />') ?? '' }} />
            </div>
            <div className="text-right mt-6 flex-shrink-0">
                <button onClick={onClose} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">Cerrar</button>
            </div>
        </div>
    </div>
);


const Resources: React.FC<ResourcesProps> = ({ resources, downloadedIds, onUpdate }) => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [areaFilter, setAreaFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [showOnlyDownloaded, setShowOnlyDownloaded] = useState(false);
    const [viewingResource, setViewingResource] = useState<Resource | null>(null);

    const handleDownload = async (resource: Resource) => {
        await addResource(resource);
        onUpdate();
    };

    const handleDelete = async (resourceId: string) => {
        await removeResource(resourceId);
        onUpdate();
    };
    
    const handleSaveResource = async (newResource: Resource) => {
        await addResource(newResource);
        onUpdate();
        
        setView('list');
        setSearchQuery('');
        setAreaFilter('all');
        setTypeFilter('all');
        setShowOnlyDownloaded(false);
    };
    
    const filteredResources = useMemo(() => {
        return resources.filter(res => {
            const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesArea = areaFilter === 'all' || res.subjectArea === areaFilter;
            const matchesType = typeFilter === 'all' || res.type === typeFilter;
            const matchesDownloaded = !showOnlyDownloaded || downloadedIds.has(res.id) || !!res.content;
            return matchesSearch && matchesArea && matchesType && matchesDownloaded;
        });
    }, [searchQuery, areaFilter, typeFilter, showOnlyDownloaded, downloadedIds, resources]);

    if (view === 'create') {
        return <ResourceCreator onSave={handleSaveResource} onCancel={() => setView('list')} />;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-md space-y-4">
                 <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Biblioteca de Recursos</h1>
                    <button
                        onClick={() => setView('create')}
                        className="bg-accent text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        <span>Generar Recurso con IA</span>
                    </button>
                </div>
                <hr />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Buscar por título..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent md:col-span-1 bg-white text-gray-900 placeholder-gray-500"
                    />
                    <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                        <option value="all">Todas las Áreas</option>
                        {SUBJECT_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                    </select>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                        <option value="all">Todos los Tipos</option>
                        {RESOURCE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div className="flex items-center justify-end">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={showOnlyDownloaded} onChange={() => setShowOnlyDownloaded(!showOnlyDownloaded)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                        <span className="ml-2 text-sm font-medium text-gray-700">Mostrar solo descargados</span>
                    </label>
                </div>
            </div>

            {filteredResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredResources.map(res => (
                        <ResourceCard
                            key={res.id}
                            resource={res}
                            isDownloaded={downloadedIds.has(res.id) || !!res.content}
                            onDownload={handleDownload}
                            onDelete={handleDelete}
                            onView={setViewingResource}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-8 bg-white rounded-lg shadow-sm border border-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    <h2 className="mt-2 text-xl font-semibold text-gray-700">No se encontraron recursos</h2>
                    <p className="mt-1 text-gray-500">Intenta ajustar tus filtros de búsqueda o revisa los recursos descargados.</p>
                </div>
            )}
            
            {viewingResource && <ResourceViewerModal resource={viewingResource} onClose={() => setViewingResource(null)} />}
        </div>
    );
};

export default Resources;