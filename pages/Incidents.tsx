


import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Incident, Student, AttendanceRecord, Citation, Announcement, Teacher, SubjectGrades, Guardian, AttentionReport } from '../types';
import { IncidentType, AttendanceStatus, CitationStatus, Role, DocumentType, TeacherStatus, IncidentStatus } from '../types';
import { addOrUpdateTeachers, addOrUpdateStudents, getTeachers, addOrUpdateGuardians } from '../db';
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
import AddTeacherModal from '../components/AddTeacherModal';
import AddGuardianModal from '../components/AddGuardianModal';
import AttentionReportModal from '../components/AttentionReportModal';


type EnrichedAttendanceRecord = AttendanceRecord & { student: Student };

// --- Helper Functions for Downloading ---

const generateIncidentsCSV = (incidentsToExport: Incident[]): string => {
    const headers = ['ID', 'Estudiante', 'Docente que Reporta', 'Lugar', 'Tipo', 'Descripción', 'Fecha', 'Estado'];
    const rows = incidentsToExport.map(inc => [
        inc.id,
        `"${inc.studentName.replace(/"/g, '""')}"`,
        `"${inc.teacherName.replace(/"/g, '""')}"`,
        `"${inc.location.replace(/"/g, '""')}"`,
        `"${inc.type}"`,
        `"${inc.notes.replace(/"/g, '""')}"`,
        `"${new Date(inc.timestamp).toLocaleString()}"`,
        inc.status
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
            <td>${inc.status}</td>
            <td>${new Date(inc.timestamp).toLocaleString('es-CO')}</td>
            <td class="notes">${inc.notes}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#333;margin:20px}h1{color:#005A9C;border-bottom:2px solid #005A9C;padding-bottom:10px;font-size:24px}p{font-size:12px;color:#555}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#f2f2f2;color:#333;font-weight:bold}tr:nth-child(even){background-color:#f9f9f9}.notes{white-space:pre-wrap;word-break:break-word}@media print{.no-print{display:none}}</style></head><body><p class="no-print" style="background-color:#fffae6;border:1px solid #ffecb3;padding:15px;border-radius:5px;"><strong>Instrucción:</strong> Para guardar como PDF, use la función de Imprimir de su navegador (Ctrl+P o Cmd+P) y seleccione "Guardar como PDF" como destino.</p><h1>${title}</h1><p>Generado el: ${new Date().toLocaleString('es-CO')}</p><table><thead><tr><th>Estudiante</th><th>Reportado por</th><th>Lugar</th><th>Tipo</th><th>Estado</th><th>Fecha</th><th style="width:40%">Descripción</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
};

const generateAttendanceCSV = (records: EnrichedAttendanceRecord[]): string => {
    const headers = ['Fecha', 'Estudiante', 'Grado', 'Grupo', 'Estado'];
    const rows = records.map(rec => [
        rec.date,
        `"${rec.student.name.replace(/"/g, '""')}"`,
        rec.student.grade,
        rec.student.group,
        rec.status
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
             <td style="font-weight:bold; color:${
                rec.status === AttendanceStatus.ABSENT ? '#B91C1C' :
                rec.status === AttendanceStatus.TARDY ? '#B93600' :
                rec.status === AttendanceStatus.EXCUSED ? '#1A43B8' :
                rec.status === AttendanceStatus.SPECIAL_PERMIT ? '#5C2DAA' : '#333'
            };">${rec.status}</td>
        </tr>
    `).join('');
    return `
        <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#333;margin:20px}h1{color:#005A9C;border-bottom:2px solid #005A9C;padding-bottom:10px;font-size:24px}p{font-size:12px;color:#555}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#f2f2f2;color:#333;font-weight:bold}tr:nth-child(even){background-color:#f9f9f9}@media print{.no-print{display:none}}</style></head><body><p class="no-print" style="background-color:#fffae6;border:1px solid #ffecb3;padding:15px;border-radius:5px;"><strong>Instrucción:</strong> Para guardar como PDF, use la función de Imprimir de su navegador (Ctrl+P o Cmd+P) y seleccione "Guardar como PDF" como destino.</p><h1>${title}</h1><p>Generado el: ${new Date().toLocaleString('es-CO')}</p><table><thead><tr><th>Fecha</th><th>Estudiante</th><th>Grado</th><th>Grupo</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
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
    onReportAttention: (report: AttentionReport) => void;
}

const getAttendanceStatusTextColor = (status: AttendanceStatus): string => {
    switch (status) {
        case AttendanceStatus.PRESENT: return 'text-green-600 dark:text-green-400';
        case AttendanceStatus.ABSENT: return 'text-red-600 dark:text-red-400';
        case AttendanceStatus.TARDY: return 'text-yellow-600 dark:text-yellow-400';
        case AttendanceStatus.EXCUSED: return 'text-blue-600 dark:text-blue-400';
        case AttendanceStatus.SPECIAL_PERMIT: return 'text-purple-600 dark:text-purple-400';
        default: return 'text-gray-800 dark:text-gray-200';
    }
};

const getCitationStatusClass = (status: CitationStatus) => {
    switch (status) {
        case CitationStatus.CONFIRMED: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
        case CitationStatus.PENDING: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
        case CitationStatus.COMPLETED: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
        case CitationStatus.CANCELLED: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
        case CitationStatus.RESCHEDULE_REQUESTED: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
};

const getStatusClassForIncident = (status: IncidentStatus) => {
    switch (status) {
        case IncidentStatus.ACTIVE: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
        case IncidentStatus.ATTENDED: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
        case IncidentStatus.ARCHIVED: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
        case IncidentStatus.DECLINED: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
};


const Incidents: React.FC<IncidentsProps> = ({
    isOnline,
    students,
    setStudents,
    teachers,
    setTeachers,
    currentUser,
    subjectGradesData,
    setSubjectGradesData,
    allAttendanceRecords,
    citations,
    onUpdateCitations,
    incidents,
    onUpdateIncidents,
    announcements,
    onUpdateAnnouncements,
    guardians,
    onUpdateGuardians,
    onShowSystemMessage,
    onReportAttention,
}) => {
    const [activeTab, setActiveTab] = useState<CoordinationTab>('incidents');
    const [communitySubTab, setCommunitySubTab] = useState<CommunitySubTab>('students');
    const [communityGradeFilter, setCommunityGradeFilter] = useState('all');
    const [communityGroupFilter, setCommunityGroupFilter] = useState('all');

    // Modals state
    const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isEditCitationModalOpen, setIsEditCitationModalOpen] = useState(false);
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
    const [isImportTeachersModalOpen, setIsImportTeachersModalOpen] = useState(false);
    const [isEditTeacherModalOpen, setIsEditTeacherModalOpen] = useState(false);
    const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
    const [isImportStudentsModalOpen, setIsImportStudentsModalOpen] = useState(false);
    const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isImportGuardiansModalOpen, setIsImportGuardiansModalOpen] = useState(false);
    const [isAddGuardianModalOpen, setIsAddGuardianModalOpen] = useState(false);
    const [isAttentionReportModalOpen, setIsAttentionReportModalOpen] = useState(false);


    // Data for modals
    const [citationToCancel, setCitationToCancel] = useState<Citation | null>(null);
    const [citationToEdit, setCitationToEdit] = useState<Citation | null>(null);
    const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [studentForIncident, setStudentForIncident] = useState<Student | null>(null);
    const [studentForAttentionReport, setStudentForAttentionReport] = useState<Student | null>(null);
    
    // Filters for incidents
    const [incidentViewMode, setIncidentViewMode] = useState<'list' | 'byTeacher'>('list');
    const [incidentSearch, setIncidentSearch] = useState('');
    const [incidentDateFilter, setIncidentDateFilter] = useState('');
    const [incidentTypeFilter, setIncidentTypeFilter] = useState('all');
    const [incidentStatusFilter, setIncidentStatusFilter] = useState<IncidentStatus | 'all'>('all');
    const [incidentReporterFilter, setIncidentReporterFilter] = useState('all');
    const [openTeacherAccordion, setOpenTeacherAccordion] = useState<string | null>(null);

    // Filters for attendance
    const [attendanceDateFilter, setAttendanceDateFilter] = useState('');
    const [attendanceGradeFilter, setAttendanceGradeFilter] = useState('all');
    const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('all');
    
    // Communication tab state
    const [commTitle, setCommTitle] = useState('');
    const [commContent, setCommContent] = useState('');
    const [commRecipients, setCommRecipients] = useState<'all' | 'all_teachers' | 'all_parents'>('all');

    const communityAvailableGroups = useMemo(() => {
        if (communityGradeFilter === 'all') {
            return ['all', ...GROUPS];
        }
        return ['all', ...(GRADE_GROUP_MAP[communityGradeFilter] || [])];
    }, [communityGradeFilter]);

    const filteredCommunityStudents = useMemo(() => {
        return students.filter(s => {
            const gradeMatch = communityGradeFilter === 'all' || s.grade === communityGradeFilter;
            const groupMatch = communityGroupFilter === 'all' || s.group === communityGroupFilter;
            return gradeMatch && groupMatch;
        });
    }, [students, communityGradeFilter, communityGroupFilter]);

    const sentHistory = useMemo(() => {
        return announcements.filter(ann => ann.sentBy === currentUser.name || ann.sentBy === 'Rectoría' || ann.sentBy === 'Coordinación')
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [announcements, currentUser.name]);

    const reporters = useMemo(() => Array.from(new Set(incidents.map(inc => inc.teacherName))).sort(), [incidents]);


    const handleSaveIncident = async (incidentData: Incident) => {
        await onUpdateIncidents('add', incidentData);
        onShowSystemMessage("Incidencia reportada exitosamente.");
        setIsIncidentModalOpen(false);
        setStudentForIncident(null);
    };

    const handleUpdateIncidentStatus = async (incidentId: string, status: IncidentStatus) => {
        const incident = incidents.find(i => i.id === incidentId);
        if (incident) {
            await onUpdateIncidents('update', { ...incident, status });
            onShowSystemMessage(`Incidencia marcada como ${status}.`);
        }
    };

    const handleSaveCitations = (newCitations: Citation[]) => {
        onUpdateCitations(prev => [...newCitations, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        onShowSystemMessage(`${newCitations.length} citacion(es) creada(s) exitosamente.`);
        setIsCitationModalOpen(false);
    };
    
    const handleSaveEditedCitation = (updatedCitation: Citation) => {
        onUpdateCitations(prev => prev.map(c => {
            if (c.id === updatedCitation.id) {
                // If the citation was a reschedule request, reset its status to pending so the parent can confirm again.
                if (citationToEdit?.status === CitationStatus.RESCHEDULE_REQUESTED) {
                    return { ...updatedCitation, status: CitationStatus.PENDING };
                }
                return updatedCitation;
            }
            return c;
        }));
        onShowSystemMessage('Citación actualizada.');
        setIsEditCitationModalOpen(false);
        setCitationToEdit(null);
    };

    const handleConfirmCancelCitation = (reason: string) => {
        if (!citationToCancel) return;
        onUpdateCitations(prev => prev.map(c => c.id === citationToCancel.id ? { ...c, status: CitationStatus.CANCELLED, cancellationReason: reason } : c));
        onShowSystemMessage('Citación cancelada.');
        setIsCancelModalOpen(false);
        setCitationToCancel(null);
    };
    
    const handleSendAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        const newAnnouncement: Announcement = {
            id: `ann_coord_${Date.now()}`,
            title: commTitle,
            content: commContent,
            recipients: commRecipients,
            timestamp: new Date().toISOString(),
            sentBy: currentUser.name,
        };
        await onUpdateAnnouncements(newAnnouncement);
        onShowSystemMessage("Comunicado enviado exitosamente.");
        setCommTitle('');
        setCommContent('');
    };

    const handleImportTeachers = async (newTeachers: Teacher[]) => {
        const updatedTeachers = [...teachers];
        const teacherMap = new Map(teachers.map(t => [t.id, t]));
        newTeachers.forEach(t => {
            if(!teacherMap.has(t.id)) {
                updatedTeachers.push({
                    ...t,
                    role: Role.TEACHER,
                    password: t.id,
                    passwordChanged: false
                });
            }
        });
        await addOrUpdateTeachers(updatedTeachers);
        setTeachers(updatedTeachers.sort((a,b) => a.name.localeCompare(b.name)));
        onShowSystemMessage(`${newTeachers.length} docentes importados exitosamente.`);
        setIsImportTeachersModalOpen(false);
    };
    
    const handleSaveTeacher = async (teacher: Teacher) => {
        const updatedTeachers = teachers.map(t => t.id === teacher.id ? teacher : t);
        await addOrUpdateTeachers(updatedTeachers);
        setTeachers(updatedTeachers);
        onShowSystemMessage(`Datos de ${teacher.name} actualizados.`);
        setIsEditTeacherModalOpen(false);
        setTeacherToEdit(null);
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
        setStudents(updatedStudents.sort((a,b) => a.name.localeCompare(b.name)));
        setIsAddStudentModalOpen(false);
        onShowSystemMessage(`${newStudent.name} ha sido añadido exitosamente.`, 'success');
    };

    const handleSaveEditedStudent = async (student: Student) => {
        const updatedStudents = students.map(s => s.id === student.id ? student : s);
        await addOrUpdateStudents(updatedStudents);
        setStudents(updatedStudents);
        onShowSystemMessage(`Datos de ${student.name} actualizados.`);
        setIsEditStudentModalOpen(false);
        setStudentToEdit(null);
    };
    
    const handleImportStudents = async (newStudentsData: { name: string; id: string }[], grade: string, group: string) => {
        const newStudents: Student[] = newStudentsData.map((s, i) => ({
            id: parseInt(s.id, 10) || Date.now() + i,
            name: s.name,
            avatarUrl: `https://picsum.photos/seed/${s.id}/100/100`,
            grade,
            group,
            role: Role.STUDENT
        }));
        const updatedStudents = [...students, ...newStudents];
        await addOrUpdateStudents(updatedStudents);
        setStudents(updatedStudents.sort((a,b) => a.name.localeCompare(b.name)));
        onShowSystemMessage(`${newStudents.length} estudiantes importados a ${grade}-${group}.`);
        setIsImportStudentsModalOpen(false);
    };
    
     const handleSaveNewTeacher = async (teacherData: Omit<Teacher, 'avatarUrl' | 'role' | 'passwordChanged' | 'password'>) => {
        const newTeacher: Teacher = {
            ...teacherData,
            avatarUrl: `https://picsum.photos/seed/${teacherData.id}/100/100`,
            role: Role.TEACHER,
            password: teacherData.id,
            passwordChanged: false
        };
        const updatedTeachers = [...teachers, newTeacher];
        await addOrUpdateTeachers(updatedTeachers);
        setTeachers(updatedTeachers.sort((a,b) => a.name.localeCompare(b.name)));
        onShowSystemMessage(`${newTeacher.name} ha sido añadido como docente.`);
        setIsAddTeacherModalOpen(false);
    };

    const handleSaveNewGuardian = async (guardianData: { id: string; name: string; email: string; phone: string }) => {
        const newGuardian: Guardian = {
            ...guardianData,
            avatarUrl: `https://picsum.photos/seed/${guardianData.id}/100/100`,
            role: Role.GUARDIAN,
            studentIds: [],
            password: guardianData.id,
            passwordChanged: false,
        };
        const updatedGuardians = [...guardians, newGuardian];
        await onUpdateGuardians(updatedGuardians);
        onShowSystemMessage(`${newGuardian.name} ha sido añadido como acudiente.`);
        setIsAddGuardianModalOpen(false);
    };
    
    const handleImportGuardians = async (newGuardians: Guardian[]) => {
        const updatedGuardians = [...guardians, ...newGuardians];
        await onUpdateGuardians(updatedGuardians);
        onShowSystemMessage(`${newGuardians.length} acudientes importados exitosamente.`);
        setIsImportGuardiansModalOpen(false);
    };


    const filteredIncidents = useMemo(() => {
        return incidents.filter(inc => {
            const searchLower = incidentSearch.toLowerCase();
            const matchesSearch = incidentSearch.trim() === '' ||
                inc.studentName.toLowerCase().includes(searchLower) || 
                inc.teacherName.toLowerCase().includes(searchLower) ||
                inc.notes.toLowerCase().includes(searchLower);

            const matchesDate = !incidentDateFilter || inc.timestamp.startsWith(incidentDateFilter);
            const matchesType = incidentTypeFilter === 'all' || inc.type === incidentTypeFilter;
            const matchesStatus = incidentStatusFilter === 'all' || inc.status === incidentStatusFilter;
            const matchesReporter = incidentReporterFilter === 'all' || inc.teacherName === incidentReporterFilter;

            return matchesSearch && matchesDate && matchesType && matchesStatus && matchesReporter;
        }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [incidents, incidentSearch, incidentDateFilter, incidentTypeFilter, incidentStatusFilter, incidentReporterFilter]);

    const incidentsByTeacher = useMemo(() => {
        return incidents.reduce((acc, incident) => {
            const teacherName = incident.teacherName;
            if (!acc[teacherName]) {
                acc[teacherName] = [];
            }
            acc[teacherName].push(incident);
            return acc;
        }, {} as Record<string, Incident[]>);
    }, [incidents]);

    const filteredTeachersWithIncidents = useMemo(() => {
        return Object.keys(incidentsByTeacher).filter(name =>
            name.toLowerCase().includes(incidentSearch.toLowerCase())
        ).sort();
    }, [incidentsByTeacher, incidentSearch]);

    const enrichedAttendanceRecords = useMemo(() => {
        const studentMap = new Map(students.map(s => [s.id, s]));
        return allAttendanceRecords
            .map(rec => ({ ...rec, student: studentMap.get(rec.studentId)! }))
            .filter(rec => rec.student); // Filter out records for students not found
    }, [allAttendanceRecords, students]);

    const filteredAttendance = useMemo(() => {
        return enrichedAttendanceRecords.filter(rec => 
            (attendanceDateFilter ? rec.date === attendanceDateFilter : true) &&
            (attendanceGradeFilter === 'all' || rec.student.grade === attendanceGradeFilter) &&
            (attendanceStatusFilter === 'all' || rec.status === attendanceStatusFilter)
        ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [enrichedAttendanceRecords, attendanceDateFilter, attendanceGradeFilter, attendanceStatusFilter]);


    const handleDownloadIncidents = (format: 'csv' | 'pdf') => {
        const filename = `Reporte_Incidencias_${new Date().toISOString().split('T')[0]}`;
        if (format === 'csv') {
            const csvContent = generateIncidentsCSV(filteredIncidents);
            downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
        } else {
            const title = "Reporte de Incidencias Institucionales";
            const htmlContent = generateIncidentsPDFHTML(title, filteredIncidents);
            const pdfWindow = window.open("", "_blank");
            pdfWindow?.document.write(htmlContent);
            pdfWindow?.document.close();
        }
    };
    
    const handleDownloadAttendance = (format: 'csv' | 'pdf') => {
        const filename = `Reporte_Asistencia_${new Date().toISOString().split('T')[0]}`;
        if(format === 'csv') {
            const csvContent = generateAttendanceCSV(filteredAttendance);
            downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
        } else {
            const title = "Reporte de Asistencia Institucional";
            const htmlContent = generateAttendancePDFHTML(title, filteredAttendance);
            const pdfWindow = window.open("", "_blank");
            pdfWindow?.document.write(htmlContent);
            pdfWindow?.document.close();
        }
    };
    
    const IncidentCard: React.FC<{ inc: Incident }> = ({ inc }) => (
        <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-gray-800 dark:text-gray-100">{inc.studentName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Reportado por: {inc.teacherName}</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-primary dark:text-secondary">{inc.type}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(inc.timestamp).toLocaleString()}</p>
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 p-2 bg-white dark:bg-gray-800 rounded-md">{inc.notes}</p>
            <div className="flex justify-end items-center gap-2 mt-3 text-sm">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusClassForIncident(inc.status)}`}>{inc.status}</span>

                {inc.status === IncidentStatus.ACTIVE && (
                    <>
                        <button onClick={() => handleUpdateIncidentStatus(inc.id, IncidentStatus.ATTENDED)} className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200">Marcar como Atendida</button>
                        <button onClick={() => handleUpdateIncidentStatus(inc.id, IncidentStatus.ARCHIVED)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Archivar</button>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`capitalize whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
             {/* All Modals */}
            {isCitationModalOpen && <CitationModal students={students} onClose={() => setIsCitationModalOpen(false)} onSave={handleSaveCitations} currentUser={currentUser} />}
            {isCancelModalOpen && citationToCancel && <CancelCitationModal onClose={() => setIsCancelModalOpen(false)} onConfirm={handleConfirmCancelCitation} />}
            {isEditCitationModalOpen && citationToEdit && <EditCitationModal citation={citationToEdit} onClose={() => setIsEditCitationModalOpen(false)} onSave={handleSaveEditedCitation} />}
            {isIncidentModalOpen && <IncidentModal student={studentForIncident} students={students} onClose={() => { setIsIncidentModalOpen(false); setStudentForIncident(null); }} onSave={handleSaveIncident} reporter={currentUser} />}
            
            {isImportTeachersModalOpen && <ImportTeachersModal onClose={() => setIsImportTeachersModalOpen(false)} onSave={handleImportTeachers} />}
            {isEditTeacherModalOpen && teacherToEdit && <EditTeacherModal teacher={teacherToEdit} onClose={() => setIsEditTeacherModalOpen(false)} onSave={handleSaveTeacher} />}
            {isAddTeacherModalOpen && <AddTeacherModal onClose={() => setIsAddTeacherModalOpen(false)} onSave={handleSaveNewTeacher} />}
            
            {isImportStudentsModalOpen && <ImportStudentsModal teachers={teachers} onClose={() => setIsImportStudentsModalOpen(false)} onSave={handleImportStudents} />}
            {isEditStudentModalOpen && studentToEdit && <EditStudentModal student={studentToEdit} onClose={() => setIsEditStudentModalOpen(false)} onSave={handleSaveEditedStudent} />}
            {isAddStudentModalOpen && <AddStudentModal onClose={() => setIsAddStudentModalOpen(false)} onSave={handleSaveNewStudent} />}

            {isImportGuardiansModalOpen && <ImportGuardiansModal students={students} onClose={() => setIsImportGuardiansModalOpen(false)} onSave={handleImportGuardians} />}
            {isAddGuardianModalOpen && <AddGuardianModal onClose={() => setIsAddGuardianModalOpen(false)} onSave={handleSaveNewGuardian} />}

            {isAttentionReportModalOpen && studentForAttentionReport && (
                <AttentionReportModal
                    student={studentForAttentionReport}
                    reporter={currentUser}
                    onClose={() => {
                        setIsAttentionReportModalOpen(false);
                        setStudentForAttentionReport(null);
                    }}
                    onSave={(report) => {
                        onReportAttention(report);
                        setIsAttentionReportModalOpen(false);
                        setStudentForAttentionReport(null);
                    }}
                />
            )}


            {activeTab === 'incidents' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                            <button onClick={() => setIncidentViewMode('list')} className={`px-4 py-1 text-sm font-semibold rounded-md ${incidentViewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Lista General</button>
                            <button onClick={() => setIncidentViewMode('byTeacher')} className={`px-4 py-1 text-sm font-semibold rounded-md ${incidentViewMode === 'byTeacher' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Por Docente</button>
                        </div>
                         <div className="flex justify-end gap-2">
                            <button onClick={() => handleDownloadIncidents('csv')} className="text-sm bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200">Exportar a CSV</button>
                            <button onClick={() => handleDownloadIncidents('pdf')} className="text-sm bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-lg hover:bg-red-200">Descargar PDF</button>
                        </div>
                    </div>
                    
                    {incidentViewMode === 'list' ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                <input type="text" placeholder="Buscar..." value={incidentSearch} onChange={e => setIncidentSearch(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 col-span-2 md:col-span-1" />
                                <input type="date" value={incidentDateFilter} onChange={e => setIncidentDateFilter(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                                <select value={incidentTypeFilter} onChange={e => setIncidentTypeFilter(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                    <option value="all">Todos los Tipos</option>
                                    {Object.values(IncidentType).map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                                <select value={incidentStatusFilter} onChange={e => setIncidentStatusFilter(e.target.value as any)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                    <option value="all">Todos los Estados</option>
                                    {Object.values(IncidentStatus).map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                                <select value={incidentReporterFilter} onChange={e => setIncidentReporterFilter(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                    <option value="all">Todos los Docentes</option>
                                    {reporters.map(name => <option key={name} value={name}>{name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                {filteredIncidents.map(inc => <IncidentCard key={inc.id} inc={inc} />)}
                                {filteredIncidents.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">No se encontraron incidencias.</p>}
                            </div>
                        </>
                    ) : (
                        <>
                             <input type="text" placeholder="Buscar por docente..." value={incidentSearch} onChange={e => setIncidentSearch(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 mb-4" />
                             <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                {filteredTeachersWithIncidents.map(teacherName => {
                                    const teacherIncidents = incidentsByTeacher[teacherName];
                                    const isOpen = openTeacherAccordion === teacherName;
                                    return (
                                        <div key={teacherName} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                            <button onClick={() => setOpenTeacherAccordion(isOpen ? null : teacherName)} className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{teacherName}</span>
                                                <div className="flex items-center gap-4">
                                                    <span className="bg-primary/10 text-primary dark:bg-secondary/20 dark:text-secondary text-xs font-semibold px-2 py-1 rounded-full">{teacherIncidents.length} incidencias</span>
                                                     <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </button>
                                            {isOpen && (
                                                <div className="p-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
                                                    {teacherIncidents.map(inc => <IncidentCard key={inc.id} inc={inc} />)}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {filteredTeachersWithIncidents.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">No se encontraron docentes con ese nombre.</p>}
                            </div>
                        </>
                    )}
                </div>
            )}
            
            {activeTab === 'attendance' && (
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <input type="date" value={attendanceDateFilter} onChange={e => setAttendanceDateFilter(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                        <select value={attendanceGradeFilter} onChange={e => setAttendanceGradeFilter(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                            <option value="all">Todos los Grados</option>
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                         <select value={attendanceStatusFilter} onChange={e => setAttendanceStatusFilter(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                            <option value="all">Todos los Estados</option>
                            {Object.values(AttendanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div className="flex justify-end gap-2 mb-4">
                        <button onClick={() => handleDownloadAttendance('csv')} className="text-sm bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200">Exportar a CSV</button>
                        <button onClick={() => handleDownloadAttendance('pdf')} className="text-sm bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-lg hover:bg-red-200">Descargar PDF</button>
                    </div>
                     <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                        {filteredAttendance.map(rec => (
                             <div key={rec.id} className="p-3 border dark:border-gray-700 rounded-lg flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-gray-100">{rec.student.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{rec.student.grade} - {rec.student.group}</p>
                                </div>
                                <div>
                                    <p className={`font-semibold ${getAttendanceStatusTextColor(rec.status)}`}>{rec.status}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 text-right">{rec.date}</p>
                                </div>
                            </div>
                        ))}
                         {filteredAttendance.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">No hay registros de asistencia para esta fecha/filtro.</p>}
                    </div>
                 </div>
            )}
            
            {activeTab === 'citations' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Citaciones Programadas</h3>
                        <button onClick={() => setIsCitationModalOpen(true)} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">Crear Citación</button>
                    </div>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {citations.map(cit => (
                            <div key={cit.id} className={`p-4 border dark:border-gray-700 rounded-lg ${cit.status === CitationStatus.RESCHEDULE_REQUESTED ? 'bg-purple-50 dark:bg-purple-900/50' : 'bg-gray-50 dark:bg-gray-900/50'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-gray-100">{cit.studentName}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{cit.reason}</p>
                                    </div>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCitationStatusClass(cit.status)}`}>{cit.status}</span>
                                </div>
                                <div className="flex justify-between items-end mt-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(cit.date+'T00:00:00').toLocaleDateString()} a las {cit.time}</p>
                                    <div className="space-x-2">
                                        {cit.status === CitationStatus.RESCHEDULE_REQUESTED ? (
                                            <button onClick={() => {setCitationToEdit(cit); setIsEditCitationModalOpen(true);}} className="text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-full">Reasignar Fecha</button>
                                        ) : (
                                            <button onClick={() => {setCitationToEdit(cit); setIsEditCitationModalOpen(true);}} className="text-xs font-semibold text-blue-600 hover:underline">Editar</button>
                                        )}
                                        <button onClick={() => {setCitationToCancel(cit); setIsCancelModalOpen(true);}} className="text-xs font-semibold text-red-600 hover:underline">Cancelar</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {citations.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">No hay citaciones programadas.</p>}
                    </div>
                </div>
            )}

            {activeTab === 'comunicados' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Enviar Comunicado</h3>
                        <form onSubmit={handleSendAnnouncement} className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destinatarios</label>
                                <select value={commRecipients} onChange={e => setCommRecipients(e.target.value as any)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                    <option value="all">Toda la Comunidad</option>
                                    <option value="all_teachers">Todos los Docentes</option>
                                    <option value="all_parents">Todos los Acudientes</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                                <input type="text" value={commTitle} onChange={e => setCommTitle(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenido</label>
                                <textarea rows={8} value={commContent} onChange={e => setCommContent(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" required></textarea>
                            </div>
                            <button type="submit" className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">Enviar</button>
                        </form>
                    </div>
                    <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Historial de Comunicados</h3>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                             {sentHistory.map(ann => (
                                <div key={ann.id} className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-primary dark:text-secondary">{ann.title}</h4>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(ann.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap">{ann.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'community_management' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                     <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                        <nav className="-mb-px flex space-x-6">
                            {(['students', 'teachers', 'parents'] as CommunitySubTab[]).map(tab => (
                                <button key={tab} onClick={() => setCommunitySubTab(tab)} className={`capitalize whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${communitySubTab === tab ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                    {tab === 'parents' ? 'Acudientes' : tab}
                                </button>
                            ))}
                        </nav>
                    </div>
                    {communitySubTab === 'students' && (
                         <StudentList 
                            students={filteredCommunityStudents}
                            onAddStudentClick={() => setIsAddStudentModalOpen(true)}
                            onImportClick={() => setIsImportStudentsModalOpen(true)}
                            onEditStudent={(student) => { setStudentToEdit(student); setIsEditStudentModalOpen(true); }}
                            onReportIncident={(student) => { setStudentForIncident(student); setIsIncidentModalOpen(true); }}
                            onReportAttention={(student) => { setStudentForAttentionReport(student); setIsAttentionReportModalOpen(true); }}
                            grades={['all', ...GRADES]}
                            selectedGrade={communityGradeFilter}
                            onGradeChange={(grade) => {
                                setCommunityGradeFilter(grade);
                                setCommunityGroupFilter('all');
                            }}
                            groups={communityAvailableGroups}
                            selectedGroup={communityGroupFilter}
                            onGroupChange={setCommunityGroupFilter}
                        />
                    )}
                    {communitySubTab === 'teachers' && (
                        <div>
                            <div className="flex justify-end gap-2 mb-4">
                                <button onClick={() => setIsAddTeacherModalOpen(true)} className="text-sm bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">Añadir Docente</button>
                                <button onClick={() => setIsImportTeachersModalOpen(true)} className="text-sm bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200">Importar Docentes</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                                {teachers.map(t => (
                                    <div key={t.id} className="p-3 border dark:border-gray-700 rounded-lg flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                                        <div className="flex items-center gap-3">
                                            <img src={t.avatarUrl} alt={t.name} className="w-10 h-10 rounded-full" />
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-100">{t.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{t.subject}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => { setTeacherToEdit(t); setIsEditTeacherModalOpen(true); }} className="text-xs font-semibold text-blue-600 hover:underline">Editar</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {communitySubTab === 'parents' && (
                         <div>
                            <div className="flex justify-end gap-2 mb-4">
                                <button onClick={() => setIsAddGuardianModalOpen(true)} className="text-sm bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">Añadir Acudiente</button>
                                <button onClick={() => setIsImportGuardiansModalOpen(true)} className="text-sm bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200">Importar Acudientes</button>
                            </div>
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                               {guardians.map(g => (
                                   <div key={g.id} className="p-3 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                       <p className="font-bold text-gray-800 dark:text-gray-100">{g.name}</p>
                                       <p className="text-sm text-gray-500 dark:text-gray-400">ID: {g.id} | Email: {g.email || 'N/A'}</p>
                                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Estudiantes a cargo: {g.studentIds.length}</p>
                                   </div>
                               ))}
                               {guardians.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">No hay acudientes registrados.</p>}
                           </div>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'calificaciones' && (
                 <Calificaciones 
                    students={students}
                    teachers={teachers}
                    subjectGradesData={subjectGradesData}
                    setSubjectGradesData={setSubjectGradesData}
                    currentUser={currentUser}
                    onShowSystemMessage={onShowSystemMessage}
                />
            )}
            
        </div>
    );
};

export default Incidents;