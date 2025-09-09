





import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Student, SubjectGrades, GradeItem, AcademicPeriod, SubjectArea, Teacher, InstitutionProfileData } from '../types';
import { Role, Desempeno } from '../types';
import { ACADEMIC_PERIODS, SUBJECT_AREAS, GRADES, GROUPS, MOCK_INSTITUTION_PROFILE, GRADE_GROUP_MAP } from '../constants';

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
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md mx-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{item ? 'Editar' : 'Añadir'} Ítem de Calificación</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Ítem</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900" placeholder="Ej: Examen Parcial" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Peso / Porcentaje (%)</label>
                        <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900" placeholder="Ej: 25" />
                    </div>
                    <div className="text-sm text-gray-600">
                        <p>Peso total de los demás ítems: <span className="font-bold">{(totalWeight * 100).toFixed(0)}%</span></p>
                         <p>Peso total con este ítem: <span className="font-bold">{((totalWeight + (weight/100)) * 100).toFixed(0)}%</span></p>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">Cancelar</button>
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
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg mx-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Observación para {studentName}</h2>
                <p className="text-gray-600 mb-6">Esta observación aparecerá en el boletín del estudiante.</p>
                <textarea
                    rows={6}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    placeholder="Escribe una observación sobre el desempeño del estudiante..."
                />
                 <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">Cancelar</button>
                    <button type="button" onClick={() => onSave(text)} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">Guardar Observación</button>
                </div>
            </div>
        </div>
    )
}

