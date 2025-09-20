import React, { useState, useMemo, useRef } from 'react';
import type { Student, Teacher, Resource, SubjectGrades, InstitutionProfileData, Citation, Incident, Announcement, InboxConversation } from '../types';
import { CitationStatus, Role, AcademicPeriod, Desempeno } from '../types';
import ReportCardModal from '../components/ReportCardModal';
import { MOCK_PARENT_PORTAL_CONVERSATIONS, ACADEMIC_PERIODS } from '../constants';
import NewParentConversationModal from '../components/NewParentConversationModal';


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

// --- Grade Calculation Helpers (copied from Calificaciones.tsx) ---
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
    const [activeTab, setActiveTab] = useState<'resumen' | 'calificaciones' | 'convivencia' | 'comunicados' | 'bandeja'>('resumen');
    const [isReportCardModalOpen, setIsReportCardModalOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod>(ACADEMIC_PERIODS[0]);

    // New state for chat
    const [conversations, setConversations] = useState<InboxConversation[]>(MOCK_PARENT_PORTAL_CONVERSATIONS);
    const [selectedConversation, setSelectedConversation] = useState<InboxConversation | null>(conversations.length > 0 ? conversations[0] : null);
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);

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
    
     const contactsForParent = useMemo(() => {
        if (!selectedStudent) return [];
        const studentTeacherIds = new Set(
            subjectGrades
                .filter(sg => sg.grade === selectedStudent.grade && sg.group === selectedStudent.group)
                .map(sg => sg.teacherId)
        );
        const studentTeachers = teachers.filter(t => studentTeacherIds.has(t.id));
        const adminStaff = teachers.filter(t => t.role === Role.COORDINATOR || t.role === Role.RECTOR);
        
        const allContacts = [...studentTeachers, ...adminStaff];
        return Array.from(new Map(allContacts.map(item => [item.id, item])).values());
    }, [selectedStudent, teachers, subjectGrades]);
    
    const studentGradesForPeriod = useMemo(() => {
        if (!selectedStudent) return [];

        return subjectGrades
            .filter(sg =>
                sg.grade === selectedStudent.grade &&
                sg.group === selectedStudent.group &&
                sg.period === selectedPeriod
            )
            .map(gradebook => {
                const teacher = teachers.find(t => t.id === gradebook.teacherId);
                const { finalScore } = calculateFinalScore(selectedStudent.id, gradebook);
                const desempeno = getDesempeno(finalScore);
                const observation = gradebook.observations[selectedStudent.id] || null;
                const scoresByItem = new Map(gradebook.scores.filter(s => s.studentId === selectedStudent.id).map(s => [s.gradeItemId, s.score]));

                return {
                    subject: gradebook.subject,
                    teacherName: teacher?.name || 'No asignado',
                    gradeItems: gradebook.gradeItems,
                    scoresByItem,
                    finalScore,
                    desempeno,
                    observation,
                };
            })
            .sort((a, b) => a.subject.localeCompare(b.subject));
    }, [selectedStudent, subjectGrades, teachers, selectedPeriod]);

    const handleSelectConversation = (conversation: InboxConversation) => {
        setSelectedConversation(conversation);
        if (conversation.unread) {
            setConversations(prev => prev.map(c => c.id === conversation.id ? { ...c, unread: false } : c));
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        const message = {
            sender: 'self' as const,
            text: newMessage,
            timestamp: 'Ahora',
        };

        const updatedConversation = {
            ...selectedConversation,
            conversation: [...selectedConversation.conversation, message],
            lastMessage: newMessage,
            timestamp: 'Ahora',
        };

        setSelectedConversation(updatedConversation);
        setConversations(prev =>
            prev.map(c => c.id === updatedConversation.id ? updatedConversation : c)
        );
        setNewMessage('');
    };

    const handleStartConversation = (contact: Teacher) => {
        const convoId = `${contact.role.toLowerCase()}-${contact.id}`;
        const existingConvo = conversations.find(c => c.id === convoId);

        if (existingConvo) {
            handleSelectConversation(existingConvo);
        } else {
            const newConvo: InboxConversation = {
                id: convoId,
                participantId: contact.id,
                participantName: contact.role === Role.TEACHER ? `${contact.name} (${contact.subject})` : contact.name,
                participantAvatar: contact.avatarUrl,
                participantRole: contact.role,
                lastMessage: 'Inicia la conversación...',
                timestamp: new Date().toISOString(),
                unread: false,
                conversation: []
            };
            setConversations(prev => [newConvo, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            setSelectedConversation(newConvo);
        }
        setIsNewConvoModalOpen(false);
    };
    
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
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-md">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Calificaciones</h3>
                                <div className="flex items-center gap-4">
                                    <select
                                        value={selectedPeriod}
                                        onChange={e => setSelectedPeriod(e.target.value as AcademicPeriod)}
                                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                                    >
                                        {ACADEMIC_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <button onClick={() => setIsReportCardModalOpen(true)} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">
                                        Descargar Boletín
                                    </button>
                                </div>
                            </div>
                            {studentGradesForPeriod.length > 0 ? (
                                <div className="space-y-6">
                                    {studentGradesForPeriod.map(data => (
                                        <div key={data.subject} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 border-b dark:border-gray-700">
                                                <h4 className="font-bold text-lg text-primary dark:text-secondary">{data.subject}</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Docente: {data.teacherName}</p>
                                            </div>
                                            <div className="p-4 space-y-3">
                                                <ul className="space-y-2">
                                                    {data.gradeItems.map(item => (
                                                        <li key={item.id} className="flex justify-between items-center text-sm p-2 rounded-md even:bg-gray-50 dark:even:bg-gray-900/50">
                                                            <span>{item.name} <span className="text-gray-500 dark:text-gray-400">({(item.weight * 100).toFixed(0)}%)</span></span>
                                                            <span className="font-bold text-gray-800 dark:text-gray-100">{data.scoresByItem.has(item.id) && data.scoresByItem.get(item.id) !== null ? data.scoresByItem.get(item.id)!.toFixed(1) : 'S.N.'}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700 font-bold text-md p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                                                    <span className="text-gray-800 dark:text-gray-100">Nota Final</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getDesempenoClass(data.desempeno)}`}>
                                                            {data.desempeno}
                                                        </span>
                                                        <span className="text-gray-800 dark:text-gray-100">{data.finalScore !== null ? data.finalScore.toFixed(2) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                {data.observation && (
                                                    <div className="mt-3 pt-3 border-t dark:border-gray-700">
                                                        <h5 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Observaciones del Docente:</h5>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-1 p-3 bg-yellow-50 dark:bg-yellow-900/40 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-r-md">"{data.observation}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-10">No hay calificaciones registradas para {selectedStudent.name} en el {selectedPeriod}.</p>
                            )}
                        </div>
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
            case 'comunicados':
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
             case 'bandeja':
                return (
                    <div className="flex h-[calc(100vh-320px)] bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">Mensajes</h2>
                                <button onClick={() => setIsNewConvoModalOpen(true)} className="p-2 rounded-full text-primary hover:bg-primary/10" title="Nuevo Mensaje">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                            </div>
                            <ul className="overflow-y-auto flex-1">
                                {conversations.map(convo => (
                                    <li key={convo.id} onClick={() => handleSelectConversation(convo)} className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${selectedConversation?.id === convo.id ? 'border-primary bg-blue-50' : 'border-transparent'}`}>
                                        <div className="flex items-start gap-3">
                                            <div className="relative flex-shrink-0">
                                                <img src={convo.participantAvatar} alt={convo.participantName} className="w-12 h-12 rounded-full" />
                                                {convo.unread && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-accent ring-2 ring-white"></span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-800 truncate">{convo.participantName}</p>
                                                <p className={`text-sm text-gray-600 truncate mt-1 ${convo.unread ? 'font-bold text-gray-900' : ''}`}>{convo.lastMessage}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex-1 flex-col hidden md:flex">
                             {selectedConversation ? (
                                <>
                                    <div className="p-4 border-b flex items-center space-x-4">
                                        <img src={selectedConversation.participantAvatar} alt={selectedConversation.participantName} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <h3 className="font-bold text-gray-800">{selectedConversation.participantName}</h3>
                                            <p className="text-sm text-gray-500">{selectedConversation.participantRole}</p>
                                        </div>
                                    </div>
                                    <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50">
                                        {selectedConversation.conversation.map((msg, index) => (
                                            <div key={index} className={`flex items-end gap-2 ${msg.sender === 'self' ? 'justify-end' : ''}`}>
                                                {msg.sender === 'participant' && <img src={selectedConversation.participantAvatar} className="w-8 h-8 rounded-full" alt="participant" />}
                                                <div className={`max-w-lg p-3 rounded-xl ${msg.sender === 'self' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                                </div>
                                                {msg.sender === 'self' && <img src={selectedStudent.avatarUrl} className="w-8 h-8 rounded-full" alt="self" />}
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex items-center gap-4">
                                        <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe una respuesta..." className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary resize-none bg-gray-50" rows={1} />
                                        <button type="submit" className="bg-primary text-white rounded-full p-3 hover:bg-primary-focus disabled:bg-gray-300" disabled={!newMessage.trim()}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-center"><p className="text-gray-500">Selecciona una conversación para ver los mensajes.</p></div>
                            )}
                        </div>
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
                    {(['resumen', 'calificaciones', 'convivencia', 'comunicados', 'bandeja'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`capitalize whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                           {tab === 'bandeja' ? 'Bandeja de Entrada' : tab}
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
            
            {isNewConvoModalOpen && (
                <NewParentConversationModal 
                    contacts={contactsForParent}
                    onClose={() => setIsNewConvoModalOpen(false)}
                    onStartConversation={handleStartConversation}
                />
            )}
        </div>
    );
};

export default ParentPortal;