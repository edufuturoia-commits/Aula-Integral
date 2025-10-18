import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES ---
interface GeneratedQuestion {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
    area: string;
}

// --- CONFIG ---
const SIMULATION_QUESTIONS = 131;
const SIMULATION_TIME_SECONDS = 270 * 60; // 4 hours 30 minutes
const AREAS = ['Lectura Crítica', 'Matemáticas', 'Sociales y Ciudadanas', 'Ciencias Naturales', 'Inglés'];

// --- HELPER COMPONENTS ---

const Spinner: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex flex-col items-center justify-center text-center p-8">
        <svg className="animate-spin h-12 w-12 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{text}</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">La IA está preparando preguntas únicas para ti. Esto puede tardar unos minutos.</p>
    </div>
);

const Timer: React.FC<{ seconds: number }> = ({ seconds }) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const isLowTime = seconds < 300; // Less than 5 minutes

    return (
        <div className={`font-mono text-lg font-bold px-3 py-1 rounded-md ${isLowTime ? 'text-red-600 bg-red-100 animate-pulse' : 'text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700'}`}>
            {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
        </div>
    );
};

// --- MAIN COMPONENT ---
const IcfesDrillTaker: React.FC = () => {
    const [gameState, setGameState] = useState<'start' | 'loading' | 'playing' | 'finished'>('start');
    const [drillMode, setDrillMode] = useState<'practice' | 'simulation' | null>(null);
    
    // Customization State
    const [practiceQuestions, setPracticeQuestions] = useState(10);
    const [practiceAreas, setPracticeAreas] = useState<string[]>([]);

    // Game State
    const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [score, setScore] = useState(0);

    // Timer effect for simulation mode
    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (gameState === 'playing' && drillMode === 'simulation' && timeRemaining !== null && timeRemaining > 0) {
            timer = setInterval(() => {
                setTimeRemaining(prev => (prev ? prev - 1 : 0));
            }, 1000);
        } else if (timeRemaining === 0) {
            handleFinish();
        }
        return () => clearInterval(timer);
    }, [gameState, drillMode, timeRemaining]);


    const handleToggleArea = (area: string) => {
        setPracticeAreas(prev => 
            prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
        );
    };

    const handleStartDrill = async (mode: 'practice' | 'simulation') => {
        setDrillMode(mode);
        setGameState('loading');
        setError(null);
        
        const isSimulation = mode === 'simulation';
        const numQuestions = isSimulation ? SIMULATION_QUESTIONS : practiceQuestions;
        const areas = isSimulation || practiceAreas.length === 0 ? AREAS : practiceAreas;
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = isSimulation 
                ? `Genera un simulacro completo tipo ICFES Saber 11, simulando una sesión de la prueba real. Debes crear exactamente ${SIMULATION_QUESTIONS} preguntas de opción múltiple con única respuesta (A, B, C, D). Las preguntas deben tener una dificultad y distribución temática realista, cubriendo las 5 áreas principales. La distribución debe ser aproximadamente: Lectura Crítica (41 preguntas), Matemáticas (25 preguntas), Sociales y Ciudadanas (25 preguntas), Ciencias Naturales (29 preguntas), e Inglés (11 preguntas). Para cada pregunta, proporciona el área de conocimiento, la pregunta en sí, las 4 opciones, el índice de la respuesta correcta y una explicación detallada.`
                : `Genera una práctica tipo ICFES Saber 11 con ${numQuestions} preguntas de opción múltiple con única respuesta (A, B, C, D) para un estudiante de grado 11. Las preguntas deben ser del área o áreas de: ${areas.join(', ')}. Para cada pregunta, proporciona el área de conocimiento, la pregunta en sí, las 4 opciones, el índice de la respuesta correcta y una explicación detallada.`;
            
            const responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
                        correctAnswerIndex: { type: Type.INTEGER },
                        explanation: { type: Type.STRING },
                        area: { type: Type.STRING, description: `El área de conocimiento. Debe ser una de: ${AREAS.join(', ')}` }
                    },
                    required: ["question", "options", "correctAnswerIndex", "explanation", "area"]
                }
            };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema
                },
            });
            
            const responseText = response.text.trim();
            const results = JSON.parse(responseText) as GeneratedQuestion[];

            setQuestions(results);
            setGameState('playing');
            if (isSimulation) {
                setTimeRemaining(SIMULATION_TIME_SECONDS);
            }

        } catch (e: any) {
            console.error("Error generating drill:", e);
            setError(`Error al generar el simulacro: ${e.message}`);
            setGameState('start');
        }
    };
    
    const handleAnswerSelect = (optionIndex: number) => {
        setAnswers(prev => ({...prev, [currentQuestionIndex]: optionIndex }));
        if (drillMode === 'practice') {
            // No automatic next, let them see the result.
        } else {
            // auto advance in simulation
            setTimeout(() => {
                if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                }
            }, 300);
        }
    };

    const handleFinish = () => {
        let correctAnswers = 0;
        questions.forEach((q, index) => {
            if (answers[index] === q.correctAnswerIndex) {
                correctAnswers++;
            }
        });
        setScore(correctAnswers);
        setGameState('finished');
        setTimeRemaining(null);
    };

    const handleRestart = () => {
        setGameState('start');
        setQuestions([]);
        setAnswers({});
        setCurrentQuestionIndex(0);
        setError(null);
        setScore(0);
        setDrillMode(null);
        setTimeRemaining(null);
    };

    const currentQuestion = questions[currentQuestionIndex];
    const userAnswer = answers[currentQuestionIndex];

    const resultsByArea = useMemo((): Record<string, { correct: number, total: number }> => {
        if (gameState !== 'finished') return {};
        const results = AREAS.reduce((acc, area) => {
            acc[area] = { correct: 0, total: 0 };
            return acc;
        }, {} as Record<string, { correct: number, total: number }>);

        questions.forEach((q, index) => {
            if (results[q.area]) {
                results[q.area].total++;
                if (answers[index] === q.correctAnswerIndex) {
                    results[q.area].correct++;
                }
            } else { // Handle cases where AI might return a slightly different area name
                const similarArea = AREAS.find(a => q.area.includes(a));
                if (similarArea && results[similarArea]) {
                    results[similarArea].total++;
                    if (answers[index] === q.correctAnswerIndex) {
                        results[similarArea].correct++;
                    }
                }
            }
        });
        return results;
    }, [gameState, questions, answers]);


    if (gameState === 'start') {
        return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg animate-fade-in space-y-8">
                 <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Simulacro ICFES Saber 11</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Elige tu modo de práctica para empezar a prepararte.</p>
                    {error && <p className="mt-4 text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Practice Mode */}
                    <div className="border border-gray-200 dark:border-gray-700 p-6 rounded-lg flex flex-col">
                        <h2 className="text-2xl font-bold text-primary dark:text-secondary">Práctica Rápida</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6 flex-grow">Personaliza tu sesión de estudio. Elige el número de preguntas y las áreas que quieres reforzar. Recibirás retroalimentación inmediata después de cada pregunta.</p>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número de Preguntas: {practiceQuestions}</label>
                                <input type="range" min="5" max="50" step="5" value={practiceQuestions} onChange={e => setPracticeQuestions(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Áreas (opcional, si no se elige ninguna se usarán todas):</label>
                                <div className="flex flex-wrap gap-2">
                                    {AREAS.map(area => (
                                        <button key={area} onClick={() => handleToggleArea(area)} className={`px-3 py-1 text-sm font-semibold rounded-full border-2 transition-colors ${practiceAreas.includes(area) ? 'bg-primary border-primary text-white' : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary'}`}>
                                            {area}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button onClick={() => handleStartDrill('practice')} className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-focus transition-colors">
                            Iniciar Práctica
                        </button>
                    </div>

                    {/* Simulation Mode */}
                    <div className="border-2 border-primary dark:border-secondary p-6 rounded-lg flex flex-col bg-blue-50/20 dark:bg-gray-900">
                        <h2 className="text-2xl font-bold text-primary dark:text-secondary">Simulacro Completo</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6 flex-grow">Experimenta una sesión completa del examen Saber 11. Con <strong>{SIMULATION_QUESTIONS} preguntas</strong> y un tiempo límite de <strong>4 horas y 30 minutos</strong>. Los resultados se muestran al final.</p>
                        <button onClick={() => handleStartDrill('simulation')} className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-focus transition-colors">
                            Iniciar Simulacro
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    if (gameState === 'loading') {
        return (
             <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <Spinner text={drillMode === 'simulation' ? "Generando Simulacro Completo..." : "Generando Práctica Rápida..."} />
            </div>
        );
    }

    if (gameState === 'finished') {
        const proportionalScore = questions.length > 0 ? Math.round((score / questions.length) * 500) : 0;
        
        return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg animate-fade-in space-y-6">
                 <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">¡Simulacro Finalizado!</h1>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Este es un puntaje global estimado (sobre 500) basado en tu desempeño.</p>
                    <p className="text-7xl font-extrabold text-primary dark:text-secondary my-2">{proportionalScore}</p>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">({score} de {questions.length} correctas)</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Results by Area */}
                    <div className="p-4 border dark:border-gray-700 rounded-lg">
                        <h3 className="text-xl font-bold mb-4">Rendimiento por Área</h3>
                        <div className="space-y-4">
                            {Object.entries(resultsByArea).map(([area, result]) => {
                                // FIX: Cast `result` to its expected type, as Object.entries returns `unknown` for values.
                                const typedResult = result as { correct: number; total: number };
                                if (typedResult.total === 0) return null;
                                const percentage = (typedResult.correct / typedResult.total) * 100;
                                return (
                                    <div key={area}>
                                        <div className="flex justify-between text-sm font-semibold mb-1">
                                            <span className="text-gray-700 dark:text-gray-300">{area}</span>
                                            <span className="text-gray-600 dark:text-gray-400">{typedResult.correct} / {typedResult.total}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                     {/* Actions */}
                    <div className="p-4 border dark:border-gray-700 rounded-lg flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50">
                         <h3 className="text-xl font-bold mb-4">¿Qué sigue ahora?</h3>
                         <p className="text-gray-600 dark:text-gray-400 text-center mb-6">Revisa tus respuestas para entender tus errores y aciertos, o vuelve a intentarlo para mejorar tu puntaje.</p>
                        <button onClick={handleRestart} className="w-full max-w-xs bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-focus transition-colors">
                            Volver a Intentar
                        </button>
                    </div>
                </div>

                 {/* Review Answers */}
                <div>
                    <h3 className="text-2xl font-bold mb-4 pt-6 border-t dark:border-gray-700">Revisión de Preguntas</h3>
                    <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-3">
                         {questions.map((q, index) => (
                            <div key={index} className="p-4 border dark:border-gray-700 rounded-lg">
                                <p className="font-semibold text-gray-800 dark:text-gray-200 mb-3">{index + 1}. {q.question}</p>
                                <div className="space-y-2">
                                    {q.options.map((option, optIndex) => {
                                        const isCorrect = optIndex === q.correctAnswerIndex;
                                        const isUserAnswer = optIndex === answers[index];
                                        let optionClass = 'border-gray-300 dark:border-gray-600';
                                        if (isCorrect) optionClass = 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/50 dark:border-green-600 dark:text-green-200';
                                        if (isUserAnswer && !isCorrect) optionClass = 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/50 dark:border-red-600 dark:text-red-200';
                                        
                                        return (
                                            <div key={optIndex} className={`p-3 border rounded-md text-sm ${optionClass}`}>
                                                {option} {isUserAnswer && <span className="font-bold text-xs"> (Tu respuesta)</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/40 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-r-md">
                                    <h4 className="font-bold text-yellow-800 dark:text-yellow-200 text-sm">Explicación</h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{q.explanation}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'playing' && currentQuestion) {
         return (
             <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-4xl mx-auto">
                 {/* Header */}
                 <div className="flex justify-between items-center mb-4">
                     <div>
                        <h2 className="text-xl font-bold text-primary dark:text-secondary">{drillMode === 'simulation' ? 'Simulacro Completo' : 'Práctica Rápida'}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{currentQuestion.area}</p>
                     </div>
                     {drillMode === 'simulation' && timeRemaining !== null && <Timer seconds={timeRemaining} />}
                 </div>

                 {/* Progress & Question Grid */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold">Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
                        <div className="w-1/2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-10 md:grid-cols-20 gap-1 mt-4 max-h-24 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        {questions.map((_, index) => (
                             <button 
                                key={index} 
                                onClick={() => setCurrentQuestionIndex(index)}
                                className={`h-8 w-8 text-xs font-bold rounded flex items-center justify-center transition-colors
                                    ${index === currentQuestionIndex ? 'bg-primary text-white ring-2 ring-primary ring-offset-2' : 
                                    (answers[index] !== undefined ? 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500')}
                                `}>
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </div>

                 {/* Question */}
                 <div className="p-6 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 min-h-[120px] flex items-center mb-6">
                    <p className="text-lg text-gray-800 dark:text-gray-200">{currentQuestion.question}</p>
                </div>

                 {/* Options */}
                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = userAnswer === index;
                        let optionClass = 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-800 dark:text-gray-200';
                        if (drillMode === 'practice' && userAnswer !== undefined) {
                             if (index === currentQuestion.correctAnswerIndex) {
                                optionClass = 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/50 dark:border-green-600 dark:text-green-200';
                            } else if (isSelected) {
                                optionClass = 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/50 dark:border-red-600 dark:text-red-200';
                            }
                        } else if (isSelected) {
                            optionClass = 'bg-blue-100 border-primary text-primary dark:bg-blue-900/50 dark:border-secondary dark:text-secondary';
                        }
                        return (
                            <button key={index} onClick={() => handleAnswerSelect(index)} disabled={drillMode === 'practice' && userAnswer !== undefined} className={`w-full text-left p-4 border-2 rounded-lg flex items-center space-x-4 transition-colors ${optionClass}`}>
                                <span className={`font-bold flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm ${isSelected ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>{String.fromCharCode(65 + index)}</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">{option}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Feedback for Practice Mode */}
                {drillMode === 'practice' && userAnswer !== undefined && (
                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/40 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-r-md animate-fade-in">
                        <h4 className="font-bold text-yellow-800 dark:text-yellow-200">Explicación</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{currentQuestion.explanation}</p>
                    </div>
                )}
                 {/* Navigation */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t dark:border-gray-700">
                    <button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} className="px-6 py-2 rounded-md font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50">Anterior</button>
                     {currentQuestionIndex === questions.length - 1 ? (
                        <button onClick={handleFinish} className="px-6 py-2 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700">Finalizar</button>
                    ) : (
                        <button onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))} className="px-6 py-2 rounded-md font-semibold text-white bg-primary hover:bg-primary-focus">Siguiente</button>
                    )}
                </div>
             </div>
         );
    }
    
    return (
        <div className="text-center p-8">
            <h2 className="text-xl font-bold text-red-500">Error Inesperado</h2>
            <p className="text-gray-600">Ha ocurrido un error en el estado de la aplicación. Por favor, intenta reiniciar.</p>
            <button onClick={handleRestart} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Reiniciar Simulacro</button>
        </div>
    );
};

export default IcfesDrillTaker;