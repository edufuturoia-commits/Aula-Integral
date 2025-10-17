import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { SUBJECT_AREAS, GRADES } from '../constants';
import type { SubjectArea } from '../types';

interface GeneratedQuestion {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

interface GeneratedContent {
    title: string;
    explanation: string;
    practiceQuestions: GeneratedQuestion[];
}

const Spinner: React.FC = () => (
    <div className="flex justify-center items-center">
        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-4 text-gray-700 dark:text-gray-300 font-semibold">Generando lección... Esto puede tomar un momento.</p>
    </div>
);

// Helper function to render markdown-like text to React elements
const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let unorderedListItems: string[] = [];
    let orderedListItems: string[] = [];
    let blockquoteLines: string[] = [];

    const flushUnorderedList = () => {
        if (unorderedListItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-2 mb-4 pl-4 text-justify">
                    {unorderedListItems.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            );
            unorderedListItems = [];
        }
    };
    
    const flushOrderedList = () => {
        if (orderedListItems.length > 0) {
            elements.push(
                <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-2 mb-4 pl-4 text-justify">
                    {orderedListItems.map((item, i) => <li key={i}>{item}</li>)}
                </ol>
            );
            orderedListItems = [];
        }
    };

    const flushBlockquote = () => {
        if (blockquoteLines.length > 0) {
            elements.push(
                <blockquote key={`bq-${elements.length}`} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-4">
                    {blockquoteLines.map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                </blockquote>
            );
            blockquoteLines = [];
        }
    };
    
    const flushAll = () => {
        flushUnorderedList();
        flushOrderedList();
        flushBlockquote();
    }

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('* ')) {
            flushOrderedList();
            flushBlockquote();
            unorderedListItems.push(trimmedLine.substring(2));
        } else if (trimmedLine.match(/^\d+\.\s/)) {
            flushUnorderedList();
            flushBlockquote();
            orderedListItems.push(trimmedLine.replace(/^\d+\.\s/, ''));
        } else if (trimmedLine.startsWith('> ')) {
            flushUnorderedList();
            flushOrderedList();
            blockquoteLines.push(trimmedLine.substring(2));
        }
        else {
            flushAll();
            if (trimmedLine.startsWith('## ')) {
                elements.push(<h2 key={index} className="text-xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">{trimmedLine.substring(3)}</h2>);
            } else if (trimmedLine.startsWith('# ')) {
                elements.push(<h1 key={index} className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{trimmedLine.substring(2)}</h1>);
            } else if (trimmedLine !== '') {
                elements.push(<p key={index} className="mb-4 text-justify">{trimmedLine}</p>);
            }
        }
    });

    flushAll(); // Flush any remaining lists/quotes at the end
    return elements;
};


