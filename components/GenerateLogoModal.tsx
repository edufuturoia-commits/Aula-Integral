import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface GenerateLogoModalProps {
  onClose: () => void;
  onLogoGenerated: (logoUrl: string) => void;
  primaryColor: string;
  secondaryColor: string;
}

const Spinner: React.FC = () => (
    <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const GenerateLogoModal: React.FC<GenerateLogoModalProps> = ({ onClose, onLogoGenerated, primaryColor, secondaryColor }) => {
    const [prompt, setPrompt] = useState(`Un logo moderno y profesional para una aplicación educativa llamada 'AULA INTEGRAL MAYA'. El logo debe ser minimalista, aspiracional y representar aprendizaje y crecimiento. Utiliza principalmente el color azul (${primaryColor}) con acentos en amarillo (${secondaryColor}). El logo debe ser un icono abstracto, sin texto.`);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedLogo(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            });
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
            setGeneratedLogo(imageUrl);
        } catch (e) {
            console.error("Error generating logo:", e);
            setError("No se pudo generar el logo. Por favor, inténtalo de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUseLogo = () => {
        if (generatedLogo) {
            onLogoGenerated(generatedLogo);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-xl mx-auto flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800">Generador de Logo con IA</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">Describe el logo que imaginas:</label>
                        <textarea
                            id="prompt"
                            rows={4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary bg-white text-gray-900"
                        />
                    </div>
                    
                    <div className="text-center">
                        <button onClick={handleGenerate} disabled={isLoading} className="px-6 py-2 rounded-md text-white bg-accent hover:bg-red-700 transition-colors flex items-center justify-center min-w-[150px] mx-auto disabled:bg-gray-400">
                            {isLoading ? 'Generando...' : 'Generar Logo'}
                        </button>
                    </div>

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center p-8">
                            <Spinner />
                            <p className="mt-4 text-gray-600">Creando tu logo, esto puede tardar un momento...</p>
                        </div>
                    )}
                    
                    {error && <p className="text-red-600 text-center">{error}</p>}
                    
                    {generatedLogo && (
                        <div className="text-center mt-4 animate-fade-in">
                            <h3 className="text-lg font-semibold mb-2">Logo Generado</h3>
                            <img src={generatedLogo} alt="Logo generado" className="w-48 h-48 mx-auto rounded-lg shadow-md border" />
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-4 pt-6 mt-4 border-t flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">Cerrar</button>
                    <button onClick={handleUseLogo} disabled={!generatedLogo} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus disabled:bg-gray-400">
                        Usar este Logo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateLogoModal;
