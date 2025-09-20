import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Student, SubjectGrades, GradeItem, AcademicPeriod, SubjectArea, Teacher } from '../types';
import { Role, Desempeno } from '../types';
import { ACADEMIC_PERIODS, SUBJECT_AREAS, GRADES, GROUPS, GRADE_GROUP_MAP } from '../constants';

// --- Helper Components (Modals) ---

interface ItemModalProps {
    item: GradeItem | null;
    existingItems: GradeItem[];
    onClose: () => void;
    onSave: (item: GradeItem) => void;
}

const ItemModal: React.FC<ItemModalProps> = ({ item, existingItems, onClose, onSave }) => {
    const [name, setName] = useState(item?.name || '');
    const [weight, setWeight] = useState(item?.weight ? item.weight * 100 : 25);
    const totalWeight = useMemo(() => {
        return existingItems.reduce((acc, current) => acc + (current.id === item?.id ? 0 : current.weight), 0);
    }, [existingItems, item]);

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
        });
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md mx-4">
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
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                        <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    )
};

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
}

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
    if (score === null) return Desempeno.BAJO;
    if (score >= 4.6) return Desempeno.SUPERIOR;
    if (score >= 4.0) return Desempeno.ALTO;
    if (score >= 3.0) return Desempeno.BASICO;
    return Desempeno.BAJO;
};

