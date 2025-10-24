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

const AssessmentCreator: React.FC<AssessmentCreatorProps> = ({ onSave, onCancel }) => {
    const [step, setStep] = useState(1);
    
    // Step 1 state
    const [title, setTitle] = useState('');
    const [area, setArea] = useState<SubjectArea>(SUBJECT_AREAS[0]);
    const [grade, setGrade] = useState(GRADES[5]); // Default to 6th grade
    const [competency, setCompetency] = useState<Competency>(COMPETENCIES[0]);
    const [numQuestions, setNumQuestions] = useState(5);
    const [topic, setTopic] = useState('');
    
    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    // Step 2 state
    const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

    const handleGenerate = async () => {
        if (!topic.trim() || !title.trim()) {
            setGenerationError("Por favor, especifica un título y un tema para la evaluación.");
            return;
        }
        setIsGenerating(true);
        setGenerationError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const prompt = `Genera ${numQuestions} preguntas de evaluación tipo ICFES para estudiantes de '${grade}'. El tema es '${topic}', enfocado en la competencia de '${competency}' del área de '${area}'. Cada pregunta debe tener un enunciado claro, seguido de 4 opciones de respuesta (A, B, C, D), y debes indicar cuál es la respuesta correcta. La dificultad debe ser apropiada para el grado escolar. Devuelve el resultado como un array JSON de objetos.`;
            
            const responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING, description: "El texto principal de la pregunta." },
                        options: {
                            type: Type.ARRAY,
                            description: "Un array de 4 strings con las opciones de respuesta.",
                            items: { type: Type.STRING },
                            minItems: 4,
                            maxItems: 4
                        },
                        correctAnswer: { type: Type.INTEGER, description: "El índice (0-3) de la respuesta correcta en el array de opciones." }
                    },
                    required: ["text", "options", "correctAnswer"]
                }
            };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                },
            });
            
            const responseText = response.text.trim();
            if (!responseText || responseText === 'undefined') {
                throw new Error("La IA no devolvió un resultado válido. Por favor, intenta de nuevo.");
            }
            const results = JSON.parse(responseText) as { text: string; options: string[]; correctAnswer: number }[];

            const questions: Question[] = results.map((q, index) => ({
                id: `q_${Date.now()}_${index}`,
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer,
                area,
                grade,
                competency,
            }));

            setGeneratedQuestions(questions);
            setStep(2);

        } catch (error) {
            console.error("Error generating assessment:", error);
            setGenerationError("Hubo un error al contactar la IA. Por favor, revisa la consola para más detalles e intenta de nuevo.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSave = () => {
        const newAssessment: Assessment = {
            id: `asm_${Date.now()}`,
            title,
            createdAt: new Date().toISOString(),
            questions: generatedQuestions,
        };
        onSave(newAssessment);
    };

    const handleDownloadPdf = () => {
        const questionsHtml = generatedQuestions.map((q, index) => `
            <div class="question">
                <p><strong>${index + 1}.</strong> ${q.text}</p>
                <ol type="A">
                    ${q.options?.map(opt => `<li>${opt}</li>`).join('') || ''}
                </ol>
            </div>
        `).join('');

        const answerKeyHtml = `
            <h2>Hoja de Respuestas (Para el Docente)</h2>
            <ol>
                ${generatedQuestions.map(q => `<li>${String.fromCharCode(65 + (q.correctAnswer ?? 0))}</li>`).join('')}
            </ol>
        `;

        const htmlContent = `
            <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:sans-serif;line-height:1.6;margin:40px}h1{color:#005A9C;border-bottom:2px solid #ddd;padding-bottom:10px} .header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #ddd;padding-bottom:15px;margin-bottom:20px}.info-field{border-bottom:1px solid #333;padding:2px 5px;min-width:200px}.question{margin-bottom:20px}ol{list-style-position:inside;padding-left:0}ol li{margin-bottom:8px}.page-break{page-break-after:always}@media print{.no-print{display:none}}</style></head><body><div class="no-print" style="background-color:#fffae6;border:1px solid #ffecb3;padding:15px;border-radius:5px;"><strong>Instrucción:</strong> Para guardar como PDF, use la función de Imprimir de su navegador (Ctrl+P o Cmd+P) y seleccione "Guardar como PDF" como destino.</div><h1>${title}</h1><div class="header"><p><strong>Nombre:</strong><span class="info-field"></span></p><p><strong>Fecha:</strong><span class="info-field"></span></p><p><strong>Grado:</strong><span class="info-field"></span></p></div><div>${questionsHtml}</div><div class="page-break"></div><div class="no-print">${answerKeyHtml}</div></body></html>`;

        const pdfWindow = window.open("", "_blank");
        pdfWindow?.document.write(htmlContent);
        pdfWindow?.document.close();
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Creador de Evaluaciones con IA</h2>
            
            {step === 1 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Paso 1: Define los Parámetros</h3>
                    <div className="space-y-4">
                         <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Título de la Evaluación (Ej: Examen de Biología Celular)"/>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select value={area} onChange={e => setArea(e.target.value as SubjectArea)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                {SUBJECT_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                             <select value={competency} onChange={e => setCompetency(e.target.value as Competency)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                {COMPETENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="md:col-span-2 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Tema Específico (Ej: La Célula y sus Partes)"/>
                            <div>
                                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Nº de Preguntas</label>
                                <input type="number" value={numQuestions} onChange={e => setNumQuestions(Math.max(1, parseInt(e.target.value, 10)))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
                            </div>
                        </div>
                    </div>
                    {generationError && <p className="text-red-600 text-center my-4">{generationError}</p>}
                    <div className="flex justify-end mt-6">
                        <button onClick={handleGenerate} disabled={isGenerating} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors flex items-center justify-center min-w-[180px] disabled:bg-gray-400">
                            {isGenerating ? <><Spinner /> Generando...</> : 'Generar Preguntas'}
                        </button>
                    </div>
                </div>
            )}
            
            {step === 2 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Paso 2: Revisa la Evaluación Generada</h3>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 border dark:border-gray-700 rounded-lg p-4">
                        {generatedQuestions.map((q, index) => (
                            <div key={q.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{index + 1}. {q.text}</p>
                                <ul className="mt-2 space-y-1 pl-4">
                                    {q.options?.map((opt, optIndex) => (
                                        <li key={optIndex} className={`text-sm ${optIndex === q.correctAnswer ? 'text-green-700 dark:text-green-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {String.fromCharCode(65 + optIndex)}. {opt} {optIndex === q.correctAnswer && '(Correcta)'}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center mt-6">
                        <button onClick={() => setStep(1)} className="px-6 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Atrás</button>
                        <div>
                             <button onClick={handleDownloadPdf} className="mr-4 px-6 py-2 rounded-md text-primary dark:text-blue-200 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/80 transition-colors">Descargar PDF</button>
                             <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors">Guardar Evaluación</button>
                        </div>
                    </div>
                </div>
            )}

            <button onClick={onCancel} className="mt-8 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                Cancelar y volver
            </button>
        </div>
    );
};

export default AssessmentCreator;