import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { Student, Teacher, Incident, Announcement } from '../types';
import { IncidentType, IncidentStatus } from '../types';
import { getIncidents } from '../db';
import DashboardCard from '../components/DashboardCard';
import { ClassroomIcon, IncidentsIcon, ProfileIcon } from '../constants';

// --- Props ---
interface RectoryProps {
    students: Student[];
    teachers: Teacher[];
    announcements: Announcement[];
    onUpdateAnnouncements: (announcement: Announcement) => Promise<void>;
    onShowSystemMessage: (message: string, type?: 'success' | 'error') => void;
    currentUser: Teacher;
}

// --- Type for tabs ---
type RectoryTab = 'dashboard' | 'communication';

// --- Mock data for charts ---
const MOCK_GRADE_PERFORMANCE = [
    { name: '6º', "Rendimiento Promedio": 4.1 },
    { name: '7º', "Rendimiento Promedio": 3.8 },
    { name: '8º', "Rendimiento Promedio": 4.3 },
    { name: '9º', "Rendimiento Promedio": 3.9 },
    { name: '10º', "Rendimiento Promedio": 4.5 },
    { name: '11º', "Rendimiento Promedio": 4.4 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#DA291C', '#8884d8'];


const Rectory: React.FC<RectoryProps> = ({ students, teachers, announcements, onUpdateAnnouncements, onShowSystemMessage, currentUser }) => {
    const [activeTab, setActiveTab] = useState<RectoryTab>('dashboard');
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    
    // --- Communication State - simplified ---
    const [recipientType, setRecipientType] = useState<'all' | 'all_teachers' | 'all_parents'>('all');
    const [commTitle, setCommTitle] = useState('');
    const [commContent, setCommContent] = useState('');
    
    const sentHistory = useMemo(() => {
        return announcements
            .filter(ann => ann.sentBy === "Rectoría")
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [announcements]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const allIncidents = await getIncidents();
            setIncidents(allIncidents.filter(inc => inc.status !== IncidentStatus.ARCHIVED));
            setLoading(false);
        };
        loadData();
    }, []);

    const incidentTypeData = useMemo(() => {
        const counts = incidents.reduce((acc, incident) => {
            acc[incident.type] = (acc[incident.type] || 0) + 1;
            return acc;
        }, {} as Record<IncidentType, number>);

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [incidents]);
    
    const handleSendCommunication = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const newAnnouncement: Announcement = {
            id: `ann_rector_${Date.now()}`,
            title: commTitle,
            content: commContent,
            recipients: recipientType,
            timestamp: new Date().toISOString(),
            sentBy: "Rectoría",
        };
        
        await onUpdateAnnouncements(newAnnouncement);
        
        setCommTitle('');
        setCommContent('');
        setRecipientType('all');
        
        onShowSystemMessage("Comunicado enviado exitosamente.");
    };

    if (loading) {
        return <div className="text-center p-8">Cargando datos de la institución...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    <button onClick={() => setActiveTab('dashboard')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Panel de Control</button>
                    <button onClick={() => setActiveTab('communication')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'communication' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Comunicación</button>
                </nav>
            </div>
            
            <div className={activeTab === 'dashboard' ? '' : 'hidden'}>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DashboardCard title="Total Estudiantes" value={students.length.toString()} color="bg-blue-100 text-blue-600" icon={<ClassroomIcon className="h-6 w-6" />} />
                        <DashboardCard title="Total Docentes" value={teachers.length.toString()} color="bg-purple-100 text-purple-600" icon={<ProfileIcon className="h-6 w-6" />} />
                        <DashboardCard title="Incidencias Activas" value={incidents.length.toString()} color="bg-red-100 text-red-600" icon={<IncidentsIcon className="h-6 w-6" />} />
                        <DashboardCard title="Asistencia Hoy" value="94%" color="bg-green-100 text-green-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Incidencias por Tipo</h3>
                            <div style={{ width: '100%', height: 300 }}>
                                {incidentTypeData.length > 0 ? (
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={incidentTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                                {incidentTypeData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-center text-gray-500 pt-16">No hay datos de incidencias.</p>}
                            </div>
                        </div>
                        <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Rendimiento Académico por Grado</h3>
                             <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={MOCK_GRADE_PERFORMANCE}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Rendimiento Promedio" fill="#82ca9d" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={activeTab === 'communication' ? '' : 'hidden'}>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Nuevo Comunicado</h3>
                        <form onSubmit={handleSendCommunication} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destinatarios</label>
                                <select value={recipientType} onChange={e => setRecipientType(e.target.value as any)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                    <option value="all">Toda la comunidad</option>
                                    <option value="all_teachers">Todos los Docentes</option>
                                    <option value="all_parents">Todos los Acudientes</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                                <input type="text" value={commTitle} onChange={e => setCommTitle(e.target.value)} required className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenido</label>
                                <textarea rows={8} value={commContent} onChange={e => setCommContent(e.target.value)} required className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"></textarea>
                            </div>
                            <button type="submit" className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">Enviar Comunicado</button>
                        </form>
                    </div>
                    <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Historial de Comunicados</h3>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                             {sentHistory.map(ann => (
                                <div key={ann.id} className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-primary dark:text-secondary">{ann.title}</h4>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(ann.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap">{ann.content}</p>
                                </div>
                            ))}
                            {sentHistory.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-10">No hay comunicados enviados desde Rectoría.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Rectory;
