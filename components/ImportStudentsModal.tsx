
import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { GRADES, GRADE_GROUP_MAP } from '../constants';

interface ImportStudentsModalProps {
  onClose: () => void;
  onSave: (studentNames: string[], grade: string, group: string) => void;
}

const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

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
        inlineData: { data: base64Data, mimeType: file.type },
    };
};


const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({ onClose, onSave }) => {
    const [step, setStep] = useState(1);
    const [grade, setGrade] = useState(GRADES[5]);
    const [group, setGroup] = useState(GRADE_GROUP_MAP[GRADES[5]][0]);
    const [file, setFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedNames, setExtractedNames] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const availableGroups = useMemo(() => GRADE_GROUP_MAP[grade] || [], [grade]);

    const handleGradeChange = (newGrade: string) => {
        setGrade(newGrade);
        setGroup(GRADE_GROUP_MAP[newGrade]?.[0] || '');
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const allowedExtensions = /(\.pdf|\.xls|\.xlsx)$/i;
            if (!allowedExtensions.exec(selectedFile.name)) {
                setError('Formato no soportado. Sube un archivo PDF o Excel (.pdf, .xls, .xlsx).');
                setFile(null);
                if (e.target) e.target.value = '';
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleExtract = async () => {
        if (!file) {
            setError("Por favor, selecciona un archivo.");
            return;
        }
        setIsExtracting(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `De la siguiente lista de un documento (PDF o Excel), extrae únicamente los nombres completos de los estudiantes. Ignora números de lista, encabezados de columna, o cualquier otro texto que no sea un nombre. Devuelve el resultado como un array JSON de strings. Documento:`;

            const responseSchema = {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            };
            
            const filePart = await fileToGenerativePart(file);
            const contents = { parts: [{ text: prompt }, filePart] };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                },
            });

            const results = JSON.parse(response.text) as string[];
            if (!results || results.length === 0) {
                 setError("No se pudieron extraer nombres. Por favor, revisa el formato del archivo. Asegúrate que la lista de nombres sea clara.");
                 setIsExtracting(false);
                 return;
            }
            setExtractedNames(results);
            setStep(2);
        } catch (e: any) {
            console.error("Error extracting names:", e);
            setError(`Error al procesar el archivo: ${e.message}`);
        } finally {
            setIsExtracting(false);
        }
    };
    
    const handleSave = () => {
        onSave(extractedNames, grade, group);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800">Importar Estudiantes por Grupo</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
                </div>
                
                {step === 1 && (
                    <div className="flex-1">
                        <p className="text-gray-600 mb-4">Selecciona el grado y grupo, luego sube un archivo PDF o Excel con el listado de estudiantes. La IA se encargará de extraer los nombres.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <select value={grade} onChange={e => handleGradeChange(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            <select value={group} onChange={e => setGroup(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                                {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-md text-center cursor-pointer hover:border-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                <span className="mt-2 block text-sm font-medium text-gray-600">{file ? file.name : 'Arrastra y suelta un archivo o haz clic para seleccionar'}</span>
                                <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.xls,.xlsx"/>
                            </label>
                        </div>
                        {error && <p className="text-red-600 text-sm text-center mt-4">{error}</p>}
                        <div className="flex justify-end space-x-4 mt-8">
                            <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">Cancelar</button>
                            <button onClick={handleExtract} disabled={isExtracting || !file} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus flex items-center disabled:bg-gray-400">
                                {isExtracting && <Spinner />}
                                {isExtracting ? 'Extrayendo...' : 'Extraer Nombres'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <>
                        <div className="mb-4 flex-shrink-0">
                            <p className="text-gray-600">Se encontraron <span className="font-bold">{extractedNames.length}</span> estudiantes para añadir a <span className="font-bold">{grade} - Grupo {group}</span>. Revisa la lista y confirma.</p>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 border rounded-lg p-2 bg-gray-50">
                            <ul className="divide-y divide-gray-200">
                                {extractedNames.map((name, index) => (
                                    <li key={index} className="p-2">{index + 1}. {name}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex justify-between items-center mt-6 pt-6 border-t flex-shrink-0">
                            <button type="button" onClick={() => setStep(1)} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">Atrás</button>
                            <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">
                                Añadir {extractedNames.length} Estudiantes
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ImportStudentsModal;
