import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import InteractiveManual, { Scenario } from './InteractiveManual';

// Define the shape of the summary content object
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

// Helper functions for file processing
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            if (!result) return reject(new Error("File could not be read."));
            const parts = result.split(',');
            if (parts.length === 2) resolve(parts[1]);
            else reject(new Error("Invalid file format for base64 conversion."));
        };
        reader.onerror = error => reject(error);
    });
};

const fileToGenerativePart = async (file: File) => {
    const base64Data = await fileToBase64(file);
    return {
        inlineData: { data: base64Data, mimeType: 'application/pdf' },
    };
};

// Spinner Component
const Spinner: React.FC = () => (
    <div className="flex justify-center items-center py-10">
        <svg className="animate-spin h-10 w-10 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-4 text-gray-700">Analizando documento, por favor espera...</p>
    </div>
);


const PEISummary: React.FC = () => {
    const [activeNav, setActiveNav] = useState<SectionId>('misionVision');
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summaryContent, setSummaryContent] = useState<SummaryContent | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const sectionRefs = NAV_ITEMS.reduce((acc, item) => {
        acc[item.id] = useRef<HTMLElement>(null);
        return acc;
    }, {} as Record<SectionId, React.RefObject<HTMLElement>>);

    // Load summary from localStorage on initial mount
    useEffect(() => {
        try {
            const savedSummary = localStorage.getItem('peiSummaryContent');
            if (savedSummary) {
                setSummaryContent(JSON.parse(savedSummary));
            }
        } catch (error) {
            console.error("Failed to load PEI summary from localStorage", error);
            // Clear corrupted data
            localStorage.removeItem('peiSummaryContent');
        }
    }, []);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: SectionId) => {
        e.preventDefault();
        setActiveNav(sectionId);
        sectionRefs[sectionId].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const allowedExtensions = /(\.pdf)$/i;
            if (!allowedExtensions.exec(selectedFile.name)) {
                setError('Formato de archivo no soportado. Por favor, sube un archivo PDF (.pdf).');
                setFile(null);
                if(e.target) e.target.value = ''; // Reset file input
                return;
            }
            setFile(selectedFile);
            setError(null);
            setSummaryContent(null); // Reset summary when new file is chosen
        }
    };
    
    const handleGenerateSummary = async () => {
        if (!file) {
            setError("Por favor, selecciona un archivo primero.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSummaryContent(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const prompt = `Analiza el siguiente documento institucional (PEI). Tu tarea es doble:
            1. Para las secciones 'Misión y Visión', 'Derechos y Deberes', 'Proyectos Pedagógicos', 'Sistema de Evaluación', y 'Participación de la Comunidad', extrae un resumen conciso y claro.
            2. Para la sección 'Manual de Convivencia', en lugar de un resumen, crea una serie de al menos 4 escenarios interactivos en formato de quiz para evaluar la comprensión del manual. Cada escenario debe presentar una situación común y preguntar cuál es el procedimiento correcto.
            
            Devuelve el resultado como un único objeto JSON.`;
            
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    misionVision: { type: Type.STRING, description: 'Resumen de la Misión y Visión.' },
                    derechosDeberes: { type: Type.STRING, description: 'Resumen de los Derechos y Deberes.' },
                    manualConvivencia: { 
                        type: Type.ARRAY,
                        description: 'Un quiz interactivo basado en el manual de convivencia.',
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                scenario: { type: Type.STRING, description: 'La situación o pregunta del quiz.' },
                                options: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Un array de 4 posibles respuestas en string.' },
                                correctAnswerIndex: { type: Type.INTEGER, description: 'El índice (0-3) de la respuesta correcta en el array de opciones.' },
                                explanation: { type: Type.STRING, description: 'Una breve explicación de por qué la respuesta es correcta según el manual.'}
                            },
                             required: ["scenario", "options", "correctAnswerIndex", "explanation"]
                        }
                    },
                    proyectosPedagogicos: { type: Type.STRING, description: 'Resumen de los Proyectos Pedagógicos.' },
                    evaluacion: { type: Type.STRING, description: 'Resumen del Sistema de Evaluación.' },
                    comunidad: { type: Type.STRING, description: 'Resumen sobre la Participación de la Comunidad.' },
                },
                required: ['misionVision', 'derechosDeberes', 'manualConvivencia', 'proyectosPedagogicos', 'evaluacion', 'comunidad']
            };

            const filePart = await fileToGenerativePart(file);

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts: [{ text: prompt }, filePart] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema
                },
            });
            
            const result = JSON.parse(response.text);
            setSummaryContent(result);
            // Save to localStorage for other portals to access
            localStorage.setItem('peiSummaryContent', JSON.stringify(result));

        } catch (e: any) {
            console.error("Error generating summary:", e);
            const errorMessage = e.message || JSON.stringify(e);
            setError(`Ocurrió un error al analizar el documento. Esto puede suceder con archivos muy complejos o formatos no estándar. Intente con un PDF más simple. Error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (!summaryContent) return; // Don't attach listener if there's no content to scroll to

        const handleScroll = () => {
            const scrollPosition = window.scrollY + 120; // offset for better accuracy
            
            for (const { id } of NAV_ITEMS) {
                const element = sectionRefs[id].current;
                if (element && scrollPosition >= element.offsetTop && scrollPosition < element.offsetTop + element.offsetHeight) {
                    setActiveNav(id);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sectionRefs, summaryContent]);


    return (
        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf"/>
            
            <div className="upload-section bg-gray-50 p-6 rounded-lg text-center border-2 border-dashed">
                <h2 className="text-xl font-bold text-gray-800">Resumen Interactivo del PEI</h2>
                <p className="text-gray-600 mt-2 mb-4">Sube el PEI u otro documento institucional para generar un resumen interactivo con IA.</p>
                <div className="flex justify-center items-center gap-4 flex-wrap">
                    <button onClick={() => fileInputRef.current?.click()} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                            <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                        </svg>
                        <span>{file ? 'Cambiar archivo' : 'Seleccionar archivo'}</span>
                    </button>
                    {file && (
                        <button onClick={handleGenerateSummary} disabled={isLoading} className="bg-accent text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400">
                            {isLoading ? 'Generando...' : 'Generar Resumen con IA'}
                        </button>
                    )}
                </div>
                 {file && <p className="text-sm text-gray-500 mt-3">Archivo seleccionado: <strong>{file.name}</strong></p>}
            </div>

            {error && <p className="text-center text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
            
            {isLoading && <Spinner />}

            {summaryContent && (
                <div className="summary-container grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="summary-nav md:col-span-1">
                        <div className="sticky top-24">
                            <h3 className="text-lg font-bold mb-3">Navegación</h3>
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
            )}
            
            {!summaryContent && !isLoading && !error && (
                 <div className="text-center py-16 px-8 bg-white rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h2 className="mt-2 text-xl font-semibold text-gray-700">Esperando documento</h2>
                    <p className="mt-1 text-gray-500">Sube un documento y haz clic en "Generar Resumen con IA" para comenzar.</p>
                </div>
            )}
        </div>
    );
};

export default PEISummary;
