
import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import DashboardCard from '../components/DashboardCard';
import { MOCK_ASSESSMENT_DATA } from '../constants';
import type { AssessmentData, Student, Teacher } from '../types';

interface DashboardProps {
    students: Student[];
    teachers: Teacher[];
}

const Dashboard: React.FC<DashboardProps> = ({ students, teachers }) => {
    return (
        <div className="space-y-8">
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

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-4">Análisis de Desempeño por Competencia</h2>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart data={MOCK_ASSESSMENT_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 70 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="competency" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '40px' }} />
                            <Bar name="Promedio del Curso" dataKey="classAverage" fill="#8884d8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            <Bar name="Estudiante Destacado" dataKey="studentAverage" fill="#82ca9d" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
