





import React, { useState, useMemo, useEffect } from 'react';
import type { Student, Assessment, Resource, StudentAssessmentResult, Teacher, SubjectGrades, Citation } from '../types';
import { Role, CitationStatus } from '../types';
import OnlineAssessmentTaker from '../components/OnlineAssessmentTaker';
import ManualViewer from '../components/ManualViewer';
import EventPostersViewer from '../components/EventPostersViewer';
import IcfesDrillTaker from './IcfesDrillTaker';


interface StudentPortalProps {
    loggedInUser: Student | Teacher;
    allStudents: Student[];
    teachers: Teacher[];
    subjectGrades: SubjectGrades[];
    resources: Resource[];
    assessments: Assessment[];
    studentResults: StudentAssessmentResult[];
    onAddResult: (result: StudentAssessmentResult) => Promise<void>;
    citations: Citation[];
    icfesDrillSettings: { isActive: boolean, grades: string[] };
}

const getCitationStatusClass = (status: CitationStatus) => {
    switch (status) {
        case CitationStatus.CONFIRMED: return 'bg-green-100 text-green-800';
        case CitationStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
        case CitationStatus.COMPLETED: return 'bg-blue-100 text-blue-800';
        case CitationStatus.CANCELLED: return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

type StudentPortalTab = 'Inicio' | 'Mis Asignaturas' | 'Mis Evaluaciones' | 'Recursos' | 'Citaciones' | 'Manual de Convivencia' | 'Simulacro ICFES';

const StudentPortal: React.FC<StudentPortalProps> = ({ loggedInUser, allStudents, teachers, subjectGrades, resources, assessments, studentResults, onAddResult, citations, icfesDrillSettings }) => {
    const [activeTab, setActiveTab] = useState<StudentPortalTab>('Inicio');
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
    const [viewedStudent, setViewedStudent] = useState<Student | null>(null);

    useEffect(() => {
        if (loggedInUser.role === Role.STUDENT) {
            setViewedStudent(loggedInUser as Student);
        } else if (loggedInUser.role === Role.ADMIN && allStudents.length > 0) {
            setViewedStudent(allStudents[0]);
        } else {
            setViewedStudent(null);
        }
    }, [loggedInUser, allStudents]);

    const isIcfesDrillVisible = useMemo(() => {
        if (!viewedStudent) return false;
        return icfesDrillSettings?.isActive && icfesDrillSettings?.grades?.includes(viewedStudent.grade);
    }, [viewedStudent, icfesDrillSettings]);

    const studentCitations = useMemo(() => {
        if (!viewedStudent) return [];
        return citations
            .filter(c => c.studentId === viewedStudent.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [citations, viewedStudent]);

    const pendingCitationsCount = useMemo(() => {
        return studentCitations.filter(c => c.status === CitationStatus.PENDING).length;
    }, [studentCitations]);

    const studentSubjects = useMemo(() => {
        if (!viewedStudent) return [];
        
        const gradebooks = subjectGrades.filter(sg => 
            sg.grade === viewedStudent.grade && sg.group === viewedStudent.group
        );

        return gradebooks.map(gb => {
            const teacher = teachers.find(t => t.id === gb.teacherId);
            return {
                subject: gb.subject,
                teacher: teacher || { name: 'Docente no asignado', avatarUrl: `https://picsum.photos/seed/default/100/100`, id: 'unknown', role: 'Docente' as any, subject: gb.subject }
            };
        }).sort((a, b) => a.subject.localeCompare(b.subject));
    }, [viewedStudent, subjectGrades, teachers]);

    const assignedAssessments = useMemo(() => {
        if (!viewedStudent) return [];
        return assessments.filter(assessment => {
            const assignedToGroup = assessment.assignedGroups?.some(
                g => g.grade === viewedStudent.grade && g.group === viewedStudent.group
            );
            const assignedIndividually = assessment.assignedStudentIds?.includes(viewedStudent.id);
            return assignedToGroup || assignedIndividually;
        });
    }, [assessments, viewedStudent]);

    const completedAssessmentsMap = useMemo(() => {
        if (!viewedStudent) return new Map();
        const map = new Map<string, StudentAssessmentResult>();
        studentResults
            .filter(r => r.studentId === viewedStudent.id)
            .forEach(result => {
                map.set(result.assessmentId, result);
            });
        return map;
    }, [studentResults, viewedStudent]);

    const handleAssessmentComplete = async (score: number) => {
        if (!selectedAssessment || !viewedStudent) return;
        
        const newResult: StudentAssessmentResult = {
            id: `${selectedAssessment.id}_${viewedStudent.id}`,
            studentId: viewedStudent.id,
            assessmentId: selectedAssessment.id,
            assessmentTitle: selectedAssessment.title,
            score: score,
            completedAt: new Date().toISOString(),
        };

        await onAddResult(newResult);
        alert(`¡Evaluación completada! Tu nota es: ${score.toFixed(1)}`);
        setSelectedAssessment(null);
    };

    if (selectedAssessment) {
        return <OnlineAssessmentTaker assessment={selectedAssessment} onComplete={handleAssessmentComplete} onBack={() => setSelectedAssessment(null)} />;
    }
    
    if (!viewedStudent) {
         return (
            <div className="flex justify-center items-center h-full">
                <p className="text-xl text-gray-500">
                    {loggedInUser.role === Role.ADMIN ? "No hay estudiantes para mostrar." : "Cargando datos del estudiante..."}
                </p>
            </div>
        );
    }
    
    const TABS: { id: StudentPortalTab, label: string, badge?: number }[] = [
        { id: 'Inicio', label: 'Inicio' },
        { id: 'Mis Asignaturas', label: 'Mis Asignaturas' },
        { id: 'Mis Evaluaciones', label: 'Mis Evaluaciones' },
        { id: 'Citaciones', label: 'Citaciones', badge: pendingCitationsCount },
        { id: 'Recursos', label: 'Recursos' },
        { id: 'Manual de Convivencia', label: 'Manual de Convivencia' },
    ];

    if (isIcfesDrillVisible) {
        TABS.splice(3, 0, { id: 'Simulacro ICFES', label: 'Simulacro ICFES' });
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'Inicio':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-2xl font-bold">¡Bienvenido, {viewedStudent.name}!</h2>
                        <p className="text-gray-600 mt-2">Este es tu portal personal. Aquí puedes ver tus asignaturas, evaluaciones, recursos y comunicados importantes.</p>
                        {assignedAssessments.length > 0 && (
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="font-semibold text-blue-800">Tienes {assignedAssessments.filter(a => !completedAssessmentsMap.has(a.id)).length} evaluaciones pendientes. ¡Ve a la pestaña "Mis Evaluaciones" para comenzarlas!</p>
                            </div>
                        )}
                    </div>
                );
            case 'Mis Asignaturas':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
                        <h2 className="text-xl font-bold">Mis Asignaturas</h2>
                        {studentSubjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {studentSubjects.map(({ subject, teacher }) => (
                                    <div key={subject} className="bg-gray-50 p-4 border rounded-lg flex items-center space-x-4">
                                        <img src={teacher.avatarUrl} alt={teacher.name} className="w-12 h-12 rounded-full object-cover" />
                                        <div>
                                            <h3 className="font-bold text-lg text-primary">{subject}</h3>
                                            <p className="text-sm text-gray-600">{teacher.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No se encontraron asignaturas para tu curso.</p>
                        )}
                    </div>
                );
            case 'Mis Evaluaciones':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
                        <h2 className="text-xl font-bold">Evaluaciones Asignadas</h2>
                        {assignedAssessments.length > 0 ? (
                            assignedAssessments.map(asm => {
                                const completedResult = completedAssessmentsMap.get(asm.id);
                                const isCompleted = !!completedResult;
                                const isPassing = completedResult && completedResult.score >= 3.0;

                                return (
                                    <div key={asm.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50">
                                        <div>
                                            <h3 className="font-bold text-primary">{asm.title}</h3>
                                            <p className="text-sm text-gray-500">{asm.questions.length} preguntas</p>
                                        </div>
                                        {isCompleted ? (
                                            <div className="text-center">
                                                <p className="text-sm text-gray-600">Calificación:</p>
                                                <div className={`text-xl font-bold px-3 py-1 rounded-lg ${isPassing ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {completedResult.score.toFixed(1)}
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={() => setSelectedAssessment(asm)} className="bg-accent text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700">
                                                Iniciar Evaluación
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                             <p className="text-gray-500 text-center py-8">No tienes evaluaciones asignadas en este momento.</p>
                        )}
                    </div>
                );
            case 'Simulacro ICFES':
                return <IcfesDrillTaker />;
            case 'Citaciones':
                return (
                     <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
                        <h2 className="text-xl font-bold">Mis Citaciones</h2>
                        {studentCitations.length > 0 ? (
                            studentCitations.map(cit => (
                                <div key={cit.id} className={`p-4 border rounded-lg ${cit.status === CitationStatus.CANCELLED ? 'bg-gray-100' : 'bg-gray-50'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-primary">{cit.reason}</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {new Date(cit.date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las {cit.time} en {cit.location}.
                                            </p>
                                        </div>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCitationStatusClass(cit.status)}`}>
                                            {cit.status}
                                        </span>
                                    </div>
                                    {cit.status === CitationStatus.CANCELLED && cit.cancellationReason && (
                                        <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
                                            <p><strong className="font-semibold">Motivo de cancelación:</strong> {cit.cancellationReason}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-8">No tienes citaciones registradas.</p>
                        )}
                    </div>
                );
            case 'Recursos':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold">Recursos de Estudio</h2>
                        <p className="mt-4 text-gray-500">Próximamente encontrarás aquí los recursos compartidos por tus docentes.</p>
                    </div>
                );
            case 'Manual de Convivencia':
                return <ManualViewer />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {loggedInUser.role === Role.ADMIN && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                    <label htmlFor="student-selector" className="block text-sm font-bold text-yellow-800">Viendo como Administrador. Selecciona un estudiante:</label>
                    <select
                        id="student-selector"
                        value={viewedStudent?.id || ''}
                        onChange={(e) => {
                            const student = allStudents.find(s => s.id === Number(e.target.value));
                            if (student) setViewedStudent(student);
                        }}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    >
                        {allStudents.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.grade} - {s.group})</option>
                        ))}
                    </select>
                </div>
            )}
             <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-6">
                 <img src={viewedStudent.avatarUrl} alt={viewedStudent.name} className="w-20 h-20 rounded-full object-cover border-4 border-secondary" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{viewedStudent.name}</h1>
                    <p className="text-gray-600">{viewedStudent.grade} - Grupo {viewedStudent.group}</p>
                </div>
            </div>
             <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                         <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            {tab.label}
                            {tab.badge && tab.badge > 0 && (
                                <span className="bg-yellow-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{tab.badge}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>
            {renderContent()}
        </div>
    );
};

export default StudentPortal;