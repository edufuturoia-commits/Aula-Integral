import React, { useState } from 'react';
import type { Assessment } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface OnlineAssessmentTakerProps {
    assessment: Assessment;
    onComplete: (score: number) => void;
    onBack: () => void;
}

const ProcessingSpinner: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl shadow-lg">
        <svg className="animate-spin h-12 w-12 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h3 className="text-xl font-bold text-gray-800">{text}</h3>
        <p className="text-gray-500 mt-2">Esto puede tomar un momento.</p>
    </div>
);


const OnlineAssessmentTaker: React.FC<OnlineAssessmentTakerProps> = ({ assessment, onComplete, onBack }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [isFinished, setIsFinished] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [aiReport, setAiReport] = useState<{ greeting: string; strengths: string; areasForImprovement: string; motivation: string; } | null>(null);

    const questions = assessment.questions;
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    const handleAnswerSelect = (optionIndex: number) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleFinish = async () => {
        if (!window.confirm('¿Estás seguro de que quieres finalizar la evaluación? No podrás cambiar tus respuestas.')) {
            return;
        }

        setIsProcessing(true);

        // --- Local Score Calculation ---
        let correctAnswersCount = 0;
        questions.forEach(q => {
            if (q.correctAnswer !== undefined && answers[q.id] === q.correctAnswer) {
                correctAnswersCount++;
            }
        });
        const percentageScore = questions.length > 0 ? (correctAnswersCount / questions.length) * 100 : 0;
        const scoreOneToFive = (percentageScore / 100) * 4.0 + 1.0;
        setFinalScore(scoreOneToFive);
        onComplete(scoreOneToFive);

        // --- AI Report Generation ---
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const assessmentDetails = questions.map(q => ({
                pregunta: q.text,
                respuestaEstudiante: q.options ? q.options[answers[q.id]] : "N/A",
                respuestaCorrecta: q.options && q.correctAnswer !== undefined ? q.options[q.correctAnswer] : "N/A",
                esCorrecta: answers[q.id] === q.correctAnswer
            }));

            const prompt = `Actúa como un tutor amigable y experto. Un estudiante acaba de completar la evaluación "${assessment.title}". Aquí están sus resultados: ${JSON.stringify(assessmentDetails)}. 
            
            Tu tarea es generar un reporte de retroalimentación personalizado y constructivo. El reporte debe estar en español y ser motivador.
            
            Genera una respuesta en formato JSON con las siguientes claves:
            - "greeting": Un saludo corto y positivo.
            - "strengths": Un párrafo analizando las fortalezas del estudiante, basado en las respuestas correctas. Sé específico.
            - "areasForImprovement": Un párrafo con sugerencias constructivas sobre las áreas a mejorar, basado en las respuestas incorrectas. Explica por qué una respuesta podría ser incorrecta de manera simple. No seas negativo.
            - "motivation": Un mensaje final corto y motivador para alentar al estudiante a seguir aprendiendo.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    greeting: { type: Type.STRING },
                    strengths: { type: Type.STRING },
                    areasForImprovement: { type: Type.STRING },
                    motivation: { type: Type.STRING },
                },
                required: ['greeting', 'strengths', 'areasForImprovement', 'motivation'],
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
                throw new Error("AI returned an invalid or empty response.");
            }

            const report = JSON.parse(responseText);
            setAiReport(report);

        } catch (error) {
            console.error("Error generating AI report:", error);
            // Set a default report on error so the UI doesn't break
            setAiReport({
                greeting: "¡Evaluación completada!",
                strengths: "Has demostrado un buen esfuerzo en esta evaluación.",
                areasForImprovement: "Hubo un problema al generar el reporte detallado, pero revisa tus respuestas a continuación para ver dónde puedes mejorar.",
                motivation: "¡Sigue adelante con tu aprendizaje!"
            });
        } finally {
            setIsProcessing(false);
            setIsFinished(true);
        }
    };

    if (isProcessing) {
        return (
             <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto animate-fade-in">
                <ProcessingSpinner text="Calificando y generando tu reporte con IA..." />
            </div>
        );
    }

    if (isFinished) {
        const isPassing = finalScore >= 3.0;
        return (
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">¡Evaluación Completada!</h2>
                <p className="text-center text-gray-600 mb-6">Este es el resumen de tu desempeño en "{assessment.title}".</p>
                
                <div className="text-center mb-8">
                    <p className="text-lg text-gray-600 mb-2">Tu resultado final:</p>
                    <div className={`mx-auto w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold ${isPassing ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {finalScore.toFixed(1)}
                    </div>
                </div>

                {aiReport && (
                    <div className="bg-blue-50/50 border border-blue-200 p-6 rounded-lg mb-8 space-y-4">
                        <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            Análisis de tu Tutor IA
                        </h3>
                        <p className="text-lg font-semibold text-gray-700">{aiReport.greeting}</p>
                        <div>
                            <h4 className="font-bold text-green-700">Tus Fortalezas</h4>
                            <p className="text-gray-600">{aiReport.strengths}</p>
                        </div>
                         <div>
                            <h4 className="font-bold text-amber-700">Áreas para Mejorar</h4>
                            <p className="text-gray-600">{aiReport.areasForImprovement}</p>
                        </div>
                        <p className="font-semibold text-gray-700 italic">{aiReport.motivation}</p>
                    </div>
                )}

                <h3 className="text-xl font-bold text-gray-800 mb-4 border-t pt-6">Revisión de Respuestas</h3>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                    {questions.map((q, index) => {
                        const userAnswerIndex = answers[q.id];
                        const isCorrect = userAnswerIndex === q.correctAnswer;
                        
                        return (
                            <div key={q.id} className="p-4 border rounded-lg bg-gray-50">
                                <p className="font-semibold text-gray-800 mb-3">{index + 1}. {q.text}</p>
                                <div className="space-y-2">
                                    {q.options?.map((option, optIndex) => {
                                        const isUserAnswer = optIndex === userAnswerIndex;
                                        const isCorrectAnswer = optIndex === q.correctAnswer;
                                        
                                        let optionClass = "border-gray-300";
                                        if (isCorrectAnswer) {
                                            optionClass = "bg-green-100 border-green-500 text-green-800 font-semibold";
                                        }
                                        if (isUserAnswer && !isCorrect) {
                                            optionClass = "bg-red-100 border-red-500 text-red-800 font-semibold";
                                        }
                                        
                                        return (
                                            <div key={optIndex} className={`p-2 border rounded-md text-sm flex items-center ${optionClass}`}>
                                                {isUserAnswer && !isCorrect && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
                                                {isCorrectAnswer && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                <span className="flex-1">{option}</span>
                                                {isUserAnswer && <span className="text-xs ml-auto font-normal italic pr-2">(Tu respuesta)</span>}
                                            </div>
                                        );
                                    })}
                                    {userAnswerIndex === undefined && q.correctAnswer !== undefined && <p className="text-xs text-amber-700 mt-2">No se seleccionó respuesta.</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="text-center mt-8">
                    <button 
                        onClick={onBack} 
                        className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-primary-focus transition-colors"
                    >
                        Volver a Evaluaciones
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{assessment.title}</h2>
                <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800">Volver</button>
            </div>
            
            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progreso</span>
                    <span>Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="p-6 border rounded-lg bg-gray-50 min-h-[150px] flex items-center">
                <p className="text-lg font-semibold text-gray-800">{currentQuestionIndex + 1}. {currentQuestion.text}</p>
            </div>

            <div className="mt-6 space-y-4">
                {currentQuestion.options?.map((option, index) => {
                    const letter = String.fromCharCode(65 + index);
                    const isSelected = answers[currentQuestion.id] === index;
                    return (
                        <label key={index} className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'bg-blue-50 border-primary shadow-md' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>
                            <input
                                type="radio"
                                name={`question-${currentQuestion.id}`}
                                className="hidden"
                                checked={isSelected}
                                onChange={() => handleAnswerSelect(index)}
                            />
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold flex-shrink-0 mr-4 ${isSelected ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'}`}>
                                {letter}
                            </div>
                            <span className="font-medium text-gray-700">{option}</span>
                        </label>
                    );
                })}
            </div>

            <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <button onClick={handlePrev} disabled={currentQuestionIndex === 0} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                    Anterior
                </button>
                {currentQuestionIndex === questions.length - 1 ? (
                    <button onClick={handleFinish} className="px-6 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors">
                        Finalizar Evaluación
                    </button>
                ) : (
                    <button onClick={handleNext} disabled={answers[currentQuestion.id] === undefined} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                        Siguiente
                    </button>
                )}
            </div>
        </div>
    );
};

export default OnlineAssessmentTaker;