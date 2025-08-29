import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { MOCK_ASSESSMENT_DATA, MOCK_STUDENT_ASSESSMENT_RESULTS, MOCK_RESOURCES, SUBJECT_AREAS, MOCK_CITATIONS } from '../constants';
import { getIncidents, getAnnouncements } from '../db';
import type { Incident, Student, StudentAssessmentResult, Resource, ResourceType, Citation, Announcement, Teacher, EventPoster } from '../types';
import { CitationStatus } from '../types';
import CancelCitationModal from '../components/CancelCitationModal';
import ManualViewer from '../components/ManualViewer';
import EventPostersViewer from '../components/EventPostersViewer';

const READ_ANNOUNCEMENTS_KEY = 'readAnnouncements';

type ParentPortalTab = 'Rendimiento' | 'Incidencias' | 'Evaluaciones' | 'Recursos' | 'Comunicación' | 'Citaciones' | 'Comunicados' | 'Manual de Convivencia' | 'Eventos';

interface ChatMessage {
  id: number;
  text: string;
  sender: 'teacher' | 'parent';
  timestamp: string;
}

// --- Reusable Components specific to this page ---

const StatCard: React.FC<{ title: string; value: string | number; icon: JSX.Element }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-xl shadow flex items-center space-x-4">
        <div className="bg-primary-focus/10 p-3 rounded-full text-primary">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const ICONS: Record<ResourceType, JSX.Element> = {
    PDF: <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 11-2 0V4h-3v9a1 1 0 11-2 0V4H6v12a1 1 0 11-2 0V4zm4-2a1 1 0 00-1 1v1h2V3a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
    Video: <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14.553 1.398l-3.267 3.267c-.24.24-.24.63 0 .87l3.267 3.267A.5.5 0 0018 13.5V6.5a.5.5 0 00-.447-.498z" /></svg>,
    Imagen: <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>,
    Documento: <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>,
};

const ResourceCard: React.FC<{ resource: Resource }> = ({ resource }) => (
    <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col overflow-hidden">
        <div className={`h-24 w-full flex items-center justify-center p-6 ${
            resource.type === 'PDF' ? 'bg-red-100 text-red-600' :
            resource.type === 'Video' ? 'bg-blue-100 text-blue-600' :
            resource.type === 'Imagen' ? 'bg-purple-100 text-purple-600' :
            'bg-yellow-100 text-yellow-700'
        }`}>
            {ICONS[resource.type]}
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="font-bold text-gray-800 truncate">{resource.title}</h3>
            <p className="text-xs text-gray-500 mb-2">{resource.subjectArea}</p>
            <p className="text-sm text-gray-600 flex-grow break-words">{resource.description}</p>
        </div>
        <div className="p-4 bg-gray-50 border-t">
            <button className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors text-sm">
                Ver Recurso
            </button>
        </div>
    </div>
);

interface ParentPortalProps {
    students: Student[];
    teachers: Teacher[];
    resources: Resource[];
}


