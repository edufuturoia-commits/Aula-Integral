import React from 'react';
import type { Page, Student, AssessmentData, Question, SubjectArea, Competency, Resource, StudentAssessmentResult, Citation, User, Announcement, Teacher, InstitutionProfileData, EventPoster, SubjectGrades, InboxConversation, DesempenoDescriptor, Guardian, Conversation, Certification, Experience, ProfessionalDevelopment } from './types';
import { ResourceType, CitationStatus, IncidentType, AttendanceStatus, DocumentType, Role, AcademicPeriod, TeacherStatus } from './types';

// --- ICONS ---

export const DashboardIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

export const ClassroomIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

export const AssessmentsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

export const GradesIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

export const ConsolidadoIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

export const TutorIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

export const PsychologyIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

export const SecretariaIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);


export const EventsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export const CommunicationIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

export const ResourcesIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
);

export const IncidentsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const ProfileIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export const SettingsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const ParentPortalIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

export const StudentPortalIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
);


export const RectoryIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

export const IcfesIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
);



export const LogoutIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

// --- SIDEBAR CONFIG ---
export const SIDEBAR_ITEMS: { name: Page; label: string; icon: React.FC<{className?: string}> }[] = [
    { name: 'Dashboard', label: 'Tablero Principal', icon: DashboardIcon },
    { name: 'Classroom', label: 'Mi Salón', icon: ClassroomIcon },
    { name: 'Incidents', label: 'Coordinación', icon: IncidentsIcon },
    { name: 'Psychology', label: 'Psicología', icon: PsychologyIcon },
    { name: 'Secretaria', label: 'Secretaría', icon: SecretariaIcon },
    { name: 'TutorMode', label: 'Tutor IA', icon: TutorIcon },
    { name: 'Communication', label: 'Comunicación', icon: CommunicationIcon },
    { name: 'Assessments', label: 'Evaluaciones', icon: AssessmentsIcon },
    { name: 'Calificaciones', label: 'Calificaciones', icon: GradesIcon },
    { name: 'Consolidado', label: 'Consolidados', icon: ConsolidadoIcon },
    { name: 'Resources', label: 'Biblioteca', icon: ResourcesIcon },
    { name: 'Eventos', label: 'Eventos', icon: EventsIcon },
    { name: 'Profile', label: 'Mi Perfil', icon: ProfileIcon },
    { name: 'Settings', label: 'Configuración', icon: SettingsIcon },
    { name: 'Rectory', label: 'Rectoría', icon: RectoryIcon },
    { name: 'InstitutionProfile', label: 'Perfil Institucional', icon: RectoryIcon }, // Re-using icon for now
    { name: 'ParentPortal', label: 'Portal Acudiente', icon: ParentPortalIcon },
    { name: 'StudentPortal', label: 'Portal Estudiante', icon: StudentPortalIcon },
    { name: 'SimulacroICFES', label: 'Simulacro ICFES', icon: IcfesIcon },
];

// --- MOCK DATA (to be replaced with DB calls) ---

export const MOCK_STUDENTS: Student[] = [
  { id: 1001, name: 'Ana Sofía Rodríguez', avatarUrl: `https://picsum.photos/seed/Ana/100/100`, grade: '7º', group: 'A', role: Role.STUDENT, lastIncident: 'Uso de celular', email: 'ana.s.r@email.com', dateOfBirth: '2008-05-15', documentType: DocumentType.IDENTITY_CARD, documentNumber: '1001234567', password: 'password123', passwordChanged: true },
  { id: 1002, name: 'Carlos Andrés Pérez', avatarUrl: `https://picsum.photos/seed/CarlosA/100/100`, grade: '7º', group: 'A', role: Role.STUDENT, lastIncident: 'Tardanza', email: 'carlos.a.p@email.com', dateOfBirth: '2008-03-20', documentType: DocumentType.IDENTITY_CARD, documentNumber: '1002345678', password: 'password123', passwordChanged: true },
  { id: 1101, name: 'Beatriz Elena Cano', avatarUrl: `https://picsum.photos/seed/Beatriz/100/100`, grade: '7º', group: 'B', role: Role.STUDENT, lastIncident: 'Falta académica', email: 'beatriz.e.c@email.com', dateOfBirth: '2007-11-10', documentType: DocumentType.IDENTITY_CARD, documentNumber: '1003456789', password: 'password123', passwordChanged: true },
];

