import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { GRADES, GRADE_GROUP_MAP } from '../constants';
import type { Student, Guardian } from '../types';
import { Role } from '../types';

interface ImportGuardiansModalProps {
  onClose: () => void;
  onSave: (guardians: Guardian[]) => void;
  students: Student[];
}

interface ExtractedGuardian {
    id: string;
    name: string;
    email: string;
    phone: string;
    studentIds: (string | number)[];
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

const StudentSelector: React.FC<{
    students: Student[];
    selectedIds: (string | number)[];
    onConfirm: (ids: (string | number)[]) => void;
    onCancel: () => void;
}> = ({ students, selectedIds, onConfirm, onCancel }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentSelection, setCurrentSelection] = useState(new Set(selectedIds));
    const [gradeFilter, setGradeFilter] = useState('all');
    const [groupFilter, setGroupFilter] = useState('all');

    const availableGroups = useMemo(() => {
        if (gradeFilter === 'all' || !GRADE_GROUP_MAP[gradeFilter]) {
            const allGroups = new Set<string>();
            // FIX: Added type assertion to resolve TypeScript inference issue.
            (Object.values(GRADE_GROUP_MAP) as string[][]).forEach(groups => groups.forEach(g => allGroups.add(g)));
            return ['all', ...Array.from(allGroups).sort()];
        }
        return ['all', ...GRADE_GROUP_MAP[gradeFilter]];
    }, [gradeFilter]);

    const handleGradeChange = (grade: string) => {
        setGradeFilter(grade);
        setGroupFilter('all');
    };