const ParentPortal: React.FC<ParentPortalProps> = ({ students, teachers, resources }) => {
    const [activeTab, setActiveTab] = useState<ParentPortalTab>('Rendimiento');
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [citations, setCitations] = useState<Citation[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [areaFilter, setAreaFilter] = useState<string>('all');
    const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({
      '1037612345': [
        { id: 1, text: 'Buenas tardes, quería consultar sobre el progreso de Ana en Matemáticas.', sender: 'parent', timestamp: 'Hace 2 horas' },
        { id: 2, text: '¡Buenas tardes! Claro que sí. Ana ha mostrado una gran mejora en la resolución de problemas. Mañana tenemos una pequeña evaluación sobre fracciones.', sender: 'teacher', timestamp: 'Hace 1 hora' },
      ],
      '43567890': [
        { id: 3, text: 'Hola profe Lucía, ¿hay alguna lectura recomendada para el fin de semana?', sender: 'parent', timestamp: 'Ayer'}
      ],
      '79812345': [],
    });
    const [newMessage, setNewMessage] = useState('');
    const [isTeacherTyping, setIsTeacherTyping] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [citationToCancel, setCitationToCancel] = useState<Citation | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [notificationPermission, setNotificationPermission] = useState('Notification' in window ? Notification.permission : 'denied');
    const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);
    const [hasNewEvents, setHasNewEvents] = useState(false);


    // Use the first student from the props as the current student for this portal
    const currentStudent = useMemo(() => students.length > 0 ? students[0] : null, [students]);

    useEffect(() => {
        if (!currentStudent) return;
        const loadData = async () => {
            const allIncidents = await getIncidents();
            setIncidents(allIncidents.filter(inc => inc.studentId === currentStudent.id));
            
            const studentCitations = MOCK_CITATIONS.filter(c => c.studentId === currentStudent.id);
            setCitations(studentCitations);

            const allAnnouncements = await getAnnouncements();
            const studentAnnouncements = allAnnouncements.filter(ann => {
                if (ann.recipients === 'all') {
                    return true;
                }
                if (typeof ann.recipients === 'object' && ann.recipients.grade === currentStudent.grade && ann.recipients.group === currentStudent.group) {
                    return true;
                }
                return false;
            });
            setAnnouncements(studentAnnouncements);
            
            const readIds: string[] = JSON.parse(localStorage.getItem(READ_ANNOUNCEMENTS_KEY) || '[]');
            const unreadCount = studentAnnouncements.filter(ann => !readIds.includes(ann.id)).length;
            setUnreadAnnouncementsCount(unreadCount);

            try {
                const savedPostersRaw = localStorage.getItem('eventPosters');
                if (savedPostersRaw) {
                    const savedPosters: EventPoster[] = JSON.parse(savedPostersRaw);
                    if (savedPosters.length > 0) {
                        const lastSeenTimestamp = localStorage.getItem('lastSeenEventTimestamp_parent');
                        const latestPosterTimestamp = savedPosters[0].createdAt; // Assuming sorted descending
                        if (!lastSeenTimestamp || new Date(latestPosterTimestamp) > new Date(lastSeenTimestamp)) {
                            setHasNewEvents(true);
                        }
                    }
                }
            } catch (e) {
                console.error("Error checking for new events:", e);
            }
        };
        loadData();
    }, [currentStudent]);

    const requestNotificationPermission = useCallback(async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'Comunicación' && 'Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, [activeTab]);
    
    useEffect(() => {
        if (activeTab === 'Comunicados' && announcements.length > 0) {
            const allAnnouncementIds = announcements.map(ann => ann.id);
            localStorage.setItem(READ_ANNOUNCEMENTS_KEY, JSON.stringify(allAnnouncementIds));
            setUnreadAnnouncementsCount(0);
        }
    }, [activeTab, announcements]);
    
    useEffect(() => {
        if (activeTab === 'Eventos') {
            try {
                const savedPostersRaw = localStorage.getItem('eventPosters');
                if (savedPostersRaw) {
                    const savedPosters: EventPoster[] = JSON.parse(savedPostersRaw);
                    if (savedPosters.length > 0) {
                        // Assuming they are sorted descending by createdAt
                        localStorage.setItem('lastSeenEventTimestamp_parent', savedPosters[0].createdAt);
                    }
                }
                setHasNewEvents(false);
            } catch (e) {
                console.error("Error updating last seen event timestamp for parent:", e);
            }
        }
    }, [activeTab]);


    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [selectedTeacher, conversations, isTeacherTyping]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedTeacher || !currentStudent) return;

        const parentMessage: ChatMessage = {
            id: Date.now(),
            text: newMessage,
            sender: 'parent',
            timestamp: 'Ahora'
        };
        
        const teacherId = selectedTeacher.id;

        setConversations(prev => ({
            ...prev,
            [teacherId]: [...(prev[teacherId] || []), parentMessage]
        }));
        setNewMessage('');

        if (notificationPermission === 'granted') {
             new Notification(`Mensaje para ${selectedTeacher.name}`, {
                body: parentMessage.text,
                icon: currentStudent.avatarUrl,
                tag: `aula-integral-maya-comunicado-parent-${selectedTeacher.id}`
            });
        }

        setIsTeacherTyping(true);
        setTimeout(() => {
            const teacherReply: ChatMessage = {
                id: Date.now() + 1,
                text: `¡Hola! Gracias por tu mensaje sobre ${currentStudent.name}. Lo revisaré y te responderé en breve. - ${selectedTeacher.name}`,
                sender: 'teacher',
                timestamp: 'Ahora'
            };
            setIsTeacherTyping(false);
            setConversations(prev => ({
                ...prev,
                [teacherId]: [...(prev[teacherId] || []), teacherReply]
            }));
        }, 2500);
    };
    
    const handleConfirmCitation = (citationId: string) => {
        setCitations(prevCitations =>
            prevCitations.map(c =>
                c.id === citationId ? { ...c, status: CitationStatus.CONFIRMED } : c
            )
        );
        alert('Asistencia confirmada. El docente será notificado.');
    };
    
    const handleOpenCancelModal = (citation: Citation) => {
        setCitationToCancel(citation);
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancelCitation = (reason: string) => {
        if (!citationToCancel) return;
        setCitations(prev => prev.map(c => 
            c.id === citationToCancel.id 
            ? { ...c, status: CitationStatus.CANCELLED, cancellationReason: reason }
            : c
        ));
        setIsCancelModalOpen(false);
        setCitationToCancel(null);
        alert("Citación cancelada. El docente será notificado.");
    };

    const getStatusClass = (status: CitationStatus) => {
        switch (status) {
            case CitationStatus.CONFIRMED: return 'bg-green-100 text-green-800';
            case CitationStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
            case CitationStatus.COMPLETED: return 'bg-blue-100 text-blue-800';
            case CitationStatus.CANCELLED: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const renderContent = () => {
        switch (activeTab) {
            case 'Rendimiento':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <StatCard title="Total Incidencias" value={incidents.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                            <StatCard title="Promedio General" value="4.2 / 5.0" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>} />
                            <StatCard title="Citaciones Pendientes" value={citations.filter(c => c.status === CitationStatus.PENDING).length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow">
                            <h3 className="text-lg font-bold mb-4">Desempeño del Estudiante vs. la Clase</h3>
                             <div style={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer>
                                    <BarChart data={MOCK_ASSESSMENT_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 70 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="competency" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '40px' }}/>
                                        <Bar name="Promedio de Clase" dataKey="classAverage" fill="#8884d8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        <Bar name="Estudiante" dataKey="studentAverage" fill="#82ca9d" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                );
            case 'Incidencias':
                return (
                     <div className="bg-white p-6 rounded-xl shadow space-y-4">
                        {incidents.length > 0 ? incidents.map(inc => (
                            <div key={inc.id} className="p-4 border border-gray-200 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-primary">{inc.type}</h4>
                                    <span className="text-xs text-gray-500">{new Date(inc.timestamp).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-2 break-words">{inc.notes}</p>
                                <p className="text-xs text-gray-400 mt-3 text-right">Reportado por: {inc.teacherName}</p>
                            </div>
                        )) : <p className="text-center text-gray-500 py-8">No hay incidencias registradas para este estudiante.</p>}
                    </div>
                );
            case 'Evaluaciones':
                 return (
                    <div className="bg-white p-6 rounded-xl shadow space-y-4">
                        {MOCK_STUDENT_ASSESSMENT_RESULTS.map(res => (
                             <div key={res.assessmentId} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-gray-800 truncate">{res.assessmentTitle}</h4>
                                    <p className="text-sm text-gray-500">Completado: {new Date(res.completedAt).toLocaleDateString()}</p>
                                </div>
                                 <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${res.score >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {res.score}%
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'Recursos':
                return (
                    <div className="space-y-6">
                        <div className="bg-white p-4 rounded-xl shadow-md">
                             <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                                <option value="all">Todas las Áreas</option>
                                {SUBJECT_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {resources.filter(r => areaFilter === 'all' || r.subjectArea === areaFilter).map(res => (
                                <ResourceCard key={res.id} resource={res} />
                            ))}
                        </div>
                    </div>
                );
            case 'Comunicación':
                return (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[75vh]">
                        <div className="md:col-span-1 bg-white p-4 rounded-xl shadow flex flex-col">
                             <h3 className="text-lg font-bold mb-4 px-2">Contactar Docentes</h3>
                            <ul className="space-y-2 overflow-y-auto">
                                {teachers.map(teacher => (
                                    <li key={teacher.id} onClick={() => setSelectedTeacher(teacher)} className={`p-3 rounded-lg flex items-center space-x-3 cursor-pointer ${selectedTeacher?.id === teacher.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
                                        <img src={teacher.avatarUrl} alt={teacher.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-gray-800 truncate">{teacher.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{teacher.subject}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <div className="md:col-span-2 bg-white rounded-xl shadow flex flex-col">
                            {selectedTeacher ? (
                                <>
                                 <div className="p-4 border-b flex items-center space-x-3 min-w-0">
                                     <img src={selectedTeacher.avatarUrl} alt={selectedTeacher.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                                     <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold break-words">Chat con {selectedTeacher.name}</h3>
                                        <p className="text-sm text-gray-600 break-words">Sobre {currentStudent.name}</p>
                                     </div>
                                </div>
                                 <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50">
                                    {(conversations[selectedTeacher.id] || []).map((msg) => (
                                         <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'parent' ? 'justify-end' : ''}`}>
                                             {msg.sender === 'teacher' && <img src={selectedTeacher.avatarUrl} className="w-8 h-8 rounded-full" alt="teacher" />}
                                            <div className={`max-w-md p-3 rounded-xl ${msg.sender === 'parent' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                                <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                                <p className="text-xs opacity-70 mt-1 text-right">{msg.timestamp}</p>
                                            </div>
                                             {msg.sender === 'parent' && <img src={currentStudent.avatarUrl} className="w-8 h-8 rounded-full" alt="parent" />}
                                        </div>
                                    ))}
                                    {isTeacherTyping && (
                                         <div className="flex items-end gap-2">
                                             <img src={selectedTeacher.avatarUrl} className="w-8 h-8 rounded-full" alt="teacher" />
                                             <div className="max-w-md p-3 rounded-xl bg-gray-200 text-gray-800 rounded-bl-none">
                                                <div className="flex items-center space-x-1">
                                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                                                </div>
                                             </div>
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex items-center gap-4">
                                    <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}} placeholder="Escribe un mensaje..." className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary resize-none" rows={1}/>
                                    <button type="submit" className="bg-primary text-white rounded-full p-3 hover:bg-primary-focus disabled:bg-gray-300" disabled={!newMessage.trim()}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
                                </form>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                    <h3 className="mt-4 text-lg font-semibold text-gray-700">Selecciona un docente</h3>
                                    <p className="text-gray-500 mt-1">Elige un docente de la lista para iniciar una conversación.</p>
                                    {notificationPermission === 'default' && (
                                        <button onClick={requestNotificationPermission} className="mt-4 bg-secondary text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors">Activar Notificaciones</button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'Citaciones':
                return (
                    <div className="bg-white p-6 rounded-xl shadow space-y-4">
                        {citations.length > 0 ? citations.map(cit => (
                            <div key={cit.id} className="p-4 border border-gray-200 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-primary break-words">{cit.reason}</h4>
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(cit.status)}`}>{cit.status}</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    {new Date(cit.date).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las {cit.time} en {cit.location}
                                </p>
                                {cit.status === CitationStatus.CANCELLED && cit.cancellationReason && (
                                     <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
                                        <p><strong className="font-semibold">Motivo de cancelación:</strong> {cit.cancellationReason}</p>
                                    </div>
                                )}
                                {cit.status === CitationStatus.PENDING && (
                                    <div className="mt-4 flex justify-end space-x-3">
                                        <button onClick={() => handleOpenCancelModal(cit)} className="text-sm font-semibold text-red-600 hover:text-red-800">No puedo asistir</button>
                                        <button onClick={() => handleConfirmCitation(cit.id)} className="text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg">Confirmar Asistencia</button>
                                    </div>
                                )}
                            </div>
                        )) : <p className="text-center text-gray-500 py-8">No hay citaciones programadas.</p>}
                    </div>
                );
            case 'Comunicados':
                 return (
                    <div className="bg-white p-6 rounded-xl shadow space-y-4">
                         {announcements.map(ann => (
                            <div key={ann.id} className="p-4 border border-gray-200 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-primary">{ann.title}</h4>
                                    <span className="text-xs text-gray-500">{new Date(ann.timestamp).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-2 break-words">{ann.content}</p>
                                <p className="text-xs text-gray-400 mt-3 text-right">Enviado por: {ann.sentBy}</p>
                            </div>
                        ))}
                         {announcements.length === 0 && <p className="text-center text-gray-500 py-8">No hay comunicados para mostrar.</p>}
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

    if (!currentStudent) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="text-center p-8 bg-white rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700">No se encontraron datos del estudiante.</h2>
                    <p className="mt-2 text-gray-500">Por favor, contacte a la administración.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-6">
                 <img src={currentStudent.avatarUrl} alt={currentStudent.name} className="w-20 h-20 rounded-full object-cover border-4 border-secondary" />
                <div>
                    <p className="text-sm text-gray-500">Bienvenido al portal de tu acudido,</p>
                    <h1 className="text-3xl font-bold text-gray-800">{currentStudent.name}</h1>
                    <p className="text-gray-600">{currentStudent.grade} - Grupo {currentStudent.group}</p>
                </div>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {(['Rendimiento', 'Incidencias', 'Evaluaciones', 'Recursos', 'Comunicación', 'Citaciones', 'Eventos', 'Comunicados', 'Manual de Convivencia'] as ParentPortalTab[]).map(tab => (
                         <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            {tab}
                             {tab === 'Eventos' && hasNewEvents && (
                                <span className="absolute top-3 right-0 block h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-white"></span>
                            )}
                            {tab === 'Comunicados' && unreadAnnouncementsCount > 0 && (
                                <span className="absolute top-2 -right-3 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{unreadAnnouncementsCount}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-4">
                {renderContent()}
            </div>
            
             {isCancelModalOpen && citationToCancel && (
                <CancelCitationModal 
                    onClose={() => setIsCancelModalOpen(false)}
                    onConfirm={handleConfirmCancelCitation}
                />
            )}
        </div>
    );
};

export default ParentPortal;