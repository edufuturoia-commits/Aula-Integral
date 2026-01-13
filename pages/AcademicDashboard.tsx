import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Student, SubjectGrades, AcademicPeriod, SubjectArea } from '../types';
import { Desempeno } from '../types';
import DashboardCard from '../components/DashboardCard';
import AcademicDataUploader from '../components/AcademicDataUploader';
import { ACADEMIC_PERIODS, GRADES, GRADE_GROUP_MAP, JORNADAS } from '../constants';

// --- Helper Functions ---
// FIX: Changed studentId to accept string | number.
const calculateFinalScoreForSubject = (studentId: string | number, gradebook: SubjectGrades | undefined): { finalScore: number | null } => {
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
}

const PIE_CHART_COLORS: Record<Desempeno, string> = {
    [Desempeno.SUPERIOR]: '#3b82f6',
    [Desempeno.HIGH]: '#22c55e',
    [Desempeno.BASIC]: '#f59e0b',
    [Desempeno.LOW]: '#ef4444',
};

// --- Props ---
interface AcademicDashboardProps {
    students: Student[];
    subjectGradesData: SubjectGrades[];
    setStudents: (updater: React.SetStateAction<Student[]>) => Promise<void>;
    setSubjectGradesData: (updater: React.SetStateAction<SubjectGrades[]>) => Promise<void>;
    onShowSystemMessage: (message: string, type?: 'success' | 'error') => void;
}