// --- Icons ---
const LockClosedIcon = ({ className = '' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H3a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>;
const LockOpenIcon = ({ className = '' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 2a3 3 0 013 3v2H7V7a3 3 0 013-3z" /></svg>;


// --- Main Component ---

interface CalificacionesProps {
    students: Student[];
    subjectGradesData: SubjectGrades[];
    setSubjectGradesData: React.Dispatch<React.SetStateAction<SubjectGrades[]>>;
    currentUser: Teacher;
    viewMode?: 'full' | 'teacher';
}

const calculateFinalScoreForSubject = (studentId: number, gradebook: SubjectGrades): number | null => {
    if (!gradebook) return null;
    const studentScores = gradebook.scores.filter(s => s.studentId === studentId);
    if (studentScores.length === 0) return null;

    const totalScore = studentScores.reduce((acc, score) => {
        const item = gradebook.gradeItems.find(i => i.id === score.gradeItemId);
        if (item && score.score !== null) {
            return acc + (score.score * item.weight);
        }
        return acc;
    }, 0);
    
    const totalWeight = studentScores.reduce((acc, score) => {
         const item = gradebook.gradeItems.find(i => i.id === score.gradeItemId);
         if (item && score.score !== null) return acc + item.weight;
         return acc;
    }, 0);

    return totalWeight > 0 ? totalScore / totalWeight : null;
};

const getDesempeno = (score: number | null): Desempeno => {
    if (score === null) return Desempeno.BAJO;
    if (score >= 4.6) return Desempeno.SUPERIOR;
    if (score >= 4.0) return Desempeno.ALTO;
    if (score >= 3.0) return Desempeno.BASICO;
    return Desempeno.BAJO;
};

const Calificaciones: React.FC<CalificacionesProps> = ({ students, subjectGradesData, setSubjectGradesData, currentUser, viewMode = 'full' }) => {
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<GradeItem | null>(null);

    const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
    const [editingObservation, setEditingObservation] = useState<{ studentId: number; studentName: string, text: string } | null>(null);
    
    const [editingCell, setEditingCell] = useState<string | null>(null); // "studentId-itemId"
    const [editingValue, setEditingValue] = useState('');

    const [institutionProfile] = useState<InstitutionProfileData>(() => {
        const savedProfile = localStorage.getItem('institutionProfile');
        return savedProfile ? JSON.parse(savedProfile) : MOCK_INSTITUTION_PROFILE;
    });

    const isPowerUser = useMemo(() => 
        [Role.COORDINATOR, Role.RECTOR, Role.ADMIN].includes(currentUser.role),
        [currentUser.role]
    );

    const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod>(ACADEMIC_PERIODS[0]);
    const [selectedSubject, setSelectedSubject] = useState<SubjectArea>(currentUser.subject);
    const [selectedGrade, setSelectedGrade] = useState<string>(GRADES[0]);
    const [selectedGroup, setSelectedGroup] = useState<string>(GRADE_GROUP_MAP[GRADES[0]][0]);
    
    const availableGroupsForGrade = useMemo(() => {
        return GRADE_GROUP_MAP[selectedGrade] || [];
    }, [selectedGrade]);

    useEffect(() => {
        const groupsForSelectedGrade = GRADE_GROUP_MAP[selectedGrade] || [];
        if (groupsForSelectedGrade.length > 0) {
            // Check if the current group is valid for the new grade
            if (!groupsForSelectedGrade.includes(selectedGroup)) {
                setSelectedGroup(groupsForSelectedGrade[0]);
            }
        } else {
            setSelectedGroup('');
        }
    }, [selectedGrade, selectedGroup]);

    useEffect(() => {
        setIsObservationModalOpen(!!editingObservation);
    }, [editingObservation]);

    const currentGradebook = useMemo(() => 
        subjectGradesData.find(sg => 
            sg.period === selectedPeriod &&
            sg.subject === selectedSubject &&
            sg.grade === selectedGrade &&
            sg.group === selectedGroup
        ), 
    [subjectGradesData, selectedPeriod, selectedSubject, selectedGrade, selectedGroup]);

    const filteredStudents = useMemo(() => 
        students.filter(s => s.grade === selectedGrade && s.group === selectedGroup),
    [students, selectedGrade, selectedGroup]);

    const handleUpdateGradebook = (updatedGradebook: SubjectGrades) => {
        setSubjectGradesData(prev => prev.map(sg => sg.id === updatedGradebook.id ? updatedGradebook : sg));
    };

    const handleCreateGradebook = () => {
        if (!selectedGrade || !selectedGroup || !selectedSubject || !selectedPeriod) {
            alert("Por favor, selecciona período, materia, grado y grupo para crear una planilla.");
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
        
        setSubjectGradesData(prev => [...prev, newGradebook]);
    };
    
    const handleToggleLockPeriod = () => {
        if (!currentGradebook) return;
        const confirmationText = currentGradebook.isLocked
            ? "¿Estás seguro de que quieres HABILITAR la subida de notas para este período?"
            : "¿Estás seguro de que quieres DESHABILITAR la subida de notas para este período? Los docentes ya no podrán modificar las calificaciones.";
        if (window.confirm(confirmationText)) {
            handleUpdateGradebook({ ...currentGradebook, isLocked: !currentGradebook.isLocked });
        }
    };

    const handleScoreFocus = (studentId: number, itemId: string, score: number | null) => {
        setEditingCell(`${studentId}-${itemId}`);
        setEditingValue(score === null ? '' : String(score).replace('.', ','));
    };
    
    const handleScoreBlur = () => {
        if (!editingCell) return;
        const [studentIdStr, itemId] = editingCell.split('-');
        const studentId = parseInt(studentIdStr, 10);
    
        let valueToProcess = editingValue.replace(',', '.').trim();
    
        // Auto-format single digits (e.g., "5" becomes "5.0")
        if (/^[0-5]$/.test(valueToProcess)) {
            valueToProcess = `${valueToProcess}.0`;
        }
    
        const scoreValue = valueToProcess === '' ? null : parseFloat(valueToProcess);
    
        if (scoreValue !== null && (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 5)) {
            alert("La nota debe ser un número entre 0.0 y 5.0.");
        } else if (currentGradebook) {
            const updatedScores = [...currentGradebook.scores];
            const scoreIndex = updatedScores.findIndex(s => s.studentId === studentId && s.gradeItemId === itemId);
    
            if (scoreIndex !== -1) {
                if (scoreValue === null) {
                    updatedScores.splice(scoreIndex, 1);
                } else {
                    updatedScores[scoreIndex].score = scoreValue;
                }
            } else if (scoreValue !== null) {
                updatedScores.push({ studentId, gradeItemId: itemId, score: scoreValue });
            }
            handleUpdateGradebook({ ...currentGradebook, scores: updatedScores });
        }
        setEditingCell(null);
    };

    const handleSaveItem = (item: GradeItem) => {
        if (!currentGradebook) return;
        const updatedItems = [...currentGradebook.gradeItems];
        const itemIndex = updatedItems.findIndex(i => i.id === item.id);
        if (itemIndex !== -1) {
            updatedItems[itemIndex] = item;
        } else {
            updatedItems.push(item);
        }
        handleUpdateGradebook({ ...currentGradebook, gradeItems: updatedItems });
        setIsItemModalOpen(false);
        setEditingItem(null);
    };
    
    const handleDeleteItem = (itemId: string) => {
        if (!currentGradebook) return;
        if (window.confirm("¿Estás seguro de que quieres eliminar este ítem de calificación? Todas las notas asociadas se perderán permanentemente.")) {
            const updatedItems = currentGradebook.gradeItems.filter(i => i.id !== itemId);
            const updatedScores = currentGradebook.scores.filter(s => s.gradeItemId !== itemId);
            handleUpdateGradebook({ ...currentGradebook, gradeItems: updatedItems, scores: updatedScores });
        }
    };

    const handleSaveObservation = (text: string) => {
        if (!currentGradebook || !editingObservation) return;
        const updatedObservations = { ...currentGradebook.observations, [editingObservation.studentId]: text };
        handleUpdateGradebook({ ...currentGradebook, observations: updatedObservations });
        setEditingObservation(null);
    }
    
    const generatePlanillaHTML = () => {
        if (!currentGradebook) return '';
        const itemsHeader = currentGradebook.gradeItems.map(item => `<th style="min-width: 80px; text-align: center;">${item.name}<br>(${item.weight * 100}%)</th>`).join('');
        const studentRows = filteredStudents.map((student, index) => {
            const itemCells = currentGradebook.gradeItems.map(item => {
                const score = currentGradebook.scores.find(s => s.studentId === student.id && s.gradeItemId === item.id)?.score;
                return `<td style="text-align: center;">${score?.toFixed(2) ?? '-'}</td>`;
            }).join('');
            const finalScore = calculateFinalScoreForSubject(student.id, currentGradebook);
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${student.name}</td>
                    ${itemCells}
                    <td style="font-weight: bold; text-align: center;">${finalScore?.toFixed(2) ?? 'N/A'}</td>
                </tr>
            `;
        }).join('');

        return `
            <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Planilla de Calificaciones</title>
            <style>body{font-family:sans-serif;margin:20px}h1,h2,h3{color:#005A9C}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:8px}thead{background-color:#f2f2f2}tbody tr:nth-child(even){background-color:#f9f9f9}</style>
            </head><body>
                <h1>${institutionProfile.name}</h1>
                <h2>Planilla de Calificaciones</h2>
                <h3>${currentGradebook.subject} - ${selectedGrade} Grupo ${selectedGroup} - ${currentGradebook.period}</h3>
                <table>
                    <thead><tr><th style="width: 30px;">#</th><th style="text-align: left;">Estudiante</th>${itemsHeader}<th>Definitiva</th></tr></thead>
                    <tbody>${studentRows}</tbody>
                </table>
            </body></html>
        `;
    };
    
    const generateBoletinHTML = () => {
        const gradebooksForClass = subjectGradesData.filter(
            sg => sg.grade === selectedGrade && sg.group === selectedGroup && sg.period === selectedPeriod
        );

        if (gradebooksForClass.length === 0) {
            alert(`No se encontraron datos de calificaciones para ${selectedGrade}-${selectedGroup} en el ${selectedPeriod}.`);
            return '';
        }

        const reports = filteredStudents.map(student => {
            const subjectRows = gradebooksForClass.map(gb => {
                const finalScore = calculateFinalScoreForSubject(student.id, gb);
                const desempeno = getDesempeno(finalScore);
                const observation = gb.observations[student.id] || '';
                
                return `
                    <tr>
                        <td>${gb.subject}</td>
                        <td style="text-align: center; font-weight: bold;">${finalScore?.toFixed(2) ?? '-'}</td>
                        <td style="text-align: center;">${desempeno}</td>
                        <td>${observation}</td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="boletin">
                    <div class="header">
                        <img src="${institutionProfile.logoUrl}" alt="logo" style="width: 80px; height: 80px;">
                        <div>
                            <h1>${institutionProfile.name}</h1>
                            <h2>Boletín de Calificaciones</h2>
                        </div>
                    </div>
                    <p><strong>Estudiante:</strong> ${student.name}</p>
                    <p><strong>Grado:</strong> ${selectedGrade} - Grupo ${selectedGroup}</p>
                    <p><strong>Período:</strong> ${selectedPeriod}</p>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Asignatura</th>
                                <th>Nota Final</th>
                                <th>Desempeño</th>
                                <th>Observaciones del Docente</th>
                            </tr>
                        </thead>
                        <tbody>${subjectRows}</tbody>
                    </table>
                     <div class="signatures">
                        <div>
                            <p>_________________________</p>
                            <p><strong>${currentUser.name}</strong></p>
                            <p>Director(a) de Grupo</p>
                        </div>
                        <div>
                            <p>_________________________</p>
                            <p><strong>${institutionProfile.rector}</strong></p>
                             <p>Rector(a)</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Boletines ${selectedGrade}-${selectedGroup}</title>
            <style>
                body{font-family:sans-serif;margin:20px;font-size:12px;color:#333}
                .boletin{border:2px solid #005A9C;padding:20px;margin-bottom:20px;page-break-after:always}
                .header{display:flex;align-items:center;gap:20px;border-bottom:1px solid #ccc;padding-bottom:10px;margin-bottom:10px}
                h1,h2{color:#005A9C;margin:0} h1{font-size:22px} h2{font-size:16px}
                table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ccc;padding:8px;vertical-align:top}thead{background-color:#f2f2f2}
                .signatures{display:flex;justify-content:space-around;margin-top:80px;text-align:center;}
                .signatures p{margin:0;}
            </style>
            </head><body>${reports}</body></html>`;
    };

    const handleGenerateReport = (type: 'planilla' | 'boletin') => {
        const htmlContent = type === 'planilla' ? generatePlanillaHTML() : generateBoletinHTML();
        if (htmlContent) {
            const reportWindow = window.open("", "_blank");
            reportWindow?.document.write(htmlContent);
            reportWindow?.document.close();
        }
    };
    
    const formatScoreForDisplay = (score: number | null | undefined): string => {
        if (score === null || score === undefined) return '';
        return score.toFixed(1).replace('.', ',');
    };

    const canEdit = !currentGradebook?.isLocked || isPowerUser;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Tablero de Calificaciones</h1>
            
            <div className="bg-white p-4 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value as AcademicPeriod)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                    {ACADEMIC_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value as SubjectArea)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                    {SUBJECT_AREAS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                    {availableGroupsForGrade.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>

            {currentGradebook ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-4 flex flex-wrap justify-between items-center gap-4 border-b">
                        <div className="flex items-center gap-2">
                           {currentGradebook.isLocked ? <LockClosedIcon className="h-6 w-6 text-red-500" /> : <LockOpenIcon className="h-6 w-6 text-green-500" />}
                           <h2 className="text-xl font-bold">Planilla de {currentGradebook.subject}</h2>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                             <button onClick={() => handleGenerateReport('planilla')} className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200">Generar Planilla</button>
                             {viewMode === 'full' && (
                                <button onClick={() => handleGenerateReport('boletin')} className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-100 text-green-700 hover:bg-green-200">Generar Boletín</button>
                             )}
                        </div>
                    </div>
                     {isPowerUser && viewMode === 'full' && (
                        <div className="p-3 bg-gray-50 border-b">
                            <div className="flex items-center justify-between max-w-md mx-auto">
                                <h3 className="text-sm font-semibold text-gray-700">Controles de Coordinación</h3>
                                <button onClick={handleToggleLockPeriod} className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 ${currentGradebook.isLocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                                    {currentGradebook.isLocked ? <LockOpenIcon className="h-4 w-4" /> : <LockClosedIcon className="h-4 w-4" />}
                                    {currentGradebook.isLocked ? 'Habilitar Notas' : 'Deshabilitar Notas'}
                                </button>
                            </div>
                        </div>
                    )}
                     {currentGradebook.isLocked && !isPowerUser && (
                        <div className="p-3 bg-yellow-100 text-yellow-800 text-sm font-semibold text-center">
                            Este período está cerrado. Las calificaciones no se pueden modificar.
                        </div>
                    )}
                    <div className="overflow-x-auto shadow-inner md:shadow-none">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th scope="col" className="px-6 py-3 min-w-[200px]">Estudiante</th>
                                    {currentGradebook.gradeItems.map(item => (
                                        <th key={item.id} scope="col" className="px-4 py-3 text-center min-w-[150px]">
                                            <div className="flex flex-col items-center">
                                                <span>{item.name} ({item.weight * 100}%)</span>
                                                {canEdit && (
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <button
                                                            onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }}
                                                            className="text-gray-400 hover:text-primary"
                                                            title="Editar ítem"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                                                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            className="text-gray-400 hover:text-red-600"
                                                            title="Eliminar ítem"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                    {canEdit && <th scope="col" className="px-4 py-3"><button onClick={() => { setEditingItem(null); setIsItemModalOpen(true);}} className="text-primary font-bold text-lg">+</button></th>}
                                    <th scope="col" className="px-6 py-3 text-center font-extrabold min-w-[100px]">Definitiva</th>
                                    <th scope="col" className="px-6 py-3 min-w-[200px]">Observaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(student => {
                                    const finalScore = calculateFinalScoreForSubject(student.id, currentGradebook);
                                    return (
                                        <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{student.name}</th>
                                            {currentGradebook.gradeItems.map(item => {
                                                const score = currentGradebook.scores.find(s => s.studentId === student.id && s.gradeItemId === item.id)?.score;
                                                const cellId = `${student.id}-${item.id}`;
                                                const isEditingThisCell = editingCell === cellId;
                                                return (
                                                    <td key={item.id} className="px-2 py-2">
                                                        <input 
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={isEditingThisCell ? editingValue : formatScoreForDisplay(score)}
                                                            onFocus={() => handleScoreFocus(student.id, item.id, score ?? null)}
                                                            onChange={e => setEditingValue(e.target.value)}
                                                            onBlur={handleScoreBlur}
                                                            disabled={!canEdit}
                                                            className={`w-20 text-center p-2 border rounded-md ${score !== null && score < 3 ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                                                        />
                                                    </td>
                                                );
                                            })}
                                            {canEdit && <td></td>}
                                            <td className={`px-6 py-4 text-center font-bold text-lg ${finalScore !== null && finalScore < 3 ? 'text-red-600' : 'text-green-600'}`}>
                                                {finalScore?.toFixed(2) ?? 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => setEditingObservation({ studentId: student.id, studentName: student.name, text: currentGradebook.observations[student.id] || '' })}
                                                    disabled={!canEdit}
                                                    className="text-primary hover:underline text-xs disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                                                >
                                                    {currentGradebook.observations[student.id] ? 'Editar' : 'Añadir'} Observación
                                                </button>
                                                {currentGradebook.observations[student.id] && (
                                                    <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate" title={currentGradebook.observations[student.id]}>
                                                        {currentGradebook.observations[student.id]}
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-xl shadow-md text-center">
                    <h2 className="text-xl font-semibold text-gray-700">No se encontró una planilla</h2>
                    <p className="mt-2 text-gray-500">No hay una planilla de calificaciones para los filtros seleccionados.</p>
                     <button
                        onClick={handleCreateGradebook}
                        className="mt-6 px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors"
                    >
                        Crear Planilla para {selectedSubject} {selectedGrade}-{selectedGroup}
                    </button>
                </div>
            )}

            {isItemModalOpen && currentGradebook && (
                <ItemModal item={editingItem} existingItems={currentGradebook.gradeItems} onClose={() => setIsItemModalOpen(false)} onSave={handleSaveItem} />
            )}
             {isObservationModalOpen && editingObservation && (
                <ObservationModal
                    studentName={editingObservation.studentName}
                    observation={editingObservation.text}
                    onClose={() => setEditingObservation(null)}
                    onSave={handleSaveObservation}
                />
            )}
        </div>
    );
};

export default Calificaciones;