import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { SUBJECT_AREAS, GRADES } from '../constants';
import type { SubjectArea, Lesson, LessonContent, Student, Teacher, Guardian } from '../types';

interface TutorModeProps {
  lessons: Lesson[];
  onAddLesson: (lesson: Lesson) => Promise<void>;
  currentUser: Student | Teacher | Guardian;
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


const TutorMode: React.FC<TutorModeProps> = ({ lessons, onAddLesson, currentUser }) => {
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    
    // Form state
    const [topic, setTopic] = useState('');
    const [grade, setGrade] = useState(GRADES[5]); // Default to 6th grade
    const [subject, setSubject] = useState<SubjectArea>('Matemáticas');
    const [numQuestions, setNumQuestions] = useState(3);
    
    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | null>>({});
    const [historySearchTerm, setHistorySearchTerm] = useState('');

    const userLessons = useMemo(() => {
        if (!currentUser) return [];
        return lessons
            .filter(l => l.userId === currentUser.id)
            .filter(l => 
                l.content.title.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                l.topic.toLowerCase().includes(historySearchTerm.toLowerCase())
            );
    }, [lessons, currentUser, historySearchTerm]);
    
    const viewLesson = (lesson: Lesson | null) => {
        setSelectedLesson(lesson);
        setSelectedAnswers({});
        setError(null);
    };

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError("Por favor, ingresa un tema para la lección.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSelectedLesson(null);
        setSelectedAnswers({});

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const prompt = `Actúa como un tutor experto y amigable para un estudiante de '${grade}'. El tema a explicar es '${topic}' en la materia de '${subject}'.

Tu tarea es generar una lección completa, didáctica y moderna. La lección debe ser fácil de entender y seguir un flujo lógico.

La salida final debe ser un único objeto JSON que contenga:
1. 'title': Un título claro y atractivo para la lección.
2. 'introduction': Un párrafo que introduce el tema, captura el interés del estudiante y explica su importancia.
3. 'development': La explicación principal del tema. **Organiza el contenido de forma clara y estructurada.** Utiliza párrafos cortos separados por saltos de línea para facilitar la lectura. **Divide la explicación en secciones lógicas usando subtítulos (formato: ## Título de la Sección).** Para listar características o elementos, usa viñetas (formato: * Elemento de la lista). Para pasos secuenciales, usa listas numeradas (formato: 1. Primer paso). Incluye ejemplos claros donde sea pertinente. **Asegúrate de usar correctamente los signos de puntuación como puntos aparte para separar ideas.**
4. 'deepening': Una sección de "Profundización". Aquí puedes incluir aplicaciones en el mundo real, conexiones con otras áreas del conocimiento, o un dato curioso avanzado sobre el tema.
5. 'conclusion': Un párrafo que resume los puntos más importantes de la lección.
6. 'practiceQuestions': Un array con exactamente ${numQuestions} preguntas de práctica de opción múltiple (4 opciones) para verificar la comprensión, cada una con su explicación.

**Reglas de formato del texto:**
- Dentro de los campos de texto ('introduction', 'development', etc.), usa una sintaxis similar a Markdown para estructurar el contenido:
  - Subtítulos con '## '.
  - Listas con viñetas usando '* '.
  - Listas enumeradas usando '1. ', '2. ', etc.
  - Citas o texto destacado usando '> '.
- **Separa los párrafos con un salto de línea en blanco.**
- Asegúrate de que el JSON esté bien formado y que el contenido sea pedagógicamente sólido.`;
            
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "El título de la lección." },
                    introduction: { type: Type.STRING, description: "Párrafo de introducción." },
                    development: { type: Type.STRING, description: "Explicación principal del tema con formato markdown-like." },
                    deepening: { type: Type.STRING, description: "Sección de profundización del tema." },
                    conclusion: { type: Type.STRING, description: "Párrafo de conclusión." },
                    practiceQuestions: {
                        type: Type.ARRAY,
                        description: `Un array con exactamente ${numQuestions} objetos de pregunta.`,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
                                correctAnswerIndex: { type: Type.INTEGER },
                                explanation: { type: Type.STRING }
                            },
                            required: ["question", "options", "correctAnswerIndex", "explanation"]
                        }
                    }
                },
                required: ["title", "introduction", "development", "deepening", "conclusion", "practiceQuestions"]
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
            const result: LessonContent = JSON.parse(responseText);

            const newLesson: Lesson = {
                id: `lesson_${Date.now()}`,
                userId: currentUser.id,
                createdAt: new Date().toISOString(),
                topic,
                grade,
                subject,
                content: result,
            };
            await onAddLesson(newLesson);
            viewLesson(newLesson);

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

    const handleDownloadPdf = (lessonContent: LessonContent) => {
        if (!lessonContent) return;

        const renderMarkdownToHtml = (text: string): string => {
            if (!text) return '';
            let html = text.split('\n\n').map(paragraph => {
                const trimmed = paragraph.trim();
                if (trimmed.startsWith('## ')) return `<h3>${trimmed.substring(3)}</h3>`;
                if (trimmed.startsWith('> ')) return `<blockquote>${trimmed.substring(2)}</blockquote>`;
                if (trimmed.startsWith('* ') || trimmed.match(/^\d+\.\s/)) {
                    const listType = trimmed.startsWith('* ') ? 'ul' : 'ol';
                    const items = paragraph.split('\n').map(item => `<li>${item.replace(/^\*\s|^\d+\.\s/, '')}</li>`).join('');
                    return `<${listType}>${items}</${listType}>`;
                }
                return `<p>${trimmed}</p>`;
            }).join('');
            return html;
        };

        const explanationHtml = `
            <div class="section"><h2>Introducción</h2>${renderMarkdownToHtml(lessonContent.introduction)}</div>
            <div class="section"><h2>Desarrollo del Contenido</h2>${renderMarkdownToHtml(lessonContent.development)}</div>
            <div class="section"><h2>Profundización</h2>${renderMarkdownToHtml(lessonContent.deepening)}</div>
            <div class="section"><h2>Conclusión</h2>${renderMarkdownToHtml(lessonContent.conclusion)}</div>
        `;

        const questionsHtml = lessonContent.practiceQuestions.map((q, index) => `...`).join('');
        const answerKeyHtml = `...`;

        const htmlContent = `
            <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${lessonContent.title}</title><style>body{font-family:sans-serif;line-height:1.6;margin:40px}p{text-align:justify}h1{color:#005A9C;border-bottom:2px solid #ddd;padding-bottom:10px}h2{color:#333;margin-top:2em;border-bottom:1px solid #eee;padding-bottom:5px}h3{color:#555;margin-top:1.5em}ul,ol{margin-bottom:1em}blockquote{border-left:4px solid #ccc;padding-left:1em;margin-left:0;font-style:italic;color:#666}.question{margin-bottom:20px}.page-break{page-break-after:always}@media print{.no-print{display:none}}</style></head><body><div class="no-print" style="background-color:#fffae6;border:1px solid #ffecb3;padding:15px;border-radius:5px;margin-bottom:20px;"><strong>Instrucción:</strong> Para guardar como PDF, use la función de Imprimir de su navegador (Ctrl+P o Cmd+P) y seleccione "Guardar como PDF" como destino.</div><h1>${lessonContent.title}</h1><div>${explanationHtml}</div><hr style="margin:2em 0;" /><h2>Preguntas de Práctica</h2><div>${questionsHtml}</div><div class="page-break"></div><div class="no-print">${answerKeyHtml}</div></body></html>`;

        const pdfWindow = window.open("", "_blank");
        pdfWindow?.document.write(htmlContent);
        pdfWindow?.document.close();
    };


    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full max-h-[calc(100vh-112px)]">
            {/* History Panel */}
            <div className="w-full lg:w-1/3 xl:w-1/4 flex-shrink-0 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex-shrink-0">Historial de Lecciones</h2>
                <button 
                    onClick={() => viewLesson(null)} 
                    className="w-full mb-4 px-4 py-3 bg-accent text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 text-lg flex-shrink-0"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    <span>Crear Nueva Lección</span>
                </button>
                <div className="mb-4 flex-shrink-0">
                    <input 
                        type="text"
                        value={historySearchTerm}
                        onChange={e => setHistorySearchTerm(e.target.value)}
                        placeholder="Buscar en historial..."
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    />
                </div>
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2">
                    {userLessons.length > 0 ? userLessons.map(lesson => (
                        <div 
                            key={lesson.id} 
                            onClick={() => viewLesson(lesson)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors border-l-4 ${selectedLesson?.id === lesson.id ? 'bg-primary/10 border-primary' : 'bg-gray-50 dark:bg-gray-700/50 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{lesson.content.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{lesson.subject} - {lesson.grade}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(lesson.createdAt).toLocaleDateString()}</p>
                        </div>
                    )) : (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">No hay lecciones en tu historial.</p>
                    )}
                </div>
            </div>
            
            {/* Content Panel */}
            <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md overflow-y-auto">
                {isLoading ? <Spinner /> : error ? <p className="text-red-600 text-center">{error}</p> : selectedLesson ? (
                    // Display existing/generated lesson
                     <div className="space-y-8 animate-fade-in">
                         <div className="flex justify-between items-center border-b dark:border-gray-700 pb-4">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{selectedLesson.content.title}</h2>
                            <button onClick={() => handleDownloadPdf(selectedLesson.content)} className="bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-900/80 transition-colors flex items-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                <span>Descargar PDF</span>
                            </button>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-6">
                           {/* Lesson Content Sections */}
                            <div><h3 className="text-xl font-bold text-primary dark:text-secondary border-b-2 border-primary-focus/30 pb-2 mb-4">Introducción</h3>{renderMarkdown(selectedLesson.content.introduction)}</div>
                            <div><h3 className="text-xl font-bold text-primary dark:text-secondary border-b-2 border-primary-focus/30 pb-2 mb-4">Desarrollo del Contenido</h3>{renderMarkdown(selectedLesson.content.development)}</div>
                            <div><h3 className="text-xl font-bold text-primary dark:text-secondary border-b-2 border-primary-focus/30 pb-2 mb-4">Profundización</h3>{renderMarkdown(selectedLesson.content.deepening)}</div>
                            <div><h3 className="text-xl font-bold text-primary dark:text-secondary border-b-2 border-primary-focus/30 pb-2 mb-4">Conclusión</h3>{renderMarkdown(selectedLesson.content.conclusion)}</div>
                        </div>
                         {/* Practice Questions */}
                        <div>
                           <h3 className="text-xl font-bold text-primary dark:text-secondary border-b-2 border-primary-focus/30 pb-2 mb-4">Preguntas de Práctica</h3>
                           {/* ... a lot of code for questions ... */}
                        </div>
                     </div>
                ) : (
                    // Display generation form
                    <div className="space-y-6">
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
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nº Preguntas</label>
                                <input type="number" value={numQuestions} onChange={e => setNumQuestions(Math.max(1, Math.min(10, parseInt(e.target.value, 10)) || 1))} min="1" max="10" className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                            </div>
                        </div>
                        <div className="text-right mt-4">
                            <button onClick={handleGenerate} className="bg-accent text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors">
                                Generar Lección
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TutorMode;