import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { GRADES, GRADE_GROUP_MAP } from '../constants';
import type { Teacher } from '../types';

interface ImportStudentsModalProps {
  onClose: () => void;
  onSave: (students: { name: string; id: string }[], grade: string, group: string, homeroomTeacherId?: string) => void;
  teachers: Teacher[];
}

interface ExtractedStudent {
    id: string;
    name: string;
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

const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({ onClose, onSave, teachers }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [grade, setGrade] = useState(GRADES[0]);
    const [group, setGroup] = useState(GRADE_GROUP_MAP[GRADES[0]][0]);
    const [homeroomTeacherId, setHomeroomTeacherId] = useState<string>('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedStudents, setExtractedStudents] = useState<ExtractedStudent[]>([]);
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
                setError('Formato no soportado. Sube un archivo PDF o Excel.');
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
            const prompt = `Extrae el número de identificación (cédula o tarjeta de identidad) y los nombres completos de los estudiantes de la siguiente lista. Devuelve el resultado como un array JSON de objetos. Cada objeto debe tener las propiedades "id" (el número de documento como string) y "name" (el nombre completo como string). Si un documento no tiene número de identificación, genera un ID único basado en la fecha y hora. Asegúrate de que el JSON esté bien formado.`;
            
            const responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                    },
                    required: ["id", "name"]
                }
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

            const responseText = response.text.trim();
            if (!responseText || responseText === 'undefined') {
                throw new Error("La IA no devolvió un resultado válido. Intente con un archivo más simple.");
            }
            const students = JSON.parse(responseText) as ExtractedStudent[];

            if (students.length === 0) {
                 setError("No se pudieron extraer estudiantes. Asegúrate de que el archivo tenga un formato claro.");
            } else {
                 setExtractedStudents(students);
                 setStep(2);
            }
        } catch (e: any) {
            console.error("Error extracting students:", e);
            setError(`Ocurrió un error al procesar el archivo: ${e.message}. Inténtalo de nuevo.`);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleStudentDataChange = (index: number, field: keyof ExtractedStudent, value: string) => {
        setExtractedStudents(prev =>
            prev.map((student, i) =>
                i === index ? { ...student, [field]: value } : student
            )
        );
    };
    
    const handleSave = () => {
        onSave(extractedStudents, grade, group, homeroomTeacherId || undefined);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-800">Importar Estudiantes desde Archivo</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
          </div>
          
          {step === 1 && (
            <div className="flex-1">
              <p className="text-gray-600 mb-4">Selecciona el curso, un director de grupo (opcional) y sube el listado de estudiantes en formato PDF o Excel.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asignar Director de Grupo (Opcional)</label>
                    <select value={homeroomTeacherId} onChange={e => setHomeroomTeacherId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                      <option value="">No asignar</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Archivo de Estudiantes</label>
                <input type="file" onChange={handleFileChange} accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
              </div>
              {file && <p className="text-sm text-gray-500 mt-2">Archivo seleccionado: <strong>{file.name}</strong></p>}
              {error && <p className="text-red-600 text-sm text-center mt-2">{error}</p>}
              <div className="flex justify-end space-x-4 mt-8">
                 <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Cancelar</button>
                 <button onClick={handleExtract} disabled={isExtracting || !file} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors flex items-center disabled:bg-gray-400">
                    {isExtracting && <Spinner />}
                    {isExtracting ? 'Extrayendo...' : 'Extraer Datos'}
                 </button>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col overflow-hidden">
                <p className="text-gray-600 mb-4 flex-shrink-0">Se encontraron <strong>{extractedStudents.length}</strong> estudiantes. Revisa y corrige los datos antes de importar a <strong>{grade} - Grupo {group}</strong>.</p>
                <div className="flex-1 overflow-y-auto pr-2 border-t border-b -mx-8 px-8 py-4">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-100">
                            <tr className="text-left text-gray-500">
                                <th className="p-2 w-1/3">ID / Documento</th>
                                <th className="p-2 w-2/3">Nombre Completo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {extractedStudents.map((student, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-2"><input type="text" value={student.id} onChange={(e) => handleStudentDataChange(index, 'id', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent"/></td>
                                    <td className="p-2"><input type="text" value={student.name} onChange={(e) => handleStudentDataChange(index, 'name', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent"/></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-between items-center mt-6 flex-shrink-0">
                    <button type="button" onClick={() => setStep(1)} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Atrás</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">
                        Confirmar e Importar {extractedStudents.length} Estudiantes
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    );
};

export default ImportStudentsModal;