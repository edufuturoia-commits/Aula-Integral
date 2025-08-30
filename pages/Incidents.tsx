import React, { useState, useEffect, useMemo } from 'react';
import { getIncidents, updateIncident, getAllAttendanceRecords, getAnnouncements, addAnnouncement, addOrUpdateTeachers, addOrUpdateStudents, addIncident, getTeachers } from '../db';
import type { Incident, Student, AttendanceRecord, Citation, Announcement, Teacher } from '../types';
import { IncidentType, AttendanceStatus, CitationStatus, DocumentType } from '../types';
import { GRADES, GROUPS, MOCK_CITATIONS, COORDINATOR_PROFILE } from '../constants';
import CitationModal from '../components/CitationModal';
import CancelCitationModal from '../components/CancelCitationModal';
import ImportTeachersModal from '../components/ImportTeachersModal';
import EditTeacherModal from '../components/EditTeacherModal';
import StudentList from '../components/StudentList';
import ImportStudentsModal from '../components/ImportStudentsModal';
import IncidentModal from '../components/IncidentModal';
import EditStudentModal from '../components/EditStudentModal';


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
    const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

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
            const seenEmails = new Set<string>();
    
            for (const teacher of newTeachers) {
                const teacherCopy = { ...teacher }; // create a mutable copy

                // Sanitize email to undefined if empty or just whitespace
                if (!teacherCopy.email || teacherCopy.email.trim() === '') {
                    teacherCopy.email = undefined;
                }

                // Check for duplicate ID and non-undefined email
                const isDuplicateId = !teacherCopy.id || typeof teacherCopy.id !== 'string' || teacherCopy.id.trim() === '' || seenIds.has(teacherCopy.id);
                const isDuplicateEmail = teacherCopy.email && seenEmails.has(teacherCopy.email);

                if (!isDuplicateId && !isDuplicateEmail) {
                    const teacherWithAuth: Teacher = {
                        ...teacherCopy,
                        password: teacherCopy.id, // Set password to ID
                        passwordChanged: false, // Set flag for first login
                    };
                    validTeachers.push(teacherWithAuth);
                    seenIds.add(teacherCopy.id);
                    if (teacherCopy.email) {
                        seenEmails.add(teacherCopy.email);
                    }
                } else {
                    console.warn(`Skipping teacher with invalid or duplicate data: ${teacherCopy.name}`);
                }
            }
            
            if (validTeachers.length !== newTeachers.length) {
                const skippedCount = newTeachers.length - validTeachers.length;
                alert(`${skippedCount} docente(s) fue(ron) omitido(s) debido a datos duplicados o inválidos (Cédula o Email). Por favor, revise el archivo de origen.`);
            }
    
            if (validTeachers.length > 0) {
                await addOrUpdateTeachers(validTeachers);
                const allTeachers = await getTeachers();
                setTeachers(allTeachers);
            } else if (newTeachers.length > 0) {
                 alert("No se pudo importar ningún docente. Asegúrese de que cada docente en el archivo tenga una Cédula y Email únicos y válidos.");
            } else {
                // If newTeachers is empty, clear the list.
                await addOrUpdateTeachers([]);
                setTeachers([]);
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

    const handleOpenEditStudentModal = (student: Student) => {
        setStudentToEdit(student);
        setIsEditStudentModalOpen(true);
    };
    
    const handleCloseEditStudentModal = () => {
        setIsEditStudentModalOpen(false);
        setStudentToEdit(null);
    };
    
    const handleSaveStudent = async (updatedStudent: Student) => {
        const updatedStudents = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
        await addOrUpdateStudents(updatedStudents);
        setStudents(updatedStudents);
        handleCloseEditStudentModal();
        showSyncMessage(`${updatedStudent.name} ha sido actualizado exitosamente.`);
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

    // FIX: Added a specific helper function for attendance status classes to resolve type error.
    const getAttendanceStatusClass = (status: AttendanceStatus) => {
        switch (status) {
            case AttendanceStatus.PRESENT: return 'bg-green-100 text-green-800';
            case AttendanceStatus.ABSENT: return 'bg-red-100 text-red-800';
            case AttendanceStatus.TARDY: return 'bg-yellow-100 text-yellow-800';
            case AttendanceStatus.EXCUSED: return 'bg-blue-100 text-blue-800';
            case AttendanceStatus.SPECIAL_PERMIT: return 'bg-purple-100 text-purple-800';
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
                                <button onClick={() => handleDownloadAttendance('pdf')} className="p-2 border rounded-md hover:bg-gray-100" title="Descargar PDF"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
                            </div>
                        </div>
                        {/* Start of added content */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-center">
                            {Object.entries(attendanceSummary).map(([status, count]) => (
                                <div key={status} className="p-2 bg-gray-100 rounded-lg">
                                    <p className="text-2xl font-bold text-gray-800">{count}</p>
                                    <p className="text-sm text-gray-600">{status}</p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                            {displayedAttendance.map(rec => (
                                <div key={rec.id} className="p-3 border rounded-lg flex justify-between items-center bg-gray-50">
                                    <div className="flex items-center space-x-3">
                                        <img src={rec.student.avatarUrl} alt={rec.student.name} className="w-8 h-8 rounded-full" />
                                        <div>
                                            <p className="font-semibold">{rec.student.name}</p>
                                            <p className="text-xs text-gray-500">{rec.date}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAttendanceStatusClass(rec.status)}`}>{rec.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'citations':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Gestión de Citaciones</h3>
                            <button onClick={() => setIsCitationModalOpen(true)} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">
                                Crear Citación
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <input type="text" placeholder="Buscar por estudiante o motivo..." value={citationSearch} onChange={e => setCitationSearch(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500" />
                            <select value={citationStatusFilter} onChange={e => setCitationStatusFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                                <option value="all">Todos los Estados</option>
                                {Object.values(CitationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select value={citationGradeFilter} onChange={e => setCitationGradeFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                                <option value="all">Todos los Grados</option>
                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            <select value={citationGroupFilter} onChange={e => setCitationGroupFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                                <option value="all">Todos los Grupos</option>
                                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {displayedCitations.map(cit => (
                                <div key={cit.id} className="p-4 border rounded-lg bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{cit.studentName}</p>
                                            <p className="text-sm text-gray-600">{cit.reason}</p>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(cit.date).toLocaleDateString('es-CO')} - {cit.time}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(cit.status)}`}>{cit.status}</span>
                                            {[CitationStatus.PENDING, CitationStatus.CONFIRMED].includes(cit.status) && (
                                                <button onClick={() => handleOpenCancelModal(cit)} className="text-xs font-semibold text-red-600 hover:text-red-800 mt-2 block">
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {displayedCitations.length === 0 && <p className="text-center text-gray-500 py-8">No se encontraron citaciones.</p>}
                        </div>
                    </div>
                );
            case 'comunicados':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-xl font-bold mb-4">Nuevo Comunicado</h3>
                            <form onSubmit={(e) => { e.preventDefault(); handleSendAnnouncement(); }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium">Título</label>
                                    <input type="text" value={newAnnouncement.title} onChange={e => setNewAnnouncement(p => ({...p, title: e.target.value}))} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Contenido</label>
                                    <textarea rows={5} value={newAnnouncement.content} onChange={e => setNewAnnouncement(p => ({...p, content: e.target.value}))} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900" required></textarea>
                                </div>
                                <button type="submit" className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">Enviar Comunicado</button>
                            </form>
                        </div>
                        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-xl font-bold mb-4">Historial de Comunicados</h3>
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {announcements.map(ann => (
                                    <div key={ann.id} className="p-4 border rounded-lg bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold">{ann.title}</h4>
                                            <span className="text-xs text-gray-500">{new Date(ann.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm mt-2">{ann.content}</p>
                                        <p className="text-xs text-gray-400 mt-2 text-right">Enviado por: {ann.sentBy}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'teacher_management':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Gestión de Docentes</h3>
                            <button onClick={() => setIsImportTeachersModalOpen(true)} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">
                                Importar Docentes
                            </button>
                        </div>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                            {teachers.map(teacher => (
                                <div key={teacher.id} className="p-3 border rounded-lg flex justify-between items-center bg-gray-50">
                                    <div className="flex items-center space-x-3">
                                        <img src={teacher.avatarUrl} alt={teacher.name} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <p className="font-semibold">{teacher.name}</p>
                                            <p className="text-sm text-gray-500">{teacher.subject}</p>
                                        </div>
                                    </div>
                                    <div className="space-x-2">
                                        <button onClick={() => setEditingTeacher(teacher)} className="text-sm font-semibold text-blue-600 hover:text-blue-800">Editar</button>
                                        <button onClick={() => handleDeleteTeacher(teacher.id)} className="text-sm font-semibold text-red-600 hover:text-red-800">Eliminar</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'student_management':
                return (
                    <StudentList 
                        students={filteredStudentsForList}
                        onEditStudent={handleOpenEditStudentModal}
                        onReportIncident={handleSelectStudentForIncident}
                        onImportClick={() => setIsImportStudentsModalOpen(true)}
                        grades={['all', ...GRADES]}
                        selectedGrade={studentGradeFilter}
                        onGradeChange={setStudentGradeFilter}
                        groups={['all', ...GROUPS]}
                        selectedGroup={studentGroupFilter}
                        onGroupChange={setStudentGroupFilter}
                    />
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            {renderContent()}
    
            {isCitationModalOpen && (
                <CitationModal 
                    students={students}
                    onClose={() => setIsCitationModalOpen(false)}
                    onSave={handleSaveCitations}
                />
            )}
            {isCancelModalOpen && citationToCancel && (
                <CancelCitationModal 
                    onClose={() => setIsCancelModalOpen(false)}
                    onConfirm={handleConfirmCancelCitation}
                />
            )}
            {isImportTeachersModalOpen && (
                <ImportTeachersModal
                    onClose={() => setIsImportTeachersModalOpen(false)}
                    onSave={handleSaveTeachers}
                />
            )}
            {editingTeacher && (
                <EditTeacherModal
                    teacher={editingTeacher}
                    onClose={() => setEditingTeacher(null)}
                    onSave={handleUpdateTeacher}
                />
            )}
            {isImportStudentsModalOpen && (
                <ImportStudentsModal
                    onClose={() => setIsImportStudentsModalOpen(false)}
                    onSave={handleImportStudents}
                />
            )}
            {isIncidentModalOpen && (
                <IncidentModal 
                    student={selectedStudentForIncident}
                    students={students}
                    onClose={() => {
                        setIsIncidentModalOpen(false);
                        setSelectedStudentForIncident(null);
                    }}
                    onSave={handleSaveIncident}
                    reporterName={COORDINATOR_PROFILE.name}
                />
            )}
            {isEditStudentModalOpen && studentToEdit && (
                <EditStudentModal
                    student={studentToEdit}
                    onClose={handleCloseEditStudentModal}
                    onSave={handleSaveStudent}
                />
            )}
            {showSnackbar.visible && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg z-50">
                    {showSnackbar.message}
                </div>
            )}
        </div>
    );
};

export default Incidents;