export const MOCK_GUARDIANS: Guardian[] = [
  {
    id: '71717171',
    name: 'Marta Lucía Ramírez',
    avatarUrl: `https://picsum.photos/seed/Marta/100/100`,
    role: Role.GUARDIAN,
    email: 'marta.ramirez@email.com',
    phone: '3101234567',
    studentIds: [1001, 1002],
    password: 'password123',
    passwordChanged: true,
    notifications: {
        newIncident: true,
        weeklySummary: true,
        assessmentReminders: true,
    }
  },
  {
    id: '82828282',
    name: 'Carlos Alberto Vélez',
    avatarUrl: `https://picsum.photos/seed/Carlos/100/100`,
    role: Role.GUARDIAN,
    email: 'carlos.velez@email.com',
    phone: '3119876543',
    studentIds: [1101],
    password: 'password123',
    passwordChanged: true,
    notifications: {
        newIncident: true,
        weeklySummary: false,
        assessmentReminders: true,
    }
  },
];

export const MOCK_TEACHERS: Teacher[] = [
  { id: '1037612345', name: 'Juan Carlos Restrepo', avatarUrl: 'https://picsum.photos/seed/Juan/100/100', role: Role.TEACHER, subject: 'Matemáticas', email: 'juan.restrepo@institucion.edu.co', phone: '3001112233', status: TeacherStatus.ACTIVE, isHomeroomTeacher: true, assignedGroup: {grade: '7º', group: 'A'}, password: '1037612345', passwordChanged: false },
  { id: '987654321', name: 'María Eugenia Arango', avatarUrl: 'https://picsum.photos/seed/Maria/100/100', role: Role.COORDINATOR, subject: 'Coordinadores', email: 'maria.arango@institucion.edu.co', phone: '3019998877', status: TeacherStatus.ACTIVE, password: '987654321', passwordChanged: false },
  { id: '123456789', name: 'Luis Fernando Montoya', avatarUrl: 'https://picsum.photos/seed/Luis/100/100', role: Role.RECTOR, subject: 'Administrativos', email: 'rectoria@institucion.edu.co', phone: '3205556677', status: TeacherStatus.ACTIVE, password: '123456789', passwordChanged: true },
  { id: '1122334455', name: 'Sandra Milena Rojas', avatarUrl: 'https://picsum.photos/seed/Sandra/100/100', role: Role.PSYCHOLOGY, subject: 'Psicología', email: 'psicologia@institucion.edu.co', phone: '3157778899', status: TeacherStatus.ACTIVE, password: '1122334455', passwordChanged: false },
  { id: 'admin', name: 'Administrador del Sistema', avatarUrl: 'https://picsum.photos/seed/Admin/100/100', role: Role.ADMIN, subject: 'Administrativos', email: 'admin@institucion.edu.co', password: 'admin', passwordChanged: true },
  { id: 'rector', name: 'Rector de Prueba', avatarUrl: 'https://picsum.photos/seed/Rector/100/100', role: Role.RECTOR, subject: 'Administrativos', email: 'rector.prueba@demo.com', password: 'rector', passwordChanged: true },
];

export const MOCK_COORDINATOR_USER: Teacher = {
    id: '987654321', name: 'Coordinación Académica', avatarUrl: 'https://picsum.photos/seed/Coord/100/100', role: Role.COORDINATOR, subject: 'Coordinadores'
};

export const MOCK_ASSESSMENT_DATA: AssessmentData[] = [
  { competency: 'Comprensión Lectora', classAverage: 78, studentAverage: 85 },
  { competency: 'Resolución de Problemas', classAverage: 82, studentAverage: 90 },
  { competency: 'Pensamiento Crítico', classAverage: 75, studentAverage: 70 },
  { competency: 'Competencias Ciudadanas', classAverage: 88, studentAverage: 92 },
  { competency: 'Comunicación Escrita', classAverage: 72, studentAverage: 78 },
];

export const MOCK_CITATIONS: Citation[] = [
    { id: 'cit1', studentId: 1001, studentName: 'Ana Sofía Rodríguez', studentAvatar: 'https://picsum.photos/seed/Ana/100/100', date: '2024-08-01', time: '08:30', location: 'Coordinación', reason: 'Seguimiento académico y de convivencia', status: CitationStatus.CONFIRMED },
    { id: 'cit2', studentId: 1101, studentName: 'Beatriz Elena Cano', studentAvatar: 'https://picsum.photos/seed/Beatriz/100/100', date: '2024-08-05', time: '10:00', location: 'Coordinación', reason: 'Incumplimiento reiterado de normas de uniforme', status: CitationStatus.PENDING },
    { id: 'cit3', studentId: 1002, studentName: 'Carlos Andrés Pérez', studentAvatar: 'https://picsum.photos/seed/CarlosA/100/100', date: '2024-07-25', time: '11:00', location: 'Coordinación', reason: 'Proceso de mediación por conflicto entre pares', status: CitationStatus.COMPLETED },
];

