import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { MOCK_STUDENTS, MOCK_ASSESSMENT_DATA, MOCK_STUDENT_ASSESSMENT_RESULTS, MOCK_RESOURCES, SUBJECT_AREAS, MOCK_CITATIONS, MOCK_USER, MOCK_TEACHERS } from '../constants';
import { getIncidents, getDownloadedResources, getAnnouncements } from '../db';
import type { Incident, Student, StudentAssessmentResult, Resource, ResourceType, Citation, Announcement, Teacher } from '../types';
import { CitationStatus } from '../types';
import CancelCitationModal from '../components/CancelCitationModal';

const currentStudent: Student = MOCK_STUDENTS[0]; // Hardcoded for demo
const READ_ANNOUNCEMENTS_KEY = 'readAnnouncements';

type ParentPortalTab = 'Rendimiento' | 'Incidencias' | 'Evaluaciones' | 'Recursos' | 'Comunicación' | 'Citaciones' | 'Comunicados';

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
            <p className="text-sm text-gray-600 flex-grow">{resource.description}</p>
        </div>
        <div className="p-4 bg-gray-50 border-t">
            <button className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors text-sm">
                Ver Recurso
            </button>
        </div>
    </div>
);


const ParentPortal: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ParentPortalTab>('Rendimiento');
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [citations, setCitations] = useState<Citation[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [areaFilter, setAreaFilter] = useState<string>('all');
    const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({
      't_math_01': [
        { id: 1, text: 'Buenas tardes, quería consultar sobre el progreso de Ana en Matemáticas.', sender: 'parent', timestamp: 'Hace 2 horas' },
        { id: 2, text: '¡Buenas tardes! Claro que sí. Ana ha mostrado una gran mejora en la resolución de problemas. Mañana tenemos una pequeña evaluación sobre fracciones.', sender: 'teacher', timestamp: 'Hace 1 hora' },
      ],
      't_span_02': [
        { id: 3, text: 'Hola profe Lucía, ¿hay alguna lectura recomendada para el fin de semana?', sender: 'parent', timestamp: 'Ayer'}
      ],
      't_sci_03': [],
    });
    const [newMessage, setNewMessage] = useState('');
    const [isTeacherTyping, setIsTeacherTyping] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [citationToCancel, setCitationToCancel] = useState<Citation | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [notificationPermission, setNotificationPermission] = useState('Notification' in window ? Notification.permission : 'denied');
    const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);


    useEffect(() => {
        const loadData = async () => {
            const allIncidents = await getIncidents();
            setIncidents(allIncidents.filter(inc => inc.studentId === currentStudent.id));

            const allResources = await getDownloadedResources();
            const resourceMap = new Map(MOCK_RESOURCES.map(r => [r.id, r]));
            allResources.forEach(r => resourceMap.set(r.id, r));
            setResources(Array.from(resourceMap.values()));
            
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
        };
        loadData();
    }, []);

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
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [selectedTeacher, conversations, isTeacherTyping]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedTeacher) return;

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
            const notification = new Notification(`Mensaje para ${selectedTeacher.name}`, {
                body: parentMessage.text,
                icon: currentStudent.avatarUrl,
                tag: `aula-integral-comunicado-parent-${selectedTeacher.id}`
            });
        }

        setIsTeacherTyping(true);
        setTimeout(() => {
            const teacherReply: ChatMessage = {
                id: Date.now() + 1,
                text: `¡Hola! Gracias por tu mensaje sobre Ana. Lo revisaré y te responderé en breve. - ${selectedTeacher.name}`,
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

    const studentPerformanceData = MOCK_ASSESSMENT_DATA.map(d => ({
        ...d,
        studentAverage: d.studentAverage + (currentStudent.id * 2 % 10 - 5) // Simulate student variation
    }));
    
    const filteredResources = useMemo(() => {
        return resources.filter(res => areaFilter === 'all' || res.subjectArea === areaFilter);
    }, [resources, areaFilter]);


    const renderContent = () => {
        switch (activeTab) {
            case 'Rendimiento':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard title="Total Incidencias" value={incidents.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                            <StatCard title="Promedio General" value="8.5 / 10" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>} />
                            <StatCard title="Próxima Evaluación" value="Junio 15" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow">
                            <h3 className="text-lg font-bold mb-4">Desempeño Comparativo por Competencia</h3>
                            <div style={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer>
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={studentPerformanceData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="competency" />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                        <Radar name="Promedio de la Clase" dataKey="classAverage" stroke="#8884d8" fill="#8884d8" fillOpacity={0.5} />
                                        <Radar name="Tu Desempeño" dataKey="studentAverage" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.7} />
                                        <Legend />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                );
            case 'Incidencias':
                 return (
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h3 className="text-lg font-bold mb-4">Historial de Incidencias</h3>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {incidents.length > 0 ? incidents.map(inc => (
                                <div key={inc.id} className="p-4 rounded-md border border-gray-200 bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-primary">{inc.type}</p>
                                            <p className="text-sm text-gray-500">{new Date(inc.timestamp).toLocaleString()}</p>
                                        </div>
                                        <p className="text-xs text-gray-500">Reportado por: {inc.teacherName}</p>
                                    </div>
                                    <p className="mt-2 text-gray-700">{inc.notes}</p>
                                </div>
                            )) : <p className="text-center text-gray-500 py-8">¡Felicidades! No hay incidencias registradas.</p>}
                        </div>
                    </div>
                 );
            case 'Evaluaciones':
                return (
                    <div className="bg-white p-6 rounded-xl shadow">
                         <h3 className="text-lg font-bold mb-4">Resultados de Evaluaciones</h3>
                         <div className="overflow-x-auto">
                             <table className="min-w-full text-sm divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Evaluación</th>
                                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Fecha</th>
                                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Calificación</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {MOCK_STUDENT_ASSESSMENT_RESULTS.map(res => (
                                    <tr key={res.assessmentId}>
                                        <td className="px-6 py-4 font-medium text-gray-900">{res.assessmentTitle}</td>
                                        <td className="px-6 py-4 text-gray-700">{new Date(res.completedAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4"><span className={`font-bold ${res.score >= 80 ? 'text-green-600' : res.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{res.score}/100</span></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                );
            case 'Recursos':
                return (
                    <div className="space-y-6">
                        <div className="bg-white p-4 rounded-xl shadow">
                             <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                                <option value="all">Todas las Áreas</option>
                                {SUBJECT_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredResources.map(res => <ResourceCard key={res.id} resource={res} />)}
                        </div>
                    </div>
                );
            case 'Comunicados':
                return (
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h3 className="text-lg font-bold mb-4">Comunicados del Colegio</h3>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {announcements.length > 0 ? announcements.map(ann => (
                                <div key={ann.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-primary">{ann.title}</h4>
                                        <span className="text-xs text-gray-500">
                                            {new Date(ann.timestamp).toLocaleDateString('es-CO')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">{ann.content}</p>
                                    <p className="text-xs text-gray-400 mt-3 text-right">Enviado por: {ann.sentBy}</p>
                                </div>
                            )) : (
                                <p className="text-center text-gray-500 py-8">No hay comunicados para mostrar.</p>
                            )}
                        </div>
                    </div>
                );
            case 'Comunicación':
                if (!selectedTeacher) {
                    return (
                        <div className="bg-white p-6 rounded-xl shadow">
                            <h3 className="text-lg font-bold mb-4">Iniciar una conversación</h3>
                            <p className="text-sm text-gray-600 mb-6">Selecciona el docente con el que deseas comunicarte.</p>
                             {notificationPermission === 'default' && (
                                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6 rounded-md shadow" role="alert">
                                    <div className="flex">
                                        <div className="py-1"><svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8h2v2H9v-2z"/></svg></div>
                                        <div>
                                            <p className="font-bold">Recibe notificaciones de nuevos mensajes</p>
                                            <p className="text-sm">Permite las notificaciones para saber al instante cuándo hay nueva información.</p>
                                            <button onClick={requestNotificationPermission} className="mt-2 bg-yellow-500 text-white font-bold py-1 px-3 rounded text-sm hover:bg-yellow-600 transition-colors">
                                                Activar Notificaciones
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {MOCK_TEACHERS.map(teacher => (
                                    <div key={teacher.id} onClick={() => setSelectedTeacher(teacher)} className="p-4 border rounded-lg flex items-center gap-4 cursor-pointer hover:bg-gray-50 hover:border-primary transition-colors">
                                        <img src={teacher.avatarUrl} alt={teacher.name} className="w-12 h-12 rounded-full"/>
                                        <div>
                                            <p className="font-bold text-gray-800">{teacher.name}</p>
                                            <p className="text-sm text-gray-500">{teacher.subject}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }

                const currentChatMessages = conversations[selectedTeacher.id] || [];

                return (
                    <div className="bg-white rounded-xl shadow flex flex-col h-[70vh]">
                        <div className="p-4 border-b flex items-center space-x-3">
                             <button onClick={() => setSelectedTeacher(null)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                   <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                             </button>
                             <img src={selectedTeacher.avatarUrl} alt={selectedTeacher.name} className="w-10 h-10 rounded-full" />
                             <div>
                                <h3 className="text-lg font-bold">Chat con {selectedTeacher.name}</h3>
                                <p className="text-sm text-gray-600">{selectedTeacher.subject}</p>
                             </div>
                        </div>
                        <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50">
                            {currentChatMessages.map(msg => (
                                <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'parent' ? 'justify-end' : ''}`}>
                                    {msg.sender === 'teacher' && <img src={selectedTeacher.avatarUrl} className="w-8 h-8 rounded-full" alt={selectedTeacher.name} />}
                                    <div className={`max-w-md p-3 rounded-xl ${msg.sender === 'parent' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                        <p className="text-sm">{msg.text}</p>
                                        <p className="text-xs opacity-70 mt-1 text-right">{msg.timestamp}</p>
                                    </div>
                                    {msg.sender === 'parent' && <img src={currentStudent.avatarUrl} className="w-8 h-8 rounded-full" alt={currentStudent.name} />}
                                </div>
                            ))}
                            {isTeacherTyping && (
                                <div className="flex items-end gap-2">
                                    <img src={selectedTeacher.avatarUrl} className="w-8 h-8 rounded-full" alt={selectedTeacher.name} />
                                    <div className="max-w-md p-3 rounded-xl bg-gray-200 text-gray-800 rounded-bl-none">
                                        <div className="flex items-center justify-center space-x-1">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex items-center gap-4">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}}
                                placeholder="Escribe un mensaje para el docente..."
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-white text-gray-900 placeholder-gray-500"
                                rows={1}
                            />
                            <button type="submit" className="bg-primary text-white rounded-full p-3 hover:bg-primary-focus transition-colors disabled:bg-gray-300" disabled={!newMessage.trim()}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            </button>
                        </form>
                    </div>
                );
            case 'Citaciones':
                 return (
                    <div className="bg-white p-6 rounded-xl shadow">
                         <h3 className="text-lg font-bold mb-4">Citaciones Programadas</h3>
                         <div className="space-y-4">
                            {citations.length > 0 ? citations.map(cit => (
                                 <div key={cit.id} className={`p-4 rounded-md border ${cit.status === CitationStatus.CANCELLED ? 'bg-gray-200 border-gray-300' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex justify-between items-center text-sm mb-2">
                                        <p className="font-semibold text-gray-700">Motivo: {cit.reason}</p>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(cit.status)}`}>{cit.status}</span>
                                    </div>
                                    <p className="text-sm text-gray-600"><strong>Fecha:</strong> {new Date(cit.date).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las <strong>{cit.time}</strong></p>
                                    <p className="text-sm text-gray-600"><strong>Lugar:</strong> {cit.location}</p>
                                    
                                     {cit.status === CitationStatus.CANCELLED && cit.cancellationReason && (
                                        <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
                                            <p><strong className="font-semibold">Motivo de cancelación:</strong> {cit.cancellationReason}</p>
                                        </div>
                                    )}

                                    {cit.status === CitationStatus.PENDING && (
                                        <div className="mt-4 flex justify-end space-x-3">
                                            <button onClick={() => handleOpenCancelModal(cit)} className="text-xs font-semibold text-red-600 hover:text-red-800">No puedo asistir</button>
                                            <button onClick={() => handleConfirmCitation(cit.id)} className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full hover:bg-green-700">Confirmar Asistencia</button>
                                        </div>
                                    )}
                                </div>
                            )) : <p className="text-center text-gray-500 py-8">No hay citaciones programadas.</p>}
                         </div>
                    </div>
                 );
            default:
                return null;
        }
    };
    
    const TABS: ParentPortalTab[] = ['Rendimiento', 'Incidencias', 'Evaluaciones', 'Recursos', 'Comunicación', 'Citaciones', 'Comunicados'];

    return (
        <div className="bg-gray-50/50">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow mb-8">
                 <div className="flex items-center space-x-6">
                    <img src={currentStudent.avatarUrl} alt={currentStudent.name} className="w-20 h-20 rounded-full object-cover border-4 border-secondary" />
                    <div>
                        <p className="text-sm text-gray-500">Portal del Acudiente para</p>
                        <h1 className="text-3xl font-bold text-gray-800">{currentStudent.name}</h1>
                        <p className="text-gray-600">{currentStudent.grade} - Grupo {currentStudent.group}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4">
                    <div className="bg-white p-4 rounded-xl shadow sticky top-8">
                        <h2 className="text-lg font-semibold mb-4 px-2">Navegación</h2>
                        <nav className="space-y-1">
                            {TABS.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-150 flex justify-between items-center ${activeTab === tab ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <span>{tab}</span>
                                    {tab === 'Comunicados' && unreadAnnouncementsCount > 0 && (
                                        <span className="bg-accent text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{unreadAnnouncementsCount}</span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>
                <main className="flex-1">
                    {renderContent()}
                </main>
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