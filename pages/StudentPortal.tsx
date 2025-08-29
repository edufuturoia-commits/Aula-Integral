import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { MOCK_ASSESSMENT_DATA } from '../constants';
import { getIncidents, getAnnouncements, getAllAttendanceRecords, addOrUpdateStudents } from '../db';
import type { Student, Incident, Assessment, Resource, Announcement, AttendanceRecord, ResourceType, EventPoster } from '../types';
import { AttendanceStatus, DocumentType } from '../types';
import OnlineAssessmentTaker from '../components/OnlineAssessmentTaker';
import ManualViewer from '../components/ManualViewer';
import EventPostersViewer from '../components/EventPostersViewer';

const READ_ANNOUNCEMENTS_KEY_STUDENT = 'readAnnouncements_student';
const LAST_SEEN_EVENT_TIMESTAMP_KEY_STUDENT = 'lastSeenEventTimestamp_student';

const mockOnlineAssessments: Assessment[] = [
    {
        id: 'online_asm_1',
        title: 'Prueba de Comprensión Lectora - "El Principito"',
        createdAt: new Date().toISOString(),
        questions: [
            { id: 'q1', text: '¿Qué le pidió el principito al aviador que dibujara?', area: 'Lengua Castellana', grade: '6º', competency: 'Comprensión Lectora', options: ['Una casa', 'Un cordero', 'Un elefante en una boa', 'Una estrella'], correctAnswer: 1 },
            { id: 'q2', text: '¿De qué planeta venía el principito?', area: 'Lengua Castellana', grade: '6º', competency: 'Comprensión Lectora', options: ['Marte', 'Tierra', 'Asteroide B-612', 'Venus'], correctAnswer: 2 },
            { id: 'q3', text: '¿Cuál era la mayor preocupación del principito sobre su planeta?', area: 'Lengua Castellana', grade: '6º', competency: 'Comprensión Lectora', options: ['La soledad', 'Los volcanes', 'Los baobabs', 'Su rosa'], correctAnswer: 2 },
            { id: 'q4', text: '¿Qué animal le enseñó al principito el significado de "domesticar"?', area: 'Lengua Castellana', grade: '6º', competency: 'Comprensión Lectora', options: ['La serpiente', 'El zorro', 'El elefante', 'La oveja'], correctAnswer: 1 },
        ]
    },
    {
        id: 'online_asm_2',
        title: 'Cuestionario de Matemáticas - Fracciones',
        createdAt: new Date().toISOString(),
        questions: [
             { id: 'q_math1', text: '¿Cuánto es 1/2 + 1/4?', area: 'Matemáticas', grade: '6º', competency: 'Resolución de Problemas', options: ['2/6', '3/4', '1/6', '1'], correctAnswer: 1 },
             { id: 'q_math2', text: 'Simplifica la fracción 8/12.', area: 'Matemáticas', grade: '6º', competency: 'Resolución de Problemas', options: ['4/6', '2/3', '1/2', 'No se puede simplificar'], correctAnswer: 1 },
        ]
    }
];

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

const CameraIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);


type StudentPortalTab = 'Rendimiento' | 'Evaluaciones' | 'Recursos' | 'Incidencias' | 'Asistencia' | 'Eventos' | 'Comunicados' | 'Manual de Convivencia' | 'Mi Perfil';

const TABS: StudentPortalTab[] = ['Rendimiento', 'Evaluaciones', 'Recursos', 'Incidencias', 'Asistencia', 'Eventos', 'Comunicados', 'Manual de Convivencia', 'Mi Perfil'];

