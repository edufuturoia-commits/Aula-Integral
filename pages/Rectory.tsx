import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Sector } from 'recharts';
import type { Student, Teacher, Incident, Announcement } from '../types';
import { IncidentType } from '../types';
import { getIncidents, addOrUpdateStudents } from '../db';
import DashboardCard from '../components/DashboardCard';
import ImportStudentsModal from '../components/ImportStudentsModal';
import { GRADES, GROUPS } from '../constants';

interface RectoryProps {
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    teachers: Teacher[];
}

type RectoryTab = 'dashboard' | 'communication' | 'lists';

// Mock data for charts
const MOCK_GRADE_PERFORMANCE = [
    { name: '6º', "Rendimiento Promedio": 4.1 },
    { name: '7º', "Rendimiento Promedio": 3.8 },
    { name: '8º', "Rendimiento Promedio": 4.3 },
    { name: '9º', "Rendimiento Promedio": 3.9 },
    { name: '10º', "Rendimiento Promedio": 4.5 },
    { name: '11º', "Rendimiento Promedio": 4.4 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#DA291C', '#8884d8'];

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize={14} fontWeight="bold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`Total ${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`( ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};


const Rectory: React.FC<RectoryProps> = ({ students, setStudents, teachers }) => {
    const [activeTab, setActiveTab] = useState<RectoryTab>('dashboard');
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Communication State
    const [recipientType, setRecipientType] = useState<'all' | 'group' | 'individual'>('all');
    const [commTitle, setCommTitle] = useState('');
    const [commContent, setCommContent] = useState('');
    const [commGrade, setCommGrade] = useState(GRADES[0]);
    const [commGroup, setCommGroup] = useState(GROUPS[0]);
    const [commTarget, setCommTarget] = useState<'student' | 'teacher'>('student');
    const [commSearch, setCommSearch] = useState('');
    const [sentHistory, setSentHistory] = useState<Announcement[]>([]);
    
    // Lists State
    const [listTab, setListTab] = useState<'students' | 'teachers'>('students');
    const [studentSearch, setStudentSearch] = useState('');
    const [teacherSearch, setTeacherSearch] = useState('');
    const [studentGradeFilter, setStudentGradeFilter] = useState('all');
    const [studentGroupFilter, setStudentGroupFilter] = useState('all');
    const [teacherGradeFilter, setTeacherGradeFilter] = useState('all');
    const [teacherGroupFilter, setTeacherGroupFilter] = useState('all');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);


    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const PatchedPie = Pie as any;

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const allIncidents = await getIncidents();
            setIncidents(allIncidents.filter(inc => !inc.archived));
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
    
    const handleSendCommunication = (e: React.FormEvent) => {
        e.preventDefault();
        const newAnnouncement: Announcement = {
            id: `ann_rector_${Date.now()}`,
            title: commTitle,
            content: commContent,
            recipients: 'all', 
            timestamp: new Date().toISOString(),
            sentBy: "Rectoría",
        };
        setSentHistory(prev => [newAnnouncement, ...prev]);
        setCommTitle('');
        setCommContent('');
        alert("Comunicado enviado exitosamente.");
    };

    const filteredStudents = useMemo(() => students.filter(s =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) &&
        (studentGradeFilter === 'all' || s.grade === studentGradeFilter) &&
        (studentGroupFilter === 'all' || s.group === studentGroupFilter)
    ), [students, studentSearch, studentGradeFilter, studentGroupFilter]);

    const filteredTeachers = useMemo(() => teachers.filter(t => {
        const nameMatch = t.name.toLowerCase().includes(teacherSearch.toLowerCase());
        const gradeMatch = teacherGradeFilter === 'all' || (t.isHomeroomTeacher && t.assignedGroup?.grade === teacherGradeFilter);
        const groupMatch = teacherGroupFilter === 'all' || (t.isHomeroomTeacher && t.assignedGroup?.group === teacherGroupFilter);
        return nameMatch && gradeMatch && groupMatch;
    }), [teachers, teacherSearch, teacherGradeFilter, teacherGroupFilter]);
    
    const handleImportStudents = async (studentNames: string[], grade: string, group: string) => {
      const newStudents: Student[] = studentNames.map((name, index) => ({
          id: Date.now() + index,
          name,
          avatarUrl: `https://picsum.photos/seed/${Date.now() + index}/100/100`,
          grade: grade,
          group: group,
      }));
      await addOrUpdateStudents([...students, ...newStudents]);
      setStudents(prev => [...prev, ...newStudents].sort((a, b) => a.name.localeCompare(b.name)));
      setIsImportModalOpen(false);
      // Maybe show a snackbar notification
      setStudentGradeFilter(grade);
      setStudentGroupFilter(group);
  };


    const renderContent = () => {
        if (loading) {
            return <div className="text-center p-8">Cargando datos de la institución...</div>;
        }

        switch (activeTab) {
            case 'dashboard': return (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DashboardCard title="Total Estudiantes" value={students.length.toString()} color="bg-blue-100 text-blue-600" icon={<ClassroomIcon className="h-6 w-6" />} />
                        <DashboardCard title="Total Docentes" value={teachers.length.toString()} color="bg-purple-100 text-purple-600" icon={<ProfileIcon className="h-6 w-6" />} />
                        <DashboardCard title="Incidencias Activas" value={incidents.length.toString()} color="bg-red-100 text-red-600" icon={<IncidentsIcon className="h-6 w-6" />} />
                        <DashboardCard title="Asistencia Hoy" value="94%" color="bg-green-100 text-green-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-lg font-bold mb-4">Incidencias por Tipo</h3>
                            <div style={{ width: '100%', height: 300 }}>
                                {incidentTypeData.length > 0 ? (
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <PatchedPie activeIndex={activeIndex} activeShape={renderActiveShape} data={incidentTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" dataKey="value" onMouseEnter={onPieEnter}>
                                                {incidentTypeData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </PatchedPie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-center text-gray-500 pt-16">No hay datos de incidencias.</p>}
                            </div>
                        </div>
                        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-lg font-bold mb-4">Rendimiento Académico por Grado</h3>
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
            );
            case 'communication': return (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-lg font-bold mb-4">Nuevo Comunicado</h3>
                        <form onSubmit={handleSendCommunication} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Destinatarios</label>
                                <select value={recipientType} onChange={e => setRecipientType(e.target.value as any)} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                                    <option value="all">Toda la comunidad</option>
                                    <option value="group">Grupo Específico</option>
                                    <option value="individual">Individual</option>
                                </select>
                            </div>
                            {recipientType === 'group' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <select value={commGrade} onChange={e => setCommGrade(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                    <select value={commGroup} onChange={e => setCommGroup(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                                        {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            )}
                            {recipientType === 'individual' && (
                                <>
                                    <select value={commTarget} onChange={e => setCommTarget(e.target.value as any)} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                                        <option value="student">Estudiante</option>
                                        <option value="teacher">Docente</option>
                                    </select>
                                    <input type="text" placeholder={`Buscar ${commTarget === 'student' ? 'estudiante' : 'docente'}...`} className="w-full p-2 border border-gray-300 rounded-md bg-white" />
                                </>
                            )}
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input type="text" value={commTitle} onChange={e => setCommTitle(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
                                <textarea rows={5} value={commContent} onChange={e => setCommContent(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white" required></textarea>
                            </div>
                            <button type="submit" className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">Enviar</button>
                        </form>
                    </div>
                    <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-md">
                         <h3 className="text-lg font-bold mb-4">Historial de Enviados</h3>
                         <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {sentHistory.length > 0 ? sentHistory.map(ann => (
                                    <div key={ann.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                         <div className="flex justify-between items-start">
                                             <h4 className="font-semibold text-primary">{ann.title}</h4>
                                             <span className="text-xs text-gray-500">{new Date(ann.timestamp).toLocaleDateString('es-CO')}</span>
                                         </div>
                                         <p className="text-sm text-gray-600 mt-2">{ann.content}</p>
                                    </div>
                                )) : (
                                    <p className="text-center text-gray-500 py-8">No hay comunicados enviados desde Rectoría.</p>
                                )}
                            </div>
                    </div>
                 </div>
            );
            case 'lists': return (
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8">
                                <button onClick={() => setListTab('students')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm ${listTab === 'students' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Estudiantes ({students.length})</button>
                                <button onClick={() => setListTab('teachers')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm ${listTab === 'teachers' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Docentes ({teachers.length})</button>
                            </nav>
                        </div>
                        {listTab === 'students' && (
                            <button onClick={() => setIsImportModalOpen(true)} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors flex items-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                <span>Importar Estudiantes</span>
                            </button>
                        )}
                    </div>
                    {listTab === 'students' ? (
                        <div>
                            <div className="flex flex-col md:flex-row gap-4 mb-4">
                                <input type="text" placeholder="Buscar por nombre..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500" />
                                <select value={studentGradeFilter} onChange={e => setStudentGradeFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                                    <option value="all">Todos los Grados</option>
                                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <select value={studentGroupFilter} onChange={e => setStudentGroupFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                                    <option value="all">Todos los Grupos</option>
                                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredStudents.map(s => (
                                    <div key={s.id} className="p-3 border rounded-lg flex items-center space-x-3 bg-gray-50">
                                        <img src={s.avatarUrl} alt={s.name} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <p className="font-semibold">{s.name}</p>
                                            <p className="text-sm text-gray-500">{s.grade} - Grupo {s.group}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                         <div>
                             <div className="flex flex-col md:flex-row gap-4 mb-4">
                                <input type="text" placeholder="Buscar por nombre..." value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500" />
                                <select value={teacherGradeFilter} onChange={e => setTeacherGradeFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                                    <option value="all">Todos los Grados (Director)</option>
                                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <select value={teacherGroupFilter} onChange={e => setTeacherGroupFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                                    <option value="all">Todos los Grupos (Director)</option>
                                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredTeachers.map(t => (
                                    <div key={t.id} className="p-3 border rounded-lg flex items-center space-x-3 bg-gray-50">
                                        <img src={t.avatarUrl} alt={t.name} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <p className="font-semibold">{t.name}</p>
                                            <p className="text-sm text-gray-500">{t.subject}{t.isHomeroomTeacher ? ` - Dir. ${t.assignedGroup?.grade}-${t.assignedGroup?.group}` : ''}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('dashboard')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Panel de Control</button>
                    <button onClick={() => setActiveTab('communication')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'communication' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Comunicación</button>
                    <button onClick={() => setActiveTab('lists')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'lists' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Listados</button>
                </nav>
            </div>
            {renderContent()}
            {isImportModalOpen && (
                <ImportStudentsModal
                    onClose={() => setIsImportModalOpen(false)}
                    onSave={handleImportStudents}
                />
            )}
        </div>
    );
}

// Icons needed by DashboardCard, but not exported from constants
const ClassroomIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);
const IncidentsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const ProfileIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);

export default Rectory;