const AcademicDashboard: React.FC<AcademicDashboardProps> = ({ students, subjectGradesData, setStudents, setSubjectGradesData, onShowSystemMessage }) => {
    const [isUploaderOpen, setIsUploaderOpen] = useState(false);
    
    // Filters State
    const [periodFilter, setPeriodFilter] = useState(ACADEMIC_PERIODS[0]);
    const [jornadaFilter, setJornadaFilter] = useState('all');
    const [gradeFilter, setGradeFilter] = useState('all');
    const [groupFilter, setGroupFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');


    const availableGroups = useMemo(() => {
        if (gradeFilter === 'all' || !GRADE_GROUP_MAP[gradeFilter]) {
            const allGroups = new Set<string>();
            Object.values(GRADE_GROUP_MAP).forEach(groups => groups.forEach(g => allGroups.add(g)));
            return ['all', ...Array.from(allGroups).sort()];
        }
        return ['all', ...GRADE_GROUP_MAP[gradeFilter]];
    }, [gradeFilter]);

    useEffect(() => {
        if (!availableGroups.includes(groupFilter)) {
            setGroupFilter('all');
        }
    }, [gradeFilter, availableGroups, groupFilter]);

    const filteredStudents = useMemo(() => {
        return students.filter(s =>
            (gradeFilter === 'all' || s.grade === gradeFilter) &&
            (groupFilter === 'all' || s.group === groupFilter) &&
            (jornadaFilter === 'all' || s.jornada === jornadaFilter)
        );
    }, [students, gradeFilter, groupFilter, jornadaFilter]);

    const studentAverages = useMemo(() => {
        return filteredStudents.map(student => {
            let totalScore = 0;
            let subjectCount = 0;
            const studentGradebooks = subjectGradesData.filter(sg =>
                sg.grade === student.grade &&
                sg.group === student.group &&
                sg.period === periodFilter
            );
            
            studentGradebooks.forEach(gradebook => {
                const { finalScore } = calculateFinalScoreForSubject(student.id, gradebook);
                if (finalScore !== null) {
                    totalScore += finalScore;
                    subjectCount++;
                }
            });

            const average = subjectCount > 0 ? totalScore / subjectCount : 0;
            return {
                studentId: student.id,
                name: student.name,
                avatarUrl: student.avatarUrl,
                grade: student.grade,
                average,
                desempeno: getDesempeno(average)
            };
        });
    }, [filteredStudents, subjectGradesData, periodFilter]);
    
    const searchedStudentAverages = useMemo(() => {
        if (!searchTerm) return studentAverages;
        return studentAverages.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [studentAverages, searchTerm]);


    const dashboardStats = useMemo(() => {
        const totalStudents = filteredStudents.length;
        if (totalStudents === 0) return { overallAverage: 0, excellentCount: 0, atRiskCount: 0, approvalRate: 0 };
        
        let totalAverageSum = 0;
        let studentsWithGrades = 0;
        let excellentCount = 0;
        let atRiskCount = 0;
        let approvedCount = 0;

        studentAverages.forEach(s => {
            if (s.average > 0) {
                totalAverageSum += s.average;
                studentsWithGrades++;
            }
            if (s.average >= 4.5) excellentCount++;
            if (s.average < 3.0 && s.average > 0) atRiskCount++;
            if (s.average >= 3.0) approvedCount++;
        });

        return {
            overallAverage: studentsWithGrades > 0 ? totalAverageSum / studentsWithGrades : 0,
            excellentCount,
            atRiskCount,
            approvalRate: totalStudents > 0 ? (approvedCount / totalStudents) * 100 : 0
        };
    }, [filteredStudents.length, studentAverages]);

    const desempenoDistribution = useMemo(() => {
        const counts = { [Desempeno.SUPERIOR]: 0, [Desempeno.HIGH]: 0, [Desempeno.BASIC]: 0, [Desempeno.LOW]: 0 };
        studentAverages.forEach(s => {
            if (s.average > 0) counts[s.desempeno]++;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [studentAverages]);

    const topStudents = useMemo(() => {
        return [...searchedStudentAverages].sort((a, b) => b.average - a.average).slice(0, 10);
    }, [searchedStudentAverages]);

    const riskStudents = useMemo(() => {
        return searchedStudentAverages.filter(s => s.average > 0 && s.average < 3.0).sort((a, b) => a.average - b.average);
    }, [searchedStudentAverages]);
    
    const subjectPerformance = useMemo(() => {
        if (filteredStudents.length === 0) return [];

        const periodGradebooks = subjectGradesData.filter(sg => sg.period === periodFilter && filteredStudents.some(s => s.grade === sg.grade && s.group === sg.group));
        const uniqueSubjects = [...new Set(periodGradebooks.map(gb => gb.subject))];

        return uniqueSubjects.map(subject => {
            let totalScore = 0;
            let studentCountWithScore = 0;
            let failingCount = 0;
            
            filteredStudents.forEach(student => {
                const relevantGradebook = periodGradebooks.find(gb => gb.subject === subject && gb.grade === student.grade && gb.group === student.group);
                if (relevantGradebook) {
                    const { finalScore } = calculateFinalScoreForSubject(student.id, relevantGradebook);
                    if (finalScore !== null) {
                        totalScore += finalScore;
                        studentCountWithScore++;
                        if (finalScore < 3.0) failingCount++;
                    }
                }
            });
            
            if (studentCountWithScore === 0) return null;

            return {
                subject,
                average: totalScore / studentCountWithScore,
                failingRate: (failingCount / studentCountWithScore) * 100,
            };
        }).filter((s): s is { subject: SubjectArea; average: number; failingRate: number; } => s !== null);
    }, [filteredStudents, subjectGradesData, periodFilter]);

    const topSubjects = useMemo(() => [...subjectPerformance].sort((a,b) => b.average - a.average).slice(0, 5), [subjectPerformance]);
    const difficultSubjects = useMemo(() => [...subjectPerformance].sort((a,b) => b.failingRate - a.failingRate).slice(0, 5), [subjectPerformance]);

    const gradeComparison = useMemo(() => {
        if (gradeFilter !== 'all') {
            const groupsInGrade = [...new Set(filteredStudents.filter(s => s.grade === gradeFilter).map(s => s.group))].sort();
            return groupsInGrade.map(group => {
                const studentsInGroup = studentAverages.filter(s => {
                    const student = students.find(st => st.id === s.studentId);
                    return student && student.grade === gradeFilter && student.group === group && s.average > 0;
                });
                const total = studentsInGroup.reduce((sum, s) => sum + s.average, 0);
                return { name: `Grupo ${group}`, promedio: studentsInGroup.length > 0 ? total / studentsInGroup.length : 0 };
            });
        } else {
            const grades = [...new Set(students.map(s => s.grade))].sort();
            return grades.map(grade => {
                const studentsInGrade = studentAverages.filter(s => s.grade === grade && s.average > 0);
                const total = studentsInGrade.reduce((sum, s) => sum + s.average, 0);
                return { name: grade, promedio: studentsInGrade.length > 0 ? total / studentsInGrade.length : 0 };
            });
        }
    }, [students, studentAverages, gradeFilter, filteredStudents]);
    

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard Académico</h1>
                <button
                    onClick={() => setIsUploaderOpen(true)}
                    className="bg-accent text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    <span>Cargar Datos con IA</span>
                </button>
            </div>
            
            {/* Filter Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-wrap items-center gap-4">
                <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value as AcademicPeriod)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                    {ACADEMIC_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={jornadaFilter} onChange={e => setJornadaFilter(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                    <option value="all">Todas las Jornadas</option>
                    {JORNADAS.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
                <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                    <option value="all">Todos los Grados</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                    {availableGroups.map(g => <option key={g} value={g}>{g === 'all' ? 'Todos los Grupos' : `Grupo ${g}`}</option>)}
                </select>
                <div className="relative flex-grow min-w-[250px]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar estudiante por nombre..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 w-full"
                    />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <DashboardCard title="Estudiantes Filtrados" value={filteredStudents.length.toString()} color="bg-blue-100 text-blue-600" icon={<div className="h-6 w-6" />} />
                <DashboardCard title="Promedio General" value={dashboardStats.overallAverage.toFixed(2)} color="bg-indigo-100 text-indigo-600" icon={<div className="h-6 w-6" />} />
                <DashboardCard title="Estudiantes Excelentes" value={dashboardStats.excellentCount.toString()} color="bg-green-100 text-green-600" icon={<div className="h-6 w-6" />} />
                <DashboardCard title="Estudiantes en Riesgo" value={dashboardStats.atRiskCount.toString()} color="bg-red-100 text-red-600" icon={<div className="h-6 w-6" />} />
                <DashboardCard title="Tasa de Aprobación" value={`${dashboardStats.approvalRate.toFixed(1)}%`} color="bg-yellow-100 text-yellow-600" icon={<div className="h-6 w-6" />} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Distribución de Rendimiento</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={desempenoDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, value }) => value > 0 ? `${name}: ${value}`: ''} >
                                    {desempenoDistribution.map((entry) => <Cell key={`cell-${entry.name}`} fill={PIE_CHART_COLORS[entry.name as Desempeno]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                     <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                        {gradeFilter === 'all' ? 'Comparación entre Grados' : `Comparación entre Grupos de ${gradeFilter}`}
                     </h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={gradeComparison}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 5]} />
                                <Tooltip />
                                <Bar dataKey="promedio" fill="#8884d8" name="Promedio" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Subject Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Asignaturas con Mejor Desempeño</h3>
                    <ul className="space-y-3">
                        {topSubjects.map(s => (
                            <li key={s.subject} className="flex items-center justify-between">
                                <span className="font-semibold">{s.subject}</span>
                                <span className="font-bold text-green-600 dark:text-green-400">{s.average.toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Asignaturas con Mayor Dificultad</h3>
                    <ul className="space-y-3">
                        {difficultSubjects.map(s => (
                            <li key={s.subject} className="flex items-center justify-between">
                                <span className="font-semibold">{s.subject}</span>
                                <span className="font-bold text-red-600 dark:text-red-400">{s.failingRate.toFixed(1)}% de reprobación</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Student Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                     <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{searchTerm ? 'Resultados en Mejores Estudiantes' : 'Top 10 Estudiantes'}</h3>
                     <ul className="space-y-3 max-h-80 overflow-y-auto">
                        {topStudents.length > 0 ? topStudents.map((s, i) => (
                            <li key={s.studentId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-lg text-gray-400 w-6">{i + 1}</span>
                                    <img src={s.avatarUrl} alt={s.name} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{s.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{s.grade}</p>
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-green-600 dark:text-green-400">{s.average.toFixed(2)}</div>
                            </li>
                        )) : (
                             <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                                {searchTerm ? 'No se encontraron estudiantes con ese nombre.' : 'No hay datos de estudiantes para mostrar.'}
                            </p>
                        )}
                     </ul>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                     <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{searchTerm ? 'Resultados en Estudiantes en Riesgo' : 'Estudiantes en Riesgo Académico'}</h3>
                      <ul className="space-y-3 max-h-80 overflow-y-auto">
                        {riskStudents.length > 0 ? riskStudents.map((s) => (
                            <li key={s.studentId} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/30 rounded-md">
                                <div className="flex items-center gap-3">
                                    <img src={s.avatarUrl} alt={s.name} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{s.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{s.grade}</p>
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-red-600 dark:text-red-400">{s.average.toFixed(2)}</div>
                            </li>
                        )) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                                {searchTerm ? 'No se encontraron estudiantes en riesgo con ese nombre.' : '¡Felicidades! No hay estudiantes en riesgo.'}
                            </p>
                        )}
                     </ul>
                </div>
            </div>

            {isUploaderOpen && (
                <AcademicDataUploader
                    onClose={() => setIsUploaderOpen(false)}
                    onSaveData={(newStudents, newGrades) => {
                        setStudents(prev => [...prev, ...newStudents]);
                        setSubjectGradesData(prev => {
                            const gradeMap = new Map(prev.map(g => [g.id, g]));
                            newGrades.forEach(g => gradeMap.set(g.id, g));
                            return Array.from(gradeMap.values());
                        });
                    }}
                    allStudents={students}
                    allGrades={subjectGradesData}
                    onShowSystemMessage={onShowSystemMessage}
                />
            )}
        </div>
    );
};

export default AcademicDashboard;