export const MOCK_RESOURCES: Resource[] = [
    { id: 'res1', title: 'Guía de Álgebra Lineal', description: 'Conceptos básicos y ejercicios resueltos.', type: ResourceType.PDF, subjectArea: 'Matemáticas', url: 'path/to/algebra.pdf' },
    { id: 'res2', title: 'Video: La Célula', description: 'Documental sobre la estructura y función celular.', type: ResourceType.Video, subjectArea: 'Biología', url: 'path/to/celula.mp4' },
    { id: 'res3', title: 'Mapa de la Gran Colombia', description: 'Imagen en alta resolución del mapa histórico.', type: ResourceType.Image, subjectArea: 'Historia', url: 'path/to/mapa.jpg' },
    { id: 'res4', title: 'Taller de Comprensión Lectora', description: 'Ejercicios prácticos para mejorar la lectura crítica.', type: ResourceType.Document, subjectArea: 'Lengua Castellana', url: 'path/to/taller.docx' },
];

export const MOCK_STUDENT_ASSESSMENT_RESULTS: StudentAssessmentResult[] = [
    { id: 'asm1_1001', studentId: 1001, assessmentId: 'asm1', assessmentTitle: "Quiz de Fracciones", score: 4.5, completedAt: '2024-07-15T10:00:00Z' },
    { id: 'asm1_1002', studentId: 1002, assessmentId: 'asm1', assessmentTitle: "Quiz de Fracciones", score: 3.8, completedAt: '2024-07-15T10:05:00Z' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'ann1', title: 'Reunión General de Padres de Familia', content: 'Se convoca a todos los padres y acudientes a la reunión general del tercer período, que se realizará el día 5 de agosto a las 7:00 AM en el auditorio principal.', recipients: 'all_parents', timestamp: new Date().toISOString(), sentBy: 'Rectoría' },
  { id: 'ann2', title: 'Entrega de Boletines - Segundo Período', content: 'La entrega de informes académicos del segundo período se realizará el día 2 de agosto. Cada director de grupo informará el horario y la modalidad.', recipients: 'all', timestamp: new Date(Date.now() - 86400000).toISOString(), sentBy: 'Coordinación' },
];

export const MOCK_INSTITUTION_PROFILE: InstitutionProfileData = {
    name: "Institución Educativa Demo",
    daneCode: "123456789012",
    nit: "900.123.456-7",
    rector: "Luis Fernando Montoya",
    address: "Calle Falsa 123, Medellín, Antioquia",
    phone: "(604) 123-4567",
    email: "contacto@instituciondemo.edu.co",
    logoUrl: "https://raw.githubusercontent.com/davidsantiagoo/AULA-INTEGRAL-MAYA/35b3e15b3b1923d385a3c625895e7832938a1835/src/assets/logo.svg",
    primaryColor: "#005A9C",
    secondaryColor: "#FFCD00",
};