const getDesempenoClass = (desempeno: Desempeno) => {
    switch (desempeno) {
        case Desempeno.SUPERIOR: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
        case Desempeno.ALTO: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
        case Desempeno.BASICO: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
        case Desempeno.BAJO: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
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
    
    // New state for robust grade input
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

        // From existing gradebooks
        subjectGradesData.forEach(sg => {
            gradeGroupSet.add(`${sg.grade}|${sg.group}`);
        });

        // From students list
        students.forEach(s => {
            gradeGroupSet.add(`${s.grade}|${s.group}`);
        });

        // From homeroom teachers
        teachers.forEach(t => {
            if (t.isHomeroomTeacher && t.assignedGroup) {
                gradeGroupSet.add(`${t.assignedGroup.grade}|${t.assignedGroup.group}`);
            }
        });

        const allGroups = Array.from(gradeGroupSet).map(gg => {
            const [grade, group] = gg.split('|');
            return { grade, group };
        });

        // Filter for regular teachers to only see their groups
        if (!canAdminGrades) {
            const teacherOwnedGroups = new Set<string>();
            subjectGradesData.forEach(sg => {
                if (sg.teacherId === currentUser.id) {
                    teacherOwnedGroups.add(`${sg.grade}|${sg.group}`);
                }
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


    useEffect(() => {
        if (teacherSubjects.length > 0 && !selectedSubject) {
            setSelectedSubject(teacherSubjects[0]);
        }
        if (availableGradeGroups.length > 0 && (!selectedGrade || !selectedGroup)) {
            const firstGroup = availableGradeGroups[0];
            setSelectedGrade(firstGroup.grade);
            setSelectedGroup(firstGroup.group);
        }
    }, [teacherSubjects, availableGradeGroups, selectedSubject, selectedGrade, selectedGroup]);


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
            if (prev.some(sg => sg.id === newGradebook.id)) {
                return prev;
            }
            return [...prev, newGradebook];
        });
        onShowSystemMessage(`Planilla para ${selectedSubject} (${selectedGrade}-${selectedGroup}) creada exitosamente.`);
    };

    const handleUpdateGradebook = useCallback(async (updatedGradebook: SubjectGrades) => {
        await setSubjectGradesData(prev =>
            prev.map(sg => sg.id === updatedGradebook.id ? updatedGradebook : sg)
        );
    }, [setSubjectGradesData]);
    
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
        if (!isNaN(numericValue)) {
            if (numericValue > 5) return;
            if (numericValue === 5 && parts[1] && parseInt(parts[1], 10) > 0) return;
        }

        setEditingCell({ ...editingCell, value: sanitizedValue });
    };

    const handleInputBlur = () => {
        if (!editingCell) return;
        const { studentId, itemId, value } = editingCell;
        
        let finalScore: number | null = null;
        if (value.trim() !== '') {
            let scoreValue = parseFloat(value.trim().replace(',', '.'));
            if (!isNaN(scoreValue)) {
                scoreValue = Math.max(0, Math.min(5, scoreValue));
                finalScore = scoreValue;
            }
        }
        
        saveScoreChange(studentId, itemId, finalScore);
        setEditingCell(null);
    };

    const handleItemSave = (item: GradeItem) => {
        if (!selectedGradebook) return;
        const existingItems = selectedGradebook.gradeItems;
        const itemIndex = existingItems.findIndex(i => i.id === item.id);
        let updatedItems: GradeItem[];

        if (itemIndex > -1) {
            updatedItems = existingItems.map(i => i.id === item.id ? item : i);
        } else {
            updatedItems = [...existingItems, item];
        }
        
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
        const updatedObservations = {
            ...selectedGradebook.observations,
            [editingObservation.studentId]: text,
        };
        handleUpdateGradebook({ ...selectedGradebook, observations: updatedObservations });
        setIsObservationModalOpen(false);
        setEditingObservation(null);
    };
    
    const handleLockToggle = async (locked: boolean) => {
        if (!selectedGradebook) return;
        const updatedGradebook = { ...selectedGradebook, isLocked: locked };
        await handleUpdateGradebook(updatedGradebook);
        setShowSnackbar(`La planilla ha sido ${locked ? 'CERRADA' : 'ABIERTA'}.`);
        setTimeout(() => setShowSnackbar(''), 3000);
    };

    const getGradeSelectorOptions = () => {
        return availableGradeGroups.map(gg => (
            <option key={`${gg.grade}-${gg.group}`} value={`${gg.grade}|${gg.group}`}>
                {`${gg.grade} - Grupo ${gg.group}`}
            </option>
        ));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Gestor de Calificaciones</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={selectedPeriod}
                            onChange={e => setSelectedPeriod(e.target.value as AcademicPeriod)}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        >
                            {ACADEMIC_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                         <select
                            value={selectedSubject || ''}
                            onChange={e => setSelectedSubject(e.target.value as SubjectArea)}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            disabled={teacherSubjects.length === 0}
                        >
                            {teacherSubjects.length > 0 ? teacherSubjects.map(s => <option key={s} value={s}>{s}</option>) : <option>No hay asignaturas</option>}
                        </select>
                        <select
                            value={`${selectedGrade || ''}|${selectedGroup || ''}`}
                            onChange={e => {
                                const [grade, group] = e.target.value.split('|');
                                setSelectedGrade(grade);
                                setSelectedGroup(group);
                            }}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            disabled={availableGradeGroups.length === 0}
                        >
                           {availableGradeGroups.length > 0 ? getGradeSelectorOptions() : <option>No hay grupos</option>}
                        </select>
                    </div>
                </div>

                {!selectedGradebook && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">No hay una planilla de calificaciones configurada para esta selección.</p>
                        {(!viewMode || canAdminGrades) && (
                            <button
                                onClick={handleCreateGradebook}
                                className="mt-4 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus"
                                disabled={!selectedGrade || !selectedGroup || !selectedSubject}
                            >
                                Crear Planilla
                            </button>
                        )}
                    </div>
                )}
                
                 {viewMode === 'teacher' && selectedGradebook?.isLocked && (
                    <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 rounded-md flex items-center gap-3">
                        <LockClosedIcon className="h-6 w-6" />
                        <div>
                            <p className="font-bold">Planilla Cerrada</p>
                            <p className="text-sm">Esta planilla ha sido cerrada por la administración. No se pueden realizar modificaciones.</p>
                        </div>
                    </div>
                )}


                {selectedGradebook && (
                    <>
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-primary dark:text-secondary">
                                    {selectedSubject} - {selectedGrade} {selectedGroup}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Período: {selectedPeriod} | Total Ítems: {selectedGradebook.gradeItems.length}
                                </p>
                            </div>
                            
                            {canAdminGrades && viewMode !== 'teacher' && (
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{selectedGradebook.isLocked ? "Planilla Cerrada" : "Planilla Abierta"}</span>
                                    <button onClick={() => handleLockToggle(!selectedGradebook.isLocked)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${selectedGradebook.isLocked ? 'bg-red-500' : 'bg-green-500'}`}>
                                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${selectedGradebook.isLocked ? 'translate-x-1' : 'translate-x-6'}`} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div ref={tableContainerRef} className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                {/* Table Header */}
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-left sticky left-0 bg-gray-100 dark:bg-gray-700 w-48">Estudiante</th>
                                        {selectedGradebook.gradeItems.map(item => (
                                            <th key={item.id} className="px-4 py-3 text-center min-w-[120px]">
                                                <div className="flex flex-col">
                                                    <span>{item.name}</span>
                                                    <span className="font-normal text-gray-500 dark:text-gray-400">({(item.weight * 100).toFixed(0)}%)</span>
                                                     {!selectedGradebook.isLocked && (
                                                        <div className="flex justify-center items-center mt-1">
                                                            <button onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }} className="text-blue-500 hover:underline text-xs">Editar</button>
                                                            <span className="mx-1 text-gray-300">|</span>
                                                            <button onClick={() => handleItemDelete(item.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        {!selectedGradebook.isLocked && (!viewMode || canAdminGrades) && (
                                            <th className="px-4 py-3 min-w-[100px] text-center">
                                                <button onClick={() => { setEditingItem(null); setIsItemModalOpen(true); }} className="w-full h-full bg-primary/20 text-primary dark:bg-secondary/20 dark:text-secondary rounded-md p-2 hover:bg-primary/30 text-xs font-semibold">+ Ítem</button>
                                            </th>
                                        )}
                                        <th className="px-4 py-3 text-center font-semibold min-w-[100px]">Final</th>
                                        <th className="px-4 py-3 text-center font-semibold min-w-[100px]">Desempeño</th>
                                        <th className="px-4 py-3 text-center font-semibold min-w-[120px]">Observaciones</th>
                                    </tr>
                                </thead>
                                {/* Table Body */}
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
                                                    
                                                    let displayValue = '';
                                                    if (isEditingThisCell) {
                                                        displayValue = editingCell.value;
                                                    } else if (score !== null && score !== undefined) {
                                                        displayValue = score.toFixed(1).replace('.', ',');
                                                    }

                                                    return (
                                                        <td key={item.id} className="px-4 py-2 text-center">
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={displayValue}
                                                                onFocus={() => {
                                                                    if (selectedGradebook.isLocked) return;
                                                                    setEditingCell({
                                                                        studentId: student.id,
                                                                        itemId: item.id,
                                                                        // FIX: Called toFixed on a string. Should be called on the number.
                                                                        value: score === null || score === undefined ? '' : score.toFixed(1).replace('.', ','),
                                                                    });
                                                                }}
                                                                onChange={(e) => handleEditingInputChange(e.target.value)}
                                                                onBlur={handleInputBlur}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                                                disabled={selectedGradebook.isLocked}
                                                                className={`w-16 p-1 text-center border rounded-md bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-200 ${selectedGradebook.isLocked ? 'border-gray-200 dark:border-gray-600' : 'border-gray-300 dark:border-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent'} disabled:cursor-not-allowed disabled:bg-gray-200`}
                                                            />
                                                        </td>
                                                    )
                                                })}
                                                {!selectedGradebook.isLocked && (!viewMode || canAdminGrades) && <td></td>}
                                                <td className="px-4 py-2 text-center font-bold text-gray-900 dark:text-gray-100">{finalScore !== null ? finalScore.toFixed(2) : 'N/A'}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDesempenoClass(desempeno)}`}>
                                                        {desempeno}
                                                    </span>
                                                </td>
                                                 <td className="px-4 py-2 text-center">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingObservation({ studentId: student.id, studentName: student.name, text: observation });
                                                            setIsObservationModalOpen(true);
                                                        }}
                                                        disabled={selectedGradebook.isLocked}
                                                        className="text-primary dark:text-secondary hover:underline text-xs disabled:text-gray-400 disabled:no-underline"
                                                    >
                                                        {observation ? 'Editar' : 'Añadir'}
                                                    </button>
                                                </td>
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
            
            {/* Modals */}
            {isItemModalOpen && selectedGradebook && (
                <ItemModal item={editingItem} existingItems={selectedGradebook.gradeItems} onClose={() => setIsItemModalOpen(false)} onSave={handleItemSave} />
            )}
            {isObservationModalOpen && editingObservation && (
                <ObservationModal
                    studentName={editingObservation.studentName}
                    observation={editingObservation.text}
                    onClose={() => setIsObservationModalOpen(false)}
                    onSave={handleObservationSave}
                />
            )}
            
            {/* Snackbar */}
            {showSnackbar && (
                <div className="fixed bottom-6 right-6 bg-gray-800 text-white py-3 px-6 rounded-lg shadow-lg z-50 animate-fade-in-up">
                    {showSnackbar}
                </div>
            )}
        </div>
    );
};

export default Calificaciones;