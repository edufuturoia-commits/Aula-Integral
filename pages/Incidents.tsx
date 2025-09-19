import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Incident, Student, AttendanceRecord, Citation, Announcement, Teacher, SubjectGrades, Guardian } from '../types';
import { IncidentType, AttendanceStatus, CitationStatus, Role, DocumentType, TeacherStatus } from '../types';
// FIX: Import 'getAnnouncements' and 'getTeachers' to resolve undefined function errors.
import { addOrUpdateTeachers, addOrUpdateStudents, getTeachers } from '../db';
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
import AddStudentModal from '../components/AddStudentModal';
import ImportGuardiansModal from '../components/ImportGuardiansModal';


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
type CoordinationTab = 'incidents' | 'attendance' | 'citations' | 'comunicados' | 'community_management' | 'calificaciones';
type CommunitySubTab = 'teachers' | 'students' | 'parents';

const TABS: { id: CoordinationTab; label: string }[] = [
    { id: 'incidents', label: 'Historial de Incidencias' },
    { id: 'attendance', label: 'Reportes de Asistencia' },
    { id: 'citations', label: 'Gestión de Citaciones' },
    { id: 'comunicados', label: 'Comunicados' },
    { id: 'community_management', label: 'Gestión Comunitaria' },
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
    setSubjectGradesData: (updater: React.SetStateAction<SubjectGrades[]>) => Promise<void>;
    allAttendanceRecords: AttendanceRecord[];
    citations: Citation[];
    onUpdateCitations: React.Dispatch<React.SetStateAction<Citation[]>>;
    incidents: Incident[];
    onUpdateIncidents: (action: 'add' | 'update' | 'delete', data: Incident | string) => Promise<void>;
    announcements: Announcement[];
    onUpdateAnnouncements: (announcement: Announcement) => Promise<void>;
    guardians: Guardian[];
    onUpdateGuardians: (guardians: Guardian[]) => Promise<void>;
    onShowSystemMessage: (message: string, type?: 'success' | 'error') => void;
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


const Incidents: React.FC<IncidentsProps> = ({ isOnline, students, setStudents, teachers, setTeachers, currentUser, subjectGradesData, setSubjectGradesData, allAttendanceRecords, citations, onUpdateCitations, incidents, onUpdateIncidents, announcements, onUpdateAnnouncements, guardians, onUpdateGuardians, onShowSystemMessage }) => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<CoordinationTab>('incidents');
    const [activeCommunityTab, setActiveCommunityTab] = useState<CommunitySubTab>('teachers');
    
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
    const [announcementRecipient, setAnnouncementRecipient] = useState<'all_teachers' | 'all_parents' | 'all_students' | 'group'>('all_teachers');
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementContent, setAnnouncementContent] = useState('');
    const [announcementGrade, setAnnouncementGrade] = useState(GRADES[0]);
    const [announcementGroup, setAnnouncementGroup] = useState(GRADE_GROUP_MAP[GRADES[0]][0]);

    // Teacher state
    const [teacherSearch, setTeacherSearch] = useState('');
    const [isImportTeachersModalOpen, setIsImportTeachersModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [teacherActionMenu, setTeacherActionMenu] = useState<string | null>(null);
    const teacherMenuRef = useRef<HTMLDivElement>(null);

    // Student Management State
    const [studentGradeFilter, setStudentGradeFilter] = useState<string>('all');
    const [studentGroupFilter, setStudentGroupFilter] = useState<string>('all');
    const [isImportStudentsModalOpen, setIsImportStudentsModalOpen] = useState(false);
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
    const [selectedStudentForIncident, setSelectedStudentForIncident] = useState<Student | null>(null);
    const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    
    // Guardian Management State
    const [isImportGuardiansModalOpen, setIsImportGuardiansModalOpen] = useState(false);

    const studentMap = useMemo(() => new Map<number, Student>(students.map(s => [s.id, s])), [students]);
    
    const sentAnnouncements = useMemo(() => {
        return announcements
            .filter(ann => ann.sentBy.includes('Coordinación') || ann.sentBy.includes('Rectoría'))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [announcements]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (teacherMenuRef.current && !teacherMenuRef.current.contains(event.target as Node)) {
                setTeacherActionMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [teacherMenuRef]);

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
                onShowSystemMessage("Incidencia eliminada.");
            }
        } else if (action === 'archive') {
            await onUpdateIncidents('update', { ...incident, archived: !incident.archived });
            onShowSystemMessage(incident.archived ? "Incidencia desarchivada." : "Incidencia archivada.");
        } else if (action === 'attend') {
            await onUpdateIncidents('update', { ...incident, attended: true });
            onShowSystemMessage("Incidencia marcada como atendida.");
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
        if (!announcementTitle.trim() || !announcementContent.trim()) {
            onShowSystemMessage("El título y el contenido no pueden estar vacíos.", 'error');
            return;
        }

        let recipients: Announcement['recipients'] = 'all';
        let recipientDescription = "Comunidad General";

        switch (announcementRecipient) {
            case 'all_teachers':
                recipientDescription = "Todos los Docentes";
                // In a real backend, you'd target a 'teachers' group
                break;
            case 'all_parents':
                recipientDescription = "Todos los Acudientes";
                break;
            case 'all_students':
                recipientDescription = "Todos los Estudiantes";
                break;
            case 'group':
                recipients = { grade: announcementGrade, group: announcementGroup };
                recipientDescription = `Grupo ${announcementGrade}-${announcementGroup}`;
                break;
        }

        const newAnnouncement: Announcement = {
            id: `ann_coord_${Date.now()}`,
            title: announcementTitle,
            content: announcementContent,
            recipients: recipients,
            timestamp: new Date().toISOString(),
            sentBy: `Coordinación (${recipientDescription})`,
        };

        await onUpdateAnnouncements(newAnnouncement);

        setAnnouncementTitle('');
        setAnnouncementContent('');
        onShowSystemMessage('Comunicado enviado exitosamente.');
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
            onShowSystemMessage("Citación eliminada.");
        }
    };
    
    const handleSaveEditedCitation = (updatedCitation: Citation) => {
        const citationToSave = { ...updatedCitation, status: CitationStatus.PENDING };
        onUpdateCitations(prev => prev.map(c => (c.id === citationToSave.id ? citationToSave : c)));
        setEditingCitation(null);
        onShowSystemMessage("Citación actualizada. El acudiente debe confirmar los nuevos detalles.");
    };
    
    const filteredTeachers = useMemo(() => teachers.filter(t => 
        t.name.toLowerCase().includes(teacherSearch.toLowerCase())
    ), [teachers, teacherSearch]);
    
    const handleSaveTeachers = async (newTeachers: Teacher[]) => {
        try {
            if (newTeachers.length === 0) {
                onShowSystemMessage("No se encontraron docentes para importar en el archivo.", 'error');
                setIsImportTeachersModalOpen(false);
                return;
            }

            const existingTeachers = await getTeachers();
            const teacherMap = new Map(existingTeachers.map(t => [t.id, t]));

            // Add or update teachers from the imported list
            newTeachers.forEach(teacher => {
                // Ensure required fields for new teachers are present
                const teacherToSave: Teacher = {
                    ...teacher,
                    password: teacher.id, // Default password is the ID
                    passwordChanged: false,
                    role: Role.TEACHER, // Ensure role is set
                    email: (!teacher.email || teacher.email.trim() === '') ? undefined : teacher.email
                };
                teacherMap.set(teacherToSave.id, teacherToSave);
            });
            
            const updatedTeachersList = Array.from(teacherMap.values());
            await addOrUpdateTeachers(updatedTeachersList);
            setTeachers(updatedTeachersList.sort((a,b) => a.name.localeCompare(b.name)));
            
            onShowSystemMessage(`${newTeachers.length} docente(s) han sido importados/actualizados exitosamente.`);
            
        } catch (error) {
            console.error("Failed to save teachers:", error);
            onShowSystemMessage("Ocurrió un error al guardar los docentes.", 'error');
        } finally {
            setIsImportTeachersModalOpen(false);
        }
    };
    
    const handleSaveTeacherEdit = async (updatedTeacher: Teacher) => {
        const updatedTeachers = teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t);
        await addOrUpdateTeachers(updatedTeachers);
        setTeachers(updatedTeachers);
        setEditingTeacher(null);
        onShowSystemMessage("Datos del docente actualizados.");
    };

    const handleTeacherStatusChange = async (teacher: Teacher, status: TeacherStatus) => {
        const updatedTeachers = teachers.map(t => t.id === teacher.id ? { ...t, status } : t);
        await addOrUpdateTeachers(updatedTeachers);
        setTeachers(updatedTeachers);
        setTeacherActionMenu(null);
        onShowSystemMessage(`Estado de ${teacher.name} actualizado a "${status}".`);
    };
    
    const handleDeleteTeacher = (teacher: Teacher) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar a ${teacher.name}? Esta acción no se puede deshacer.`)) {
            const updatedTeachers = teachers.filter(t => t.id !== teacher.id);
            addOrUpdateTeachers(updatedTeachers).then(() => {
                setTeachers(updatedTeachers);
                onShowSystemMessage(`${teacher.name} ha sido eliminado.`);
            });
        }
        setTeacherActionMenu(null);
    };

    const getStatusBadge = (status?: TeacherStatus) => {
        if (!status || status === TeacherStatus.ACTIVE) return null;
        const baseClasses = "text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full";
        let colorClasses = "";
        switch(status) {
            case TeacherStatus.RETIRED:
                colorClasses = "bg-gray-200 text-gray-800";
                break;
            case TeacherStatus.ON_COMMISSION:
                colorClasses = "bg-blue-200 text-blue-800";
                break;
        }
        return <span className={`${baseClasses} ${colorClasses}`}>{status}</span>
    }
    
    // --- Student Management Functions ---
    const handleImportStudents = async (
        newStudentsFromModal: { name: string; id: string }[],
        grade: string,
        group: string,
        homeroomTeacherId?: string
    ) => {
        const existingStudentIds = new Set(students.map(s => s.documentNumber));
        const newStudents: Student[] = [];
        let skippedCount = 0;
    
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
                documentType: s.id ? DocumentType.TARJETA_IDENTIDAD : undefined,
            });
        });
    
        if (skippedCount > 0) {
            onShowSystemMessage(`${skippedCount} estudiante(s) omitido(s) por tener un documento ya existente o inválido.`, 'error');
        }
    
        if (newStudents.length > 0) {
            const updatedStudentList = [...students, ...newStudents];
            await addOrUpdateStudents(updatedStudentList);
            setStudents(updatedStudentList.sort((a, b) => a.name.localeCompare(b.name)));
            onShowSystemMessage(`${newStudents.length} estudiantes importados a ${grade}-${group}. Todos los módulos actualizados.`);
        }
    
        if (homeroomTeacherId) {
            let teacherName = '';
            const updatedTeachers = teachers.map(t => {
                // Unassign any other teacher who might have been assigned to this group before
                if (t.assignedGroup?.grade === grade && t.assignedGroup?.group === group && t.id !== homeroomTeacherId) {
                     return { ...t, isHomeroomTeacher: false, assignedGroup: undefined };
                }
                // Assign the new teacher
                if (t.id === homeroomTeacherId) {
                    teacherName = t.name;
                    return { ...t, isHomeroomTeacher: true, assignedGroup: { grade, group } };
                }
                return t;
            });
            await addOrUpdateTeachers(updatedTeachers);
            setTeachers(updatedTeachers);
            if (teacherName) {
                onShowSystemMessage(`${teacherName} ha sido asignado como director de grupo.`);
            }
        }
    
        setIsImportStudentsModalOpen(false);
    };

    const handleOpenIncidentModal = (student: Student) => {
        setSelectedStudentForIncident(student);
        setIsIncidentModalOpen(true);
    };
    
    const handleSaveIncident = async (incident: Incident) => {
        await onUpdateIncidents('add', { ...incident, synced: isOnline });
        setIsIncidentModalOpen(false);
        setSelectedStudentForIncident(null);
        onShowSystemMessage("Incidencia guardada exitosamente.");
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
        onShowSystemMessage("Datos del estudiante actualizados en todos los módulos.");
    };
    
    const handleSaveNewStudent = async (newStudentData: { name: string; grade: string; group: string }) => {
        const newStudent: Student = {
            id: Date.now(),
            name: newStudentData.name,
            avatarUrl: `https://picsum.photos/seed/${Date.now()}/100/100`,
            grade: newStudentData.grade,
            group: newStudentData.group,
            role: Role.STUDENT,
        };
        const updatedStudents = [...students, newStudent];
        await addOrUpdateStudents(updatedStudents);
        setStudents(updatedStudents.sort((a, b) => a.name.localeCompare(b.name)));
        setIsAddStudentModalOpen(false);
        onShowSystemMessage(`${newStudent.name} ha sido añadido y todos los módulos se han actualizado.`);
    };

    const handleStudentGradeChange = (grade: string) => {
        setStudentGradeFilter(grade);
        setStudentGroupFilter('all');
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

    const handleSaveGuardians = async (newGuardians: Guardian[]) => {
        const guardianMap = new Map(guardians.map(g => [g.id, g]));
        newGuardians.forEach(g => {
            const existing = guardianMap.get(g.id);
            if (existing) {
                // Merge student IDs, avoiding duplicates
                const updatedStudentIds = Array.from(new Set([...existing.studentIds, ...g.studentIds]));
                guardianMap.set(g.id, { ...existing, ...g, studentIds: updatedStudentIds });
            } else {
                guardianMap.set(g.id, g);
            }
        });
        await onUpdateGuardians(Array.from(guardianMap.values()));
        onShowSystemMessage(`${newGuardians.length} acudiente(s) importados/actualizados.`);
        setIsImportGuardiansModalOpen(false);
    };

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
                            <div className="bg-gray-100 rounded-lg p-1 flex">
                                <button onClick={() => setIncidentView('active')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${incidentView === 'active' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:bg-gray-200'}`}>Activas</button>
                                <button onClick={() => setIncidentView('archived')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${incidentView === 'archived' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:bg-gray-200'}`}>Archivadas</button>
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
                        <select value={citationGradeFilter} onChange={e => handleCitationGradeChange(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                             <option value="all">Todos los Grados</option>
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="md:col-start-4">
                            <select value={citationGroupFilter} onChange={e => setCitationGroupFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                                <option value="all">Todos los Grupos</option>
                                {availableGroupsForCitations.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {displayedCitations.map(cit => (
                            <div key={cit.id} className={`p-4 border rounded-lg ${cit.status === CitationStatus.CANCELLED ? 'bg-gray-100' : 'bg-gray-50'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-primary">{cit.studentName}</p>
                                        <p className="text-sm text-gray-600">{cit.reason}</p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(cit.date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {cit.time} @ {cit.location}</p>
                                    </div>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCitationStatusClass(cit.status)}`}>
                                        {cit.status}
                                    </span>
                                </div>
                                {cit.status === CitationStatus.CANCELLED && cit.cancellationReason && (
                                    <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
                                        <p><strong className="font-semibold">Cancelada:</strong> {cit.cancellationReason}</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-end space-x-3 mt-2 pt-2 border-t">
                                    <button onClick={() => setEditingCitation(cit)} className="text-xs font-semibold text-blue-600 hover:underline">Editar</button>
                                    {[CitationStatus.PENDING, CitationStatus.CONFIRMED, CitationStatus.RESCHEDULE_REQUESTED].includes(cit.status) && (
                                        <button onClick={() => handleOpenCancelModal(cit)} className="text-xs font-semibold text-orange-600 hover:underline">Cancelar</button>
                                    )}
                                    <button onClick={() => handleDeleteCitation(cit.id)} className="text-xs font-semibold text-red-600 hover:underline">Eliminar</button>
                                </div>
                            </div>
                        ))}
                        {displayedCitations.length === 0 && <p className="text-center text-gray-500 py-8">No se encontraron citaciones.</p>}
                    </div>
                </div>
            </div>

             <div className={activeTab === 'comunicados' ? '' : 'hidden'}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-lg font-bold mb-4">Nuevo Comunicado</h3>
                        <form onSubmit={handleSendAnnouncement} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Destinatarios</label>
                                <select value={announcementRecipient} onChange={e => setAnnouncementRecipient(e.target.value as any)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                                    <option value="all_teachers">Todos los Docentes</option>
                                    <option value="all_parents">Todos los Acudientes</option>
                                    <option value="all_students">Todos los Estudiantes</option>
                                    <option value="group">Grupo Específico (Estudiantes y Acudientes)</option>
                                </select>
                            </div>
                            {announcementRecipient === 'group' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <select value={announcementGrade} onChange={e => setAnnouncementGrade(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                    <select value={announcementGroup} onChange={e => setAnnouncementGroup(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                                        {(GRADE_GROUP_MAP[announcementGrade] || []).map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input type="text" value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido del Mensaje</label>
                                <textarea rows={8} value={announcementContent} onChange={e => setAnnouncementContent(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900" required></textarea>
                            </div>
                            <button type="submit" className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">Enviar Comunicado</button>
                        </form>
                    </div>
                    <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-lg font-bold mb-4">Historial de Comunicados Enviados</h3>
                        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                            {sentAnnouncements.length > 0 ? sentAnnouncements.map(ann => (
                                <div key={ann.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-primary">{ann.title}</h4>
                                        <span className="text-xs text-gray-500">{new Date(ann.timestamp).toLocaleDateString('es-CO')}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{ann.content}</p>
                                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                                        <strong>Enviado por:</strong> {ann.sentBy}
                                    </p>
                                </div>
                            )) : (
                                <p className="text-center text-gray-500 py-8">No se han enviado comunicados.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={activeTab === 'community_management' ? '' : 'hidden'}>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Community Tabs">
                            <button
                                onClick={() => setActiveCommunityTab('teachers')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeCommunityTab === 'teachers' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                Gestión de Docentes
                            </button>
                            <button
                                onClick={() => setActiveCommunityTab('students')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeCommunityTab === 'students' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                Gestión de Estudiantes
                            </button>
                            <button
                                onClick={() => setActiveCommunityTab('parents')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeCommunityTab === 'parents' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                Gestión de Acudientes
                            </button>
                        </nav>
                    </div>

                    <div className={activeCommunityTab === 'teachers' ? '' : 'hidden'}>
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                            <h2 className="text-xl font-bold text-gray-800">Docentes ({teachers.length})</h2>
                            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                                <input
                                    type="text"
                                    placeholder="Buscar docente..."
                                    value={teacherSearch}
                                    onChange={e => setTeacherSearch(e.target.value)}
                                    className="w-full sm:w-auto p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500"
                                />
                                <button
                                    onClick={() => setIsImportTeachersModalOpen(true)}
                                    className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors flex items-center space-x-2 flex-shrink-0"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    <span className="hidden sm:inline">Importar Docentes</span>
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                            {filteredTeachers.length > 0 ? (
                                filteredTeachers.map(teacher => (
                                    <div key={teacher.id} className="bg-gray-50 rounded-lg shadow p-4 flex items-center space-x-4">
                                        <img src={teacher.avatarUrl} alt={teacher.name} className="w-16 h-16 rounded-full object-cover"/>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-bold text-gray-800">{teacher.name}</p>
                                                {getStatusBadge(teacher.status)}
                                            </div>
                                            <p className="text-sm text-gray-500">{teacher.subject}</p>
                                            {teacher.isHomeroomTeacher && <p className="text-xs text-primary mt-1">Director de Grupo: {teacher.assignedGroup?.grade}-{teacher.assignedGroup?.group}</p>}
                                        </div>
                                        <div className="relative" ref={teacher.id === teacherActionMenu ? teacherMenuRef : null}>
                                            <button onClick={() => setTeacherActionMenu(prev => (prev === teacher.id ? null : teacher.id))} className="p-2 rounded-full text-gray-500 hover:bg-gray-200">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                            </button>
                                            {teacherActionMenu === teacher.id && (
                                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 border animate-fade-in" style={{ animationDuration: '150ms' }}>
                                                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                                        <a href="#" onClick={(e) => { e.preventDefault(); setEditingTeacher(teacher); setTeacherActionMenu(null); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Editar</a>
                                                        {(!teacher.status || teacher.status === TeacherStatus.ACTIVE) && <>
                                                            <a href="#" onClick={(e) => { e.preventDefault(); handleTeacherStatusChange(teacher, TeacherStatus.RETIRED); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Marcar como Pensionado</a>
                                                            <a href="#" onClick={(e) => { e.preventDefault(); handleTeacherStatusChange(teacher, TeacherStatus.ON_COMMISSION); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Marcar en Comisión</a>
                                                        </>}
                                                        {(teacher.status === TeacherStatus.RETIRED || teacher.status === TeacherStatus.ON_COMMISSION) &&
                                                            <a href="#" onClick={(e) => { e.preventDefault(); handleTeacherStatusChange(teacher, TeacherStatus.ACTIVE); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Reactivar Docente</a>
                                                        }
                                                        <div className="border-t my-1"></div>
                                                        <a href="#" onClick={(e) => { e.preventDefault(); handleDeleteTeacher(teacher); }} className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50">Eliminar Docente</a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-8">No se encontraron docentes.</p>
                            )}
                        </div>
                    </div>
                    <div className={activeCommunityTab === 'students' ? '' : 'hidden'}>
                         <StudentList
                            students={filteredStudentsForList}
                            onImportClick={() => setIsImportStudentsModalOpen(true)}
                            onAddStudentClick={() => setIsAddStudentModalOpen(true)}
                            onReportIncident={handleOpenIncidentModal}
                            onEditStudent={handleOpenEditStudentModal}
                            grades={['all', ...GRADES]}
                            selectedGrade={studentGradeFilter}
                            onGradeChange={handleStudentGradeChange}
                            groups={availableGroupsForStudentMgmt}
                            selectedGroup={studentGroupFilter}
                            onGroupChange={setStudentGroupFilter}
                        />
                    </div>
                    <div className={activeCommunityTab === 'parents' ? '' : 'hidden'}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Gestión de Acudientes ({guardians.length})</h3>
                            <button onClick={() => setIsImportGuardiansModalOpen(true)} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                <span>Importar y Vincular</span>
                            </button>
                        </div>
                         <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                            {guardians.map(guardian => {
                                const linkedStudents = guardian.studentIds.map(id => studentMap.get(id)?.name).filter(Boolean);
                                return (
                                    <div key={guardian.id} className="bg-gray-50 rounded-lg p-4">
                                        <p className="font-bold">{guardian.name}</p>
                                        <p className="text-sm text-gray-600">ID: {guardian.id} | Tel: {guardian.phone || 'N/A'}</p>
                                        <p className="text-sm text-gray-600">Estudiantes: <span className="font-medium text-primary">{linkedStudents.join(', ') || 'Ninguno vinculado'}</span></p>
                                    </div>
                                )
                            })}
                             {guardians.length === 0 && <p className="text-center text-gray-500 py-8">No hay acudientes registrados.</p>}
                        </div>
                    </div>
                </div>
            </div>

             <div className={activeTab === 'calificaciones' ? '' : 'hidden'}>
                 <Calificaciones
                    students={students}
                    teachers={teachers}
                    subjectGradesData={subjectGradesData}
                    setSubjectGradesData={setSubjectGradesData}
                    currentUser={currentUser}
                />
            </div>

            {/* Modals */}
            {isCitationModalOpen && <CitationModal students={filteredStudentsForList} onClose={() => setIsCitationModalOpen(false)} onSave={handleSaveCitations} currentUser={currentUser} />}
            {isCancelModalOpen && citationToCancel && <CancelCitationModal onClose={() => setIsCancelModalOpen(false)} onConfirm={handleConfirmCancelCitation} />}
            {editingCitation && <EditCitationModal citation={editingCitation} onClose={() => setEditingCitation(null)} onSave={handleSaveEditedCitation} />}
            {isImportTeachersModalOpen && <ImportTeachersModal onClose={() => setIsImportTeachersModalOpen(false)} onSave={handleSaveTeachers} />}
            {editingTeacher && <EditTeacherModal teacher={editingTeacher} onClose={() => setEditingTeacher(null)} onSave={handleSaveTeacherEdit} />}
            {isImportStudentsModalOpen && <ImportStudentsModal teachers={teachers} onClose={() => setIsImportStudentsModalOpen(false)} onSave={handleImportStudents} />}
            {isAddStudentModalOpen && <AddStudentModal onClose={() => setIsAddStudentModalOpen(false)} onSave={handleSaveNewStudent} />}
            {isIncidentModalOpen && <IncidentModal student={selectedStudentForIncident} students={students} onClose={() => { setIsIncidentModalOpen(false); setSelectedStudentForIncident(null); }} onSave={handleSaveIncident} reporterName={currentUser.name} />}
            {isEditStudentModalOpen && studentToEdit && <EditStudentModal student={studentToEdit} onClose={() => setIsEditStudentModalOpen(false)} onSave={handleSaveStudentEdit} />}
            {isImportGuardiansModalOpen && <ImportGuardiansModal students={students} onClose={() => setIsImportGuardiansModalOpen(false)} onSave={handleSaveGuardians} />}
        </div>
    );
};

export default Incidents;
