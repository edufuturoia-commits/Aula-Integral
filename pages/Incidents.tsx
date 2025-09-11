



import React, { useState, useEffect, useMemo } from 'react';
import type { Incident, Student, AttendanceRecord, Citation, Announcement, Teacher, SubjectGrades } from '../types';
import { IncidentType, AttendanceStatus, CitationStatus, Role } from '../types';
// FIX: Import 'getAnnouncements' and 'getTeachers' to resolve undefined function errors.
import { addAnnouncement, addOrUpdateTeachers, addOrUpdateStudents, getAnnouncements, getTeachers } from '../db';
import { GRADES, GROUPS, GRADE_GROUP_MAP } from '../constants';
import CitationModal from '../components/CitationModal';
import CancelCitationModal from '../components/CancelCitationModal';
import ImportTeachersModal from '../components/ImportTeachersModal';
import EditTeacherModal from '../components/EditTeacherModal';
import StudentList from '../components/StudentList';
import ImportStudentsModal from '../components/ImportStudentsModal';
import IncidentModal from '../components/IncidentModal';
import EditStudentModal from '../components/EditStudentModal';
import Calificaciones from './Calificaciones';
import EditCitationModal from '../components/EditCitationModal';


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
type CoordinationTab = 'incidents' | 'attendance' | 'citations' | 'comunicados' | 'teacher_management' | 'student_management' | 'calificaciones';

const TABS: { id: CoordinationTab; label: string }[] = [
    { id: 'incidents', label: 'Historial de Incidencias' },
    { id: 'attendance', label: 'Reportes de Asistencia' },
    { id: 'citations', label: 'Gestión de Citaciones' },
    { id: 'comunicados', label: 'Comunicados' },
    { id: 'teacher_management', label: 'Gestión de Docentes' },
    { id: 'student_management', label: 'Gestión de Estudiantes' },
    { id: 'calificaciones', label: 'Calificaciones' },
];

interface IncidentsProps {
    isOnline: boolean;
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    teachers: Teacher[];
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    currentUser: Teacher;
    subjectGradesData: SubjectGrades[];
    setSubjectGradesData: React.Dispatch<React.SetStateAction<SubjectGrades[]>>;
    allAttendanceRecords: AttendanceRecord[];
    citations: Citation[];
    onUpdateCitations: React.Dispatch<React.SetStateAction<Citation[]>>;
    incidents: Incident[];
    onUpdateIncidents: (action: 'add' | 'update' | 'delete', data: Incident | string) => Promise<void>;
}

const getAttendanceStatusTextColor = (status: AttendanceStatus): string => {
    switch (status) {
        case AttendanceStatus.PRESENT: return 'text-green-600';
        case AttendanceStatus.ABSENT: return 'text-red-600';
        case AttendanceStatus.TARDY: return 'text-yellow-600';
        case AttendanceStatus.EXCUSED: return 'text-blue-600';
        case AttendanceStatus.SPECIAL_PERMIT: return 'text-purple-600';
        default: return 'text-gray-800';
    }
};

