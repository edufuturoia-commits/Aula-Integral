import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { SUBJECT_AREAS, ACADEMIC_PERIODS } from '../constants';
import type { Student, SubjectGrades, SubjectArea, AcademicPeriod, Score } from '../types';
import { Role } from '../types';

// --- TYPES ---
interface ExtractedData {
    studentName: string;
    grade: string;
    group: string;
    subjectScores: { subject: string; score: number }[];
}

interface UploaderProps {
    onClose: () => void;
    onSaveData: (newStudents: Student[], newGrades: SubjectGrades[]) => void;
    allStudents: Student[];
    allGrades: SubjectGrades[];
    onShowSystemMessage: (message: string, type?: 'success' | 'error') => void;
}

// --- HELPER COMPONENTS ---
const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// --- HELPER FUNCTIONS ---
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
    return { inlineData: { data: base64Data, mimeType: file.type } };
};

// --- MAIN COMPONENT ---
const AcademicDataUploader: React.FC<UploaderProps> = ({ onClose, onSaveData, allStudents, allGrades, onShowSystemMessage }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
    const [period, setPeriod] = useState(ACADEMIC_PERIODS[0]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleExtract = async () => {
        if (!file) {
            setError("Por favor, selecciona un archivo PDF.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setExtractedData([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Analiza el documento PDF adjunto que contiene calificaciones de estudiantes. Extrae la información académica clave. Para cada estudiante, necesito su nombre completo, grado, grupo y una lista de sus notas finales por asignatura. Ignora notas parciales si hay una nota final o definitiva. Devuelve un array JSON de objetos. Cada objeto debe representar a un estudiante y tener las siguientes propiedades: "studentName" (string), "grade" (string, ej: "10º"), "group" (string, ej: "A"), y "subjectScores" (un array de objetos con "subject": string y "score": number). Asegúrate de que los nombres de las asignaturas coincidan lo más posible con esta lista oficial: ${SUBJECT_AREAS.join(', ')}.`;

            const responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        studentName: { type: Type.STRING },
                        grade: { type: Type.STRING },
                        group: { type: Type.STRING },
                        subjectScores: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    subject: { type: Type.STRING },
                                    score: { type: Type.NUMBER }
                                },
                                required: ["subject", "score"]
                            }
                        }
                    },
                    required: ["studentName", "grade", "group", "subjectScores"]
                }
            };
            
            const filePart = await fileToGenerativePart(file);

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts: [{ text: prompt }, filePart] },
                config: { responseMimeType: "application/json", responseSchema }
            });
            
            const responseText = response.text.trim();
            const results = JSON.parse(responseText) as ExtractedData[];

            if (!results || results.length === 0) {
                setError("La IA no pudo extraer datos del documento. Intenta con un archivo de formato más simple.");
            } else {
                setExtractedData(results);
                setStep(2);
            }
        } catch (e: any) {
            setError(`Error al procesar el archivo: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleConfirmImport = () => {
        const newStudents: Student[] = [];
        // Explicitly type the map to prevent implicit any errors
        const gradebookMap = new Map<string, SubjectGrades>(allGrades.map(g => [g.id, JSON.parse(JSON.stringify(g))]));
        let importedScores = 0;
        let skippedScores = 0;

        extractedData.forEach(entry => {
            let student = allStudents.find(s => s.name.toLowerCase() === entry.studentName.toLowerCase());
            let studentId: string | number;

            if (!student) {
                studentId = Date.now() + Math.random();
                const newStudent: Student = {
                    id: studentId,
                    name: entry.studentName,
                    avatarUrl: `https://picsum.photos/seed/${studentId}/100/100`,
                    grade: entry.grade,
                    group: entry.group,
                    role: Role.STUDENT,
                };
                newStudents.push(newStudent);
            } else {
                studentId = student.id;
            }

            entry.subjectScores.forEach(subjectScore => {
                const gradebookId = `${subjectScore.subject}-${entry.grade}-${entry.group}-${period}`;
                
                if (gradebookMap.has(gradebookId)) {
                    const gradebook = gradebookMap.get(gradebookId)!;
                    
                    const aiItem = { id: 'ai-imported', name: 'Nota Importada (IA)', weight: 1.0 };
                    // If there is already a matching item, use it, otherwise create one or update list
                    // Simplified: overwrite gradeItems with just this one for demo or append
                    gradebook.gradeItems = [aiItem];

                    const scoreIndex = gradebook.scores.findIndex((s: Score) => s.studentId === studentId && s.gradeItemId === aiItem.id);
                    if (scoreIndex > -1) {
                        gradebook.scores[scoreIndex] = { ...gradebook.scores[scoreIndex], score: subjectScore.score };
                    } else {
                        gradebook.scores.push({ studentId, gradeItemId: aiItem.id, score: subjectScore.score });
                    }
                    
                    gradebookMap.set(gradebookId, gradebook);
                    importedScores++;
                } else {
                    skippedScores++;
                }
            });
        });
        
        onSaveData(newStudents, Array.from(gradebookMap.values()));
        onShowSystemMessage(`Importación completada. ${newStudents.length} estudiantes nuevos. ${importedScores} notas importadas. ${skippedScores} notas omitidas.`, 'success');
        onClose();
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl mx-4 flex flex-col h-[90vh]">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Cargar Datos Académicos con IA</h2>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-3xl">&times;</button>
                </div>

                {step === 1 && (
                    <div className="p-8 space-y-6">
                        <p className="text-gray-600 dark:text-gray-300">Sube un archivo PDF con las calificaciones finales de un período. La IA leerá el documento, extraerá los datos y los preparará para ser importados a la plataforma.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Periodo Académico</label>
                                <select value={period} onChange={e => setPeriod(e.target.value as AcademicPeriod)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                    {ACADEMIC_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Archivo de Calificaciones</label>
                                <input type="file" onChange={handleFileChange} accept=".pdf" className="block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                            </div>
                        </div>
                        {file && <p className="text-sm text-gray-500">Archivo seleccionado: <strong>{file.name}</strong></p>}
                        {error && <p className="text-red-600 text-center">{error}</p>}
                        <div className="flex justify-end pt-4">
                            <button onClick={handleExtract} disabled={isLoading || !file} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus flex items-center disabled:bg-gray-400">
                                {isLoading ? <><Spinner /> Procesando con IA...</> : 'Procesar Archivo'}
                            </button>
                        </div>
                    </div>
                )}
                
                {step === 2 && (
                    <div className="p-6 flex-1 flex flex-col overflow-hidden">
                        <p className="text-gray-600 dark:text-gray-300 mb-4 flex-shrink-0">Se han extraído <strong>{extractedData.length}</strong> registros de estudiantes. Revisa los datos y confirma la importación para el período <strong>{period}</strong>.</p>
                        <div className="flex-1 overflow-y-auto border-t border-b dark:border-gray-700 -mx-6 px-6 py-4">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="p-2 text-left">Estudiante</th>
                                        <th className="p-2 text-left">Grado</th>
                                        <th className="p-2 text-left">Asignatura</th>
                                        <th className="p-2 text-center">Nota</th>
                                        <th className="p-2 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {extractedData.flatMap((studentData, studentIndex) =>
                                        studentData.subjectScores.map((score, scoreIndex) => {
                                            const gradebookExists = allGrades.some(g => 
                                                g.subject === score.subject && 
                                                g.grade === studentData.grade && 
                                                g.group === studentData.group && 
                                                g.period === period
                                            );
                                            return (
                                                <tr key={`${studentIndex}-${scoreIndex}`}>
                                                    {scoreIndex === 0 && <td rowSpan={studentData.subjectScores.length} className="p-2 font-semibold align-top">{studentData.studentName}</td>}
                                                    {scoreIndex === 0 && <td rowSpan={studentData.subjectScores.length} className="p-2 align-top">{studentData.grade}-{studentData.group}</td>}
                                                    <td className="p-2">{score.subject}</td>
                                                    <td className="p-2 text-center font-bold">{score.score.toFixed(2)}</td>
                                                    <td className="p-2 text-center">
                                                        {gradebookExists ? <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">Listo</span> : <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200" title="La planilla para esta asignatura/grupo no existe. Esta nota será omitida.">Omitido</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                         <div className="flex justify-between items-center mt-6 flex-shrink-0">
                            <button onClick={() => setStep(1)} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500">Atrás</button>
                            <button onClick={handleConfirmImport} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">Confirmar e Importar Datos</button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AcademicDataUploader;