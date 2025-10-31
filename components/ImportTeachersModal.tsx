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
        inlineData: { data: base64Data, mimeType: file.type },
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
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const subjectList = SUBJECT_AREAS.join(', ');

            const responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        cedula: { type: Type.STRING, description: "La cédula o un ID temporal si no se encuentra. No debe estar vacío." },
                        nombresYApellidos: { type: Type.STRING, description: "El nombre y apellido completo del docente. DEBE ser extraído de forma literal del documento, sin ninguna corrección, modificación o alteración. Copiar textualmente es la regla principal." },
                        fechaDeNacimiento: { type: Type.STRING, description: "La fecha de nacimiento del docente (YYYY-MM-DD)." },
                        areaEducativa: { type: Type.STRING, description: `El área de especialización del docente. Debe ser uno de los valores permitidos.` },
                        direccion: { type: Type.STRING, description: "La dirección de residencia del docente." },
                        email: { type: Type.STRING, description: "El correo electrónico del docente." },
                        movil: { type: Type.STRING, description: "El número de teléfono móvil del docente." },
                        esDirectorDeGrupo: { type: Type.BOOLEAN, description: "Indica si el docente es director de grupo (true) o no (false). Si no se especifica, se asume false." },
                        gradoAsignado: { type: Type.STRING, description: "Si es director de grupo, el grado asignado (ej: '11º')." },
                        grupoAsignado: { type: Type.STRING, description: "Si es director de grupo, el grupo asignado (ej: 'A')." }
                    },
                    required: ['cedula', 'nombresYApellidos'],
                },
            };
            
            const promptInstruction = `Tu tarea es analizar un documento que contiene una lista de docentes y extraer su información.

**Reglas Estrictas:**
1.  **Extracción Literal de Nombres**: La regla más importante es que los **Nombres y Apellidos** deben ser extraídos **LITERALMENTE** y **SIN NINGUNA MODIFICACIÓN**. Copia el texto tal cual aparece, incluyendo mayúsculas, minúsculas, tildes o la falta de ellas. No corrijas, no abrevies, no completes ni alteres los nombres bajo ninguna circunstancia. La fidelidad al documento original es la máxima prioridad.
2.  **Manejo de Cédula/ID**: Extrae el número de Cédula o Identificación. Si no se encuentra, **DEBES GENERAR** un ID temporal único (ej: 'temp_12345'). El campo de la cédula no puede quedar vacío.
3.  **Campos Opcionales**: Si no encuentras información para Fecha de Nacimiento, Dirección, Email o Móvil, deja el campo como un string vacío.
4.  **Área Educativa**: El 'areaEducativa' debe ser uno de los siguientes valores: ${subjectList}. Intenta deducir la materia correcta. Si parece ser un profesor de primaria (enseña múltiples materias básicas), asigna 'Todas'. Si el cargo es de coordinador, asigna 'Coordinadores'. Si es administrativo, asigna 'Administrativos'. Si no es claro, asigna 'Matemáticas' por defecto.
5.  **Director de Grupo**: Si el documento indica que un docente es "director de grupo", "titular", o un rol similar para un curso específico, establece 'esDirectorDeGrupo' en true. Además, extrae el grado y el grupo correspondientes en 'gradoAsignado' y 'grupoAsignado'. Si no se especifica, 'esDirectorDeGrupo' debe ser false.

**Formato de Salida:**
Devuelve un array JSON de objetos. Cada objeto debe tener las siguientes propiedades: "cedula", "nombresYApellidos", "fechaDeNacimiento", "areaEducativa", "direccion", "email", "movil", "esDirectorDeGrupo", "gradoAsignado", "grupoAsignado".`;

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
            
            const responseText = response.text.trim();
            if (!responseText || responseText === 'undefined') {
                throw new Error("La respuesta de la IA estaba vacía. Intente con un archivo más simple o en formato PDF.");
            }

            const rawTeachers = JSON.parse(responseText) as { 
                cedula: string, 
                nombresYApellidos: string, 
                fechaDeNacimiento: string, 
                areaEducativa: SubjectArea, 
                direccion: string, 
                email: string, 
                movil: string,
                esDirectorDeGrupo?: boolean,
                gradoAsignado?: string,
                grupoAsignado?: string
            }[];
            
            if (!rawTeachers || rawTeachers.length === 0) {
                setError("No se pudieron extraer datos de docentes del archivo. Por favor, asegúrate de que el archivo contenga una lista clara.");
                setIsExtracting(false);
                return;
            }

            setExtractedTeachers(rawTeachers.map(t => ({
                id: t.cedula || `temp_${Date.now()}_${Math.random()}`,
                name: t.nombresYApellidos || '',
                subject: SUBJECT_AREAS.includes(t.areaEducativa) ? t.areaEducativa : SUBJECT_AREAS[0],
                dateOfBirth: t.fechaDeNacimiento || '',
                address: t.direccion || '',
                email: t.email || '',
                phone: t.movil || '',
                isHomeroomTeacher: t.esDirectorDeGrupo || false,
                assignedGrade: t.esDirectorDeGrupo && t.gradoAsignado && GRADES.includes(t.gradoAsignado) ? t.gradoAsignado : GRADES[5],
                assignedGroup: t.esDirectorDeGrupo && t.grupoAsignado && GROUPS.includes(t.grupoAsignado) ? t.grupoAsignado : GROUPS[0]
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Importar Plantel Docente</h2>
              <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 text-3xl">&times;</button>
            </div>
            
            {step === 1 && (
                <div className="flex-1">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Sube un archivo PDF o Excel con los datos de tus docentes (hasta 200). La IA extraerá automáticamente la información relevante.</p>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Archivo PDF o Excel</label>
                          <input type="file" onChange={handleFileChange} accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                      </div>
                      {file && <p className="text-sm text-gray-500 dark:text-gray-400">Archivo seleccionado: <strong>{file.name}</strong></p>}
                  </div>
                  {error && <p className="text-red-600 dark:text-red-400 text-sm text-center mt-2">{error}</p>}
                  <div className="flex justify-end space-x-4 mt-8">
                      <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                      <button onClick={handleExtract} disabled={isExtracting || !file} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors flex items-center disabled:bg-gray-400">
                          {isExtracting && <Spinner />}
                          {isExtracting ? 'Extrayendo...' : 'Extraer Datos'}
                      </button>
                  </div>
                </div>
            )}

            {step === 2 && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <p className="text-gray-600 dark:text-gray-300 mb-4 flex-shrink-0">Se encontraron <strong>{extractedTeachers.length}</strong> docentes. Revisa y corrige los datos antes de importar.</p>
                    <div className="flex-1 overflow-y-auto pr-2 border-t border-b -mx-8 px-8 py-4">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-left text-gray-500 dark:text-gray-400">
                                    <th className="p-2">Cédula</th>
                                    <th className="p-2">Nombre</th>
                                    <th className="p-2">Área</th>
                                    <th className="p-2">Email</th>
                                    <th className="p-2">Director de Grupo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extractedTeachers.map((teacher, index) => (
                                    <tr key={index} className="border-b dark:border-gray-700">
                                        <td className="p-2"><input type="text" value={teacher.id} onChange={(e) => handleTeacherDataChange(index, 'id', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"/></td>
                                        <td className="p-2"><input type="text" value={teacher.name} onChange={(e) => handleTeacherDataChange(index, 'name', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"/></td>
                                        <td className="p-2">
                                            <select value={teacher.subject} onChange={(e) => handleTeacherDataChange(index, 'subject', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent">
                                                {SUBJECT_AREAS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2"><input type="email" value={teacher.email} onChange={(e) => handleTeacherDataChange(index, 'email', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"/></td>
                                        <td className="p-2 text-center">
                                            <input type="checkbox" checked={teacher.isHomeroomTeacher} onChange={(e) => handleTeacherDataChange(index, 'isHomeroomTeacher', e.target.checked)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"/>
                                            {teacher.isHomeroomTeacher && (
                                                <div className="flex gap-1 mt-1">
                                                    <select value={teacher.assignedGrade} onChange={(e) => handleTeacherGroupChange(index, 'assignedGrade', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent">
                                                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                                    </select>
                                                    <select value={teacher.assignedGroup} onChange={(e) => handleTeacherGroupChange(index, 'assignedGroup', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent">
                                                        {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between items-center mt-6 flex-shrink-0">
                        <button type="button" onClick={() => setStep(1)} className="px-6 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Atrás</button>
                        <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">
                            Confirmar e Importar {extractedTeachers.length} Docentes
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
    );
};

export default ImportTeachersModal;