
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { GRADES, GROUPS, SUBJECT_AREAS } from '../constants';
import type { SubjectArea, Teacher } from '../types';
import { Role } from '../types';

interface ImportTeachersModalProps {
  onClose: () => void;
  onSave: (newTeachers: Teacher[]) => void;
}

interface ExtractedTeacher {
    id: string;
    name: string;
    subject: SubjectArea;
    dateOfBirth: string;
    address: string;
    email: string;
    phone: string;
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
        inlineData: { data: base64Data, mimeType: 'application/pdf' },
    };
};

const ImportTeachersModal: React.FC<ImportTeachersModalProps> = ({ onClose, onSave }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedTeachers, setExtractedTeachers] = useState<ExtractedTeacher[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const allowedExtensions = /(\.pdf)$/i;
            if (!allowedExtensions.exec(selectedFile.name)) {
                setError('Formato no soportado. Sube un archivo PDF (.pdf).');
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
            const subjectList = SUBJECT_AREAS.join(', ');

            const responseSchema = {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  cedula: { type: Type.STRING },
                  nombresYApellidos: { type: Type.STRING },
                  fechaDeNacimiento: { type: Type.STRING },
                  areaEducativa: { type: Type.STRING, enum: SUBJECT_AREAS },
                  direccion: { type: Type.STRING },
                  email: { type: Type.STRING },
                  movil: { type: Type.STRING },
                },
                required: ['cedula', 'nombresYApellidos', 'fechaDeNacimiento', 'areaEducativa', 'direccion', 'email', 'movil'],
              },
            };
            
            const promptInstruction = `Has recibido un documento que contiene un listado de docentes. Extrae la información para cada docente. La información a extraer es: Cédula, Nombres y Apellidos, Fecha de Nacimiento, Área Educativa, Dirección, Email y Móvil. Devuelve el resultado como un array JSON de objetos. Cada objeto debe tener las siguientes propiedades en minúsculas y camelCase: "cedula" (string), "nombresYApellidos" (string), "fechaDeNacimiento" (string en formato YYYY-MM-DD), "areaEducativa" (string, debe ser una de la lista: ${subjectList}), "direccion" (string), "email" (string), "movil" (string). Si un valor no se encuentra, déjalo como un string vacío. Asegúrate de que el JSON esté bien formado.`;

            const filePart = await fileToGenerativePart(file);
            const contents = { parts: [{ text: promptInstruction }, filePart] };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                },
            });
            
            const responseText = response.text?.trim();
            if (!responseText) {
                throw new Error("La respuesta de la IA estaba vacía. Intente con un archivo más simple o en formato PDF.");
            }

            const rawTeachers = JSON.parse(responseText) as { cedula: string, nombresYApellidos: string, fechaDeNacimiento: string, areaEducativa: SubjectArea, direccion: string, email: string, movil: string }[];
            
            if (!rawTeachers || rawTeachers.length === 0) {
                setError("No se pudieron extraer datos de docentes del archivo. Por favor, asegúrate de que el archivo contenga una lista clara.");
                setIsExtracting(false);
                return;
            }

            setExtractedTeachers(rawTeachers.map(t => ({
                id: t.cedula || '',
                name: t.nombresYApellidos || '',
                subject: SUBJECT_AREAS.includes(t.areaEducativa) ? t.areaEducativa : SUBJECT_AREAS[0],
                dateOfBirth: t.fechaDeNacimiento || '',
                address: t.direccion || '',
                email: t.email || '',
                phone: t.movil || '',
                isHomeroomTeacher: false,
                assignedGrade: GRADES[5],
                assignedGroup: GROUPS[0]
            })));
            setStep(2);

        } catch (e: any) {
            console.error("Error extracting teachers:", e);
            const errorMessage = e.message || JSON.stringify(e);
            setError(`Error al procesar el archivo: ${errorMessage}`);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleTeacherDataChange = (index: number, field: keyof ExtractedTeacher, value: string | boolean) => {
        setExtractedTeachers(prev =>
            prev.map((teacher, i) =>
                i === index ? { ...teacher, [field]: value } : teacher
            )
        );
    };
    
    const handleTeacherGroupChange = (index: number, field: 'assignedGrade' | 'assignedGroup', value: string) => {
        setExtractedTeachers(prev =>
            prev.map((teacher, i) =>
                i === index ? { ...teacher, [field]: value } : teacher
            )
        );
    };

    const handleSave = () => {
        const newTeachers: Teacher[] = extractedTeachers.map((t, index) => ({
            id: t.id,
            name: t.name,
            avatarUrl: `https://picsum.photos/seed/teacher${Date.now() + index}/100/100`,
            // Fix: Added missing role property
            role: Role.TEACHER,
            subject: t.subject,
            dateOfBirth: t.dateOfBirth,
            address: t.address,
            email: t.email,
            phone: t.phone,
            isHomeroomTeacher: t.isHomeroomTeacher,
            assignedGroup: t.isHomeroomTeacher ? { grade: t.assignedGrade, group: t.assignedGroup } : undefined
        }));
        onSave(newTeachers);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800">Importar Plantel Docente</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
            </div>
            
            {step === 1 && (
                <div className="flex-1">
                  <p className="text-gray-600 mb-4">Sube un archivo PDF con los datos de tus docentes (hasta 200). La IA extraerá automáticamente la Cédula, Nombres, Área, Email, etc.</p>
                  <div className="mb-4">
                    <label className="block w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-md text-center cursor-pointer hover:border-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <span className="mt-2 block text-sm font-medium text-gray-600">{file ? file.name : 'Arrastra y suelta un archivo o haz clic para seleccionar'}</span>
                        <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf"/>
                    </label>
                  </div>
                   {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}
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
                <>
                  <div className="mb-4 flex-shrink-0">
                     <p className="text-gray-600">Se encontraron {extractedTeachers.length} docentes. Revisa y ajusta los datos extraídos antes de guardar.</p>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {extractedTeachers.map((teacher, index) => (
                       <details key={index} className="bg-gray-50 border border-gray-200 rounded-lg" open={index < 3}>
                            <summary className="p-3 font-semibold cursor-pointer flex justify-between items-center">
                                <span>{teacher.name || `Docente ${index + 1}`} - <span className="font-normal text-gray-600">{teacher.id}</span></span>
                            </summary>
                            <div className="p-4 border-t bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600">Nombres y Apellidos</label>
                                    <input type="text" value={teacher.name} onChange={e => handleTeacherDataChange(index, 'name', e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600">Email</label>
                                    <input type="email" value={teacher.email} onChange={e => handleTeacherDataChange(index, 'email', e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600">Móvil</label>
                                    <input type="tel" value={teacher.phone} onChange={e => handleTeacherDataChange(index, 'phone', e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600">Área Educativa</label>
                                    <select value={teacher.subject} onChange={e => handleTeacherDataChange(index, 'subject', e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900">
                                        {SUBJECT_AREAS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600">Fecha de Nacimiento</label>
                                    <input type="date" value={teacher.dateOfBirth} onChange={e => handleTeacherDataChange(index, 'dateOfBirth', e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900"/>
                                </div>
                                <div className="md:col-span-2 border-t pt-4 mt-2">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input type="checkbox" checked={teacher.isHomeroomTeacher} onChange={e => handleTeacherDataChange(index, 'isHomeroomTeacher', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                                        <span className="text-sm font-medium text-gray-700">Es Director de Grupo</span>
                                    </label>
                                    {teacher.isHomeroomTeacher && (
                                        <div className="grid grid-cols-2 gap-4 mt-2 pl-7">
                                             <select value={teacher.assignedGrade} onChange={e => handleTeacherGroupChange(index, 'assignedGrade', e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900">
                                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                             <select value={teacher.assignedGroup} onChange={e => handleTeacherGroupChange(index, 'assignedGroup', e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900">
                                                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                       </details>
                    ))}
                  </div>
                   <div className="flex justify-between items-center mt-6 pt-6 border-t flex-shrink-0">
                     <button type="button" onClick={() => setStep(1)} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Atrás</button>
                     <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">
                        Añadir {extractedTeachers.length} Docentes
                     </button>
                   </div>
                </>
            )}
          </div>
        </div>
      );
};

export default ImportTeachersModal;
