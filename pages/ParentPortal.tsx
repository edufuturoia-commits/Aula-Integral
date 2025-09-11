



import React, { useState, useMemo } from 'react';
import type { Student, Teacher, Resource, SubjectGrades, InstitutionProfileData, Citation, Incident } from '../types';
import { CitationStatus } from '../types';
import ReportCardModal from '../components/ReportCardModal';
import { AcademicPeriod } from '../types';

// Duplicating this helper function here for simplicity
const getCitationStatusClass = (status: CitationStatus) => {
    switch (status) {
        case CitationStatus.CONFIRMED: return 'bg-green-100 text-green-800';
        case CitationStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
        case CitationStatus.COMPLETED: return 'bg-blue-100 text-blue-800';
        case CitationStatus.CANCELLED: return 'bg-red-100 text-red-800';
        case CitationStatus.RESCHEDULE_REQUESTED: return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

interface ParentPortalProps {
    students: Student[];
    teachers: Teacher[];
    resources: Resource[];
    subjectGrades: SubjectGrades[];
    institutionProfile: InstitutionProfileData;
    citations: Citation[];
    onUpdateCitations: React.Dispatch<React.SetStateAction<Citation[]>>;
    incidents: Incident[];
}

const ParentPortal: React.FC<ParentPortalProps> = ({ students, teachers, resources, subjectGrades, institutionProfile, citations, onUpdateCitations, incidents }) => {
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(students.length > 0 ? students[0] : null);
    const [activeTab, setActiveTab] = useState<'resumen' | 'calificaciones' | 'convivencia'>('resumen');
    const [isReportCardModalOpen, setIsReportCardModalOpen] = useState(false);

    const studentCitations = useMemo(() => {
        if (!selectedStudent) return [];
        return citations
            .filter(c => c.studentId === selectedStudent.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [citations, selectedStudent]);

    const studentIncidents = useMemo(() => {
        if (!selectedStudent) return [];
        // Show all incidents (active and archived) to provide a complete history.
        return incidents
            .filter(inc => inc.studentId === selectedStudent.id)
            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [incidents, selectedStudent]);
    
    const handleGenerateReport = (period: AcademicPeriod) => {
        // In a real app, this would trigger a PDF generation service
        alert(`Generando boletín para ${selectedStudent?.name} del ${period}...`);
        setIsReportCardModalOpen(false);
    };

    const handleUpdateCitationStatus = (citationId: string, newStatus: CitationStatus) => {
        onUpdateCitations(prevCitations => 
            prevCitations.map(c => 
                c.id === citationId ? { ...c, status: newStatus } : c
            )
        );
    };

    const renderCitationActions = (citation: Citation) => {
        switch(citation.status) {
            case CitationStatus.PENDING:
                return (
                    <div className="flex items-center justify-end space-x-3 mt-4">
                        <button 
                            onClick={() => handleUpdateCitationStatus(citation.id, CitationStatus.RESCHEDULE_REQUESTED)}
                            className="text-sm font-semibold text-primary hover:underline"
                        >
                            Solicitar Reasignación
                        </button>
                        <button 
                            onClick={() => handleUpdateCitationStatus(citation.id, CitationStatus.CONFIRMED)}
                            className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors text-sm"
                        >
                            Confirmar Asistencia
                        </button>
                    </div>
                );
            case CitationStatus.RESCHEDULE_REQUESTED:
                 return (
                    <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md text-sm text-purple-800 flex items-center justify-between">
                        <span>Tu solicitud de reasignación ha sido enviada a coordinación.</span>
                        <button 
                            onClick={() => handleUpdateCitationStatus(citation.id, CitationStatus.PENDING)}
                            className="font-semibold hover:underline flex-shrink-0 ml-4"
                        >
                            Cancelar Solicitud
                        </button>
                    </div>
                );
            case CitationStatus.CONFIRMED:
                return (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800 font-semibold">
                        ✓ Asistencia confirmada. ¡Te esperamos!
                    </div>
                );
            default:
                return null;
        }
    };

    if (!selectedStudent) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h1 className="text-2xl font-bold text-gray-800">Portal de Acudientes</h1>
                <p className="mt-4 text-gray-500">No hay estudiantes asociados a esta cuenta.</p>
            </div>
        );
    }
    
    const renderContent = () => {
        switch(activeTab) {
            case 'resumen':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen General</h2>
                        <p>Bienvenido al portal de acudientes. Aquí encontrarás información académica y de convivencia sobre {selectedStudent.name}.</p>
                        {studentCitations.some(c => c.status === CitationStatus.PENDING) && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-800">
                                <strong>Atención:</strong> {selectedStudent.name} tiene una nueva citación pendiente. Por favor, revisa la pestaña de 'Incidencias y citaciones'.
                            </div>
                        )}
                    </div>
                );
            case 'calificaciones':
                 return (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Calificaciones</h2>
                            <button onClick={() => setIsReportCardModalOpen(true)} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">
                                Descargar Boletín
                            </button>
                        </div>
                        <p>Aquí se mostrarán las calificaciones detalladas por período y asignatura.</p>
                    </div>
                );
            case 'convivencia':
                return (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
                            <h2 className="text-xl font-bold">Citaciones Programadas</h2>
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
                                        {renderCitationActions(cit)}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">No hay citaciones programadas.</p>
                            )}
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
                            <h2 className="text-xl font-bold">Historial de Incidencias</h2>
                            {studentIncidents.length > 0 ? (
                                studentIncidents.map(inc => (
                                    <div key={inc.id} className="p-3 border rounded-lg bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-gray-900">{inc.studentName}</p>
                                                <p className="text-sm text-gray-600">{inc.type}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {inc.archived && (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-200 text-gray-800">
                                                        Archivado
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-500">{new Date(inc.timestamp).toLocaleDateString('es-CO')}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{inc.notes}</p>
                                        <p className="text-xs text-gray-500 mt-2">Reportado por: {inc.teacherName}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">No hay incidencias de convivencia registradas para {selectedStudent.name}.</p>
                            )}
                        </div>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center space-x-6">
                    <img src={selectedStudent.avatarUrl} alt={selectedStudent.name} className="w-20 h-20 rounded-full object-cover border-4 border-secondary" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{selectedStudent.name}</h1>
                        <p className="text-gray-600 text-lg">{selectedStudent.grade} - Grupo {selectedStudent.group}</p>
                    </div>
                </div>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('resumen')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'resumen' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Resumen</button>
                    <button onClick={() => setActiveTab('calificaciones')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'calificaciones' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Calificaciones</button>
                    <button onClick={() => setActiveTab('convivencia')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'convivencia' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Incidencias y citaciones</button>
                </nav>
            </div>
            
            {renderContent()}

            {isReportCardModalOpen && <ReportCardModal onClose={() => setIsReportCardModalOpen(false)} onGenerate={handleGenerateReport} />}
        </div>
    );
};

export default ParentPortal;