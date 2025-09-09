import React, { useState, useMemo } from 'react';
import type { Student, Assessment, Resource, StudentAssessmentResult } from '../types';
import OnlineAssessmentTaker from '../components/OnlineAssessmentTaker';
import ManualViewer from '../components/ManualViewer';
import EventPostersViewer from '../components/EventPostersViewer';


interface StudentPortalProps {
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    resources: Resource[];
    assessments: Assessment[];
    studentResults: StudentAssessmentResult[];
    onAddResult: (result: StudentAssessmentResult) => Promise<void>;
}

const StudentPortal: React.FC<StudentPortalProps> = ({ students, resources, assessments, studentResults, onAddResult }) => {
    const [activeTab, setActiveTab] = useState<'Inicio' | 'Mis Evaluaciones' | 'Recursos' | 'Eventos' | 'Manual de Convivencia'>('Inicio');
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

    // Assuming the first student is the one logged in for this portal simulation
    const currentStudent = useMemo(() => students.length > 0 ? students[0] : null, [students]);

    const assignedAssessments = useMemo(() => {
        if (!currentStudent) return [];
        return assessments.filter(assessment => {
            const assignedToGroup = assessment.assignedGroups?.some(
                g => g.grade === currentStudent.grade && g.group === currentStudent.group
            );
            const assignedIndividually = assessment.assignedStudentIds?.includes(currentStudent.id);
            return assignedToGroup || assignedIndividually;
        });
    }, [assessments, currentStudent]);

    const completedAssessmentsMap = useMemo(() => {
        if (!currentStudent) return new Map();
        const map = new Map<string, StudentAssessmentResult>();
        studentResults
            .filter(r => r.studentId === currentStudent.id)
            .forEach(result => {
                map.set(result.assessmentId, result);
            });
        return map;
    }, [studentResults, currentStudent]);

    const handleAssessmentComplete = async (score: number) => {
        if (!selectedAssessment || !currentStudent) return;
        
        const newResult: StudentAssessmentResult = {
            id: `${selectedAssessment.id}_${currentStudent.id}`,
            studentId: currentStudent.id,
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
    
    if (!currentStudent) {
         return (
            <div className="flex justify-center items-center h-full">
                <p className="text-xl text-gray-500">Cargando datos del estudiante...</p>
            </div>
        );
    }
    
    const renderContent = () => {
        switch (activeTab) {
            case 'Inicio':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-2xl font-bold">¡Bienvenido, {currentStudent.name}!</h2>
                        <p className="text-gray-600 mt-2">Este es tu portal personal. Aquí puedes ver tus evaluaciones, recursos y comunicados importantes.</p>
                        {assignedAssessments.length > 0 && (
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="font-semibold text-blue-800">Tienes {assignedAssessments.filter(a => !completedAssessmentsMap.has(a.id)).length} evaluaciones pendientes. ¡Ve a la pestaña "Mis Evaluaciones" para comenzarlas!</p>
                            </div>
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
            case 'Recursos':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold">Recursos de Estudio</h2>
                        <p className="mt-4 text-gray-500">Próximamente encontrarás aquí los recursos compartidos por tus docentes.</p>
                    </div>
                );
            case 'Eventos':
                return <EventPostersViewer />;
            case 'Manual de Convivencia':
                return <ManualViewer />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-6">
                 <img src={currentStudent.avatarUrl} alt={currentStudent.name} className="w-20 h-20 rounded-full object-cover border-4 border-secondary" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{currentStudent.name}</h1>
                    <p className="text-gray-600">{currentStudent.grade} - Grupo {currentStudent.group}</p>
                </div>
            </div>
             <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {(['Inicio', 'Mis Evaluaciones', 'Recursos', 'Eventos', 'Manual de Convivencia'] as typeof activeTab[]).map(tab => (
                         <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            {renderContent()}
        </div>
    );
};

export default StudentPortal;