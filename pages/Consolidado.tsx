import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Student, SubjectGrades, AcademicPeriod } from '../types';
import { ACADEMIC_PERIODS, GRADES, GRADE_GROUP_MAP } from '../constants';
import { Desempeno } from '../types';

// --- Calculation Helpers ---
const calculateFinalScoreForSubject = (studentId: number, gradebook: SubjectGrades | undefined): { finalScore: number | null } => {
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

const getDesempenoPdfBgColor = (desempeno: Desempeno) => {
    switch (desempeno) {
        case Desempeno.SUPERIOR: return '#DBEAFE'; // blue-100
        case Desempeno.HIGH: return '#D1FAE5'; // green-100
        case Desempeno.BASIC: return '#FEF3C7'; // yellow-100
        case Desempeno.LOW: return '#FEE2E2'; // red-100
        default: return '#F3F4F6'; // gray-100
    }
};


const getDesempenoClass = (desempeno: Desempeno) => {
    switch (desempeno) {
        case Desempeno.SUPERIOR: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
        case Desempeno.HIGH: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
        case Desempeno.BASIC: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
        case Desempeno.LOW: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
        default: return 'bg-gray-100 text-gray-800';
    }
}

const PIE_CHART_COLORS: Record<string, string> = {
    [Desempeno.SUPERIOR]: '#3b82f6',
    [Desempeno.HIGH]: '#22c55e',
    [Desempeno.BASIC]: '#f59e0b',
    [Desempeno.LOW]: '#ef4444',
};

// --- Props ---
interface ConsolidadoProps {
    students: Student[];
    subjectGradesData: SubjectGrades[];
}

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);


const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg">
                <p className="font-bold text-gray-800 dark:text-gray-100">{label}</p>
                <p className="text-sm text-primary dark:text-secondary">{`${payload[0].name}: ${payload[0].value.toFixed(2)}`}</p>
            </div>
        );
    }
    return null;
};

