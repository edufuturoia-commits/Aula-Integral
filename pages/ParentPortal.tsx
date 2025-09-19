import React, { useState, useMemo } from 'react';
import type { Student, Teacher, Resource, SubjectGrades, InstitutionProfileData, Citation, Incident, Announcement } from '../types';
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
    announcements: Announcement[];
}

const ParentPortal: React.FC<ParentPortalProps> = ({ students, teachers, resources, subjectGrades, institutionProfile, citations, onUpdateCitations, incidents, announcements }) => {
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(students.length > 0 ? students[0] : null);
    const [activeTab, setActiveTab] = useState<'resumen' | 'calificaciones' | 'convivencia' | 'comunicaciones'>('resumen');
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

    const studentAnnouncements = useMemo(() => {
        if (!selectedStudent) return [];
        return announcements
            .filter(ann => {
                if (ann.recipients === 'all' || ann.recipients === 'all_parents' || ann.recipients === 'all_students') {
                    return true;
                }
                if (typeof ann.recipients === 'object' && 'grade' in ann.recipients) {
                    return ann.recipients.grade === selectedStudent.grade && ann.recipients.group === selectedStudent.group;
                }
                return false;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [announcements, selectedStudent]);
    
    const handleGenerateReport = (period: AcademicPeriod) => {
        // In a real app this would generate a PDF. For now, we'll just log it.
        console.log(`Generating report card for ${selectedStudent?.name} for period ${period}`);
        setIsReportCardModalOpen(false);
        alert(`Boletín para ${period} generado (simulación).`);
    };

    if (!selectedStudent) {
        return (
            <div className="flex justify-center items-center h-full">
                <p className="text-xl text-gray-500">
                    No hay estudiantes asociados a este portal.
                </p>
            </div>
        );
    }
    
    const renderContent = () => {
        switch (activeTab) {
            case 'resumen':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
                            <h3 className="text-xl font-bold">Últimas Incidencias</h3>
                            {studentIncidents.length > 0 ? (
                                studentIncidents.slice(0, 3).map(inc => (
                                    <div key={inc.id} className="p-3 border rounded-lg bg-gray-50">
                                        <p className="font-semibold text-gray-800">{inc.type}</p>
                                        <p className="text-sm text-gray-600">{inc.notes}</p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(inc.timestamp).toLocaleDateString()}</p>
                                    </div>
                                ))
                            ) : <p className="text-gray-500">No hay incidencias reportadas.</p>}
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
                            <h3 className="text-xl font-bold">Próximas Citaciones</h3>
                             {studentCitations.length > 0 ? (
                                studentCitations.filter(c => new Date(c.date) >= new Date()).map(cit => (
                                    <div key={cit.id} className="p-3 border rounded-lg bg-gray-50">
                                        <p className="font-semibold text-gray-800">{cit.reason}</p>
                                        <p className="text-sm text-gray-600">{new Date(cit.date + 'T00:00:00').toLocaleDateString()} a las {cit.time}</p>
                                    </div>
                                ))
                             ) : <p className="text-gray-500">No hay citaciones programadas.</p>}
                        </div>
                    </div>
                );
             case 'calificaciones':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Calificaciones</h3>
                            <button onClick={() => setIsReportCardModalOpen(true)} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">Descargar Boletín</button>
                        </div>
                        <p className="text-gray-500">Aquí se mostrará un resumen de las calificaciones del período actual.</p>
                    </div>
                );
             case 'convivencia':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
                        <h3 className="text-xl font-bold">Historial de Convivencia</h3>
                        <h4 className="font-semibold text-lg mt-4">Incidencias</h4>
                        {studentIncidents.length > 0 ? (
                            studentIncidents.map(inc => (
                                <div key={inc.id} className="p-3 border rounded-lg bg-gray-50">
                                    <p className="font-semibold text-gray-800">{inc.type}</p>
                                    <p className="text-sm text-gray-600">{inc.notes}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(inc.timestamp).toLocaleString()}</p>
                                </div>
                            ))
                        ) : <p className="text-gray-500">No hay incidencias.</p>}
                        <h4 className="font-semibold text-lg mt-4">Citaciones</h4>
                        {studentCitations.length > 0 ? (
                            studentCitations.map(cit => (
                                <div key={cit.id} className={`p-3 border rounded-lg bg-gray-50`}>
                                    <div className="flex justify-between">
                                        <p className="font-semibold text-gray-800">{cit.reason}</p>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCitationStatusClass(cit.status)}`}>{cit.status}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">{new Date(cit.date + 'T00:00:00').toLocaleDateString()} a las {cit.time}</p>
                                </div>
                            ))
                        ) : <p className="text-gray-500">No hay citaciones.</p>}
                    </div>
                );
            case 'comunicaciones':
                 return (
                    <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
                        <h3 className="text-xl font-bold">Comunicados de la Institución</h3>
                        {studentAnnouncements.length > 0 ? (
                            studentAnnouncements.map(ann => (
                                <div key={ann.id} className="p-4 border rounded-lg bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-primary">{ann.title}</h4>
                                        <span className="text-xs text-gray-500">{new Date(ann.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{ann.content}</p>
                                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t"><strong>Enviado por:</strong> {ann.sentBy}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-8">No hay comunicados para mostrar.</p>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-6">
                    <img src={selectedStudent.avatarUrl} alt={selectedStudent.name} className="w-20 h-20 rounded-full object-cover border-4 border-secondary" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{selectedStudent.name}</h1>
                        <p className="text-gray-600">{selectedStudent.grade} - Grupo {selectedStudent.group}</p>
                    </div>
                </div>
                {students.length > 1 && (
                    <div>
                        <label htmlFor="student-selector" className="block text-sm font-medium text-gray-700">Cambiar de estudiante:</label>
                        <select
                            id="student-selector"
                            value={selectedStudent.id}
                            onChange={(e) => {
                                const student = students.find(s => s.id === Number(e.target.value));
                                if (student) setSelectedStudent(student);
                            }}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                        >
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {(['resumen', 'calificaciones', 'convivencia', 'comunicaciones'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`capitalize whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            
            {renderContent()}

            {isReportCardModalOpen && (
                <ReportCardModal
                    onClose={() => setIsReportCardModalOpen(false)}
                    onGenerate={handleGenerateReport}
                />
            )}
        </div>
    );
};

export default ParentPortal;
