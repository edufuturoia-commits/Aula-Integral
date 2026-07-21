import React, { useState, useEffect, useRef } from 'react';
import InteractiveManual, { Scenario } from './InteractiveManual';

type SummaryContent = {
    misionVision: string;
    derechosDeberes: string;
    manualConvivencia: string | Scenario[]; // Can be text or interactive scenarios
    proyectosPedagogicos: string;
    evaluacion: string;
    comunidad: string;
};
type SectionId = keyof SummaryContent;

const NAV_ITEMS: { id: SectionId; label: string }[] = [
    { id: 'misionVision', label: 'Misión y Visión' },
    { id: 'derechosDeberes', label: 'Derechos y Deberes' },
    { id: 'manualConvivencia', label: 'Manual de Convivencia' },
    { id: 'proyectosPedagogicos', label: 'Proyectos Pedagógicos' },
    { id: 'evaluacion', label: 'Sistema de Evaluación' },
    { id: 'comunidad', label: 'Participación de la Comunidad' },
];


const ManualViewer: React.FC = () => {
    const [activeNav, setActiveNav] = useState<SectionId>('misionVision');
    const [summaryContent, setSummaryContent] = useState<SummaryContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const sectionRefs = NAV_ITEMS.reduce((acc, item) => {
        acc[item.id] = useRef<HTMLElement>(null);
        return acc;
    }, {} as Record<SectionId, React.RefObject<HTMLElement>>);

    useEffect(() => {
        try {
            const savedSummary = localStorage.getItem('peiSummaryContent');
            if (savedSummary && savedSummary !== 'undefined') {
                setSummaryContent(JSON.parse(savedSummary));
            }
        } catch (error) {
            console.error("Failed to load PEI summary from localStorage", error);
            localStorage.removeItem('peiSummaryContent');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: SectionId) => {
        e.preventDefault();
        setActiveNav(sectionId);
        sectionRefs[sectionId].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (isLoading) {
        return <p>Cargando manual...</p>
    }

    if (!summaryContent) {
        return (
            <div className="text-center py-16 px-8 bg-white rounded-lg shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="mt-2 text-xl font-semibold text-gray-700">Manual Escolar no Disponible</h2>
                <p className="mt-1 text-gray-500">El documento del PEI aún no ha sido procesado por la administración. Por favor, intente más tarde.</p>
            </div>
        );
    }

    return (
        <div className="summary-container grid grid-cols-1 md:grid-cols-4 gap-6 bg-white p-6 rounded-xl shadow-md">
            <div className="summary-nav md:col-span-1">
                <div className="sticky top-24">
                    <h3 className="text-lg font-bold mb-3">Secciones del Manual</h3>
                    <ul className="nav-list space-y-2">
                        {NAV_ITEMS.map(item => (
                            <li key={item.id}>
                                <a href={`#${item.id}`} onClick={(e) => handleNavClick(e, item.id)} className={`block p-3 rounded-md text-sm font-medium transition-colors ${activeNav === item.id ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            
            <div className="summary-content md:col-span-3 space-y-8">
                {NAV_ITEMS.map(item => (
                    <section key={item.id} id={item.id} ref={sectionRefs[item.id]}>
                        <h3 className="text-xl font-bold text-primary border-b-2 border-primary-focus/30 pb-2 mb-4">{item.label}</h3>
                        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                            {item.id === 'manualConvivencia' && Array.isArray(summaryContent.manualConvivencia) ? (
                                <InteractiveManual scenarios={summaryContent.manualConvivencia} />
                            ) : (
                                <p>{summaryContent[item.id] as string}</p>
                            )}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    )
}

export default ManualViewer;