const Consolidado: React.FC<ConsolidadoProps> = ({ students, subjectGradesData }) => {
    // --- State ---
    const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod>(ACADEMIC_PERIODS[0]);
    const [selectedGrade, setSelectedGrade] = useState(GRADES[10]); // Default to 10th
    const [selectedGroup, setSelectedGroup] = useState(GRADE_GROUP_MAP[GRADES[10]] ? GRADE_GROUP_MAP[GRADES[10]][0] : '');
    const [viewMode, setViewMode] = useState<'asignatura' | 'estudiante' | 'desempeno'>('asignatura');

    // --- Memos for data processing ---
    const availableGroups = useMemo(() => {
        return GRADE_GROUP_MAP[selectedGrade] || [];
    }, [selectedGrade]);
    
    useEffect(() => {
        if (!availableGroups.includes(selectedGroup)) {
            setSelectedGroup(availableGroups[0] || '');
        }
    }, [selectedGrade, availableGroups, selectedGroup]);

    const filteredStudents = useMemo(() => {
        return students.filter(s => s.grade === selectedGrade && s.group === selectedGroup);
    }, [students, selectedGrade, selectedGroup]);

    const periodGradebooks = useMemo(() => {
        return subjectGradesData.filter(sg => 
            sg.period === selectedPeriod &&
            sg.grade === selectedGrade &&
            sg.group === selectedGroup
        );
    }, [subjectGradesData, selectedPeriod, selectedGrade, selectedGroup]);

    const promedioPorAsignatura = useMemo(() => {
        if (filteredStudents.length === 0) return [];
        
        return periodGradebooks.map(gradebook => {
            let totalScore = 0;
            let studentCount = 0;
            filteredStudents.forEach(student => {
                const { finalScore } = calculateFinalScoreForSubject(student.id, gradebook);
                if (finalScore !== null) {
                    totalScore += finalScore;
                    studentCount++;
                }
            });
            const promedio = studentCount > 0 ? totalScore / studentCount : 0;
            return { name: gradebook.subject, promedio };
        }).filter(item => item.promedio > 0);

    }, [periodGradebooks, filteredStudents]);

    const promedioPorEstudiante = useMemo(() => {
        if (filteredStudents.length === 0) return [];

        return filteredStudents.map(student => {
            let totalScore = 0;
            let subjectCount = 0;
            periodGradebooks.forEach(gradebook => {
                const { finalScore } = calculateFinalScoreForSubject(student.id, gradebook);
                if(finalScore !== null) {
                    totalScore += finalScore;
                    subjectCount++;
                }
            });
            const promedio = subjectCount > 0 ? totalScore / subjectCount : 0;
            return {
                id: student.id,
                name: student.name,
                promedio: promedio,
                desempeno: getDesempeno(promedio)
            };
        }).sort((a,b) => b.promedio - a.promedio);
    }, [filteredStudents, periodGradebooks]);

    const distribucionDesempeno = useMemo(() => {
        const counts = {
            [Desempeno.SUPERIOR]: 0,
            [Desempeno.HIGH]: 0,
            [Desempeno.BASIC]: 0,
            [Desempeno.LOW]: 0,
        };
        promedioPorEstudiante.forEach(student => {
            counts[student.desempeno]++;
        });

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [promedioPorEstudiante]);
    
    const handleDownloadPdf = () => {
        let htmlContent = '';
        let title = '';

        const headerHtml = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Consolidado Académico</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 10pt; }
                    h1 { color: #005A9C; font-size: 18pt; text-align: center; margin-bottom: 0; }
                    h2 { font-size: 12pt; text-align: center; margin-top: 5px; color: #555; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .desempeno-badge { padding: 3px 8px; border-radius: 12px; font-weight: bold; font-size: 9pt; display: inline-block; color: #333; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="background-color:#fffae6;border:1px solid #ffecb3;padding:15px;border-radius:5px;margin-bottom:20px;">
                    <strong>Instrucción:</strong> Para guardar como PDF, use la función de Imprimir de su navegador (Ctrl+P o Cmd+P) y seleccione "Guardar como PDF" como destino.
                </div>
        `;

        const footerHtml = `
            </body>
            </html>
        `;

        const filterInfoHtml = `<h2>${selectedPeriod} | Grado: ${selectedGrade} - Grupo: ${selectedGroup}</h2>`;

        if (viewMode === 'asignatura') {
            title = '<h1>Consolidado de Promedio por Asignatura</h1>';
            const tableRows = promedioPorAsignatura.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.promedio.toFixed(2)}</td>
                </tr>
            `).join('');
            const tableHtml = `
                <table>
                    <thead>
                        <tr>
                            <th>Asignatura</th>
                            <th>Promedio del Grupo</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            `;
            htmlContent = headerHtml + title + filterInfoHtml + tableHtml + footerHtml;

        } else if (viewMode === 'estudiante') {
            title = '<h1>Consolidado de Promedio por Estudiante</h1>';
            const tableRows = promedioPorEstudiante.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.promedio.toFixed(2)}</td>
                    <td><span class="desempeno-badge" style="background-color: ${getDesempenoPdfBgColor(item.desempeno)};">${item.desempeno}</span></td>
                </tr>
            `).join('');
            const tableHtml = `
                <table>
                    <thead>
                        <tr>
                            <th>Estudiante</th>
                            <th>Promedio General</th>
                            <th>Desempeño</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            `;
            htmlContent = headerHtml + title + filterInfoHtml + tableHtml + footerHtml;

        } else if (viewMode === 'desempeno') {
            title = '<h1>Consolidado de Distribución de Desempeño</h1>';
            const totalStudents = promedioPorEstudiante.length;
            const tableRows = distribucionDesempeno.map(item => {
                const percentage = totalStudents > 0 ? ((item.value / totalStudents) * 100).toFixed(1) : '0.0';
                return `
                    <tr>
                        <td><span class="desempeno-badge" style="background-color: ${getDesempenoPdfBgColor(item.name as Desempeno)};">${item.name}</span></td>
                        <td>${item.value}</td>
                        <td>${percentage}%</td>
                    </tr>
                `;
            }).join('');
             const tableHtml = `
                <table>
                    <thead>
                        <tr>
                            <th>Nivel de Desempeño</th>
                            <th>Número de Estudiantes</th>
                            <th>Porcentaje</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
                 <p style="margin-top: 10px; font-size: 10pt; text-align: right;"><strong>Total de Estudiantes:</strong> ${totalStudents}</p>
            `;
            htmlContent = headerHtml + title + filterInfoHtml + tableHtml + footerHtml;
        }

        if (htmlContent) {
            const pdfWindow = window.open("", "_blank");
            pdfWindow?.document.write(htmlContent);
            pdfWindow?.document.close();
            setTimeout(() => {
                pdfWindow?.print();
            }, 500);
        }
    };
    
    // --- Render Logic ---
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                 <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Consolidados Académicos</h2>
                     <div className="flex flex-wrap items-center gap-2">
                        <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value as AcademicPeriod)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                            {ACADEMIC_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                         <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" disabled={availableGroups.length === 0}>
                           {availableGroups.length > 0 ? availableGroups.map(g => <option key={g} value={g}>{g}</option>) : <option>No hay grupos</option>}
                        </select>
                        <button onClick={handleDownloadPdf} className="p-2 border border-transparent rounded-md bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 font-semibold flex items-center">
                            <DownloadIcon className="h-5 w-5 mr-1" /> Descargar PDF
                        </button>
                    </div>
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        <button onClick={() => setViewMode('asignatura')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${viewMode === 'asignatura' ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Promedio por Asignatura</button>
                        <button onClick={() => setViewMode('estudiante')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${viewMode === 'estudiante' ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Promedio por Estudiante</button>
                        <button onClick={() => setViewMode('desempeno')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${viewMode === 'desempeno' ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Distribución de Desempeño</button>
                    </nav>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                {viewMode === 'asignatura' && (
                    <>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Promedio por Asignatura para {selectedGrade} - {selectedGroup}</h3>
                        {promedioPorAsignatura.length > 0 ? (
                            <div style={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer>
                                    <BarChart data={promedioPorAsignatura} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-25} textAnchor="end" height={60} />
                                        <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(209, 213, 219, 0.3)' }} />
                                        <Bar name="Promedio" dataKey="promedio" fill="#8884d8" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <p className="text-center text-gray-500 dark:text-gray-400 py-10">No hay datos de calificaciones para mostrar en esta selección.</p>}
                    </>
                )}

                {viewMode === 'estudiante' && (
                    <>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Promedio General por Estudiante en {selectedGrade} - {selectedGroup}</h3>
                        {promedioPorEstudiante.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="max-h-96 overflow-y-auto pr-2">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700">
                                            <tr>
                                                <th className="p-2 text-left font-semibold text-gray-600 dark:text-gray-300">Estudiante</th>
                                                <th className="p-2 text-center font-semibold text-gray-600 dark:text-gray-300">Promedio</th>
                                                <th className="p-2 text-center font-semibold text-gray-600 dark:text-gray-300">Desempeño</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {promedioPorEstudiante.map(student => (
                                                <tr key={student.id}>
                                                    <td className="p-2 font-medium text-gray-800 dark:text-gray-100">{student.name}</td>
                                                    <td className="p-2 text-center font-bold text-gray-800 dark:text-gray-100">{student.promedio.toFixed(2)}</td>
                                                    <td className="p-2 text-center"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDesempenoClass(student.desempeno)}`}>{student.desempeno}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ width: '100%', height: 400 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={promedioPorEstudiante.slice().reverse()} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                            <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12 }} />
                                            <YAxis type="category" dataKey="name" hide={true} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(209, 213, 219, 0.3)' }} />
                                            <Bar name="Promedio" dataKey="promedio" fill="#82ca9d" radius={[0, 4, 4, 0]} maxBarSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : <p className="text-center text-gray-500 dark:text-gray-400 py-10">No hay estudiantes en este grupo para mostrar.</p>}
                    </>
                )}
                 
                 {viewMode === 'desempeno' && (
                    <>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Distribución de Desempeño General en {selectedGrade} - {selectedGroup}</h3>
                        {promedioPorEstudiante.length > 0 ? (
                            <div style={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={distribucionDesempeno} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} fill="#8884d8" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {distribucionDesempeno.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[entry.name]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <p className="text-center text-gray-500 dark:text-gray-400 py-10">No hay datos para generar la distribución.</p>}
                    </>
                 )}
            </div>
        </div>
    );
};

export default Consolidado;