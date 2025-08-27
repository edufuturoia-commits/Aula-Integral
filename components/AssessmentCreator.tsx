

import React, { useState } from 'react';
import type { Assessment, Question, SubjectArea, Competency } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { SUBJECT_AREAS, GRADES, COMPETENCIES } from '../constants';

interface AssessmentCreatorProps {
    onSave: (assessment: Assessment) => void;
    onCancel: () => void;
}

const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const generatePdfContent = (title: string, questions: Question[]) => {
    const questionsHtml = questions.map((q, index) => `
        <div class="question">
            <p><strong>${index + 1}. (${q.competency})</strong></p>
            <p>${q.text}</p>
            <div class="answer-space"></div>
        </div>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 800px; margin: 40px auto; padding: 20px; }
                h1 { color: #005A9C; border-bottom: 2px solid #005A9C; padding-bottom: 10px; }
                h2 { color: #DA291C; }
                .question { margin-bottom: 20px; }
                .answer-space { height: 100px; border-bottom: 1px dashed #ccc; margin-top: 10px; }
                @media print { .no-print { display: none; } body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="container">
                <p class="no-print" style="background-color: #fffae6; border: 1px solid #ffecb3; padding: 15px; border-radius: 5px;">
                    <strong>Instrucción:</strong> Para guardar como PDF, use la función de Imprimir de su navegador (Ctrl+P o Cmd+P) y seleccione "Guardar como PDF" como destino.
                </p>
                <h1>${title}</h1>
                <h2>Nombre del Estudiante: _________________________________________</h2>
                <h2>Fecha: _________________</h2>
                <hr style="margin: 20px 0;" />
                ${questionsHtml}
            </div>
        </body>
        </html>
    `;
};


const AssessmentCreator: React.FC<AssessmentCreatorProps> = ({ onSave, onCancel }) => {
    const [step, setStep] = useState(1);
    const [filters, setFilters] = useState({ area: SUBJECT_AREAS[0], grade: GRADES[0], competency: COMPETENCIES[0] });
    const [topic, setTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
    const [title, setTitle] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    const handleGenerateQuestions = async () => {
        if (!topic.trim()) {
            setGenerationError("Por favor, especifica un tema para las preguntas.");
            return;
        }
        setIsGenerating(true);
        setGenerationError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Genera ${numQuestions} preguntas para estudiantes de '${filters.grade}' en el área de '${filters.area}'. El tema específico es '${topic}'. Las preguntas deben ser diseñadas para evaluar la competencia de '${filters.competency}'. Las preguntas deben ser claras, concisas y apropiadas para el nivel de grado especificado. No incluyas las respuestas. Devuelve el resultado como un array JSON de objetos. Cada objeto debe tener una única propiedad 'text' que contenga el enunciado de la pregunta como un string.`;
            
            const responseSchema = {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: 'El enunciado completo de la pregunta.' },
                },
                required: ['text'],
              },
            };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                },
            });
            
            const results = JSON.parse(response.text) as { text: string }[];
            const newQuestions: Question[] = results.map((item, index) => ({
                id: `q_${Date.now()}_${index}`,
                text: item.text,
                area: filters.area as SubjectArea,
                grade: filters.grade,
                competency: filters.competency as Competency,
            }));

            setGeneratedQuestions(newQuestions);
            setSelectedQuestionIds(new Set(newQuestions.map(q => q.id)));
            setStep(2);
        } catch (error) {
            console.error("Error generating questions:", error);
            setGenerationError("Hubo un error al contactar la IA. Por favor, revisa la consola para más detalles e intenta de nuevo.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleToggleQuestion = (questionId: string) => {
        setSelectedQuestionIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) newSet.delete(questionId);
            else newSet.add(questionId);
            return newSet;
        });
    };
    
    const handleSave = () => {
        if (!title.trim()) return;
        const newAssessment: Assessment = {
            id: `asm_${Date.now()}`,
            title,
            createdAt: new Date().toISOString(),
            questions: generatedQuestions.filter(q => selectedQuestionIds.has(q.id)),
        };
        onSave(newAssessment);
    };

    const handleDownloadPdf = () => {
         const assessmentTitle = title.trim() || "Evaluación Personalizada";
         const selectedQuestions = generatedQuestions.filter(q => selectedQuestionIds.has(q.id));
         const pdfContent = generatePdfContent(assessmentTitle, selectedQuestions);
         const pdfWindow = window.open("", "_blank");
         pdfWindow?.document.write(pdfContent);
         pdfWindow?.document.close();
    }
    
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Creador de Evaluaciones con IA</h2>
            
            {step === 1 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Paso 1: Define los Criterios</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <select name="area" value={filters.area} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                            {SUBJECT_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <select name="grade" value={filters.grade} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select name="competency" value={filters.competency} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                            {COMPETENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="md:col-span-2">
                             <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-500" placeholder="Tema específico (Ej: El ciclo del agua, La independencia)"/>
                        </div>
                        <div>
                             <input type="number" value={numQuestions} onChange={e => setNumQuestions(Math.max(1, parseInt(e.target.value, 10)))} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900" placeholder="N° de preguntas"/>
                        </div>
                    </div>
                    {generationError && <p className="text-red-600 text-center mb-4">{generationError}</p>}
                    <div className="text-right">
                        <button onClick={handleGenerateQuestions} disabled={isGenerating} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors flex items-center justify-center min-w-[180px] disabled:bg-gray-400">
                            {isGenerating ? <><Spinner /> Generando...</> : 'Generar Preguntas'}
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Paso 2: Revisa y Selecciona las Preguntas ({selectedQuestionIds.size} seleccionadas)</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto p-4 border rounded-md bg-gray-50 mb-6">
                        {generatedQuestions.map(q => (
                             <label key={q.id} className="flex items-start p-3 bg-white rounded-md shadow-sm cursor-pointer hover:bg-blue-50 transition-colors">
                                <input type="checkbox" checked={selectedQuestionIds.has(q.id)} onChange={() => handleToggleQuestion(q.id)} className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" />
                                <div className="ml-3 text-sm">
                                    <p className="font-medium text-gray-900">{q.text}</p>
                                    <p className="text-gray-500">{q.area} - {q.competency}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="flex justify-between">
                        <button onClick={() => setStep(1)} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Atrás</button>
                        <button onClick={() => setStep(3)} disabled={selectedQuestionIds.size === 0} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">Previsualizar</button>
                    </div>
                </div>
            )}
            
            {step === 3 && (
                 <div>
                    <h3 className="text-lg font-semibold mb-2">Paso 3: Previsualizar y Guardar</h3>
                     <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Título de la Evaluación</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-500" placeholder="Ej: Examen de Ciencias - Primer Trimestre" />
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto p-4 border rounded-md bg-gray-50 mb-6">
                        {generatedQuestions.filter(q => selectedQuestionIds.has(q.id)).map((q, i) => (
                             <div key={q.id} className="p-2">
                                <p className="font-semibold text-gray-800">{i+1}. {q.text}</p>
                                <p className="text-xs text-gray-500 pl-4">{q.competency}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center">
                        <button onClick={() => setStep(2)} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Atrás</button>
                        <div className="flex space-x-4">
                            <button onClick={handleDownloadPdf} disabled={selectedQuestionIds.size === 0} className="px-6 py-2 rounded-md text-primary border border-primary hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Descargar PDF</button>
                            <button onClick={handleSave} disabled={!title.trim()} className="px-6 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">Guardar Evaluación</button>
                        </div>
                    </div>
                </div>
            )}

            <button onClick={onCancel} className="mt-8 text-sm text-gray-500 hover:text-gray-800">
                Cancelar y volver a la lista
            </button>
        </div>
    );
};

export default AssessmentCreator;