// --- REALISTIC CONSTANTS ---
export const GRADES = ["1º", "2º", "3º", "4º", "5º", "6º", "7º"];
export const GROUPS = ["A", "B", "C", "D", "E", "F"];
export const GRADE_GROUP_MAP: Record<string, string[]> = {
    "1º": ["A", "B", "C", "D", "E", "F"],
    "2º": ["A", "B", "C", "D", "E", "F"],
    "3º": ["A", "B", "C", "D", "E", "F"],
    "4º": ["A", "B", "C", "D", "E", "F"],
    "5º": ["A", "B", "C", "D", "E", "F"],
    "6º": ["A", "B", "C", "D", "E", "F"],
    "7º": ["A", "B", "C", "D", "E", "F"],
};
export const SUBJECT_AREAS: SubjectArea[] = ['Matemáticas', 'Lengua Castellana', 'Inglés', 'Biología', 'Química', 'Física', 'Historia', 'Geografía', 'Constitución Política y Democracia', 'Educación Artística', 'Música', 'Educación Ética y en Valores Humanos', 'Filosofía', 'Educación Física', 'Educación Religiosa', 'Tecnología e Informática', 'Convivencia', 'Todas', 'Coordinadores', 'Administrativos', 'Psicología'];
export const COMPETENCIES: Competency[] = ['Comprensión Lectora', 'Resolución de Problemas', 'Pensamiento Crítico', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Análisis Científico', 'Expresión Artística', 'Competencia Digital', 'Pensamiento Histórico', 'Bilingüismo', 'Competencia Motriz'];
export const RESOURCE_TYPES: ResourceType[] = [ResourceType.PDF, ResourceType.Video, ResourceType.Image, ResourceType.Document];
export const ACADEMIC_PERIODS: AcademicPeriod[] = [AcademicPeriod.FIRST, AcademicPeriod.SECOND, AcademicPeriod.THIRD, AcademicPeriod.FOURTH];
export const SCHOOL_LOCATIONS = ["Salón de Clase", "Patio de Recreo", "Baños", "Comedor", "Biblioteca", "Sala de Informática", "Ruta Escolar", "Fuera de la Institución", "Otro"];

// --- MOCK GRADE DATA (simplified) ---
export const MOCK_SUBJECT_GRADES: SubjectGrades[] = [
    {
        id: 'Matemáticas-7-A-PRIMERO',
        subject: 'Matemáticas',
        grade: '7º',
        group: 'A',
        period: AcademicPeriod.FIRST,
        teacherId: '1037612345',
        isLocked: false,
        observations: {
            1001: 'Ana Sofía muestra un excelente dominio de los conceptos algebraicos y una participación activa en clase. Se destaca por su capacidad para resolver problemas complejos.',
            1002: 'Carlos necesita reforzar los conceptos de trigonometría. Se recomienda practicar los ejercicios vistos en clase y no dudar en preguntar para aclarar dudas.'
        },
        gradeItems: [
            { id: 'quiz1', name: 'Quiz de Funciones', weight: 0.25 },
            { id: 'taller1', name: 'Taller de Trigonometría', weight: 0.35 },
            { id: 'parcial1', name: 'Parcial del Período', weight: 0.40 },
        ],
        scores: [
            { studentId: 1001, gradeItemId: 'quiz1', score: 4.8 },
            { studentId: 1001, gradeItemId: 'taller1', score: 5.0 },
            { studentId: 1001, gradeItemId: 'parcial1', score: 4.5 },
            { studentId: 1002, gradeItemId: 'quiz1', score: 3.5 },
            { studentId: 1002, gradeItemId: 'taller1', score: 3.0 },
            { studentId: 1002, gradeItemId: 'parcial1', score: 3.2 },
        ]
    }
];

export const MOCK_CONVERSATIONS_DATA: Conversation[] = [
    {
        id: '71717171-1037612345',
        participantIds: ['71717171', '1037612345'], // Guardian - Teacher
        messages: [
            { senderId: '71717171', text: 'Buenas tardes, profesor Juan. Quisiera saber cómo va Ana Sofía en matemáticas este período.', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
            { senderId: '1037612345', text: 'Buenas tardes, Sra. Marta. Ana Sofía va muy bien, tiene un excelente promedio y participa mucho. No hay de qué preocuparse.', timestamp: new Date(Date.now() - 86400000 * 2 + 60000).toISOString() },
        ]
    }
];

export const DESEMPENOS_BANK: DesempenoDescriptor[] = [
    // Matemáticas (25)
    {id: 'mat-1', area: 'Matemáticas', description: 'Usa números reales para resolver problemas en contextos variados.'},
    {id: 'mat-2', area: 'Matemáticas', description: 'Interpreta y utiliza conceptos de proporcionalidad para resolver problemas.'},
    {id: 'mat-3', area: 'Matemáticas', description: 'Aplica algoritmos de las operaciones básicas entre números enteros y racionales.'},
    {id: 'mat-4', area: 'Matemáticas', description: 'Reconoce y aplica propiedades de figuras geométricas para solucionar problemas.'},
    {id: 'mat-5', area: 'Matemáticas', description: 'Calcula áreas y volúmenes de cuerpos geométricos y los aplica en situaciones reales.'},
    {id: 'mat-6', area: 'Matemáticas', description: 'Utiliza el Teorema de Pitágoras y relaciones trigonométricas para resolver triángulos.'},
    {id: 'mat-7', area: 'Matemáticas', description: 'Interpreta y representa datos usando tablas de frecuencia y gráficos estadísticos.'},
    {id: 'mat-8', area: 'Matemáticas', description: 'Calcula e interpreta medidas de tendencia central (media, mediana, moda).'},
    {id: 'mat-9', area: 'Matemáticas', description: 'Usa el principio de conteo y conceptos de probabilidad para analizar eventos aleatorios.'},
    {id: 'mat-10', area: 'Matemáticas', description: 'Describe y modela fenómenos de cambio y variación a través de funciones.'},
    {id: 'mat-11', area: 'Matemáticas', description: 'Traduce expresiones del lenguaje natural al lenguaje algebraico y viceversa.'},
    {id: 'mat-12', area: 'Matemáticas', description: 'Resuelve ecuaciones e inecuaciones lineales y cuadráticas.'},
    {id: 'mat-13', area: 'Matemáticas', description: 'Identifica y grafica funciones (lineal, cuadrática, exponencial) en el plano cartesiano.'},
    {id: 'mat-14', area: 'Matemáticas', description: 'Aplica transformaciones geométricas (