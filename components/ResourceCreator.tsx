

import React, { useState } from 'react';
import type { Resource, SubjectArea, Question } from '../types';
import { ResourceType } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { SUBJECT_AREAS, GRADES } from '../constants';

interface ResourceCreatorProps {
    onSave: (resource: Resource) => void;
    onCancel: () => void;
}

const GENERATABLE_RESOURCE_TYPES = ['Guía de Estudio', 'Resumen', 'Cuestionario', 'Actividad Práctica'];

const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ResourceCreator: React.FC<ResourceCreatorProps> = ({ onSave, onCancel }) => {
    const [step, setStep] = useState(1);
    
    // Step 1 state
    const [area, setArea] = useState<SubjectArea>(SUBJECT_AREAS[0]);
    const [grade, setGrade] = useState(GRADES[0]);
    const [resourceType, setResourceType] = useState(GENERATABLE_RESOURCE_TYPES[0]);
    const [topic, setTopic] = useState('');
    
    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    // Step 2 state
    const [generatedContent, setGeneratedContent] = useState({ title: '', description: '', content: ''});

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setGenerationError("Por favor, especifica un tema para el recurso.");
            return;
        }
        setIsGenerating(true);
        setGenerationError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Genera un recurso educativo para estudiantes de '${grade}'. El tipo de recurso es un(a) '${resourceType}' sobre el tema '${topic}' en el área de '${area}'. El recurso debe ser apropiado para la edad, claro y fácil de entender. Devuelve el resultado como un único objeto JSON con las siguientes propiedades: "title" (un título breve y descriptivo), "description" (una descripción de 1-2 frases para la biblioteca de recursos), y "content" (el contenido principal y completo del recurso en formato de texto plano).`;

            const responseSchema = {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                content: { type: Type.STRING },
              },
              required: ['title', 'description', 'content'],
            };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                },
            });

            const result = JSON.parse(response.text);
            setGeneratedContent(result);
            setStep(2);

        } catch (error) {
            console.error("Error generating resource:", error);
            setGenerationError("Hubo un error al contactar la IA. Por favor, revisa la consola para más detalles e intenta de nuevo.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSave = () => {
        const newResource: Resource = {
            id: `res_gen_${Date.now()}`,
            title: generatedContent.title,
            description: generatedContent.description,
            content: generatedContent.content,
            type: ResourceType.Document,
            subjectArea: area,
            url: '#', // URL no es aplicable para contenido generado
        };
        onSave(newResource);
    };

     const handleContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setGeneratedContent(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };
    
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Generador de Recursos con IA</h2>
            
            {step === 1 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Paso 1: Describe el Recurso</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <select value={area} onChange={e => setArea(e.target.value as SubjectArea)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                            {SUBJECT_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                         <select value={resourceType} onChange={e => setResourceType(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                            {GENERATABLE_RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="mb-6">
                         <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-500" placeholder="Tema específico (Ej: El sistema solar, Los verbos regulares)"/>
                    </div>
                    {generationError && <p className="text-red-600 text-center mb-4">{generationError}</p>}
                    <div className="text-right">
                        <button onClick={handleGenerate} disabled={isGenerating} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors flex items-center justify-center min-w-[150px] disabled:bg-gray-400">
                            {isGenerating ? <><Spinner /> Generando...</> : 'Generar'}
                        </button>
                    </div>
                </div>
            )}
            
            {step === 2 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Paso 2: Revisa y Edita el Contenido</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                            <input 
                                type="text" 
                                id="title" 
                                name="title"
                                value={generatedContent.title} 
                                onChange={handleContentChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-500" 
                            />
                        </div>
                         <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción Breve</label>
                            <textarea 
                                id="description"
                                name="description"
                                rows={2}
                                value={generatedContent.description}
                                onChange={handleContentChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                            ></textarea>
                        </div>
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Contenido Principal</label>
                            <textarea
                              id="content"
                              name="content"
                              rows={10}
                              value={generatedContent.content}
                              onChange={handleContentChange}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                            ></textarea>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-6">
                        <button onClick={() => setStep(1)} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Atrás</button>
                        <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors">Guardar Recurso</button>
                    </div>
                </div>
            )}

            <button onClick={onCancel} className="mt-8 text-sm text-gray-500 hover:text-gray-800">
                Cancelar y volver a la biblioteca
            </button>
        </div>
    );
};

export default ResourceCreator;