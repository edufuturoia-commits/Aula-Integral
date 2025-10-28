import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Student, SubjectGrades, GradeItem, AcademicPeriod, SubjectArea, Teacher, DesempenoDescriptor } from '../types';
import { Role, Desempeno } from '../types';
import { ACADEMIC_PERIODS, SUBJECT_AREAS, GRADES, GROUPS, GRADE_GROUP_MAP, MOCK_DESEMPENOS_BANK } from '../constants';

// --- Helper Components (Modals & Selectors) ---

interface DesempenoSelectorProps {
    bank: DesempenoDescriptor[];
    selectedIds: Set<string>;
    subject: SubjectArea;
    onToggle: (id: string) => void;
    onAdd: (description: string) => void;
    disabled?: boolean;
}

const DesempenoSelector: React.FC<DesempenoSelectorProps> = ({ bank, selectedIds, subject, onToggle, onAdd, disabled }) => {
    const [newDesc, setNewDesc] = useState('');
    const [filter, setFilter] = useState('');

    const filteredBank = useMemo(() => bank.filter(d => 
        (d.area === subject || d.area === 'Todas') &&
        d.description.toLowerCase().includes(filter.toLowerCase())
    ), [bank, subject, filter]);

    const handleAdd = () => {
        if (newDesc.trim()) {
            onAdd(newDesc.trim());
            setNewDesc('');
        }
    };

    return (
        <div className="space-y-3">
            <input 
                type="text"
                placeholder="Buscar desempeño..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                disabled={disabled}
            />
            <div className="max-h-40 overflow-y-auto border dark:border-gray-600 rounded-md p-2 space-y-1">
                {filteredBank.map(d => (
                    <label key={d.id} className={`flex items-center p-2 rounded-md ${disabled ? 'cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer'}`}>
                        <input 
                            type="checkbox"
                            checked={selectedIds.has(d.id)}
                            onChange={() => onToggle(d.id)}
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 text-primary focus:ring-primary"
                            disabled={disabled}
                        />
                        <span className={`ml-3 text-sm ${disabled ? 'text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>{d.description}</span>
                    </label>
                ))}
                 {filteredBank.length === 0 && <p className="text-center text-xs text-gray-500 py-2">No se encontraron desempeños. Añade uno nuevo.</p>}
            </div>
            {!disabled && (
                <div className="flex gap-2">
                    <input 
                        type="text"
                        placeholder="Añadir nuevo desempeño al banco"
                        value={newDesc}
                        onChange={e => setNewDesc(e.target.value)}
                        className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    />
                    <button type="button" onClick={handleAdd} className="px-4 py-2 text-sm bg-primary/20 text-primary dark:bg-secondary/20 dark:text-secondary font-semibold rounded-md hover:bg-primary/30">Añadir</button>
                </div>
            )}
        </div>
    );
};

interface ItemModalProps {
    item: GradeItem | null;
    existingItems: GradeItem[];
    desempenosBank: DesempenoDescriptor[];
    subject: SubjectArea;
    onClose: () => void;
    onSave: (item: GradeItem) => void;
    onAddDesempeno: (description: string) => string; // Returns new ID
}

const ItemModal: React.FC<ItemModalProps> = ({ item, existingItems, desempenosBank, subject, onClose, onSave, onAddDesempeno }) => {
    const [name, setName] = useState(item?.name || '');
    const [weight, setWeight] = useState(item?.weight ? item.weight * 100 : 25);
    const [selectedDesempenoIds, setSelectedDesempenoIds] = useState(new Set(item?.desempenoIds || []));

    const totalWeight = useMemo(() => {
        return existingItems.reduce((acc, current) => acc + (current.id === item?.id ? 0 : current.weight), 0);
    }, [existingItems, item]);

    const handleToggleDesempeno = (id: string) => {
        const newSet = new Set(selectedDesempenoIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedDesempenoIds(newSet);
    };

    const handleAddDesempenoAndSelect = (description: string) => {
        const newId = onAddDesempeno(description);
        setSelectedDesempenoIds(prev => new Set(prev).add(newId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("El nombre del ítem no puede estar vacío.");
            return;
        }
        if (weight <= 0) {
            alert("El peso debe ser mayor a 0.");
            return;
        }
        if (totalWeight + (weight / 100) > 1) {
            if (!confirm("El peso total superará el 100%. ¿Deseas continuar?")) {
                return;
            }
        }
        onSave({
            id: item?.id || `item-${Date.now()}`,
            name,
            weight: weight / 100,
            desempenoIds: Array.from(selectedDesempenoIds),
        });
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg mx-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{item ? 'Editar' : 'Añadir'} Ítem de Calificación</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Ítem</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" placeholder="Ej: Examen Parcial" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Peso / Porcentaje (%)</label>
                        <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" placeholder="Ej: 25" />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Peso actual de los demás ítems: <span className="font-bold">{(totalWeight * 100).toFixed(0)}%</span></p>
                         <p>Peso total con este ítem: <span className="font-bold">{((totalWeight + (weight/100)) * 100).toFixed(0)}%</span></p>
                    </div>
                    <div className="pt-4 mt-4 border-t dark:border-gray-600">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Desempeños Evaluados (Opcional)</label>
                        <DesempenoSelector
                            bank={desempenosBank}
                            selectedIds={selectedDesempenoIds}
                            subject={subject}
                            onToggle={handleToggleDesempeno}
                            onAdd={handleAddDesempenoAndSelect}
                        />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                        <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    )
};

interface GeneralDesempenosModalProps {
    gradebook: SubjectGrades;
    desempenosBank: DesempenoDescriptor[];
    onClose: () => void;
    onSave: (desempenoIds: string[]) => void;
    onAddDesempeno: (description: string) => string;
}

const GeneralDesempenosModal: React.FC<GeneralDesempenosModalProps> = ({ gradebook, desempenosBank, onClose, onSave, onAddDesempeno }) => {
    const [selectedIds, setSelectedIds] = useState(new Set(gradebook.generalDesempenoIds || []));
    
    const handleToggle = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleAddAndSelect = (description: string) => {
        const newId = onAddDesempeno(description);
        setSelectedIds(prev => new Set(prev).add(newId));
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg mx-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Desempeños Generales del Periodo</h2>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Selecciona o añade los desempeños generales que se trabajaron durante este periodo para la asignatura de {gradebook.subject}.</p>
                    <DesempenoSelector
                        bank={desempenosBank}
                        selectedIds={selectedIds}
                        subject={gradebook.subject}
                        onToggle={handleToggle}
                        onAdd={handleAddAndSelect}
                        disabled={gradebook.isLocked}
                    />
                </div>
                <div className="flex justify-end space-x-4 pt-6 mt-4 border-t dark:border-gray-600">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                    {!gradebook.isLocked && <button type="button" onClick={() => onSave(Array.from(selectedIds))} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">Guardar Desempeños</button>}
                </div>
            </div>
        </div>
    );
}

interface ObservationModalProps {
    studentName: string;
    observation: string;
    onClose: () => void;
    onSave: (observation: string) => void;
}

const ObservationModal: React.FC<ObservationModalProps> = ({ studentName, observation, onClose, onSave }) => {
    const [text, setText] = useState(observation);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg mx-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Observación para {studentName}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Esta observación aparecerá en el boletín del estudiante.</p>
                <textarea
                    rows={6}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    placeholder="Escribe una observación sobre el desempeño del estudiante..."
                />
                 <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                    <button type="button" onClick={() => onSave(text)} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">Guardar Observación</button>
                </div>
            </div>
        </div>
    )
};

// --- Icons ---
const LockClosedIcon = ({ className = '' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H3a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>;
const LockOpenIcon = ({ className = '' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 2a3 3 0 013 3v2H7V7a3 3 0 013-3z" /></svg>;

// --- Helper Functions ---
const calculateFinalScore = (studentId: number, gradebook: SubjectGrades | null): { finalScore: number | null; totalWeight: number } => {
    if (!gradebook) return { finalScore: null, totalWeight: 0 };

    const { scores, gradeItems } = gradebook;
    let weightedSum = 0;
    let totalWeight = 0;

    gradeItems.forEach(item => {
        const score = scores.find(s => s.studentId === studentId && s.gradeItemId === item.id);
        if (score && score.score !== null) {
            weightedSum += score.score * item.weight;
            totalWeight += item.weight;
        }
    });

    if (totalWeight === 0) return { finalScore: null, totalWeight: 0 };
    return { finalScore: weightedSum / totalWeight, totalWeight: totalWeight };
};

const getDesempeno = (score: number | null): Desempeno => {
    if (score === null) return Desempeno.LOW;
    if (score >= 4.6) return Desempeno.SUPERIOR;
    if (score >= 4.0) return Desempeno.HIGH;
    if (score >= 3.0) return Desempeno.BASIC;
    return Desempeno.LOW;
};

const getDesempenoClass = (desempeno: Desempeno) => {
    switch (desempeno) {
        case Desempeno.SUPERIOR: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
        case Desempeno.HIGH: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
        case Desempeno.BASIC: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
        case Desempeno.LOW: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// --- Main Component ---

interface CalificacionesProps {
  students: Student[];
  teachers: Teacher[];
  subjectGradesData: SubjectGrades[];
  setSubjectGradesData: (updater: React.SetStateAction<SubjectGrades[]>) => Promise<void>;
  currentUser: Teacher;
  viewMode?: 'teacher'; // Optional prop for specific views
  onShowSystemMessage: (message: string, type?: 'success' | 'error') => void;
}

const Calificaciones: React.FC<CalificacionesProps> = ({ students, teachers, subjectGradesData, setSubjectGradesData, currentUser, viewMode, onShowSystemMessage }) => {
    // --- State Management ---
    const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod>(ACADEMIC_PERIODS[0]);
    const [selectedSubject, setSelectedSubject] = useState<SubjectArea | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

    const [editingItem, setEditingItem] = useState<GradeItem | null>(null);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    
    const [editingObservation, setEditingObservation] = useState<{ studentId: number; studentName: string; text: string } | null>(null);
    const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
    
    const [isGeneralDesempenosModalOpen, setIsGeneralDesempenosModalOpen] = useState(false);
    const [desempenosBank, setDesempenosBank] = useState<DesempenoDescriptor[]>(MOCK_DESEMPENOS_BANK);
    
    const [editingCell, setEditingCell] = useState<{ studentId: number; itemId: string; value: string } | null>(null);
    
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [showSnackbar, setShowSnackbar] = useState('');

    // --- Derived State and Data Filtering ---
    const canAdminGrades = useMemo(() =>
        currentUser.role === Role.ADMIN ||
        currentUser.role === Role.RECTOR ||
        currentUser.role === Role.COORDINATOR,
    [currentUser.role]);

    const teacherSubjects = useMemo(() => {
        if (canAdminGrades) {
            return SUBJECT_AREAS;
        }
        return Array.from(new Set(subjectGradesData
            .filter(sg => sg.teacherId === currentUser.id)
            .map(sg => sg.subject)));
    }, [subjectGradesData, currentUser.id, canAdminGrades]);

    const availableGradeGroups = useMemo(() => {
        const gradeGroupSet = new Set<string>();
        subjectGradesData.forEach(sg => gradeGroupSet.add(`${sg.grade}|${sg.group}`));
        students.forEach(s => gradeGroupSet.add(`${s.grade}|${s.group}`));
        teachers.forEach(t => {
            if (t.isHomeroomTeacher && t.assignedGroup) {
                gradeGroupSet.add(`${t.assignedGroup.grade}|${t.assignedGroup.group}`);
            }
        });

        const allGroups = Array.from(gradeGroupSet).map(gg => {
            const [grade, group] = gg.split('|');
            return { grade, group };
        });

        if (!canAdminGrades) {
            const teacherOwnedGroups = new Set<string>();
            subjectGradesData.forEach(sg => {
                if (sg.teacherId === currentUser.id) teacherOwnedGroups.add(`${sg.grade}|${sg.group}`);
            });
             if (currentUser.isHomeroomTeacher && currentUser.assignedGroup) {
                teacherOwnedGroups.add(`${currentUser.assignedGroup.grade}|${currentUser.assignedGroup.group}`);
            }
            return allGroups.filter(gg => teacherOwnedGroups.has(`${gg.grade}|${gg.group}`));
        }

        return allGroups.sort((a, b) => {
            const gradeA = parseInt(a.grade.replace('º', ''));
            const gradeB = parseInt(b.grade.replace('º', ''));
            if (!isNaN(gradeA) && !isNaN(gradeB)) {
                if (gradeA !== gradeB) return gradeA - gradeB;
            } else {
                if (a.grade.localeCompare(b.grade) !== 0) return a.grade.localeCompare(b.grade);
            }
            return a.group.localeCompare(b.group);
        });
    }, [subjectGradesData, students, teachers, currentUser, canAdminGrades]);

    const availableGradesForSelect = useMemo(() => {
        // FIX: Explicitly type sort parameters to resolve TS error
        return Array.from(new Set(availableGradeGroups.map(gg => gg.grade))).sort((a: string, b: string) => {
            const gradeA = parseInt(a.replace('º', ''));
            const gradeB = parseInt(b.replace('º', ''));
            if (!isNaN(gradeA) && !isNaN(gradeB)) return gradeA - gradeB;
            return a.localeCompare(b);
        });
    }, [availableGradeGroups]);

    const availableGroupsForSelect = useMemo(() => {
        if (!selectedGrade) return [];
        return Array.from(new Set(availableGradeGroups.filter(gg => gg.grade === selectedGrade).map(gg => gg.group))).sort();
    }, [availableGradeGroups, selectedGrade]);

    useEffect(() => {
        if (teacherSubjects.length > 0 && !selectedSubject) {
            setSelectedSubject(teacherSubjects[0]);
        }
        if (availableGradesForSelect.length > 0 && !selectedGrade) {
            setSelectedGrade(availableGradesForSelect[0]);
        }
    }, [teacherSubjects, availableGradesForSelect, selectedSubject, selectedGrade]);

    useEffect(() => {
        if (selectedGrade && availableGroupsForSelect.length > 0) {
            if (!selectedGroup || !availableGroupsForSelect.includes(selectedGroup)) {
                setSelectedGroup(availableGroupsForSelect[0]);
            }
        } else if (selectedGrade && availableGroupsForSelect.length === 0) {
            setSelectedGroup(null);
        }
    }, [selectedGrade, availableGroupsForSelect, selectedGroup]);


    const desempenoMap = useMemo(() => new Map(desempenosBank.map(d => [d.id, d.description])), [desempenosBank]);

    const selectedGradebook = useMemo(() => {
        return subjectGradesData.find(sg =>
            sg.period === selectedPeriod &&
            sg.subject === selectedSubject &&
            sg.grade === selectedGrade &&
            sg.group === selectedGroup
        ) || null;
    }, [subjectGradesData, selectedPeriod, selectedSubject, selectedGrade, selectedGroup]);

    const classStudents = useMemo(() => {
        if (!selectedGrade || !selectedGroup) return [];
        return students
            .filter(s => s.grade === selectedGrade && s.group === selectedGroup)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [students, selectedGrade, selectedGroup]);

    // --- Handlers for Data Mutation ---
    const handleCreateGradebook = async () => {
        if (!selectedPeriod || !selectedSubject || !selectedGrade || !selectedGroup) {
            onShowSystemMessage("Por favor, selecciona todas las opciones para crear una planilla.", 'error');
            return;
        }

        const newGradebook: SubjectGrades = {
            id: `${selectedSubject}-${selectedGrade}-${selectedGroup}-${selectedPeriod}`,
            subject: selectedSubject,
            grade: selectedGrade,
            group: selectedGroup,
            period: selectedPeriod,
            teacherId: currentUser.id,
            gradeItems: [],
            scores: [],
            observations: {},
            isLocked: false,
        };

        await setSubjectGradesData(prev => {
            if (prev.some(sg => sg.id === newGradebook.id)) return prev;
            return [...prev, newGradebook];
        });
        onShowSystemMessage(`Planilla para ${selectedSubject} (${selectedGrade}-${selectedGroup}) creada exitosamente.`);
    };

    const handleUpdateGradebook = useCallback(async (updatedGradebook: SubjectGrades) => {
        await setSubjectGradesData(prev =>
            prev.map(sg => sg.id === updatedGradebook.id ? updatedGradebook : sg)
        );
    }, [setSubjectGradesData]);
    
    const handleAddDesempeno = (description: string): string => {
        if (!selectedSubject) return '';
        const newId = `d-${selectedSubject.slice(0,4).toLowerCase()}-${Date.now()}`;
        const newDesempeno: DesempenoDescriptor = {
            id: newId,
            description,
            area: selectedSubject,
        };
        setDesempenosBank(prev => [...prev, newDesempeno]);
        return newId;
    };
    
    const saveScoreChange = (studentId: number, gradeItemId: string, scoreValue: number | null) => {
        if (!selectedGradebook) return;
        const updatedScores = [...selectedGradebook.scores];
        const scoreIndex = updatedScores.findIndex(s => s.studentId === studentId && s.gradeItemId === gradeItemId);
        if (scoreIndex > -1) {
            updatedScores[scoreIndex] = { ...updatedScores[scoreIndex], score: scoreValue };
        } else {
            updatedScores.push({ studentId, gradeItemId, score: scoreValue });
        }
        handleUpdateGradebook({ ...selectedGradebook, scores: updatedScores });
    };
    
    const handleEditingInputChange = (rawValue: string) => {
        if (!editingCell) return;
        let sanitizedValue = rawValue.replace('.', ',');
        if ((sanitizedValue.match(/,/g) || []).length > 1) return;
        sanitizedValue = sanitizedValue.replace(/[^0-9,]/g, '');
        const parts = sanitizedValue.split(',');
        if (parts[1] && parts[1].length > 1) return;
        const numericValue = parseFloat(sanitizedValue.replace(',', '.'));
        if (!isNaN(numericValue) && (numericValue > 5 || (numericValue === 5 && parts[1] && parseInt(parts[1], 10) > 0))) return;
        setEditingCell({ ...editingCell, value: sanitizedValue });
    };

    const handleInputBlur = () => {
        if (!editingCell) return;
        const { studentId, itemId, value } = editingCell;
        let finalScore: number | null = null;
        if (value.trim() !== '') {
            let scoreValue = parseFloat(value.trim().replace(',', '.'));
            if (!isNaN(scoreValue)) {
                finalScore = Math.max(0, Math.min(5, scoreValue));
            }
        }
        saveScoreChange(studentId, itemId, finalScore);
        setEditingCell(null);
    };

    const handleItemSave = (item: GradeItem) => {
        if (!selectedGradebook) return;
        const existingItems = selectedGradebook.gradeItems;
        const itemIndex = existingItems.findIndex(i => i.id === item.id);
        const updatedItems = itemIndex > -1 ? existingItems.map(i => i.id === item.id ? item : i) : [...existingItems, item];
        handleUpdateGradebook({ ...selectedGradebook, gradeItems: updatedItems });
        setIsItemModalOpen(false);
        setEditingItem(null);
    };
    
    const handleItemDelete = (itemId: string) => {
        if (!selectedGradebook || selectedGradebook.isLocked) return;
        if (confirm("¿Estás seguro de que quieres eliminar este ítem? Todas las notas asociadas se perderán.")) {
            const updatedItems = selectedGradebook.gradeItems.filter(i => i.id !== itemId);
            const updatedScores = selectedGradebook.scores.filter(s => s.gradeItemId !== itemId);
            handleUpdateGradebook({ ...selectedGradebook, gradeItems: updatedItems, scores: updatedScores });
        }
    };
    
    const handleObservationSave = (text: string) => {
        if (!selectedGradebook || !editingObservation || selectedGradebook.isLocked) return;
        const updatedObservations = { ...selectedGradebook.observations, [editingObservation.studentId]: text };
        handleUpdateGradebook({ ...selectedGradebook, observations: updatedObservations });
        setIsObservationModalOpen(false);
        setEditingObservation(null);
    };

    const handleGeneralDesempenosSave = (desempenoIds: string[]) => {
        if (!selectedGradebook) return;
        handleUpdateGradebook({ ...selectedGradebook, generalDesempenoIds: desempenoIds });
        setIsGeneralDesempenosModalOpen(false);
    };
    
    const handleLockToggle = async (locked: boolean) => {
        if (!selectedGradebook) return;
        await handleUpdateGradebook({ ...selectedGradebook, isLocked: locked });
        setShowSnackbar(`La planilla ha sido ${locked ? 'CERRADA' : 'ABIERTA'}.`);
        setTimeout(() => setShowSnackbar(''), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Gestor de Calificaciones</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value as AcademicPeriod)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                            {ACADEMIC_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                         <select value={selectedSubject || ''} onChange={e => setSelectedSubject(e.target.value as SubjectArea)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" disabled={teacherSubjects.length === 0}>
                            {teacherSubjects.length > 0 ? teacherSubjects.map(s => <option key={s} value={s}>{s}</option>) : <option>No hay asignaturas</option>}
                        </select>
                        <select value={selectedGrade || ''} onChange={e => setSelectedGrade(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" disabled={availableGradesForSelect.length === 0}>
                           {availableGradesForSelect.length > 0 ? availableGradesForSelect.map(g => <option key={g} value={g}>{g}</option>) : <option>No hay grados</option>}
                        </select>
                        <select value={selectedGroup || ''} onChange={e => setSelectedGroup(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" disabled={availableGroupsForSelect.length === 0}>
                           {availableGroupsForSelect.length > 0 ? availableGroupsForSelect.map(g => <option key={g} value={g}>{g}</option>) : <option>No hay grupos</option>}
                        </select>
                    </div>
                </div>

                {!selectedGradebook && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">No hay una planilla de calificaciones configurada para esta selección.</p>
                        {(!viewMode || canAdminGrades) && <button onClick={handleCreateGradebook} className="mt-4 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus" disabled={!selectedGrade || !selectedGroup || !selectedSubject}>Crear Planilla</button>}
                    </div>
                )}
                
                 {viewMode === 'teacher' && selectedGradebook?.isLocked && (
                    <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 rounded-md flex items-center gap-3">
                        <LockClosedIcon className="h-6 w-6" />
                        <div><p className="font-bold">Planilla Cerrada</p><p className="text-sm">Esta planilla ha sido cerrada por la administración. No se pueden realizar modificaciones.</p></div>
                    </div>
                )}

                {selectedGradebook && (
                    <>
                        <div className="flex flex-col md:flex-row justify-between items-start mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-primary dark:text-secondary">{selectedSubject} - {selectedGrade} {selectedGroup}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Período: {selectedPeriod} | Total Ítems: {selectedGradebook.gradeItems.length}</p>
                                <div className="mt-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Desempeños del Periodo:</h4>
                                        <button onClick={() => setIsGeneralDesempenosModalOpen(true)} className="text-xs font-semibold text-primary dark:text-secondary hover:underline">Gestionar</button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedGradebook.generalDesempenoIds?.map(id => (<span key={id} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs px-2 py-1 rounded-full">{desempenoMap.get(id) || '...'}</span>)) || <span className="text-xs text-gray-500 italic">No asignados</span>}
                                    </div>
                                </div>
                            </div>
                            {canAdminGrades && viewMode !== 'teacher' && (
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{selectedGradebook.isLocked ? "Planilla Cerrada" : "Planilla Abierta"}</span>
                                    <button onClick={() => handleLockToggle(!selectedGradebook.isLocked)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${selectedGradebook.isLocked ? 'bg-red-500' : 'bg-green-500'}`}><span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${selectedGradebook.isLocked ? 'translate-x-1' : 'translate-x-6'}`} /></button>
                                </div>
                            )}
                        </div>

                        <div ref={tableContainerRef} className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-left sticky left-0 bg-gray-100 dark:bg-gray-700 w-48">Estudiante</th>
                                        {selectedGradebook.gradeItems.map(item => (
                                            <th key={item.id} className="px-4 py-3 text-center min-w-[150px]">
                                                <div className="flex flex-col">
                                                    <span>{item.name}</span>
                                                    <span className="font-normal text-gray-500 dark:text-gray-400">({(item.weight * 100).toFixed(0)}%)</span>
                                                    <div className="mt-1 flex flex-wrap justify-center gap-1">{item.desempenoIds?.map(id => (<span key={id} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-[10px] px-1.5 py-0.5 rounded-full" title={desempenoMap.get(id)}>{desempenoMap.get(id)?.substring(0, 15) + (desempenoMap.get(id)!.length > 15 ? '...' : '')}</span>))}</div>
                                                     {!selectedGradebook.isLocked && (<div className="flex justify-center items-center mt-1"><button onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }} className="text-blue-500 hover:underline text-xs">Editar</button><span className="mx-1 text-gray-300">|</span><button onClick={() => handleItemDelete(item.id)} className="text-red-500 hover:underline text-xs">Eliminar</button></div>)}
                                                </div>
                                            </th>
                                        ))}
                                        {!selectedGradebook.isLocked && (!viewMode || canAdminGrades) && (<th className="px-4 py-3 min-w-[100px] text-center"><button onClick={() => { setEditingItem(null); setIsItemModalOpen(true); }} className="w-full h-full bg-primary/20 text-primary dark:bg-secondary/20 dark:text-secondary rounded-md p-2 hover:bg-primary/30 text-xs font-semibold">+ Ítem</button></th>)}
                                        <th className="px-4 py-3 text-center font-semibold min-w-[100px]">Final</th>
                                        <th className="px-4 py-3 text-center font-semibold min-w-[100px]">Desempeño</th>
                                        <th className="px-4 py-3 text-center font-semibold min-w-[120px]">Observaciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {classStudents.map(student => {
                                        const { finalScore } = calculateFinalScore(student.id, selectedGradebook);
                                        const desempeno = getDesempeno(finalScore);
                                        const observation = selectedGradebook.observations[student.id] || '';
                                        return (
                                            <tr key={student.id}>
                                                <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-gray-800 w-48">{student.name}</td>
                                                {selectedGradebook.gradeItems.map(item => {
                                                    const isEditingThisCell = editingCell?.studentId === student.id && editingCell?.itemId === item.id;
                                                    const score = selectedGradebook.scores.find(s => s.studentId === student.id && s.gradeItemId === item.id)?.score;
                                                    const displayValue = isEditingThisCell ? editingCell.value : (score !== null && score !== undefined ? score.toFixed(1).replace('.', ',') : '');
                                                    return (
                                                        <td key={item.id} className="px-4 py-2 text-center">
                                                            <input type="text" inputMode="decimal" value={displayValue} onFocus={() => !selectedGradebook.isLocked && setEditingCell({ studentId: student.id, itemId: item.id, value: score === null || score === undefined ? '' : score.toFixed(1).replace('.', ',') })} onChange={(e) => handleEditingInputChange(e.target.value)} onBlur={handleInputBlur} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} disabled={selectedGradebook.isLocked} className={`w-16 p-1 text-center border rounded-md bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-200 ${selectedGradebook.isLocked ? 'border-gray-200 dark:border-gray-600' : 'border-gray-300 dark:border-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent'} disabled:cursor-not-allowed disabled:bg-gray-200`}/>
                                                        </td>
                                                    )
                                                })}
                                                {!selectedGradebook.isLocked && (!viewMode || canAdminGrades) && <td></td>}
                                                <td className="px-4 py-2 text-center font-bold text-gray-900 dark:text-gray-100">{finalScore !== null ? finalScore.toFixed(2) : 'N/A'}</td>
                                                <td className="px-4 py-2 text-center"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDesempenoClass(desempeno)}`}>{desempeno}</span></td>
                                                 <td className="px-4 py-2 text-center"><button onClick={() => { setEditingObservation({ studentId: student.id, studentName: student.name, text: observation }); setIsObservationModalOpen(true); }} disabled={selectedGradebook.isLocked} className="text-primary dark:text-secondary hover:underline text-xs disabled:text-gray-400 disabled:no-underline">{observation ? 'Editar' : 'Añadir'}</button></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                             {classStudents.length === 0 && <p className="text-center text-gray-500 py-8">No hay estudiantes en este grupo.</p>}
                        </div>
                    </>
                )}
            </div>
            
            {isItemModalOpen && selectedGradebook && (<ItemModal item={editingItem} existingItems={selectedGradebook.gradeItems} desempenosBank={desempenosBank} subject={selectedGradebook.subject} onClose={() => setIsItemModalOpen(false)} onSave={handleItemSave} onAddDesempeno={handleAddDesempeno} />)}
            {isGeneralDesempenosModalOpen && selectedGradebook && (<GeneralDesempenosModal gradebook={selectedGradebook} desempenosBank={desempenosBank} onClose={() => setIsGeneralDesempenosModalOpen(false)} onSave={handleGeneralDesempenosSave} onAddDesempeno={handleAddDesempeno} />)}
            {isObservationModalOpen && editingObservation && (<ObservationModal studentName={editingObservation.studentName} observation={editingObservation.text} onClose={() => setIsObservationModalOpen(false)} onSave={handleObservationSave} />)}
            {showSnackbar && (<div className="fixed bottom-6 right-6 bg-gray-800 text-white py-3 px-6 rounded-lg shadow-lg z-50 animate-fade-in-up">{showSnackbar}</div>)}
        </div>
    );
};

export default Calificaciones;
