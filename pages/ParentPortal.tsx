

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Student, Teacher, Resource, SubjectGrades, InstitutionProfileData, Citation, Incident, Announcement, Conversation, Guardian, Message, AcademicPeriod, User } from '../types';
import { CitationStatus, Role, Desempeno } from '../types';
import ReportCardModal from '../components/ReportCardModal';
import { ACADEMIC_PERIODS, MOCK_COORDINATOR_USER } from '../constants';
import NewParentConversationModal from '../components/NewParentConversationModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Interfaces ---
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
    conversations: Conversation[];
    onUpdateConversation: (conversation: Conversation) => void;
    onCreateConversation: (conversation: Conversation) => void;
    allUsersMap: Map<string | number, User>;
    currentUser: Guardian;
}

type ParentPortalTab = 'inicio' | 'calificaciones' | 'convivencia' | 'comunicados';

// --- Helper Functions ---
const calculateFinalScore = (studentId: number, gradebook: SubjectGrades | undefined): { finalScore: number | null } => {
    if (!gradebook) return { finalScore: null };
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
    if (totalWeight === 0) return { finalScore: null };
    return { finalScore: weightedSum / totalWeight };
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
};

const getCitationStatusClass = (status: CitationStatus) => {
    switch (status) {
        case CitationStatus.CONFIRMED: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
        case CitationStatus.PENDING: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
        case CitationStatus.COMPLETED: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
        case CitationStatus.CANCELLED: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
        case CitationStatus.RESCHEDULE_REQUESTED: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
};

// --- Main Component ---
const ParentPortal: React.FC<ParentPortalProps> = (props) => {
    const { students, teachers, subjectGrades, institutionProfile, citations, onUpdateCitations, incidents, announcements, conversations, onUpdateConversation, onCreateConversation, allUsersMap, currentUser } = props;

    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<ParentPortalTab>('inicio');

    const guardianStudents = useMemo(() => {
        return students.filter(s => currentUser.studentIds.includes(s.id));
    }, [students, currentUser]);

    useEffect(() => {
        if (guardianStudents.length > 0 && !selectedStudentId) {
            setSelectedStudentId(guardianStudents[0].id);
        }
    }, [guardianStudents, selectedStudentId]);

    const selectedStudent = useMemo(() => {
        return guardianStudents.find(s => s.id === selectedStudentId) || null;
    }, [guardianStudents, selectedStudentId]);

    // Data for the selected student
    const studentData = useMemo(() => {
        if (!selectedStudent) return null;
        return {
            incidents: incidents.filter(i => i.studentId === selectedStudent.id),
            citations: citations.filter(c => c.studentId === selectedStudent.id),
            subjectGrades: subjectGrades.filter(sg => sg.grade === selectedStudent.grade && sg.group === selectedStudent.group),
        };
    }, [selectedStudent, incidents, citations, subjectGrades]);

    const handleUpdateCitationStatus = (citationId: string, newStatus: CitationStatus) => {
        onUpdateCitations(prev => prev.map(c => c.id === citationId ? { ...c, status: newStatus } : c));
    };
    
    // --- Render logic ---
    if (guardianStudents.length === 0) {
        return <div className="text-center p-8 bg-white rounded-lg shadow-md">No tienes estudiantes asociados a tu cuenta.</div>;
    }

    if (!selectedStudent || !studentData) {
        return <div className="text-center p-8">Cargando datos del estudiante...</div>;
    }

    const TABS: { id: ParentPortalTab; label: string; }[] = [
        { id: 'inicio', label: 'Inicio' },
        { id: 'calificaciones', label: 'Calificaciones' },
        { id: 'convivencia', label: 'Convivencia' },
        { id: 'comunicados', label: 'Comunicados' },
    ];
    
    const renderContent = () => {
        switch (activeTab) {
            case 'inicio':
                const pendingCitations = studentData.citations.filter(c => c.status === CitationStatus.PENDING || c.status === CitationStatus.CONFIRMED);
                return (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Resumen del Estudiante</h2>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                               <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                   <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Promedio General (P1)</p>
                                   <p className="text-3xl font-bold text-primary dark:text-secondary">4.2</p>
                               </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                   <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inasistencias (Año)</p>
                                   <p className="text-3xl font-bold text-primary dark:text-secondary">3</p>
                               </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                   <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Incidencias Activas</p>
                                   <p className="text-3xl font-bold text-red-500">{studentData.incidents.length}</p>
                               </div>
                            </div>
                        </div>
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                             <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Citaciones Próximas</h3>
                             {pendingCitations.length > 0 ? pendingCitations.map(cit => (
                                 <div key={cit.id} className={`p-3 border-l-4 rounded-r-lg mb-2 ${getCitationStatusClass(cit.status).replace('text-', 'border-')}`}>
                                     <p className="font-semibold">{cit.reason}</p>
                                     <p className="text-sm text-gray-600 dark:text-gray-300">Fecha: {new Date(cit.date + 'T00:00:00').toLocaleDateString()} a las {cit.time}</p>
                                     <p className="text-xs font-bold mt-1">Estado: <span className={getCitationStatusClass(cit.status)}>{cit.status}</span></p>
                                 </div>
                             )) : <p className="text-gray-500 dark:text-gray-400">No hay citaciones pendientes.</p>}
                         </div>
                    </div>
                );
            case 'calificaciones':
                return <CalificacionesView student={selectedStudent} subjectGrades={studentData.subjectGrades} teachers={teachers} institutionProfile={institutionProfile} />;
            case 'convivencia':
                return <ConvivenciaView incidents={studentData.incidents} citations={studentData.citations} onUpdateCitationStatus={handleUpdateCitationStatus} />;
            case 'comunicados':
                 return <ComunicadosView announcements={announcements} teachers={teachers} currentUser={currentUser} conversations={conversations} onUpdateConversation={onUpdateConversation} onCreateConversation={onCreateConversation} student={selectedStudent} allUsersMap={allUsersMap} subjectGrades={subjectGrades}/>;
            default:
                return null;
        }
    };


    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center space-x-4">
                    <img src={selectedStudent.avatarUrl} alt={selectedStudent.name} className="w-16 h-16 rounded-full border-4 border-secondary" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{selectedStudent.name}</h1>
                        <p className="text-gray-600 dark:text-gray-400">{selectedStudent.grade} - Grupo {selectedStudent.group}</p>
                    </div>
                </div>
                {guardianStudents.length > 1 && (
                    <div className="mt-4 md:mt-0">
                        <label htmlFor="student-selector" className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Viendo a:</label>
                        <select
                            id="student-selector"
                            value={selectedStudentId || ''}
                            onChange={e => setSelectedStudentId(Number(e.target.value))}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                            {guardianStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            {renderContent()}
        </div>
    );
};


// --- Sub-components for Tabs ---

const CalificacionesView: React.FC<{ student: Student; subjectGrades: SubjectGrades[], teachers: Teacher[], institutionProfile: InstitutionProfileData }> = ({ student, subjectGrades, teachers, institutionProfile }) => {
    const [period, setPeriod] = useState<AcademicPeriod>(ACADEMIC_PERIODS[0]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const periodGrades = useMemo(() => {
        return subjectGrades
            .filter(sg => sg.period === period)
            .map(sg => {
                const { finalScore } = calculateFinalScore(student.id, sg);
                return {
                    subject: sg.subject,
                    teacher: teachers.find(t => t.id === sg.teacherId)?.name || 'N/A',
                    finalScore,
                    desempeno: getDesempeno(finalScore),
                };
            });
    }, [period, student.id, subjectGrades, teachers]);
    
    const handleGenerateReportCard = (selectedPeriod: AcademicPeriod) => {
        // PDF generation logic would go here
        alert(`Generando boletín para ${student.name} del período ${selectedPeriod}...`);
        setIsModalOpen(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <select value={period} onChange={e => setPeriod(e.target.value as AcademicPeriod)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    {ACADEMIC_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button onClick={() => setIsModalOpen(true)} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">Descargar Boletín</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3">Asignatura</th>
                            <th className="px-6 py-3">Docente</th>
                            <th className="px-6 py-3 text-center">Nota Final</th>
                            <th className="px-6 py-3 text-center">Desempeño</th>
                        </tr>
                    </thead>
                    <tbody>
                        {periodGrades.map(grade => (
                            <tr key={grade.subject} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium">{grade.subject}</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{grade.teacher}</td>
                                <td className="px-6 py-4 text-center font-bold">{grade.finalScore?.toFixed(2) ?? 'N/A'}</td>
                                <td className="px-6 py-4 text-center"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDesempenoClass(grade.desempeno)}`}>{grade.desempeno}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <ReportCardModal onClose={() => setIsModalOpen(false)} onGenerate={handleGenerateReportCard} />}
        </div>
    );
};

const ConvivenciaView: React.FC<{ incidents: Incident[]; citations: Citation[]; onUpdateCitationStatus: (id: string, status: CitationStatus) => void }> = ({ incidents, citations, onUpdateCitationStatus }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold mb-4">Incidencias Reportadas</h3>
            {incidents.length > 0 ? incidents.map(inc => (
                <div key={inc.id} className="p-3 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/50 mb-3 rounded-r-lg">
                    <p className="font-semibold text-red-800 dark:text-red-200">{inc.type}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{inc.notes}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Reportado por {inc.teacherName} el {new Date(inc.timestamp).toLocaleDateString()}</p>
                </div>
            )) : <p className="text-gray-500 dark:text-gray-400">No hay incidencias reportadas.</p>}
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold mb-4">Citaciones</h3>
            {citations.length > 0 ? citations.map(cit => (
                <div key={cit.id} className={`p-4 rounded-lg mb-3 border ${getCitationStatusClass(cit.status).replace('text-', 'border-')}`}>
                    <div className="flex justify-between items-start">
                        <p className="font-semibold">{cit.reason}</p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCitationStatusClass(cit.status)}`}>{cit.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{new Date(cit.date + 'T00:00:00').toLocaleDateString()} a las {cit.time}</p>
                    {cit.status === CitationStatus.PENDING && (
                        <div className="mt-3 text-right space-x-2">
                            <button onClick={() => onUpdateCitationStatus(cit.id, CitationStatus.RESCHEDULE_REQUESTED)} className="text-xs font-semibold text-yellow-600 hover:underline">Solicitar Reprogramación</button>
                            <button onClick={() => onUpdateCitationStatus(cit.id, CitationStatus.CONFIRMED)} className="text-xs font-semibold bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700">Confirmar</button>
                        </div>
                    )}
                </div>
            )) : <p className="text-gray-500 dark:text-gray-400">No hay citaciones programadas.</p>}
        </div>
    </div>
);

const ComunicadosView: React.FC<{ announcements: Announcement[], teachers: Teacher[], currentUser: Guardian, conversations: Conversation[], onUpdateConversation: (c: Conversation) => void, onCreateConversation: (c: Conversation) => void, student: Student, allUsersMap: Map<string|number, User>, subjectGrades: SubjectGrades[] }> = ({ announcements, teachers, currentUser, conversations, onUpdateConversation, onCreateConversation, student, allUsersMap, subjectGrades }) => {
    const [activeCommTab, setActiveCommTab] = useState<'anuncios' | 'mensajes'>('anuncios');
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    const studentTeachers = useMemo(() => {
        const teacherIds = new Set<string>();
        // FIX: Cannot find name 'subjectGrades'. Pass subjectGrades as a prop to the component.
        subjectGrades.filter(sg => sg.grade === student.grade && sg.group === student.group).forEach(sg => teacherIds.add(sg.teacherId));
        return teachers.filter(t => teacherIds.has(t.id));
    }, [teachers, student, subjectGrades]);
    
    const myConversations = useMemo(() => {
        return conversations.filter(c => c.participantIds.includes(currentUser.id));
    }, [conversations, currentUser]);
    
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        const message: Message = {
            senderId: currentUser.id,
            text: newMessage,
            timestamp: new Date().toISOString(),
        };

        const updatedConversation: Conversation = {
            ...selectedConversation,
            messages: [...selectedConversation.messages, message],
        };

        onUpdateConversation(updatedConversation);
        setSelectedConversation(updatedConversation);
        setNewMessage('');
    };
    
    const handleStartConversation = (contact: Teacher) => {
        const convoId = [currentUser.id, contact.id].sort().join('-');
        const existing = conversations.find(c => c.id === convoId);
        if (existing) {
            setSelectedConversation(existing);
        } else {
            const newConvo: Conversation = { id: convoId, participantIds: [currentUser.id, contact.id], messages: [] };
            onCreateConversation(newConvo);
            setSelectedConversation(newConvo);
        }
        setActiveCommTab('mensajes');
        setIsNewConvoModalOpen(false);
    };

    return (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                 <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setActiveCommTab('anuncios')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeCommTab === 'anuncios' ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Anuncios Generales</button>
                    <button onClick={() => setActiveCommTab('mensajes')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeCommTab === 'mensajes' ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Mensajes Directos</button>
                </nav>
            </div>
            {activeCommTab === 'anuncios' && (
                <div className="space-y-4">
                    {announcements.map(ann => (
                         <div key={ann.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-700">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-gray-800 dark:text-gray-100">{ann.title}</h4>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(ann.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{ann.content}</p>
                         </div>
                    ))}
                </div>
            )}
            {activeCommTab === 'mensajes' && (
                <div className="flex h-[60vh]">
                     <div className="w-1/3 border-r dark:border-gray-700 pr-4">
                        <button onClick={() => setIsNewConvoModalOpen(true)} className="w-full bg-primary/10 text-primary dark:bg-secondary/20 dark:text-secondary font-semibold py-2 px-4 rounded-lg hover:bg-primary/20 mb-3">Nuevo Mensaje</button>
                        {myConversations.map(c => {
                            const otherId = c.participantIds.find(id => id !== currentUser.id)!;
                            const otherUser = allUsersMap.get(otherId);
                            return (
                                <div key={c.id} onClick={() => setSelectedConversation(c)} className={`p-2 rounded-md cursor-pointer ${selectedConversation?.id === c.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    <p className="font-semibold">{otherUser?.name || 'Usuario'}</p>
                                    <p className="text-xs text-gray-500">{c.messages[c.messages.length - 1]?.text || '...'}</p>
                                </div>
                            )
                        })}
                     </div>
                     <div className="w-2/3 pl-4 flex flex-col">
                        {selectedConversation ? (
                             <>
                                <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto mb-4 p-2">
                                     {selectedConversation.messages.map((msg, i) => {
                                        const isSelf = msg.senderId === currentUser.id;
                                        return (
                                             <div key={i} className={`flex items-end gap-2 ${isSelf ? 'justify-end' : ''}`}>
                                                <div className={`max-w-xs p-3 rounded-xl ${isSelf ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                                    <p className="text-sm">{msg.text}</p>
                                                </div>
                                             </div>
                                        )
                                    })}
                                </div>
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="Escribe un mensaje..." />
                                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Enviar</button>
                                </form>
                             </>
                        ) : <p className="text-center text-gray-500 m-auto">Selecciona una conversación o inicia una nueva.</p>}
                     </div>
                </div>
            )}
             {isNewConvoModalOpen && <NewParentConversationModal contacts={[...studentTeachers, MOCK_COORDINATOR_USER]} onClose={() => setIsNewConvoModalOpen(false)} onStartConversation={handleStartConversation} />}
        </div>
    )
};


export default ParentPortal;
