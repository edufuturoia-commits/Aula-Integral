import React, { useState, useMemo } from 'react';
import { Assessment, Student, StudentAssessmentResult } from '../types';
import AssessmentCreator from '../components/AssessmentCreator';
import { GRADES, GROUPS, GRADE_GROUP_MAP } from '../constants';

interface AssessmentsProps {
    students: Student[];
    assessments: Assessment[];
    setAssessments: (assessments: Assessment[]) => Promise<void>;
    studentResults: StudentAssessmentResult[];
}

const AssessmentCard: React.FC<{ assessment: Assessment, onManage: () => void }> = ({ assessment, onManage }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
            <h3 className="font-bold text-primary dark:text-secondary">{assessment.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{assessment.questions.length} Preguntas</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Creada: {new Date(assessment.createdAt).toLocaleDateString()}</p>
        </div>
        <button onClick={onManage} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors text-sm">
            Gestionar y Asignar
        </button>
    </div>
);

const AssessmentManager: React.FC<{
    assessment: Assessment;
    students: Student[];
    studentResults: StudentAssessmentResult[];
    onBack: () => void;
    onUpdate: (updatedAssessment: Assessment) => void;
}> = ({ assessment, students, studentResults, onBack, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'group' | 'individual' | 'results'>('group');

    const [selectedGrade, setSelectedGrade] = useState(GRADES[0]);
    const [selectedGroup, setSelectedGroup] = useState(GRADE_GROUP_MAP[GRADES[0]]?.[0] || '');

    const availableGroups = useMemo(() => {
        return GRADE_GROUP_MAP[selectedGrade] || [];
    }, [selectedGrade]);

    const handleGradeChange = (newGrade: string) => {
        setSelectedGrade(newGrade);
        setSelectedGroup(GRADE_GROUP_MAP[newGrade]?.[0] || '');
    };


    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set(assessment.assignedStudentIds || []));

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    
    const resultsForThisAssessment = useMemo(() => {
        return studentResults.filter(r => r.assessmentId === assessment.id);
    }, [studentResults, assessment.id]);

    const handleAssignGroup = () => {
        const groupExists = assessment.assignedGroups?.some(g => g.grade === selectedGrade && g.group === selectedGroup);
        if (groupExists) {
            alert('Este grupo ya ha sido asignado.');
            return;
        }
        const updatedAssessment = {
            ...assessment,
            assignedGroups: [...(assessment.assignedGroups || []), { grade: selectedGrade, group: selectedGroup }]
        };
        onUpdate(updatedAssessment);
    };

    const handleUnassignGroup = (grade: string, group: string) => {
        const updatedAssessment = {
            ...assessment,
            assignedGroups: assessment.assignedGroups?.filter(g => !(g.grade === grade && g.group === group))
        };
        onUpdate(updatedAssessment);
    };

    const toggleStudentSelection = (studentId: number) => {
        const newSet = new Set(selectedStudentIds);
        if (newSet.has(studentId)) {
            newSet.delete(studentId);
        } else {
            newSet.add(studentId);
        }
        setSelectedStudentIds(newSet);
    };
    
    const handleAssignIndividuals = () => {
        const updatedAssessment = {
            ...assessment,
            assignedStudentIds: Array.from(selectedStudentIds)
        };
        onUpdate(updatedAssessment);
        alert('Asignación individual guardada.');
    };

    const filteredStudents = useMemo(() => {
        return students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [students, searchTerm]);
    
    const individuallyAssignedStudents = useMemo(() => {
        return (assessment.assignedStudentIds || []).map(id => studentMap.get(id)).filter(Boolean) as Student[];
    }, [assessment.assignedStudentIds, studentMap]);


    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{assessment.title}</h2>
                    <p className="text-gray-500 dark:text-gray-400">Gestiona a quién se asigna esta evaluación y consulta los resultados.</p>
                </div>
                <button onClick={onBack} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Volver</button>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('group')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'group' ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        Asignar por Grupo
                    </button>
                    <button onClick={() => setActiveTab('individual')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'individual' ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        Asignar Individualmente
                    </button>
                    <button onClick={() => setActiveTab('results')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'results' ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        Resultados ({resultsForThisAssessment.length})
                    </button>
                </nav>
            </div>
            
            {activeTab === 'group' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Asignar a un nuevo grupo</h3>
                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <select value={selectedGrade} onChange={e => handleGradeChange(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select>
                            <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">{availableGroups.map(g => <option key={g} value={g}>{g}</option>)}</select>
                            <button onClick={handleAssignGroup} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus flex-shrink-0">Asignar</button>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Grupos Asignados ({assessment.assignedGroups?.length || 0})</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {assessment.assignedGroups?.map(({ grade, group }) => (
                                <div key={`${grade}-${group}`} className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-md">
                                    <span className="font-medium text-blue-800 dark:text-blue-200">{grade} - Grupo {group}</span>
                                    <button onClick={() => handleUnassignGroup(grade, group)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-bold">QUITAR</button>
                                </div>
                            ))}
                            {(!assessment.assignedGroups || assessment.assignedGroups.length === 0) && <p className="text-gray-500 dark:text-gray-400 text-sm">Aún no se han asignado grupos.</p>}
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'individual' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Seleccionar Estudiantes</h3>
                        <input type="text" placeholder="Buscar estudiante..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400"/>
                        <div className="space-y-2 max-h-60 overflow-y-auto border dark:border-gray-700 rounded-lg p-2">
                            {filteredStudents.map(student => (
                                <label key={student.id} className="flex items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <input type="checkbox" checked={selectedStudentIds.has(student.id)} onChange={() => toggleStudentSelection(student.id)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                                    <span className="ml-3 text-sm text-gray-800 dark:text-gray-200">{student.name}</span>
                                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{student.grade} - {student.group}</span>
                                </label>
                            ))}
                        </div>
                        <button onClick={handleAssignIndividuals} className="w-full mt-4 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">Guardar Selección</button>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Estudiantes Asignados ({individuallyAssignedStudents.length})</h3>
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                           {individuallyAssignedStudents.map(student => (
                                <div key={student.id} className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-md">
                                    <span className="font-medium text-blue-800 dark:text-blue-200">{student.name}</span>
                                    <button onClick={() => {
                                        const newSet = new Set(selectedStudentIds);
                                        newSet.delete(student.id);
                                        setSelectedStudentIds(newSet);
                                        const updatedAssessment = { ...assessment, assignedStudentIds: Array.from(newSet) };
                                        onUpdate(updatedAssessment);
                                    }} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-bold">QUITAR</button>
                                </div>
                            ))}
                            {individuallyAssignedStudents.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">Aún no se han asignado estudiantes individualmente.</p>}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'results' && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Resultados de la Evaluación</h3>
                     <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {resultsForThisAssessment.length > 0 ? (
                            resultsForThisAssessment.map(result => {
                                const student = studentMap.get(result.studentId);
                                if (!student) return null;
                                const isPassing = result.score >= 3.0;
                                return (
                                    <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <img src={student.avatarUrl} alt={student.name} className="w-10 h-10 rounded-full"/>
                                            <div>
                                                <p className="font-semibold text-gray-800 dark:text-gray-100">{student.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Completado: {new Date(result.completedAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className={`text-xl font-bold px-3 py-1 rounded-lg ${isPassing ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200'}`}>
                                            {result.score.toFixed(1)}
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                             <p className="text-gray-500 dark:text-gray-400 text-center py-8">Ningún estudiante ha completado esta evaluación todavía.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const Assessments: React.FC<AssessmentsProps> = ({ students, assessments, setAssessments, studentResults }) => {
    const [view, setView] = useState<'list' | 'create' | 'manage'>('list');
    const [managingAssessment, setManagingAssessment] = useState<Assessment | null>(null);

    const handleSaveAssessment = async (assessment: Assessment) => {
        const newAssessment: Assessment = {
            ...assessment,
            assignedGroups: [],
            assignedStudentIds: []
        };
        const updatedAssessments = [newAssessment, ...assessments];
        await setAssessments(updatedAssessments);
        setView('list');
    };
    
    const handleManageAssessment = (assessment: Assessment) => {
        setManagingAssessment(assessment);
        setView('manage');
    };

    const handleUpdateAssessment = async (updatedAssessment: Assessment) => {
        const updatedAssessments = assessments.map(a => a.id === updatedAssessment.id ? updatedAssessment : a);
        await setAssessments(updatedAssessments);
        setManagingAssessment(updatedAssessment);
    };

    const handleBackToList = () => {
        setManagingAssessment(null);
        setView('list');
    };

    if (view === 'create') {
        return <AssessmentCreator onSave={handleSaveAssessment} onCancel={() => setView('list')} />;
    }

    if (view === 'manage' && managingAssessment) {
        return <AssessmentManager assessment={managingAssessment} students={students} studentResults={studentResults} onBack={handleBackToList} onUpdate={handleUpdateAssessment} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Mis Evaluaciones</h1>
                <button
                    onClick={() => setView('create')}
                    className="bg-accent text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span>Crear Evaluación con IA</span>
                </button>
            </div>
            <div className="space-y-4">
                {assessments.map(assessment => (
                    <AssessmentCard key={assessment.id} assessment={assessment} onManage={() => handleManageAssessment(assessment)} />
                ))}
                {assessments.length === 0 && (
                    <div className="text-center py-16 px-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h2 className="mt-2 text-xl font-semibold text-gray-700 dark:text-gray-200">No hay evaluaciones creadas</h2>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">Haz clic en "Crear Evaluación con IA" para empezar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Assessments;