
import React, { useState } from 'react';
import { Assessment, Question } from '../types';
import AssessmentCreator from '../components/AssessmentCreator';
import { MOCK_ASSESSMENT_DATA } from '../constants';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';

const AssessmentCard: React.FC<{ assessment: Assessment, onViewResults: () => void }> = ({ assessment, onViewResults }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
            <h3 className="font-bold text-primary">{assessment.title}</h3>
            <p className="text-sm text-gray-500">{assessment.questions.length} Preguntas</p>
            <p className="text-xs text-gray-400">Creada: {new Date(assessment.createdAt).toLocaleDateString()}</p>
        </div>
        <button onClick={onViewResults} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors text-sm">
            Ver Resultados
        </button>
    </div>
);


const Assessments: React.FC = () => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

    const handleSaveAssessment = (assessment: Assessment) => {
        setAssessments(prev => [...prev, assessment]);
        setView('list');
    };
    
    const handleViewResults = (assessment: Assessment) => {
        setSelectedAssessment(assessment);
    };

    const handleCloseResults = () => {
        setSelectedAssessment(null);
    };

    if (view === 'create') {
        return <AssessmentCreator onSave={handleSaveAssessment} onCancel={() => setView('list')} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Mis Evaluaciones</h1>
                <button
                    onClick={() => setView('create')}
                    className="bg-accent text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span>Crear Nueva Evaluación</span>
                </button>
            </div>

            {assessments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assessments.map(asm => (
                        <AssessmentCard key={asm.id} assessment={asm} onViewResults={() => handleViewResults(asm)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-8 bg-white rounded-lg shadow-sm border border-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h2 className="mt-2 text-xl font-semibold text-gray-700">No hay evaluaciones creadas</h2>
                    <p className="mt-1 text-gray-500">¡Comienza creando tu primera evaluación para verla aquí!</p>
                </div>
            )}
            
            {selectedAssessment && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseResults}>
                    <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-3xl mx-4" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">Análisis de Desempeño: {selectedAssessment.title}</h2>
                         <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer>
                                <BarChart data={MOCK_ASSESSMENT_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 70 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="competency" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }}/>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '40px' }}/>
                                    <Bar name="Promedio del Curso" dataKey="classAverage" fill="#8884d8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar name="Estudiante Destacado" dataKey="studentAverage" fill="#82ca9d" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-right mt-4">
                            <button onClick={handleCloseResults} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assessments;