    const filteredStudents = useMemo(() => 
        students.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (gradeFilter === 'all' || s.grade === gradeFilter) &&
            (groupFilter === 'all' || s.group === groupFilter)
        )
    , [students, searchTerm, gradeFilter, groupFilter]);

    const handleToggle = (id: string | number) => {
        const newSelection = new Set(currentSelection);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setCurrentSelection(newSelection);
    };

    return (
        <div className="absolute top-full left-0 mt-1 w-full max-w-sm bg-white dark:bg-gray-800 shadow-lg rounded-lg border dark:border-gray-600 z-10 p-4">
             <div className="grid grid-cols-2 gap-2 mb-2">
                <select 
                    value={gradeFilter} 
                    onChange={e => handleGradeChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                    <option value="all">Todos los Grados</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select 
                    value={groupFilter} 
                    onChange={e => setGroupFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                    {availableGroups.map(g => <option key={g} value={g}>{g === 'all' ? 'Todos los Grupos' : g}</option>)}
                </select>
            </div>
            <input 
                type="text" 
                placeholder="Buscar por nombre..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <ul className="max-h-48 overflow-y-auto space-y-1">
                {filteredStudents.map(student => (
                    <li key={student.id}>
                        <label className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={currentSelection.has(student.id)}
                                onChange={() => handleToggle(student.id)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">{student.name} ({student.grade}-{student.group})</span>
                        </label>
                    </li>
                ))}
                 {filteredStudents.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No se encontraron estudiantes.</p>}
            </ul>
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={onCancel} className="text-sm px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-600 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                <button onClick={() => onConfirm(Array.from(currentSelection))} className="text-sm px-3 py-1 rounded-md bg-primary text-white hover:bg-primary-focus">Confirmar</button>
            </div>
        </div>
    );
};


const ImportGuardiansModal: React.FC<ImportGuardiansModalProps> = ({ onClose, onSave, students }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedGuardians, setExtractedGuardians] = useState<ExtractedGuardian[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [linkingGuardianIndex, setLinkingGuardianIndex] = useState<number | null>(null);

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
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
            const prompt = `Extrae la información de los acudientes del documento. La información a extraer es: Cédula, Nombres y Apellidos, Email y Móvil.
- Si la Cédula/ID no está presente, GENERA un ID temporal único. La Cédula NUNCA debe estar vacía.
- Si otros campos como email o móvil faltan, déjalos como strings vacíos.
Devuelve un array JSON de objetos con las propiedades: "id", "name", "email", "phone".`;
            
            const responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        email: { type: Type.STRING },
                        phone: { type: Type.STRING },
                    },
                    required: ["id", "name"]
                }
            };

            const filePart = await fileToGenerativePart(file);
            const contents = { parts: [{ text: prompt }, filePart] };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents,
                config: { responseMimeType: "application/json", responseSchema },
            });

            const responseText = response.text.trim();
            const guardians = JSON.parse(responseText) as { id: string, name: string, email: string, phone: string }[];

            setExtractedGuardians(guardians.map(g => ({ ...g, studentIds: [] })));
            setStep(2);
        } catch (e: any) {
            setError(`Ocurrió un error al procesar el archivo: ${e.message}. Inténtalo de nuevo.`);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleGuardianDataChange = (index: number, field: keyof ExtractedGuardian, value: string) => {
        setExtractedGuardians(prev =>
            prev.map((g, i) => i === index ? { ...g, [field]: value } : g)
        );
    };

    const handleUpdateStudentLinks = (guardianIndex: number, studentIds: (string | number)[]) => {
        setExtractedGuardians(prev => 
            prev.map((g, i) => i === guardianIndex ? { ...g, studentIds } : g)
        );
        setLinkingGuardianIndex(null);
    };
    
    const handleSave = () => {
        const guardiansToSave: Guardian[] = extractedGuardians.map(g => ({
            id: g.id,
            name: g.name,
            email: g.email,
            phone: g.phone,
            studentIds: g.studentIds,
            avatarUrl: `https://picsum.photos/seed/${g.id}/100/100`,
            role: Role.GUARDIAN,
            password: g.id,
            passwordChanged: false,
        }));
        onSave(guardiansToSave);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Importar Acudientes y Vincular Estudiantes</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
          </div>
          
          {step === 1 && (
            <div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Sube un listado de acudientes en formato PDF o Excel. La IA extraerá sus datos para que luego puedas vincularlos a los estudiantes correspondientes.</p>
              <input type="file" onChange={handleFileChange} accept=".pdf,.xls,.xlsx" className="block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
              {file && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Archivo: <strong>{file.name}</strong></p>}
              {error && <p className="text-red-600 text-sm text-center mt-2">{error}</p>}
              <div className="flex justify-end space-x-4 mt-8">
                 <button onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                 <button onClick={handleExtract} disabled={isExtracting || !file} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus flex items-center disabled:bg-gray-400">
                    {isExtracting ? <><Spinner /> Extrayendo...</> : 'Extraer Datos'}
                 </button>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col overflow-hidden">
                <p className="text-gray-600 dark:text-gray-300 mb-4 flex-shrink-0">Revisa los datos y asigna uno o más estudiantes a cada acudiente.</p>
                <div className="flex-1 overflow-y-auto pr-2 border-t border-b dark:border-gray-700 -mx-8 px-8 py-4">
                    <div className="space-y-4">
                        {extractedGuardians.map((guardian, index) => {
                            const linkedStudents = guardian.studentIds.map(id => studentMap.get(id)?.name).filter(Boolean);
                            return (
                                <div key={index} className="p-4 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-2">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <input type="text" value={guardian.name} onChange={(e) => handleGuardianDataChange(index, 'name', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Nombre"/>
                                        <input type="text" value={guardian.id} onChange={(e) => handleGuardianDataChange(index, 'id', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="ID/Cédula"/>
                                        <div className="relative">
                                            <button onClick={() => setLinkingGuardianIndex(linkingGuardianIndex === index ? null : index)} className="w-full bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-900/80">
                                                Asignar Estudiante(s)
                                            </button>
                                            {linkingGuardianIndex === index && (
                                                <StudentSelector 
                                                    students={students} 
                                                    selectedIds={guardian.studentIds}
                                                    onConfirm={(ids) => handleUpdateStudentLinks(index, ids)}
                                                    onCancel={() => setLinkingGuardianIndex(null)}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    {linkedStudents.length > 0 && (
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            <strong>Estudiantes asignados:</strong> <span className="text-primary dark:text-secondary font-medium">{linkedStudents.join(', ')}</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="flex justify-between items-center mt-6 flex-shrink-0">
                    <button onClick={() => setStep(1)} className="px-6 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Atrás</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">
                        Confirmar e Importar {extractedGuardians.length} Acudientes
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    );
};

export default ImportGuardiansModal;