const getCitationStatusClass = (status: CitationStatus) => {
    switch (status) {
        case CitationStatus.CONFIRMED: return 'bg-green-100 text-green-800';
        case CitationStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
        case CitationStatus.COMPLETED: return 'bg-blue-100 text-blue-800';
        case CitationStatus.CANCELLED: return 'bg-red-100 text-red-800';
        case CitationStatus.RESCHEDULE_REQUESTED: return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};


const Incidents: React.FC<IncidentsProps> = ({ isOnline, students, setStudents, teachers, setTeachers, currentUser, subjectGradesData, setSubjectGradesData, allAttendanceRecords, citations, onUpdateCitations, incidents, onUpdateIncidents }) => {
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
    const [editingCitation, setEditingCitation] = useState<Citation | null>(null);

    // Announcement state
    const [commRecipientType, setCommRecipientType] = useState<'all' | 'group' | 'individual'>('all');
    const [commTitle, setCommTitle] = useState('');
    const [commContent, setCommContent] = useState('');
    const [commGrade, setCommGrade] = useState(GRADES[0]);
    const [commGroup, setCommGroup] = useState(GRADE_GROUP_MAP[GRADES[0]][0]);
    const [commSelectedTeacherId, setCommSelectedTeacherId] = useState<string>('');
    
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
        const announcementsData = await getAnnouncements();
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

    const availableGroupsForAttendance = useMemo(() => {
        if (gradeFilter === 'all' || !GRADE_GROUP_MAP[gradeFilter]) {
            return ['all', ...GROUPS];
        }
        return ['all', ...GRADE_GROUP_MAP[gradeFilter]];
    }, [gradeFilter]);

    const handleAttendanceGradeChange = (grade: string) => {
        setGradeFilter(grade);
        setGroupFilter('all');
    };

    const displayedAttendance = useMemo((): EnrichedAttendanceRecord[] => {
        return allAttendanceRecords.filter(rec => {
            const student = studentMap.get(rec.studentId);
            if (!student) return false;

            const matchesDate = rec.date >= dateFilter.start && rec.date <= dateFilter.end;
            const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;
            const matchesGroup = groupFilter === 'all' || student.group === groupFilter;
            const matchesSearch = student.name.toLowerCase().includes(attendanceSearch.toLowerCase());

            return matchesDate && matchesGrade && matchesGroup && matchesSearch;
        }).map(rec => ({...rec, student: studentMap.get(rec.studentId)! }));
    }, [allAttendanceRecords, dateFilter, gradeFilter, groupFilter, attendanceSearch, studentMap]);
    
    const availableGroupsForCitations = useMemo(() => {
        if (citationGradeFilter === 'all' || !GRADE_GROUP_MAP[citationGradeFilter]) {
            return ['all', ...GROUPS];
        }
        return ['all', ...GRADE_GROUP_MAP[citationGradeFilter]];
    }, [citationGradeFilter]);

    const handleCitationGradeChange = (grade: string) => {
        setCitationGradeFilter(grade);
        setCitationGroupFilter('all');
    };

    const displayedCitations = useMemo(() => {
        return citations.filter(cit => {
            const student = studentMap.get(cit.studentId);
            
            const matchesStatus = citationStatusFilter === 'all' || cit.status === citationStatusFilter;
            const matchesSearch = cit.studentName.toLowerCase().includes(citationSearch.toLowerCase()) || cit.reason.toLowerCase().includes(citationSearch.toLowerCase());
            const matchesGrade = citationGradeFilter === 'all' || (student && student.grade === citationGradeFilter);
            const matchesGroup = citationGroupFilter === 'all' || (student && student.group === citationGroupFilter);

            return matchesStatus && matchesSearch && matchesGrade && matchesGroup;
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [citations, citationSearch, citationStatusFilter, citationGradeFilter, citationGroupFilter, studentMap]);

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

    const handleIncidentAction = async (action: 'archive' | 'delete' | 'attend', incident: Incident) => {
        if (action === 'delete') {
            if (window.confirm("¿Estás seguro de que quieres eliminar esta incidencia permanentemente?")) {
                await onUpdateIncidents('delete', incident.id);
                showSyncMessage("Incidencia eliminada.");
            }
        } else if (action === 'archive') {
            await onUpdateIncidents('update', { ...incident, archived: !incident.archived });
            showSyncMessage(incident.archived ? "Incidencia desarchivada." : "Incidencia archivada.");
        } else if (action === 'attend') {
            await onUpdateIncidents('update', { ...incident, attended: true });
            showSyncMessage("Incidencia marcada como atendida.");
        }
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
    
    const handleSendAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!commTitle.trim() || !commContent.trim()) {
            alert('El título y el contenido del comunicado no pueden estar vacíos.');
            return;
        }

        let recipients: Announcement['recipients'] = 'all';
        let alertMessage = "Comunicado enviado a toda la comunidad.";

        if (commRecipientType === 'group') {
            recipients = { grade: commGrade, group: commGroup };
            alertMessage = `Comunicado enviado a ${commGrade} - Grupo ${commGroup}.`;
        } else if (commRecipientType === 'individual') {
            if (!commSelectedTeacherId) {
                alert("Por favor, selecciona un docente.");
                return;
            }
            const teacher = teachers.find(t => t.id === commSelectedTeacherId);
            alertMessage = `Comunicado enviado a ${teacher?.name}.`;
            recipients = { grade: 'N/A', group: 'Individual' };
        }
    
        const announcementToSend: Announcement = {
            id: `ann_coord_${Date.now()}`,
            title: commTitle,
            content: commContent,
            recipients,
            timestamp: new Date().toISOString(),
            sentBy: currentUser.name,
        };
        
        try {
            await addAnnouncement(announcementToSend);
            await loadData();
            
            setCommTitle('');
            setCommContent('');
            setCommRecipientType('all');
            setCommSelectedTeacherId('');
            
            alert(alertMessage);
        } catch (error) {
            console.error('Failed to send announcement:', error);
            alert('Hubo un error al enviar el comunicado.');
        }
    };

    const handleSaveCitations = (newCitations: Citation[]) => {
        onUpdateCitations(prev => [...prev, ...newCitations]);
        setIsCitationModalOpen(false);
    };

    const handleOpenCancelModal = (citation: Citation) => {
        setCitationToCancel(citation);
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancelCitation = (reason: string) => {
        if (!citationToCancel) return;
        onUpdateCitations(prev => prev.map(c => 
            c.id === citationToCancel.id 
            ? { ...c, status: CitationStatus.CANCELLED, cancellationReason: reason }
            : c
        ));
        setIsCancelModalOpen(false);
        setCitationToCancel(null);
    };

    const handleDeleteCitation = (citationId: string) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar esta citación? Esta acción no se puede deshacer y requerirá crear una nueva.")) {
            onUpdateCitations(prev => prev.filter(c => c.id !== citationId));
            showSyncMessage("Citación eliminada.");
        }
    };
    
    const handleSaveEditedCitation = (updatedCitation: Citation) => {
        // When a citation is edited after a reschedule request, it should go back to PENDING
        // so the parent has to confirm the new details.
        const citationToSave = { ...updatedCitation, status: CitationStatus.PENDING };
        onUpdateCitations(prev => prev.map(c => (c.id === citationToSave.id ? citationToSave : c)));
        setEditingCitation(null);
        showSyncMessage("Citación actualizada. El acudiente debe confirmar los nuevos detalles.");
    };
    
    const handleSaveTeachers = async (newTeachers: Teacher[]) => {
        try {
            const validTeachers: Teacher[] = [];
            const seenIds = new Set<string>();
            const seenEmails = new Set<string>();
    
            for (const teacher of newTeachers) {
                const teacherCopy = { ...teacher }; // create a mutable copy

                if (!teacherCopy.email || teacherCopy.email.trim() === '') {
                    teacherCopy.email = undefined;
                }

                const isDuplicateId = !teacherCopy.id || typeof teacherCopy.id !== 'string' || teacherCopy.id.trim() === '' || seenIds.has(teacherCopy.id);
                const isDuplicateEmail = teacherCopy.email && seenEmails.has(teacherCopy.email);

                if (!isDuplicateId && !isDuplicateEmail) {
                    const teacherWithAuth: Teacher = {
                        ...teacherCopy,
                        password: teacherCopy.id, 
                        passwordChanged: false, 
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
            
            if (newTeachers.length > 0 && validTeachers.length !== newTeachers.length) {
                const skippedCount = newTeachers.length - validTeachers.length;
                showSyncMessage(`${skippedCount} docente(s) omitido(s) por datos duplicados o inválidos (Cédula/Email).`);
            }
    
            if (validTeachers.length > 0) {
                const existingTeachers = await getTeachers();
                const teacherMap = new Map(existingTeachers.map(t => [t.id, t]));
                validTeachers.forEach(t => teacherMap.set(t.id, t)); // Upsert logic
                
                const updatedTeachersList = Array.from(teacherMap.values());

                await addOrUpdateTeachers(updatedTeachersList);
                setTeachers(updatedTeachersList.sort((a,b) => a.name.localeCompare(b.name)));
                showSyncMessage(`${validTeachers.length} docente(s) importado(s) y/o actualizado(s) exitosamente.`);
            } else if (newTeachers.length > 0) {
                 alert("No se pudo importar ningún docente. Asegúrese de que cada docente en el archivo tenga una Cédula y Email únicos y válidos.");
            }
            
        } catch (error) {
            console.error("Failed to save teachers:", error);
            alert("Ocurrió un error al guardar los docentes.");
        } finally {
            setIsImportTeachersModalOpen(false);
        }
    };
    
    const handleSaveTeacherEdit = async (updatedTeacher: Teacher) => {
        const updatedTeachers = teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t);
        await addOrUpdateTeachers(updatedTeachers);
        setTeachers(updatedTeachers);
        setEditingTeacher(null);
        showSyncMessage("Datos del docente actualizados.");
    };
    
    // --- Student Management Functions ---
    const handleImportStudents = async (studentNames: string[], grade: string, group: string) => {
        const newStudents: Student[] = studentNames.map((name, index) => ({
            id: Date.now() + index,
            name,
            avatarUrl: `https://picsum.photos/seed/${Date.now() + index}/100/100`,
            grade,
            group,
            role: Role.STUDENT,
        }));
        const updatedStudentList = [...students, ...newStudents];
        await addOrUpdateStudents(updatedStudentList);
        setStudents(updatedStudentList.sort((a, b) => a.name.localeCompare(b.name)));
        setIsImportStudentsModalOpen(false);
        showSyncMessage(`${newStudents.length} estudiantes importados a ${grade}-${group}.`);
    };

    const handleOpenIncidentModal = (student: Student) => {
        setSelectedStudentForIncident(student);
        setIsIncidentModalOpen(true);
    };
    
    const handleSaveIncident = async (incident: Incident) => {
        await onUpdateIncidents('add', { ...incident, synced: isOnline });
        setIsIncidentModalOpen(false);
        setSelectedStudentForIncident(null);
        showSyncMessage("Incidencia guardada exitosamente.");
    };
    
    const handleOpenEditStudentModal = (student: Student) => {
        setStudentToEdit(student);
        setIsEditStudentModalOpen(true);
    };

    const handleSaveStudentEdit = async (updatedStudent: Student) => {
        const updatedStudentList = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
        await addOrUpdateStudents(updatedStudentList);
        setStudents(updatedStudentList);
        setIsEditStudentModalOpen(false);
        setStudentToEdit(null);
        showSyncMessage("Datos del estudiante actualizados.");
    };
    
    const availableGroupsForStudentMgmt = useMemo(() => {
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

    if (loading) {
        return <div className="text-center p-8">Cargando datos de coordinación...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
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

            <div className={activeTab === 'incidents' ? '' : 'hidden'}>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <input type="text" placeholder="Buscar por estudiante, docente o nota..." value={incidentSearch} onChange={e => setIncidentSearch(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md w-full md:w-auto bg-gray-50 text-gray-900" />
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <select value={incidentTypeFilter} onChange={e => setIncidentTypeFilter(e.target.value)} className="w-full md:w-auto p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                                <option value="all">Todos los Tipos</option>
                                {Object.values(IncidentType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <div className="bg-gray-200 rounded-lg p-1 flex">
                                <button onClick={() => setIncidentView('active')} className={`px-3 py-1 text-sm font-semibold rounded-md ${incidentView === 'active' ? 'bg-white shadow' : ''}`}>Activas</button>
                                <button onClick={() => setIncidentView('archived')} className={`px-3 py-1 text-sm font-semibold rounded-md ${incidentView === 'archived' ? 'bg-white shadow' : ''}`}>Archivadas</button>
                            </div>
                            <button onClick={() => handleDownloadIncidents('pdf')} className="p-2 bg-primary text-white rounded-lg hover:bg-primary-focus">PDF</button>
                            <button onClick={() => handleDownloadIncidents('csv')} className="p-2 bg-primary text-white rounded-lg hover:bg-primary-focus">CSV</button>
                        </div>
                    </div>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {displayedIncidents.map(inc => (
                            <div key={inc.id} className="p-4 border rounded-lg bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-900">{inc.studentName}</p>
                                        <p className="text-sm text-gray-600">{inc.type}</p>
                                    </div>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${inc.attended ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {inc.attended ? 'Atendido' : 'Pendiente'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{inc.notes}</p>
                                <div className="text-xs text-gray-400 mt-2 flex justify-between">
                                    <span>Reportado por: {inc.teacherName} @ {inc.location}</span>
                                    <span>{new Date(inc.timestamp).toLocaleString()}</span>
                                </div>
                                {!inc.archived && (
                                    <div className="flex items-center justify-end space-x-4 mt-3 pt-3 border-t">
                                        <button onClick={() => handleIncidentAction('attend', inc)} disabled={inc.attended} className="text-sm font-semibold text-green-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed">Marcar como Atendido</button>
                                        <button onClick={() => handleIncidentAction('archive', inc)} className="text-sm font-semibold text-primary hover:underline">{inc.archived ? 'Desarchivar' : 'Archivar'}</button>
                                        <button onClick={() => handleIncidentAction('delete', inc)} className="text-sm font-semibold text-red-600 hover:underline">Eliminar</button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {displayedIncidents.length === 0 && <p className="text-center text-gray-500 py-8">No se encontraron incidencias con los filtros actuales.</p>}
                    </div>
                </div>
            </div>

            <div className={activeTab === 'attendance' ? '' : 'hidden'}>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
                        <input type="text" placeholder="Buscar por estudiante..." value={attendanceSearch} onChange={e => setAttendanceSearch(e.target.value)} className="p-2 border border-gray-300 rounded-md w-full bg-gray-50 text-gray-900" />
                        <div>
                            <label className="text-xs font-bold text-gray-500">Fecha Inicio</label>
                            <input type="date" value={dateFilter.start} onChange={e => setDateFilter(prev => ({...prev, start: e.target.value}))} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900" />
                        </div>
                            <div>
                            <label className="text-xs font-bold text-gray-500">Fecha Fin</label>
                            <input type="date" value={dateFilter.end} onChange={e => setDateFilter(prev => ({...prev, end: e.target.value}))} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900" />
                        </div>
                            <div className="flex items-center gap-4">
                            <button onClick={() => handleDownloadAttendance('pdf')} className="flex-1 p-2 bg-primary text-white rounded-lg hover:bg-primary-focus">PDF</button>
                            <button onClick={() => handleDownloadAttendance('csv')} className="flex-1 p-2 bg-primary text-white rounded-lg hover:bg-primary-focus">CSV</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <select value={gradeFilter} onChange={e => handleAttendanceGradeChange(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                            <option value="all">Todos los Grados</option>
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                            {availableGroupsForAttendance.map(g => <option key={g} value={g}>{g === 'all' ? 'Todos los Grupos' : g}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center mb-4 p-4 bg-gray-50 rounded-lg">
                        <div><p className="font-bold text-2xl">{displayedAttendance.length}</p><p className="text-sm text-gray-500">Total Registros</p></div>
                        <div><p className="font-bold text-2xl text-green-600">{attendanceSummary[AttendanceStatus.PRESENT]}</p><p className="text-sm text-gray-500">Presentes</p></div>
                        <div><p className="font-bold text-2xl text-red-600">{attendanceSummary[AttendanceStatus.ABSENT]}</p><p className="text-sm text-gray-500">Ausentes</p></div>
                        <div><p className="font-bold text-2xl text-yellow-600">{attendanceSummary[AttendanceStatus.TARDY]}</p><p className="text-sm text-gray-500">Tardes</p></div>
                        <div><p className="font-bold text-2xl text-blue-600">{attendanceSummary[AttendanceStatus.EXCUSED]}</p><p className="text-sm text-gray-500">Excusas</p></div>
                    </div>
                        <div className="max-h-[50vh] overflow-y-auto pr-2">
                            <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                                <tr><th className="px-6 py-3">Fecha</th><th className="px-6 py-3">Estudiante</th><th className="px-6 py-3">Grado/Grupo</th><th className="px-6 py-3">Estado</th></tr>
                            </thead>
                            <tbody>
                                {displayedAttendance.map(rec => (
                                    <tr key={rec.id} className="bg-white border-b">
                                        <td className="px-6 py-4">{rec.date}</td>
                                        <td className="px-6 py-4 font-medium">{rec.student.name}</td>
                                        <td className="px-6 py-4">{rec.student.grade} - {rec.student.group}</td>
                                        <td className={`px-6 py-4 font-semibold ${getAttendanceStatusTextColor(rec.status)}`}>{rec.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                            {displayedAttendance.length === 0 && <p className="text-center text-gray-500 py-8">No hay registros de asistencia para los filtros seleccionados.</p>}
                    </div>
                </div>
            </div>
            
            <div className={activeTab === 'citations' ? '' : 'hidden'}>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Gestión de Citaciones</h3>
                        <button onClick={() => setIsCitationModalOpen(true)} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">Crear Citación</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <input type="text" placeholder="Buscar por estudiante o motivo..." value={citationSearch} onChange={e => setCitationSearch(e.target.value)} className="md:col-span-2 p-2 border border-gray-300 rounded-md w-full bg-gray-50 text-gray-900" />
                        <select value={citationStatusFilter} onChange={e => setCitationStatusFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                            <option value="all">Todos los Estados</option>
                            {Object.values(CitationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {displayedCitations.map(cit => (
                            <div key={cit.id} className="p-4 border rounded-lg bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold">{cit.studentName} - {cit.reason}</p>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCitationStatusClass(cit.status)}`}>{cit.status}</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{new Date(cit.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })} - {cit.time}</p>
                                {cit.status === CitationStatus.PENDING && (
                                    <div className="mt-3 text-right">
                                        <button onClick={() => handleOpenCancelModal(cit)} className="text-xs font-semibold text-red-600 hover:text-red-800">
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                                {cit.status === CitationStatus.RESCHEDULE_REQUESTED && (
                                    <div className="mt-4 flex items-center justify-end space-x-3">
                                        <button 
                                            onClick={() => handleDeleteCitation(cit.id)}
                                            className="text-sm font-semibold text-red-600 hover:underline"
                                        >
                                            Eliminar
                                        </button>
                                        <button 
                                            onClick={() => setEditingCitation(cit)}
                                            className="bg-primary text-white font-semibold py-1 px-3 rounded-lg hover:bg-primary-focus transition-colors text-sm"
                                        >
                                            Editar Cita
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className={activeTab === 'comunicados' ? '' : 'hidden'}>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold mb-4">Enviar Comunicado General</h3>
                    <form onSubmit={handleSendAnnouncement} className="space-y-4">
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Destinatarios</label>
                            <select value={commRecipientType} onChange={e => setCommRecipientType(e.target.value as any)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                                <option value="all">Toda la comunidad (Docentes y Acudientes)</option>
                                <option value="group">Grupo Específico</option>
                                <option value="individual">Docente Individual</option>
                            </select>
                        </div>
                        {commRecipientType === 'group' && (
                            <div className="grid grid-cols-2 gap-2">
                                <select value={commGrade} onChange={e => setCommGrade(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <select value={commGroup} onChange={e => setCommGroup(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                                    {(GRADE_GROUP_MAP[commGrade] || []).map(g => <option key={g} value={g}>{g}</option>)}
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
                        <button type="submit" className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">Enviar Comunicado</button>
                    </form>
                </div>
            </div>

            <div className={activeTab === 'teacher_management' ? '' : 'hidden'}>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Gestión de Docentes ({teachers.length})</h3>
                        <button onClick={() => setIsImportTeachersModalOpen(true)} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">Importar Docentes</button>
                    </div>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {teachers.map(teacher => (
                            <div key={teacher.id} className="p-3 border rounded-lg flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <img src={teacher.avatarUrl} alt={teacher.name} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="font-semibold">{teacher.name}</p>
                                        <p className="text-sm text-gray-500">{teacher.subject}</p>
                                    </div>
                                </div>
                                <button onClick={() => setEditingTeacher(teacher)} className="text-sm font-semibold text-primary hover:underline">Editar</button>
                            </div>
                            ))}
                    </div>
                </div>
            </div>
            
            <div className={activeTab === 'student_management' ? '' : 'hidden'}>
                <StudentList 
                    students={filteredStudentsForList}
                    onImportClick={() => setIsImportStudentsModalOpen(true)}
                    onReportIncident={handleOpenIncidentModal}
                    onEditStudent={handleOpenEditStudentModal}
                    grades={['all', ...GRADES]}
                    selectedGrade={studentGradeFilter}
                    onGradeChange={setStudentGradeFilter}
                    groups={availableGroupsForStudentMgmt}
                    selectedGroup={studentGroupFilter}
                    onGroupChange={setStudentGroupFilter}
                />
            </div>

            <div className={activeTab === 'calificaciones' ? '' : 'hidden'}>
                <Calificaciones
                    students={students}
                    subjectGradesData={subjectGradesData}
                    setSubjectGradesData={setSubjectGradesData}
                    currentUser={currentUser}
                />
            </div>
            
            {isCitationModalOpen && (
                <CitationModal 
                    students={students}
                    onClose={() => setIsCitationModalOpen(false)}
                    onSave={handleSaveCitations}
                    currentUser={currentUser}
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
                    onSave={handleSaveTeacherEdit}
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
                    onClose={() => setIsIncidentModalOpen(false)}
                    onSave={handleSaveIncident}
                    reporterName={currentUser.name}
                />
            )}
             {isEditStudentModalOpen && studentToEdit && (
                <EditStudentModal
                    student={studentToEdit}
                    onClose={() => setIsEditStudentModalOpen(false)}
                    onSave={handleSaveStudentEdit}
                />
            )}
            {editingCitation && (
                <EditCitationModal
                    citation={editingCitation}
                    onClose={() => setEditingCitation(null)}
                    onSave={handleSaveEditedCitation}
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