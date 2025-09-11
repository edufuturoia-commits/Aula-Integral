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

const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({ onClose, onSave }) => {
    const [step, setStep] = useState(1);
    const [grade, setGrade] = useState(GRADES[0]);
    const [group, setGroup] = useState(GRADE_GROUP_MAP[GRADES[0]][0]);
    const [studentList, setStudentList] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedNames, setExtractedNames] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const availableGroups = useMemo(() => {
        return GRADE_GROUP_MAP[grade] || [];
    }, [grade]);

    const handleGradeChange = (newGrade: string) => {
        setGrade(newGrade);
        setGroup(GRADE_GROUP_MAP[newGrade]?.[0] || '');
    };
    
    const handleExtract = async () => {
        if (!studentList.trim()) {
            setError("Por favor, pega la lista de estudiantes.");
            return;
        }
        setIsExtracting(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Extrae los nombres completos de los estudiantes de la siguiente lista. Ignora números, viñetas y cualquier otro texto que no sea un nombre. Devuelve el resultado como un array JSON de strings, donde cada string es un nombre completo. Lista de estudiantes: \n\n${studentList}`;
            
            const responseSchema = {
                type: Type.ARRAY,
                items: { type: Type.STRING }
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
                throw new Error("La IA no devolvió un resultado válido.");
            }
            const names = JSON.parse(responseText) as string[];

            if (names.length === 0) {
                 setError("No se pudieron extraer nombres de la lista. Por favor, asegúrate de que el formato sea claro.");
            } else {
                 setExtractedNames(names);
                 setStep(2);
            }

        } catch (e) {
            console.error("Error extracting names:", e);
            setError("Ocurrió un error al procesar la lista. Inténtalo de nuevo.");
        } finally {
            setIsExtracting(false);
        }
    };
    
    const handleSave = () => {
        onSave(extractedNames, grade, group);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Importar Estudiantes con IA</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
          </div>
          
          {step === 1 && (
            <div>
              <p className="text-gray-600 mb-4">Selecciona el curso y pega el listado de estudiantes. La IA se encargará de extraer los nombres automáticamente.</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grado</label>
                    <select value={grade} onChange={e => handleGradeChange(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                    <select value={group} onChange={e => setGroup(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                      {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pega aquí el listado</label>
                <textarea
                    rows={8}
                    value={studentList}
                    onChange={e => setStudentList(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary bg-gray-50 text-gray-900"
                    placeholder="Ej: 1. Pérez, Juan David&#10;2. Sofía López&#10;3. Martinez, Carlos"
                />
              </div>
              {error && <p className="text-red-600 text-sm text-center mt-2">{error}</p>}
              <div className="flex justify-end space-x-4 mt-8">
                 <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Cancelar</button>
                 <button onClick={handleExtract} disabled={isExtracting} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors flex items-center disabled:bg-gray-400">
                    {isExtracting && <Spinner />}
                    {isExtracting ? 'Extrayendo...' : 'Extraer Nombres'}
                 </button>
               </div>
            </div>
          )}

          {step === 2 && (
            <div>
                <p className="text-gray-600 mb-4">Se encontraron <strong>{extractedNames.length}</strong> estudiantes. Revisa la lista y confirma la importación para el <strong>{grade} - Grupo {group}</strong>.</p>
                <ul className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2 bg-gray-50">
                    {extractedNames.map((name, index) => (
                        <li key={index} className="text-gray-800">{index + 1}. {name}</li>
                    ))}
                </ul>
                <div className="flex justify-between items-center mt-8">
                    <button type="button" onClick={() => setStep(1)} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Atrás</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">
                        Confirmar e Importar {extractedNames.length} Estudiantes
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    );
};

export default ImportStudentsModal;