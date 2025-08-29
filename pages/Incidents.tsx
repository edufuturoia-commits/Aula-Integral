import React, { useState, useEffect, useMemo } from 'react';
import { getIncidents, updateIncident, getAllAttendanceRecords, getAnnouncements, addAnnouncement, addOrUpdateTeachers, addOrUpdateStudents, addIncident } from '../db';
import type { Incident, Student, AttendanceRecord, Citation, Announcement, Teacher } from '../types';
import { IncidentType, AttendanceStatus, CitationStatus } from '../types';
import { GRADES, GROUPS, MOCK_CITATIONS, COORDINATOR_PROFILE } from '../constants';
import CitationModal from '../components/CitationModal';
import CancelCitationModal from '../components/CancelCitationModal';
import ImportTeachersModal from '../components/ImportTeachersModal';
import EditTeacherModal from '../components/EditTeacherModal';
import StudentList from '../components/StudentList';
import ImportStudentsModal from '../components/ImportStudentsModal';
import IncidentModal from '../components/IncidentModal';


type EnrichedAttendanceRecord = AttendanceRecord & { student: Student };

// --- Helper Functions for Downloading ---

const generateIncidentsCSV = (incidentsToExport: Incident[]): string => {
    const headers = ['ID', 'Estudiante', 'Docente que Reporta', 'Lugar', 'Tipo', 'Descripción', 'Fecha', 'Estado Sincronización'];
    const rows = incidentsToExport.map(inc => [
        inc.id,
        `"${inc.studentName.replace(/"/g, '""')}"`,
        `"${inc.teacherName.replace(/"/g, '""')}"`,
        `"${inc.location.replace(/"/g, '""')}"`,
        `"${inc.type}"`,
        `"${inc.notes.replace(/"/g, '""')}"`,
        `"${new Date(inc.timestamp).toLocaleString()}"`,
        inc.synced ? 'Sincronizado' : 'Pendiente'
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
};

const generateIncidentsPDFHTML = (title: string, incidentsToExport: Incident[]): string => {
    const rows = incidentsToExport.map(inc => `
        <tr>
            <td>${inc.studentName}</td>
            <td>${inc.teacherName}</td>
            <td>${inc.location}</td>
            <td>${inc.type}</td>
            <td>${new Date(inc.timestamp).toLocaleString('es-CO')}</td>
            <td class="notes">${inc.notes}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#333;margin:20px}h1{color:#005A9C;border-bottom:2px solid #005A9C;padding-bottom:10px;font-size:24px}p{font-size:12px;color:#555}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#f2f2f2;color:#333;font-weight:bold}tr:nth-child(even){background-color:#f9f9f9}.notes{white-space:pre-wrap;word-break:break-word}@media print{.no-print{display:none}}</style></head><body><p class="no-print" style="background-color:#fffae6;border:1px solid #ffecb3;padding:15px;border-radius:5px;"><strong>Instrucción:</strong> Para guardar como PDF, use la función de Imprimir de su navegador (Ctrl+P o Cmd+P) y seleccione "Guardar como PDF" como destino.</p><h1>${title}</h1><p>Generado el: ${new Date().toLocaleString('es-CO')}</p><table><thead><tr><th>Estudiante</th><th>Reportado por</th><th>Lugar</th><th>Tipo</th><th>Fecha</th><th style="width:40%">Descripción</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
};


const generateAttendanceCSV = (records: EnrichedAttendanceRecord[]): string => {
    const headers = ['Fecha', 'Estudiante', 'Grado', 'Grupo', 'Estado'];
    const rows = records.map(rec => [
        `"${rec.date}"`,
        `"${rec.student.name.replace(/"/g, '""')}"`,
        `"${rec.student.grade}"`,
        `"${rec.student.group}"`,
        `"${rec.status}"`,
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
};

const generateAttendancePDFHTML = (title: string, records: EnrichedAttendanceRecord[]): string => {
    const rows = records.map(rec => `
        <tr>
            <td>${rec.date}</td>
            <td>${rec.student.name}</td>
            <td>${rec.student.grade}</td>
            <td>${rec.student.group}</td>
             <td><span class="${
                rec.status === AttendanceStatus.ABSENT ? 'status-absent' :
                rec.status === AttendanceStatus.TARDY ? 'status-tardy' :
                rec.status === AttendanceStatus.EXCUSED ? 'status-excused' :
                rec.status === AttendanceStatus.SPECIAL_PERMIT ? 'status-permit' : ''
            }">${rec.status}</span></td>
        </tr>
    `).join('');
    return `
        <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#333;margin:20px}h1{color:#005A9C;border-bottom:2px solid #005A9C;padding-bottom:10px;font-size:24px}p{font-size:12px;color:#555}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#f2f2f2;color:#333;font-weight:bold}tr:nth-child(even){background-color:#f9f9f9}.status-absent{color:#DA291C;font-weight:bold;}.status-tardy{color:#ff9900;font-weight:bold;}.status-excused{color:#2094f3;font-weight:bold;}.status-permit{color:#673AB7;font-weight:bold;}@media print{.no-print{display:none}}</style></head><body><p class="no-print" style="background-color:#fffae6;border:1px solid #ffecb3;padding:15px;border-radius:5px;"><strong>Instrucción:</strong> Para guardar como PDF, use la función de Imprimir de su navegador (Ctrl+P o Cmd+P) y seleccione "Guardar como PDF" como destino.</p><h1>${title}</h1><p>Generado el: ${new Date().toLocaleString('es-CO')}</p><table><thead><tr><th>Fecha</th><th>Estudiante</th><th>Grado</th><th>Grupo</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
};


const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};


// --- Component ---
type CoordinationTab = 'incidents' | 'attendance' | 'citations' | 'comunicados' | 'teacher_management' | 'student_management';

const TABS: { id: CoordinationTab; label: string }[] = [
    { id: 'incidents', label: 'Historial de Incidencias' },
    { id: 'attendance', label: 'Reportes de Asistencia' },
    { id: 'citations', label: 'Gestión de Citaciones' },
    { id: 'comunicados', label: 'Comunicados' },
    { id: 'teacher_management', label: 'Gestión de Docentes' },
    { id: 'student_management', label: 'Gestión de Estudiantes' },
];

interface IncidentsProps {
    isOnline: boolean;
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    teachers: Teacher[];
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
}


const Incidents: React.FC<IncidentsProps> = ({ isOnline, students, setStudents, teachers, setTeachers }) => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [allCitations, setAllCitations] = useState<Citation[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<CoordinationTab>('incidents');
    
    // Incident state
    const [incidentSearch, setIncidentSearch] = useState('');
    const [incidentTypeFilter, setIncidentTypeFilter] = useState<string>('all');
    const [incidentView, setIncidentView] = useState<'active' | 'archived'>('active');

    // Attendance state
    const [attendanceSearch, setAttendanceSearch] = useState('');
    const [dateFilter, setDateFilter] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [gradeFilter, setGradeFilter] = useState<string>('all');
    const [groupFilter, setGroupFilter] = useState<string>('all');

    // Citation state
    const [citationSearch, setCitationSearch] = useState('');
    const [citationStatusFilter, setCitationStatusFilter] = useState<string>('all');
    const [citationGradeFilter, setCitationGradeFilter] = useState<string>('all');
    const [citationGroupFilter, setCitationGroupFilter] = useState<string>('all');
    const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [citationToCancel, setCitationToCancel] = useState<Citation | null>(null);

    // Announcement state
    const [newAnnouncement, setNewAnnouncement] = useState({
        recipientType: 'all',
        grade: GRADES[0],
        group: GROUPS[0],
        title: '',
        content: ''
    });
    
    // Teacher state
    const [isImportTeachersModalOpen, setIsImportTeachersModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    
    // Student Management State
    const [studentGradeFilter, setStudentGradeFilter] = useState<string>('all');
    const [studentGroupFilter, setStudentGroupFilter] = useState<string>('all');
    const [isImportStudentsModalOpen, setIsImportStudentsModalOpen] = useState(false);
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
    const [selectedStudentForIncident, setSelectedStudentForIncident] = useState<Student | null>(null);
    const [showSnackbar, setShowSnackbar] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

    const studentMap = useMemo(() => new Map<number, Student>(students.map(s => [s.id, s])), [students]);

    const showSyncMessage = (message: string) => {
        setShowSnackbar({ message, visible: true });
        setTimeout(() => setShowSnackbar({ message: '', visible: false }), 4000);
    }

    const loadData = async () => {
        setLoading(true);
        const [incidentsData, attendanceData, announcementsData] = await Promise.all([
            getIncidents(), 
            getAllAttendanceRecords(),
            getAnnouncements()
        ]);
        setIncidents(incidentsData);
        setAttendanceRecords(attendanceData);
        setAllCitations(MOCK_CITATIONS); // This is still mock, should be moved to DB if needed
        setAnnouncements(announcementsData);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const displayedIncidents = useMemo(() => {
        return incidents.filter(inc => {
            const matchesView = incidentView === 'active' ? !inc.archived : inc.archived;
            if (!matchesView) return false;

            const matchesSearch =
                inc.studentName.toLowerCase().includes(incidentSearch.toLowerCase()) ||
                inc.teacherName.toLowerCase().includes(incidentSearch.toLowerCase()) ||
                inc.notes.toLowerCase().includes(incidentSearch.toLowerCase());
            const matchesType = incidentTypeFilter === 'all' || inc.type === incidentTypeFilter;
            return matchesSearch && matchesType;
        });
    }, [incidents, incidentSearch, incidentTypeFilter, incidentView]);

    const displayedAttendance = useMemo((): EnrichedAttendanceRecord[] => {
        return attendanceRecords.filter(rec => {
            const student = studentMap.get(rec.studentId);
            if (!student) return false;

            const matchesDate = rec.date >= dateFilter.start && rec.date <= dateFilter.end;
            const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;
            const matchesGroup = groupFilter === 'all' || student.group === groupFilter;
            const matchesSearch = student.name.toLowerCase().includes(attendanceSearch.toLowerCase());

            return matchesDate && matchesGrade && matchesGroup && matchesSearch;
        }).map(rec => ({...rec, student: studentMap.get(rec.studentId)! }));
    }, [attendanceRecords, dateFilter, gradeFilter, groupFilter, attendanceSearch, studentMap]);
    
    const displayedCitations = useMemo(() => {
        return allCitations.filter(cit => {
            const student = studentMap.get(cit.studentId);
            
            const matchesStatus = citationStatusFilter === 'all' || cit.status === citationStatusFilter;
            const matchesSearch = cit.studentName.toLowerCase().includes(citationSearch.toLowerCase()) || cit.reason.toLowerCase().includes(citationSearch.toLowerCase());
            const matchesGrade = citationGradeFilter === 'all' || (student && student.grade === citationGradeFilter);
            const matchesGroup = citationGroupFilter === 'all' || (student && student.group === citationGroupFilter);

            return matchesStatus && matchesSearch && matchesGrade && matchesGroup;
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allCitations, citationSearch, citationStatusFilter, citationGradeFilter, citationGroupFilter, studentMap]);

    const attendanceSummary = useMemo(() => {
        return displayedAttendance.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
        }, { 
            [AttendanceStatus.PRESENT]: 0,
            [AttendanceStatus.ABSENT]: 0,
            [AttendanceStatus.TARDY]: 0,
            [AttendanceStatus.EXCUSED]: 0,
            [AttendanceStatus.SPECIAL_PERMIT]: 0,
        } as Record<AttendanceStatus, number>);
    }, [displayedAttendance]);

    const handleToggleArchive = async (incident: Incident) => {
        await updateIncident({ ...incident, archived: !incident.archived });
        await loadData();
    };

    const handleDownloadIncidents = (format: 'csv' | 'pdf') => {
        if (format === 'csv') {
            const csvData = generateIncidentsCSV(displayedIncidents);
            downloadFile(csvData, `reporte_incidencias_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
        } else {
            const htmlContent = generateIncidentsPDFHTML('Reporte de Incidencias', displayedIncidents);
            const pdfWindow = window.open("", "_blank");
            pdfWindow?.document.write(htmlContent);
            pdfWindow?.document.close();
        }
    };
    
    const handleDownloadAttendance = (format: 'csv' | 'pdf') => {
        if (format === 'csv') {
            const csvData = generateAttendanceCSV(displayedAttendance);
            downloadFile(csvData, `reporte_asistencia_${dateFilter.start}_a_${dateFilter.end}.csv`, 'text/csv;charset=utf-8;');
        } else {
            const htmlContent = generateAttendancePDFHTML(`Reporte de Asistencia (${dateFilter.start} a ${dateFilter.end})`, displayedAttendance);
            const pdfWindow = window.open("", "_blank");
            pdfWindow?.document.write(htmlContent);
            pdfWindow?.document.close();
        }
    };
    
    const handleSendAnnouncement = async () => {
        if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
            alert('El título y el contenido del comunicado no pueden estar vacíos.');
            return;
        }

        const announcementToSend: Announcement = {
            id: `ann_${Date.now()}`,
            title: newAnnouncement.title,
            content: newAnnouncement.content,
            recipients: newAnnouncement.recipientType === 'all' ? 'all' : { grade: newAnnouncement.grade, group: newAnnouncement.group },
            timestamp: new Date().toISOString(),
            sentBy: COORDINATOR_PROFILE.name,
        };
        
        try {
            await addAnnouncement(announcementToSend);
            await loadData();
            
            setNewAnnouncement({
                recipientType: 'all',
                grade: GRADES[0],
                group: GROUPS[0],
                title: '',
                content: ''
            });
            alert('Comunicado enviado exitosamente.');
        } catch (error) {
            console.error('Failed to send announcement:', error);
            alert('Hubo un error al enviar el comunicado.');
        }
    };

    const handleSaveCitations = (newCitations: Citation[]) => {
        setAllCitations(prev => [...prev, ...newCitations]);
        setIsCitationModalOpen(false);
    };

    const handleOpenCancelModal = (citation: Citation) => {
        setCitationToCancel(citation);
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancelCitation = (reason: string) => {
        if (!citationToCancel) return;
        setAllCitations(prev => prev.map(c => 
            c.id === citationToCancel.id 
            ? { ...c, status: CitationStatus.CANCELLED, cancellationReason: reason }
            : c
        ));
        setIsCancelModalOpen(false);
        setCitationToCancel(null);
    };
    
    const handleSaveTeachers = async (newTeachers: Teacher[]) => {
        try {
            const validTeachers: Teacher[] = [];
            const seenIds = new Set<string>();
    
            for (const teacher of newTeachers) {
                if (teacher.id && typeof teacher.id === 'string' && teacher.id.trim() !== '' && !seenIds.has(teacher.id)) {
                    const teacherWithAuth: Teacher = {
                        ...teacher,
                        password: teacher.id, // Set password to ID
                        passwordChanged: false, // Set flag for first login
                    };
                    validTeachers.push(teacherWithAuth);
                    seenIds.add(teacher.id);
                } else {
                    console.warn(`Skipping teacher with invalid or duplicate ID: ${teacher.name}`);
                }
            }
            
            if (validTeachers.length !== newTeachers.length) {
                const skippedCount = newTeachers.length - validTeachers.length;
                alert(`${skippedCount} docente(s) fue(ron) omitido(s) debido a datos duplicados o inválidos (Cédula). Por favor, revise el archivo de origen.`);
            }
    
            if (validTeachers.length > 0) {
                await addOrUpdateTeachers(validTeachers);
                setTeachers(validTeachers.sort((a, b) => a.name.localeCompare(b.name)));
            } else if (newTeachers.length > 0) {
                 alert("No se pudo importar ningún docente. Asegúrese de que cada docente en el archivo tenga una Cédula única y válida.");
            }
            
            setIsImportTeachersModalOpen(false);
        } catch (error) {
            console.error("Error al guardar docentes:", error);
            alert("Ocurrió un error inesperado al guardar los datos de los docentes. Por favor, intente de nuevo.");
        }
    };
    
    const handleUpdateTeacher = async (updatedTeacher: Teacher) => {
        const updatedTeachers = teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t);
        await addOrUpdateTeachers(updatedTeachers);
        setTeachers(updatedTeachers);
        setEditingTeacher(null);
    };
    
    const handleDeleteTeacher = async (teacherId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar a este docente? Esta acción no se puede deshacer.')) {
            const updatedTeachers = teachers.filter(t => t.id !== teacherId);
            await addOrUpdateTeachers(updatedTeachers);
            setTeachers(updatedTeachers);
        }
    };

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
        setIsImportStudentsModalOpen(false);
        // showSyncMessage(`${newStudents.length} estudiante(s) añadido(s) a ${grade} - Grupo ${group} exitosamente.`);
        setStudentGradeFilter(grade);
        setStudentGroupFilter(group);
    };

    const handleSelectStudentForIncident = (student: Student) => {
        setSelectedStudentForIncident(student);
        setIsIncidentModalOpen(true);
    };
    
    const handleSaveIncident = async (incident: Incident) => {
        const newIncident: Incident = { ...incident, synced: isOnline };
        await addIncident(newIncident);
        await loadData();
        setIsIncidentModalOpen(false);
        setSelectedStudentForIncident(null);
        showSyncMessage("El acudiente y el estudiante han sido notificados.");
    };

    const filteredStudentsForList = useMemo(() => {
      return students.filter(student => {
          const matchesGrade = studentGradeFilter === 'all' || student.grade === studentGradeFilter;
          const matchesGroup = studentGroupFilter === 'all' || student.group === studentGroupFilter;
          return matchesGrade && matchesGroup;
      });
    }, [students, studentGradeFilter, studentGroupFilter]);

    const getStatusClass = (status: CitationStatus) => {
        switch (status) {
            case CitationStatus.CONFIRMED: return 'bg-green-100 text-green-800';
            case CitationStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
            case CitationStatus.COMPLETED: return 'bg-blue-100 text-blue-800';
            case CitationStatus.CANCELLED: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const renderContent = () => {
        if (loading) {
            return <div className="text-center p-8">Cargando datos...</div>;
        }

        switch(activeTab) {
            case 'incidents':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                            <div className="flex items-center bg-gray-100 rounded-lg">
                                <button onClick={() => setIncidentView('active')} className={`px-4 py-2 text-sm font-semibold rounded-lg ${incidentView === 'active' ? 'bg-white shadow' : ''}`}>Activas</button>
                                <button onClick={() => setIncidentView('archived')} className={`px-4 py-2 text-sm font-semibold rounded-lg ${incidentView === 'archived' ? 'bg-white shadow' : ''}`}>Archivadas</button>
                            </div>
                             <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                                 <select value={incidentTypeFilter} onChange={e => setIncidentTypeFilter(e.target.value)} className="w-full sm:w-auto p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                                     <option value="all">Todos los Tipos</option>
                                     {Object.values(IncidentType).map(type => <option key={type} value={type}>{type}</option>)}
                                 </select>
                                <input type="text" placeholder="Buscar..." value={incidentSearch} onChange={e => setIncidentSearch(e.target.value)} className="w-full sm:w-auto p-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500" />
                                <button onClick={() => handleDownloadIncidents('csv')} className="p-2 border rounded-md hover:bg-gray-100" title="Descargar CSV"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                                <button onClick={() => handleDownloadIncidents('pdf')} className="p-2 border rounded-md hover:bg-gray-100" title="Descargar PDF"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
                            </div>
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {displayedIncidents.map(inc => (
                                <div key={inc.id} className="p-4 rounded-md border bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-primary flex-1">{inc.studentName} - <span className="font-normal text-gray-600">{inc.type}{inc.otherTypeDescription ? ` (${inc.otherTypeDescription})` : ''}</span></h4>
                                        <button onClick={() => handleToggleArchive(inc)} className="text-sm font-semibold text-gray-600 hover:text-primary flex-shrink-0 ml-4">{incidentView === 'active' ? 'Archivar' : 'Desarchivar'}</button>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3">{new Date(inc.timestamp).toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-sm mb-3">
                                        <div>
                                            <p className="font-medium text-gray-500">Reportado por:</p>
                                            <p className="text-gray-800">{inc.teacherName}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-500">Lugar del Suceso:</p>
                                            <p className="text-gray-800">{inc.location}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="font-medium text-gray-500 text-sm">Descripción:</p>
                                        <p className="text-gray-700 whitespace-pre-wrap text-sm">{inc.notes}</p>
                                    </div>
                                </div>
                            ))}
                            {displayedIncidents.length === 0 && <p className="text-center text-gray-500 py-8">No se encontraron incidencias.</p>}
                        </div>
                    </div>
                );
            case 'attendance':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Desde</label>
                                    <input type="date" value={dateFilter.start} onChange={e => setDateFilter(p => ({...p, start: e.target.value}))} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Hasta</label>
                                    <input type="date" value={dateFilter.end} onChange={e => setDateFilter(p => ({...p, end: e.target.value}))} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900" />
                                </div>
                                 <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                                    <option value="all">Todos los Grados</option>
                                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                                    <option value="all">Todos los Grupos</option>
                                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
                                <input type="text" placeholder="Buscar estudiante..." value={attendanceSearch} onChange={e => setAttendanceSearch(e.target.value)} className="w-full sm:w-auto p-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500" />
                                <button onClick={() => handleDownloadAttendance('csv')} className="p-2 border rounded-md hover:bg-gray-100" title="Descargar CSV"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                                <button onClick={() => handleDownloadAttendance('pdf')} className="p-2 border rounded-md hover:bg-gray-100" title="Descargar PDF"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2