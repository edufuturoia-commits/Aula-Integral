import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { Student, Teacher, Incident, Announcement, SubjectGrades } from '../types';
import { IncidentType, Role, DocumentType, IncidentStatus } from '../types';
import { getIncidents, addOrUpdateStudents, addOrUpdateTeachers } from '../db';
import DashboardCard from '../components/DashboardCard';
import ImportStudentsModal from '../components/ImportStudentsModal';
import StudentList from '../components/StudentList';
import { GRADES, GROUPS, ClassroomIcon, IncidentsIcon, ProfileIcon, GRADE_GROUP_MAP } from '../constants';
import Calificaciones from './Calificaciones';

interface RectoryProps {
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    teachers: Teacher[];
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    subjectGradesData: SubjectGrades[];
    setSubjectGradesData: (updater: React.SetStateAction<SubjectGrades[]>) => Promise<void>;
    currentUser: Teacher;
    announcements: Announcement[];
    onUpdateAnnouncements: (announcement: Announcement) => Promise<void>;
    onShowSystemMessage: (message: string, type?: 'success' | 'error') => void;
}

type RectoryTab = 'dashboard' | 'communication' | 'lists' | 'calificaciones';

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


const Rectory: React.FC<RectoryProps> = ({ students, setStudents, teachers, setTeachers, subjectGradesData, setSubjectGradesData, currentUser, announcements, onUpdateAnnouncements, onShowSystemMessage }) => {
    const [activeTab, setActiveTab] = useState<RectoryTab>('dashboard');
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Communication State
    const [recipientType, setRecipientType] = useState<'all' | 'group' | 'individual'>('all');
    const [commTitle, setCommTitle] = useState('');
    const [commContent, setCommContent] = useState('');
    const [commGrade, setCommGrade] = useState(GRADES[0]);
    const [commGroup, setCommGroup] = useState(GRADE_GROUP_MAP[GRADES[0]][0]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    
    // Lists State
    const [listTab, setListTab] = useState<'students' | 'teachers'>('students');
    const [teacherSearch, setTeacherSearch] = useState('');
    
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    // Student Management State (from Incidents)
    const [studentGradeFilter, setStudentGradeFilter] = useState<string>('all');
    const [studentGroupFilter, setStudentGroupFilter] = useState<string>('all');
    
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
        
        let recipients: Announcement['recipients'] = 'all';
        let alertMessage = "Comunicado enviado a toda la comunidad.";

        if (recipientType === 'group') {
            recipients = { grade: commGrade, group: commGroup };
            alertMessage = `Comunicado enviado a ${commGrade} - Grupo ${commGroup}.`;
        } else if (recipientType === 'individual') {
            if (!selectedTeacherId) {
                onShowSystemMessage("Por favor, selecciona un docente.", 'error');
                return;
            }
            const teacher = teachers.find(t => t.id === selectedTeacherId);
            alertMessage = `Comunicado enviado a ${teacher?.name}.`;
            recipients = { teacherId: selectedTeacherId }; 
        }
    
        const newAnnouncement: Announcement = {
            id: `ann_rector_${Date.now()}`,
            title: commTitle,
            content: commContent,
            recipients,
            timestamp: new Date().toISOString(),
            sentBy: "Rectoría",
        };
        
        await onUpdateAnnouncements(newAnnouncement);
        
        setCommTitle('');
        setCommContent('');
        setRecipientType('all');
        setSelectedTeacherId('');
        
        onShowSystemMessage(alertMessage);
    };

    const handleStudentGradeChange = (grade: string) => {
        setStudentGradeFilter(grade);
        setStudentGroupFilter('all');
    };

    const availableGroupsForStudents = useMemo(() => {
        if (studentGradeFilter === 'all' || !GRADE_GROUP_MAP[studentGradeFilter]) {
            return ['all', ...GROUPS];
        }
        return ['all', ...GRADE_GROUP_MAP[studentGradeFilter]];
    }, [studentGradeFilter]);

    const filteredStudentsForList = useMemo(() => {
      return students.filter(student => {
          const matchesGrade = studentGradeFilter === 'all' || student.grade === studentGradeFilter;
          const matchesGroup = studentGroupFilter === 'all' || student.group === studentGroupFilter;
          return matchesGrade && matchesGroup;
      });
    }, [students, studentGradeFilter, studentGroupFilter]);

    const filteredTeachers = useMemo(() => teachers.filter(t => 
        t.name.toLowerCase().includes(teacherSearch.toLowerCase())
    ), [teachers, teacherSearch]);
    
    const handleImportStudents = async (
        newStudentsFromModal: { name: string; id: string }[],
        grade: string,
        group: string,
        homeroomTeacherId?: string
    ) => {
        const existingStudentIds = new Set(students.map(s => s.documentNumber));
        const newStudents: Student[] = [];
        let skippedCount = 0;
        let teacherName = '';

        newStudentsFromModal.forEach((s, index) => {
            if (s.id && existingStudentIds.has(s.id)) {
                skippedCount++;
                return; // Skip duplicate
            }
    
            const studentId = s.id ? parseInt(s.id.replace(/\D/g, ''), 10) : Date.now() + index;
            if (isNaN(studentId)) {
                skippedCount++;
                return;
            }
    
            newStudents.push({
                id: studentId,
                name: s.name,
                avatarUrl: `https://picsum.photos/seed/${studentId}/100/100`,
                grade,
                group,
                role: Role.STUDENT,
                documentNumber: s.id || undefined,
                // FIX: Use correct enum member `IDENTITY_CARD` instead of `TARJETA_IDENTIDAD`.
                documentType: s.id ? DocumentType.IDENTITY_CARD : undefined,
            });
        });
    
        const messages: string[] = [];

        if (newStudents.length > 0) {
            const updatedStudentList = [...students, ...newStudents];
            await addOrUpdateStudents(updatedStudentList);
            setStudents(updatedStudentList.sort((a, b) => a.name.localeCompare(b.name)));
            messages.push(`${newStudents.length} estudiantes importados a ${grade}-${group}.`);
        }
    
        if (homeroomTeacherId) {
            const updatedTeachers = teachers.map(t => {
                if (t.assignedGroup?.grade === grade && t.assignedGroup?.group === group && t.id !== homeroomTeacherId) {
                     return { ...t, isHomeroomTeacher: false, assignedGroup: undefined };
                }
                if (t.id === homeroomTeacherId) {
                    teacherName = t.name;
                    return { ...t, isHomeroomTeacher: true, assignedGroup: { grade, group } };
                }
                return t;
            });
            await addOrUpdateTeachers(updatedTeachers);
            setTeachers(updatedTeachers);
            if (teacherName) {
                messages.push(`${teacherName} ha sido asignado como director de grupo.`);
            }
        }
        
        if (messages.length > 0) {
             onShowSystemMessage(messages.join(' ') + ' Todos los módulos han sido actualizados.');
        }

        if (skippedCount > 0) {
            onShowSystemMessage(`${skippedCount} estudiante(s) omitido(s) por tener un documento ya existente o inválido.`, 'error');
        }
    
        setIsImportModalOpen(false);
        setStudentGradeFilter(grade);
        setStudentGroupFilter(group);
    };

    if (loading) {
        return <div className="text-center p-8">Cargando datos de la institución...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    <button onClick={() => setActiveTab('dashboard')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Panel de Control</button>
                    <button onClick={() => setActiveTab('communication')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'communication' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Comunicación</button>
                    <button onClick={() => setActiveTab('lists')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'lists' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Listados</button>
                    <button onClick={() => setActiveTab('calificaciones')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'calificaciones' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Calificaciones</button>
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
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-lg font-bold mb-4">Incidencias por Tipo</h3>
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
            </div>

            <div className={activeTab === 'communication' ? '' : 'hidden'}>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-lg font-bold mb-4">Nuevo Comunicado</h3>
                        <form onSubmit={handleSendCommunication} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Destinatarios</label>
                                <select value={recipientType} onChange={e => setRecipientType(e.target.value as any)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                                    <option value="all">Toda la comunidad</option>
                                    <option value="group">Grupo Específico</option>
                                    <option value="individual">Docente Individual</option>
                                </select>
                            </div>
                            {recipientType === 'group' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <select value={commGrade} onChange={e => setCommGrade(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                    <select value={commGroup} onChange={e => setCommGroup(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                                        {(GRADE_GROUP_MAP[commGrade] || []).map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            )}
                            {recipientType === 'individual' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Docente</label>
                                    <select 
                                        value={selectedTeacherId} 
                                        onChange={e => setSelectedTeacherId(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                                        required={recipientType === 'individual'}
                                    >
                                        <option value="" disabled>-- Elige un docente --</option>
                                        {teachers.map(teacher => (
                                            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input type="text" value={commTitle} onChange={e => setCommTitle(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
                                <textarea rows={5} value={commContent} onChange={e => setCommContent(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900" required></textarea>
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
            </div>

            <div className={activeTab === 'lists' ? '' : 'hidden'}>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8">
                                <button onClick={() => setListTab('students')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm ${listTab === 'students' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Gestión de Estudiantes</button>
                                <button onClick={() => setListTab('teachers')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm ${listTab === 'teachers' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Gestión de Docentes</button>
                            </nav>
                        </div>
                    </div>
                    {listTab === 'students' ? (
                        <StudentList 
                            students={filteredStudentsForList}
                            onImportClick={() => setIsImportModalOpen(true)}
                            grades={['all', ...GRADES]}
                            selectedGrade={studentGradeFilter}
                            onGradeChange={handleStudentGradeChange}
                            groups={availableGroupsForStudents}
                            selectedGroup={studentGroupFilter}
                            onGroupChange={setStudentGroupFilter}
                        />
                    ) : (
                         <div>
                             <div className="flex flex-col md:flex-row gap-4 mb-4">
                                <input type="text" placeholder="Buscar docente por nombre..." value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 placeholder-gray-500" />
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
            </div>

            <div className={activeTab === 'calificaciones' ? '' : 'hidden'}>
                 <Calificaciones 
                    students={students}
                    teachers={teachers}
                    subjectGradesData={subjectGradesData}
                    setSubjectGradesData={setSubjectGradesData}
                    currentUser={currentUser}
                    onShowSystemMessage={onShowSystemMessage}
                />
            </div>
            
            {isImportModalOpen && (
                <ImportStudentsModal 
                    teachers={teachers}
                    onClose={() => setIsImportModalOpen(false)} 
                    onSave={handleImportStudents} 
                />
            )}
        </div>
    );
};

export default Rectory;