const TutorMode: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [grade, setGrade] = useState(GRADES[5]); // Default to 6th grade
    const [subject, setSubject] = useState<SubjectArea>('Matemáticas');
    const [numQuestions, setNumQuestions] = useState(3);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | null>>({});

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError("Por favor, ingresa un tema para la lección.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedContent(null);
        setSelectedAnswers({});

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const prompt = `Actúa como un tutor experto y amigable para un estudiante de '${grade}'. El tema a explicar es '${topic}' en la materia de '${subject}'.

Tu tarea es generar una lección completa y bien estructurada. La lección debe ser fácil de entender, pedagógica y seguir un flujo lógico.

**Estructura de la lección:**
1.  **Título principal:** Un título para la lección.
2.  **Introducción:** Un párrafo breve que presente el tema y su importancia.
3.  **Desarrollo del contenido:**
    - Divide el tema en conceptos clave.
    - Explica cada concepto con párrafos claros y concisos.
    - Incluye ejemplos concretos donde sea relevante.
    - Utiliza listas con viñetas o numeradas para enumerar características, pasos o elementos importantes.
    - Cita o destaca información importante si es necesario.
4.  **Conclusión:** Un párrafo final que resuma los puntos más importantes.

**Preguntas de práctica:**
- Después de la lección, genera exactamente ${numQuestions} preguntas de práctica de opción múltiple (con 4 opciones cada una) para verificar la comprensión.
- Para cada pregunta, proporciona una explicación concisa de por qué la respuesta correcta es la correcta.

**Reglas de formato:**
- Para el campo 'explanation', utiliza una sintaxis similar a Markdown para estructurar el texto:
  - Títulos principales con '# '.
  - Subtítulos con '## '.
  - Listas con viñetas usando '* '.
  - Listas enumeradas usando '1. ', '2. ', etc.
  - Citas o texto destacado usando '> '.
- Asegúrate de que el texto sea claro, bien puntuado y fácil de leer.
- La salida final debe ser un único objeto JSON.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "El título principal de la lección." },
                    explanation: { type: Type.STRING, description: "La explicación detallada y estructurada del tema, usando la sintaxis de formato solicitada (títulos, subtítulos, listas, etc.). Debe incluir introducción, desarrollo y conclusión." },
                    practiceQuestions: {
                        type: Type.ARRAY,
                        description: `Un array con exactamente ${numQuestions} objetos de pregunta. No generes más ni menos de ${numQuestions} preguntas.`,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING, description: "El texto de la pregunta." },
                                options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4, description: "Un array de 4 strings con las opciones." },
                                correctAnswerIndex: { type: Type.INTEGER, description: "El índice (0-3) de la respuesta correcta." },
                                explanation: { type: Type.STRING, description: "La explicación de la respuesta correcta." }
                            },
                            required: ["question", "options", "correctAnswerIndex", "explanation"]
                        }
                    }
                },
                required: ["title", "explanation", "practiceQuestions"]
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
            const result = JSON.parse(responseText);
            setGeneratedContent(result);

        } catch (e) {
            console.error("Error generating lesson:", e);
            setError("Hubo un error al generar la lección. Por favor, intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
        setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
    };

    const handleDownloadPdf = () => {
        if (!generatedContent) return;

        const explanationHtml = generatedContent.explanation.split('\n').map(line => {
            line = line.trim();
            if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
            if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`;
            if (line.startsWith('* ')) return `<li>${line.substring(2)}</li>`;
            if (line === '') return '';
            return `<p>${line}</p>`;
        }).join('').replace(/<p><\/p><li>/g, '<ul><li>').replace(/<\/li><p><\/p>/g, '</li></ul>');


        const questionsHtml = generatedContent.practiceQuestions.map((q, index) => `
            <div class="question">
                <p><strong>${index + 1}.</strong> ${q.question}</p>
                <ol type="A">
                    ${q.options?.map(opt => `<li>${opt}</li>`).join('') || ''}
                </ol>
            </div>
        `).join('');
        
        const answerKeyHtml = `
            <h2>Hoja de Respuestas</h2>
            <ol>
                ${generatedContent.practiceQuestions.map(q => `<li>${String.fromCharCode(65 + (q.correctAnswerIndex ?? 0))}: ${q.explanation}</li>`).join('')}
            </ol>
        `;

        const htmlContent = `
            <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${generatedContent.title}</title><style>body{font-family:sans-serif;line-height:1.6;margin:40px}p{text-align:justify}h1{color:#005A9C;border-bottom:2px solid #ddd;padding-bottom:10px}h2{color:#333;margin-top:2em;border-bottom:1px solid #eee;padding-bottom:5px}ul{list-style-position:inside;padding-left:20px;margin-bottom:1em}.question{margin-bottom:20px}ol{list-style-position:inside;padding-left:0}ol li{margin-bottom:8px}.page-break{page-break-after:always}@media print{.no-print{display:none}}</style></head><body><div class="no-print" style="background-color:#fffae6;border:1px solid #ffecb3;padding:15px;border-radius:5px;margin-bottom:20px;"><strong>Instrucción:</strong> Para guardar como PDF, use la función de Imprimir de su navegador (Ctrl+P o Cmd+P) y seleccione "Guardar como PDF" como destino.</div><h1>${generatedContent.title}</h1><div>${explanationHtml}</div><hr style="margin:2em 0;" /><h2>Preguntas de Práctica</h2><div>${questionsHtml}</div><div class="page-break"></div><div class="no-print">${answerKeyHtml}</div></body></html>`;

        const pdfWindow = window.open("", "_blank");
        pdfWindow?.document.write(htmlContent);
        pdfWindow?.document.close();
    };


    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Modo Tutor Interactivo con IA</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Genera una lección y preguntas sobre cualquier tema para reforzar el aprendizaje.</p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tema a explicar</label>
                        <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ej: Las partes de la célula" className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Grado</label>
                        <select value={grade} onChange={e => setGrade(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Área</label>
                        <select value={subject} onChange={e => setSubject(e.target.value as SubjectArea)} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                            {SUBJECT_AREAS.filter(s => !['Todas', 'Coordinadores', 'Administrativos'].includes(s)).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nº de Preguntas</label>
                        <input type="number" value={numQuestions} onChange={e => setNumQuestions(Math.max(1, Math.min(10, parseInt(e.target.value, 10)) || 1))} min="1" max="10" className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                    </div>
                </div>
                <div className="text-right mt-4">
                    <button onClick={handleGenerate} disabled={isLoading} className="bg-accent text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400">
                        Generar Lección
                    </button>
                </div>
            </div>

            {isLoading && <Spinner />}
            {error && <p className="text-red-600 text-center">{error}</p>}

            {generatedContent && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-8 animate-fade-in">
                     <div className="flex justify-between items-center border-b dark:border-gray-700 pb-4">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{generatedContent.title}</h2>
                        <button onClick={handleDownloadPdf} className="bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-900/80 transition-colors flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            <span>Descargar PDF</span>
                        </button>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-primary dark:text-secondary mb-4">Explicación del Tema</h3>
                        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                            {renderMarkdown(generatedContent.explanation)}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-primary dark:text-secondary mb-4">Preguntas de Práctica</h3>
                        <div className="space-y-6">
                            {generatedContent.practiceQuestions.map((q, qIndex) => {
                                const userAnswer = selectedAnswers[qIndex];
                                const isAnswered = userAnswer !== undefined && userAnswer !== null;

                                return (
                                <div key={qIndex} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <p className="font-semibold mb-3 text-gray-800 dark:text-gray-200">{qIndex + 1}. {q.question}</p>
                                    <div className="space-y-2">
                                        {q.options.map((option, oIndex) => {
                                            const isSelected = userAnswer === oIndex;
                                            const isCorrect = q.correctAnswerIndex === oIndex;
                                            
                                            let optionClass = 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-800 dark:text-gray-200';
                                            if (isAnswered) {
                                                if (isCorrect) {
                                                    optionClass = 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/50 dark:border-green-600 dark:text-green-200';
                                                } else if (isSelected) {
                                                    optionClass = 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/50 dark:border-red-600 dark:text-red-200';
                                                } else {
                                                    optionClass = 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400';
                                                }
                                            }

                                            return (
                                                <button key={oIndex} onClick={() => handleAnswerSelect(qIndex, oIndex)} disabled={isAnswered} className={`w-full text-left p-3 border rounded-lg flex items-center space-x-3 transition-colors ${optionClass}`}>
                                                    <span className={`font-bold flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-sm ${isSelected || (isAnswered && isCorrect) ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>{String.fromCharCode(65 + oIndex)}</span>
                                                    <span>{option}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {isAnswered && (
                                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-r-md animate-fade-in">
                                            <h4 className="font-bold text-yellow-800 dark:text-yellow-200">Explicación</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{q.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            )})}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TutorMode;