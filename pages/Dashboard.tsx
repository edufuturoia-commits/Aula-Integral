import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import DashboardCard from '../components/DashboardCard';
import { MOCK_ASSESSMENT_DATA } from '../constants';
import { CitationStatus, type AssessmentData, type Student, type Teacher, type Citation, type Page } from '../types';
import { GoogleGenAI } from "@google/genai";

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="label font-bold text-gray-800 dark:text-gray-100">{`${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.fill }} className="text-sm font-medium">{`${pld.name}: ${pld.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};


interface DashboardProps {
    students: Student[];
    teachers: Teacher[];
    citations: Citation[];
    onNavigate: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ students, teachers, citations, onNavigate }) => {
    const [birthdays, setBirthdays] = useState<{ name: string, avatarUrl: string, role: string }[]>([]);
    const [birthdayMessages, setBirthdayMessages] = useState<Record<string, string>>({});
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    useEffect(() => {
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // getMonth() is 0-indexed
        const currentDay = today.getDate();

        const checkBirthdays = (people: (Student | Teacher)[], role: string) => {
            return people
                .filter(person => {
                    if (!person.dateOfBirth) return false;
                    // Add T00:00:00 to avoid timezone issues where the date might be interpreted as UTC
                    const birthDate = new Date(person.dateOfBirth + 'T00:00:00');
                    const birthMonth = birthDate.getMonth() + 1;
                    const birthDay = birthDate.getDate();
                    return birthMonth === currentMonth && birthDay === currentDay;
                })
                .map(person => ({ name: person.name, avatarUrl: person.avatarUrl, role }));
        };

        const studentBirthdays = checkBirthdays(students, 'Estudiante');
        const teacherBirthdays = checkBirthdays(teachers, 'Docente');
        
        setBirthdays([...studentBirthdays, ...teacherBirthdays]);
    }, [students, teachers]);


    useEffect(() => {
        const generateMessages = async () => {
            if (birthdays.length > 0) {
                setIsLoadingMessages(true);
                try {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    const messages: Record<string, string> = {};

                    const messagePromises = birthdays.map(async (person) => {
                         const prompt = `Genera un mensaje de cumpleaños corto, cálido y festivo para ${person.name}, que es un(a) ${person.role} en nuestra institución. El mensaje se mostrará en el panel principal. Mantenlo amigable y profesional. Menciona su nombre. No incluyas saludos como "Hola" o "Estimados", solo el mensaje principal del saludo.`;
                        
                        const response = await ai.models.generateContent({
                            model: 'gemini-2.5-flash-lite',
                            contents: prompt,
                        });
                        return { name: person.name, message: response.text };
                    });

                    const results = await Promise.all(messagePromises);
                    results.forEach(result => {
                        messages[result.name] = result.message;
                    });
                    
                    setBirthdayMessages(messages);

                } catch (error) {
                    console.error("Error generating birthday messages:", error);
                    const genericMessages: Record<string, string> = {};
                    birthdays.forEach(p => {
                        genericMessages[p.name] = `¡Feliz cumpleaños, ${p.name}! Te deseamos un día lleno de alegría y éxitos.`;
                    });
                    setBirthdayMessages(genericMessages); // Fallback message
                } finally {
                    setIsLoadingMessages(false);
                }
            } else {
                setBirthdayMessages({}); // Clear messages if no birthdays
            }
        };

        generateMessages();
    }, [birthdays]);

    const pendingCitations = useMemo(() => {
        return citations
            .filter(c => 
                c.status === CitationStatus.PENDING || 
                c.status === CitationStatus.CONFIRMED || 
                c.status === CitationStatus.RESCHEDULE_REQUESTED
            )
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [citations]);

    return (
        <div className="space-y-8">
            {birthdays.length > 0 && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 dark:bg-yellow-900/50 dark:border-yellow-600 dark:text-yellow-200 p-6 rounded-xl shadow-md mb-8 space-y-4 animate-fade-in">
                    <h2 className="text-xl font-bold flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c-.454-.303-.977-.454-1.5-.454V5.546c.523 0 1.046-.151 1.5-.454a2.704 2.704 0 013 0 2.704 2.704 0 003 0 2.704 2.704 0 013 0 2.704 2.704 0 003 0c.454.303.977.454 1.5.454v10z" /></svg>
                        ¡Celebraciones de Hoy!
                    </h2>
                    {isLoadingMessages ? (
                        <p className="text-center text-yellow-700 dark:text-yellow-300">Generando saludos de cumpleaños...</p>
                    ) : (
                        birthdays.map((person, index) => (
                            <div key={index} className="flex items-start space-x-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                                <img src={person.avatarUrl} alt={person.name} className="w-14 h-14 rounded-full object-cover border-2 border-yellow-400"/>
                                <div>
                                    <p className="font-bold text-yellow-900 dark:text-yellow-100">{person.name} ({person.role})</p>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 italic">"{birthdayMessages[person.name]}"</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard 
                    title="Estudiantes Activos" 
                    value={students.length.toString()} 
                    color="bg-blue-100 text-blue-600"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
                 <DashboardCard 
                    title="Docentes Activos" 
                    value={teachers.length.toString()} 
                    color="bg-purple-100 text-purple-600"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                />
                <DashboardCard 
                    title="Incidencias Hoy" 
                    value="3" 
                    color="bg-red-100 text-red-600"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <DashboardCard 
                    title="Evaluaciones Activas" 
                    value="5" 
                    color="bg-yellow-100 text-yellow-600"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Análisis de Desempeño por Competencia</h2>
                <div style={{ width: '100%', height: 400 }} className="text-gray-500 dark:text-gray-400">
                    <ResponsiveContainer>
                        <BarChart data={MOCK_ASSESSMENT_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 70 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.3}/>
                            <XAxis dataKey="competency" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12, fill: 'currentColor' }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'currentColor' }} />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: 'rgba(209, 213, 219, 0.3)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '40px' }} />
                            <Bar name="Promedio del Curso" dataKey="classAverage" fill="#8884d8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            <Bar name="Estudiante Destacado" dataKey="studentAverage" fill="#82ca9d" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Citaciones Pendientes</h2>
                    {pendingCitations.length > 0 && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300">
                            {pendingCitations.length}
                        </span>
                    )}
                </div>
                <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                    {pendingCitations.length > 0 ? (
                        pendingCitations.map(citation => (
                            <div key={citation.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-4 border-yellow-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-gray-100">{citation.studentName}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{citation.reason}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{new Date(citation.date + 'T00:00:00').toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{citation.time}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">No hay citaciones pendientes en este momento.</p>
                        </div>
                    )}
                </div>
                <div className="mt-6 text-right">
                    <button
                        onClick={() => onNavigate('Incidents')}
                        className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors text-sm"
                    >
                        Ver todas las citaciones
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;