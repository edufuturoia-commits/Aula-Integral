import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { GRADES, GROUPS } from '../constants';

interface ImportStudentsModalProps {
  onClose: () => void;
  onSave: (studentNames: string[], grade: string, group: string) => void;
}

interface ExtractedName {
    name: string;
    checked: boolean;
}

const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            if (!result) {
                return reject(new Error("File could not be read."));
            }
            const parts = result.split(',');
            if (parts.length === 2) {
                resolve(parts[1]);
            } else {
                reject(new Error("Invalid file format for base64 conversion."));
            }
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


const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({ onClose, onSave }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedNames, setExtractedNames] = useState<ExtractedName[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [grade, setGrade] = useState(GRADES[0]);
    const [group, setGroup] = useState(GROUPS[0]);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const allowedExtensions = /(\.pdf)$/i;
            if (!allowedExtensions.exec(selectedFile.name)) {
                setError('Formato no soportado. Sube un archivo PDF (.pdf).');
                setFile(null);
                if(e.target) e.target.value = '';
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
            const responseSchema = { type: Type.ARRAY, items: { type: Type.STRING } };

            const filePart = await fileToGenerativePart(file);
            const prompt = `Has recibido un documento (${file.name}) que contiene una lista de nombres de estudiantes. Extrae únicamente los nombres completos de los estudiantes de este documento. Devuelve el resultado como un array JSON de strings. Por ejemplo: ["Mariana Garcia Lopez", "Samuel Rodriguez Martinez"].`;
            const contents = { parts: [{ text: prompt }, filePart] };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                },
            });
            
            const namesText = response.text?.trim();
            if (!namesText) {
                throw new Error("La respuesta de la IA estaba vacía. Esto puede ocurrir si el archivo es muy grande o tiene un formato complejo. Intente simplificar el archivo o usar formato PDF.");
            }
            const names = JSON.parse(namesText) as string[];

            if (!names || names.length === 0) {
                setError("No se pudieron extraer nombres del archivo. Por favor, asegúrate de que el archivo contenga una lista clara de estudiantes.");
                setIsExtracting(false);
                return;
            }

            setExtractedNames(names.map(name => ({ name, checked: true })));
            setStep(2);

        } catch (e: any) {
            console.error("Error extracting names:", e);
            const errorMessage = e.message || JSON.stringify(e);
            setError(`Error al procesar el archivo: ${errorMessage}`);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleToggleName = (index: number) => {
        setExtractedNames(prev => 
            prev.map((item, i) => i === index ? { ...item, checked: !item.checked } : item)
        );
    };

    const handleSave = () => {
        setShowConfirmation(true);
    };

    const confirmAndSave = () => {
        const selectedNames = extractedNames.filter(item => item.checked).map(item => item.name);
        if (selectedNames.length > 0) {
            onSave(selectedNames, grade, group);
        }
    };
    
    const selectedCount = extractedNames.filter(i => i.checked).length;

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg mx-4 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Importar Lista de Estudiantes</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        
        {step === 1 && (
            <div>
              <p className="text-gray-600 mb-4">Sube un archivo PDF con la lista de nombres de tus estudiantes (hasta 4000). La IA los extraerá automáticamente.</p>
              <div className="mb-4">
                <label className="block w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-md text-center cursor-pointer hover:border-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="mt-2 block text-sm font-medium text-gray-600">
                       {file ? file.name : 'Arrastra y suelta un archivo o haz clic para seleccionar'}
                    </span>
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf"/>
                </label>
              </div>
               {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}
               <div className="flex justify-end space-x-4">
                 <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Cancelar</button>
                 <button onClick={handleExtract} disabled={isExtracting || !file} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors flex items-center disabled:bg-gray-400">
                    {isExtracting && <Spinner />}
                    {isExtracting ? 'Extrayendo...' : 'Extraer Nombres'}
                 </button>
               </div>
            </div>
        )}

        {step === 2 && (
            <div>
              <p className="text-gray-600 mb-2">Se encontraron {extractedNames.length} estudiantes. Revisa la lista, asigna un grado y grupo, y luego guarda.</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                  <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                   <select value={group} onChange={e => setGroup(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                      {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                {extractedNames.map((item, index) => (
                   <label key={index} className="flex items-center p-2 bg-gray-50 rounded-md cursor-pointer">
                     <input type="checkbox" checked={item.checked} onChange={() => handleToggleName(index)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                     <span className="ml-3 text-sm text-gray-800">{item.name}</span>
                   </label>
                ))}
              </div>
               <div className="flex justify-between items-center mt-6">
                 <button type="button" onClick={() => setStep(1)} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Atrás</button>
                 <button onClick={handleSave} disabled={selectedCount === 0} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors disabled:bg-gray-400">
                    Añadir {selectedCount} Estudiantes
                 </button>
               </div>
            </div>
        )}

        {showConfirmation && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
                <div className="bg-white p-8 rounded-lg shadow-xl border w-11/12">
                    <h3 className="text-lg font-bold text-gray-800">Confirmar Importación</h3>
                    <p className="mt-2 text-gray-600">
                        Estás a punto de añadir <strong className="text-primary">{selectedCount}</strong> estudiantes al <strong className="text-primary">{grade} - Grupo {group}</strong>.
                    </p>
                    <p className="mt-1 text-gray-600">¿Estás seguro de que esta información es correcta?</p>
                    <div className="mt-6 flex justify-end space-x-4">
                        <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">Cancelar</button>
                        <button onClick={confirmAndSave} className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">Confirmar y Añadir</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ImportStudentsModal;