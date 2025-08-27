import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { GRADES, GROUPS, SUBJECT_AREAS } from '../constants';
import type { SubjectArea, Teacher } from '../types';

interface ImportTeachersModalProps {
  onClose: () => void;
  onSave: (newTeachers: Teacher[]) => void;
}

interface ExtractedTeacher {
    name: string;
    subject: SubjectArea;
    isHomeroomTeacher: boolean;
    assignedGrade: string;
    assignedGroup: string;
}

const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ImportTeachersModal: React.FC<ImportTeachersModalProps> = ({ onClose, onSave }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedTeachers, setExtractedTeachers] = useState<ExtractedTeacher[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
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
            const subjectList = SUBJECT_AREAS.join(', ');
            const prompt = `Simula que has leído un listado de docentes de un archivo. Genera una lista de 5 nombres completos de docentes colombianos, asignándoles una materia de la siguiente lista: ${subjectList}. Devuelve el resultado como un array JSON de objetos. Cada objeto debe tener una propiedad 'name' con el nombre completo y una 'subject' con la materia asignada. Asegúrate que la materia asignada sea una de las de la lista.`;
            
            const responseSchema = {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  subject: { type: Type.STRING, enum: SUBJECT_AREAS }
                },
                required: ['name', 'subject'],
              },
            };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                },
            });
            
            const teachers = JSON.parse(response.text) as { name: string; subject: SubjectArea }[];
            setExtractedTeachers(teachers.map(t => ({ 
                ...t, 
                isHomeroomTeacher: false, 
                assignedGrade: GRADES[5], // Default to 6th grade
                assignedGroup: GROUPS[0]
            })));
            setStep(2);

        } catch (e) {
            console.error("Error extracting names:", e);
            setError("Hubo un error al procesar el archivo con la IA. Inténtalo de nuevo.");
        } finally {
            setIsExtracting(false);
        }
    };

    const handleTeacherDataChange = (index: number, field: keyof ExtractedTeacher, value: any) => {
        setExtractedTeachers(prev => 
            prev.map((teacher, i) => i === index ? { ...teacher, [field]: value } : teacher)
        );
    };

    const handleSave = () => {
        const newTeachers: Teacher[] = extractedTeachers.map((t, i) => ({
            id: `t_imported_${Date.now()}_${i}`,
            name: t.name,
            avatarUrl: `https://picsum.photos/seed/teacher${Date.now() + i}/100/100`,
            subject: t.subject,
            isHomeroomTeacher: t.isHomeroomTeacher,
            assignedGroup: t.isHomeroomTeacher ? { grade: t.assignedGrade, group: t.assignedGroup } : undefined
        }));
        onSave(newTeachers);
    };

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">Importar Plantel Docente</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
            {step === 1 && (
                <div>
                    <p className="text-gray-600 mb-4">Sube un archivo en formato Word, PDF o Excel. La IA se encargará de leer y extraer los nombres y materias de los docentes.</p>
                    <div className="mb-4">
                        <label className="block w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-md text-center cursor-pointer hover:border-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <span className="mt-2 block text-sm font-medium text-gray-600">
                                {file ? file.name : 'Arrastra y suelta un archivo o haz clic para seleccionar'}
                            </span>
                            <input type="file" className="hidden" onChange={handleFileChange} accept=".doc,.docx,.pdf,.xls,.xlsx"/>
                        </label>
                    </div>
                    {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}
                </div>
            )}

            {step === 2 && (
                <div>
                    <p className="text-gray-600 mb-4">Hemos encontrado a los siguientes docentes. Revisa la información, asigna directores de grupo y guarda los cambios.</p>
                    <div className="space-y-4">
                        {extractedTeachers.map((teacher, index) => (
                             <div key={index} className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                <div className="md:col-span-1">
                                    <p className="font-semibold text-gray-800">{teacher.name}</p>
                                </div>
                                <div className="md:col-span-1">
                                    <select value={teacher.subject} onChange={e => handleTeacherDataChange(index, 'subject', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm">
                                        {SUBJECT_AREAS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2 flex items-center gap-4 flex-wrap">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={teacher.isHomeroomTeacher} onChange={e => handleTeacherDataChange(index, 'isHomeroomTeacher', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                                        <span className="text-sm font-medium">Director de Grupo</span>
                                    </label>
                                    {teacher.isHomeroomTeacher && (
                                        <div className="flex items-center gap-2">
                                             <select value={teacher.assignedGrade} onChange={e => handleTeacherDataChange(index, 'assignedGrade', e.target.value)} className="p-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm">
                                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                            <select value={teacher.assignedGroup} onChange={e => handleTeacherDataChange(index, 'assignedGroup', e.target.value)} className="p-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm">
                                                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="flex justify-between items-center pt-6 border-t flex-shrink-0">
            <div>
                {step === 2 && <button type="button" onClick={() => setStep(1)} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Atrás</button>}
            </div>
            <div className="flex justify-end space-x-4">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Cancelar</button>
                {step === 1 && <button type="button" onClick={handleExtract} disabled={isExtracting || !file} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isExtracting && <Spinner />}
                    {isExtracting ? 'Procesando...' : 'Procesar Archivo'}
                </button>}
                 {step === 2 && <button type="button" onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors">
                    Añadir Docentes al Plantel
                </button>}
            </div>
        </div>
      </div>
    </div>
    );
};

export default ImportTeachersModal;