interface StudentPortalProps {
    students: Student[];
    resources: Resource[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const StudentPortal: React.FC<StudentPortalProps> = ({ students, resources, setStudents }) => {
    const [activeTab, setActiveTab] = useState<StudentPortalTab>('Rendimiento');
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [completedAssessments, setCompletedAssessments] = useState<Record<string, number>>({});
    const [takingAssessment, setTakingAssessment] = useState<Assessment | null>(null);
    const [hasNewEvents, setHasNewEvents] = useState(false);
    const [hasNewAnnouncements, setHasNewAnnouncements] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [showProfileSnackbar, setShowProfileSnackbar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentStudent = useMemo(() => students.length > 1 ? students[1] : students[0], [students]);
    const [profileData, setProfileData] = useState<Student | null>(currentStudent);

    useEffect(() => {
        setProfileData(currentStudent);
    }, [currentStudent]);

    useEffect(() => {
        if (!currentStudent) return;
        const loadData = async () => {
            const [allIncidents, allAnnouncements, allAttendance] = await Promise.all([
                getIncidents(),
                getAnnouncements(),
                getAllAttendanceRecords(),
            ]);
            
            setIncidents(allIncidents.filter(i => i.studentId === currentStudent.id && !i.archived));
            setAttendance(allAttendance.filter(a => a.studentId === currentStudent.id));
            
            const studentAnnouncements = allAnnouncements.filter(ann => 
                ann.recipients === 'all' || 
                (typeof ann.recipients === 'object' && ann.recipients.grade === currentStudent.grade && ann.recipients.group === currentStudent.group)
            );
            setAnnouncements(studentAnnouncements);

            const readIds: string[] = JSON.parse(localStorage.getItem(READ_ANNOUNCEMENTS_KEY_STUDENT) || '[]');
            const hasUnread = studentAnnouncements.some(ann => !readIds.includes(ann.id));
            setHasNewAnnouncements(hasUnread);

            try {
                const savedPostersRaw = localStorage.getItem('eventPosters');
                if (savedPostersRaw) {
                    const savedPosters: EventPoster[] = JSON.parse(savedPostersRaw);
                    if (savedPosters.length > 0) {
                        const lastSeenTimestamp = localStorage.getItem(LAST_SEEN_EVENT_TIMESTAMP_KEY_STUDENT);
                        const latestPosterTimestamp = savedPosters[0].createdAt;
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

    useEffect(() => {
        if (activeTab === 'Comunicados' && announcements.length > 0) {
            const allAnnouncementIds = announcements.map(ann => ann.id);
            localStorage.setItem(READ_ANNOUNCEMENTS_KEY_STUDENT, JSON.stringify(allAnnouncementIds));
            setHasNewAnnouncements(false);
        }

        if (activeTab === 'Eventos') {
            try {
                const savedPostersRaw = localStorage.getItem('eventPosters');
                if (savedPostersRaw) {
                    const savedPosters: EventPoster[] = JSON.parse(savedPostersRaw);
                    if (savedPosters.length > 0) {
                        localStorage.setItem(LAST_SEEN_EVENT_TIMESTAMP_KEY_STUDENT, savedPosters[0].createdAt);
                    }
                }
                setHasNewEvents(false);
            } catch (e) {
                console.error("Error updating last seen event timestamp for student:", e);
            }
        }
    }, [activeTab, announcements]);

    const studentPerformanceData = useMemo(() => {
        if (!currentStudent) return [];
        return MOCK_ASSESSMENT_DATA.map(d => ({
            ...d,
            studentAverage: d.studentAverage + (currentStudent.id * 2 % 10 - 5) // Simulate student variation
        }));
    }, [currentStudent]);

    const handleAssessmentComplete = (assessmentId: string, score: number) => {
        setCompletedAssessments(prev => ({ ...prev, [assessmentId]: score }));
    };

    const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfileData(prev => prev ? { ...prev, avatarUrl: event.target?.result as string } : null);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleSaveProfile = async () => {
        if (!profileData) return;
        
        const updatedStudents = students.map(s => s.id === profileData.id ? profileData : s);
        
        await addOrUpdateStudents(updatedStudents);
        setStudents(updatedStudents);
        
        setIsEditingProfile(false);
        setShowProfileSnackbar(true);
        setTimeout(() => setShowProfileSnackbar(false), 3000);
    };

    const handleCancelEdit = () => {
        setProfileData(currentStudent);
        setIsEditingProfile(false);
    };


    if (!currentStudent) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="text-center p-8 bg-white rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700">No hay datos de estudiantes.</h2>
                    <p className="mt-2 text-gray-500">Por favor, importe una lista de estudiantes en la sección "Mi Aula" para activar el portal de estudiante.</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'Rendimiento':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard title="Total Incidencias" value={incidents.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                            <StatCard title="Promedio General" value="4.2 / 5.0" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>} />
                            <StatCard title="Próxima Evaluación" value="Julio 25" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow">
                            <h3 className="text-lg font-bold mb-4">Mi Desempeño vs. la Clase</h3>
                            <div style={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer>
                                    <BarChart data={studentPerformanceData} margin={{ top: 5, right: 20, left: 0, bottom: 70 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="competency" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }}/>
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '40px' }}/>
                                        <Bar name="Promedio de Clase" dataKey="classAverage" fill="#8884d8" radius={[4, 4, 0, 0]} maxBarSize={40}/>
                                        <Bar name="Mi Desempeño" dataKey="studentAverage" fill="#82ca9d" radius={[4, 4, 0, 0]} maxBarSize={40}/>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                );
            case 'Evaluaciones':
                return (
                    <div className="bg-white p-6 rounded-xl shadow space-y-4">
                         {mockOnlineAssessments.map(asm => {
                             const completedScore = completedAssessments[asm.id];
                             return (
                                <div key={asm.id} className="p-4 border rounded-lg flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-gray-800">{asm.title}</h4>
                                        <p className="text-sm text-gray-500">{asm.questions.length} preguntas</p>
                                    </div>
                                    {completedScore !== undefined ? (
                                        <div className="text-right flex flex-col items-end">
                                            <p className="text-sm text-gray-500 mb-1">Calificación Obtenida</p>
                                            <div className={`px-4 py-2 rounded-lg text-lg font-bold ${completedScore >= 3.0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {completedScore.toFixed(1)}
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setTakingAssessment(asm)} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors">
                                            Realizar Evaluación
                                        </button>
                                    )}
                                </div>
                             );
                         })}
                    </div>
                );
             case 'Recursos':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {resources.map(res => (
                            <div key={res.id} className="bg-white rounded-lg shadow border border-gray-200 flex flex-col overflow-hidden">
                                <div className={`h-24 w-full flex items-center justify-center p-6 ${ res.type === 'PDF' ? 'bg-red-100 text-red-600' : res.type === 'Video' ? 'bg-blue-100 text-blue-600' : res.type === 'Imagen' ? 'bg-purple-100 text-purple-600' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {ICONS[res.type]}
                                </div>
                                <div className="p-4 flex flex-col flex-grow">
                                    <h3 className="font-bold text-gray-800 truncate">{res.title}</h3>
                                    <p className="text-xs text-gray-500 mb-2">{res.subjectArea}</p>
                                    <p className="text-sm text-gray-600 flex-grow">{res.description}</p>
                                </div>
                                <div className="p-4 bg-gray-50 border-t">
                                    <button className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors text-sm">
                                        Ver Recurso
                                    </button>
                                </div>
                            </div>
                        ))}
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
                                <p className="text-sm text-gray-600 mt-2">{inc.notes}</p>
                                <p className="text-xs text-gray-400 mt-3 text-right">Reportado por: {inc.teacherName}</p>
                            </div>
                        )) : <p className="text-center text-gray-500 py-8">No tienes incidencias registradas.</p>}
                    </div>
                );
            case 'Asistencia':
                return (
                    <div className="bg-white p-6 rounded-xl shadow">
                        <div className="overflow-x-auto max-h-[60vh]">
                            <table className="min-w-full text-sm divide-y divide-gray-200">
                                <thead className="bg-gray-100 sticky top-0"><tr>
                                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Fecha</th>
                                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Estado</th>
                                </tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {attendance.map(rec => (
                                        <tr key={rec.id}>
                                            <td className="px-4 py-2">{rec.date}</td>
                                            <td className="px-4 py-2"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                rec.status === AttendanceStatus.ABSENT ? 'bg-red-100 text-red-800' : 
                                                rec.status === AttendanceStatus.TARDY ? 'bg-yellow-100 text-yellow-800' : 
                                                rec.status === AttendanceStatus.EXCUSED ? 'bg-blue-100 text-blue-800' :
                                                rec.status === AttendanceStatus.SPECIAL_PERMIT ? 'bg-purple-100 text-purple-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>{rec.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'Eventos':
                return <EventPostersViewer />;
            case 'Comunicados':
                return (
                    <div className="bg-white p-6 rounded-xl shadow space-y-4">
                         {announcements.map(ann => (
                            <div key={ann.id} className="p-4 border border-gray-200 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-primary">{ann.title}</h4>
                                    <span className="text-xs text-gray-500">{new Date(ann.timestamp).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">{ann.content}</p>
                                <p className="text-xs text-gray-400 mt-3 text-right">Enviado por: {ann.sentBy}</p>
                            </div>
                        ))}
                    </div>
                );
            case 'Manual de Convivencia':
                return <ManualViewer />;
            case 'Mi Perfil':
                if (!profileData) return null;
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md max-w-3xl mx-auto space-y-6">
                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                            <div className="relative">
                                <img src={profileData.avatarUrl} alt={profileData.name} className="w-24 h-24 rounded-full object-cover border-4 border-primary" />
                                {isEditingProfile && (
                                    <button
                                        onClick={handleAvatarClick}
                                        className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                        aria-label="Cambiar foto de perfil"
                                    >
                                        <CameraIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                             <div className="flex-1 text-center sm:text-left">
                                {isEditingProfile ? (
                                     <input
                                        type="text"
                                        name="name"
                                        value={profileData.name}
                                        onChange={handleProfileInputChange}
                                        className="text-3xl font-bold text-gray-800 w-full p-2 border border-gray-300 rounded-md"
                                    />
                                ) : (
                                    <h1 className="text-3xl font-bold text-gray-800">{profileData.name}</h1>
                                )}
                                <p className="text-gray-600">{profileData.grade} - Grupo {profileData.group}</p>
                            </div>
                        </div>
                        <div className="border-t pt-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-700">Información Personal</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Correo Electrónico</label>
                                    {isEditingProfile ? (
                                        <input type="email" name="email" value={profileData.email || ''} onChange={handleProfileInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900"/>
                                    ) : (
                                        <p className="mt-1 text-gray-800 font-semibold">{profileData.email || 'No especificado'}</p>
                                    )}
                                </div>
                                {/* Date of Birth */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Fecha de Nacimiento</label>
                                    {isEditingProfile ? (
                                        <input type="date" name="dateOfBirth" value={profileData.dateOfBirth || ''} onChange={handleProfileInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900"/>
                                    ) : (
                                        <p className="mt-1 text-gray-800 font-semibold">{profileData.dateOfBirth || 'No especificado'}</p>
                                    )}
                                </div>
                                 {/* Document Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Tipo de Documento</label>
                                    {isEditingProfile ? (
                                        <select name="documentType" value={profileData.documentType || ''} onChange={handleProfileInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                                            <option value="">Seleccionar...</option>
                                            <option value={DocumentType.REGISTRO_CIVIL}>{DocumentType.REGISTRO_CIVIL}</option>
                                            <option value={DocumentType.TARJETA_IDENTIDAD}>{DocumentType.TARJETA_IDENTIDAD}</option>
                                        </select>
                                    ) : (
                                        <p className="mt-1 text-gray-800 font-semibold">{profileData.documentType || 'No especificado'}</p>
                                    )}
                                </div>
                                 {/* Document Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Número de Documento</label>
                                    {isEditingProfile ? (
                                        <input type="text" name="documentNumber" value={profileData.documentNumber || ''} onChange={handleProfileInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900"/>
                                    ) : (
                                        <p className="mt-1 text-gray-800 font-semibold">{profileData.documentNumber || 'No especificado'}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                         <div className="flex justify-end space-x-3 pt-6 border-t">
                            {isEditingProfile ? (
                                <>
                                    <button onClick={handleCancelEdit} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">Cancelar</button>
                                    <button onClick={handleSaveProfile} className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">Guardar Cambios</button>
                                </>
                            ) : (
                                <button onClick={() => setIsEditingProfile(true)} className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">Editar Perfil</button>
                            )}
                        </div>
                    </div>
                );
        }
    };
    
    if (takingAssessment) {
        return <OnlineAssessmentTaker assessment={takingAssessment} onComplete={(score) => handleAssessmentComplete(takingAssessment.id, score)} onBack={() => setTakingAssessment(null)} />;
    }

    return (
        <div className="space-y-6 relative">
            <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-6">
                 <img src={currentStudent.avatarUrl} alt={currentStudent.name} className="w-20 h-20 rounded-full object-cover border-4 border-secondary" />
                <div>
                    <p className="text-sm text-gray-500">Bienvenido a tu portal,</p>
                    <h1 className="text-3xl font-bold text-gray-800">{currentStudent.name}</h1>
                    <p className="text-gray-600">{currentStudent.grade} - Grupo {currentStudent.group}</p>
                </div>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                         <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            {tab}
                            {tab === 'Eventos' && hasNewEvents && (
                                <span className="absolute top-3 right-0 block h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-white"></span>
                            )}
                            {tab === 'Comunicados' && hasNewAnnouncements && (
                                <span className="absolute top-3 right-0 block h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-white"></span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div>
                {renderContent()}
            </div>
            {showProfileSnackbar && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-fade-in-out">
                    Perfil actualizado exitosamente.
                </div>
            )}
        </div>
    );
};

export default StudentPortal;