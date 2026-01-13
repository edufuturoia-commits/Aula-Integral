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

export const ChartPieIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
  </svg>
);

export const TutorIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

export const ResourcesIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
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

export const IncidentsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

export const ParentPortalIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

export const StudentPortalIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
);

export const RectoryIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

export const CommunicationIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

export const EventosIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export const SimulacroICFESIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
);

export const PsychologyIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const SecretariaIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
);


export const LogoutIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);


// --- NAVIGATION ---
export const SIDEBAR_ITEMS: { name: Page; label: string; icon: React.FC<{className?: string}> }[] = [
    { name: 'Dashboard', label: 'Tablero Principal', icon: DashboardIcon },
    { name: 'Classroom', label: 'Gestión de Aula', icon: ClassroomIcon },
    { name: 'Incidents', label: 'Coordinación', icon: IncidentsIcon },
    { name: 'Psychology', label: 'Psicología', icon: PsychologyIcon },
    { name: 'Secretaria', label: 'Secretaría', icon: SecretariaIcon },
    { name: 'TutorMode', label: 'Tutor IA', icon: TutorIcon },
    { name: 'Communication', label: 'Comunicación', icon: CommunicationIcon },
    { name: 'Assessments', label: 'Evaluaciones', icon: AssessmentsIcon },
    { name: 'Calificaciones', label: 'Calificaciones', icon: GradesIcon },
    { name: 'Consolidado', label: 'Consolidado', icon: ConsolidadoIcon },
    { name: 'AcademicDashboard', label: 'Dashboard Académico', icon: ChartPieIcon },
    { name: 'Resources', label: 'Recursos', icon: ResourcesIcon },
    { name: 'Eventos', label: 'Eventos', icon: EventosIcon },
    { name: 'Profile', label: 'Mi Perfil', icon: ProfileIcon },
    { name: 'Settings', label: 'Configuración', icon: SettingsIcon },
    { name: 'Rectory', label: 'Rectoría', icon: RectoryIcon },
    { name: 'InstitutionProfile', label: 'Perfil Institucional', icon: RectoryIcon },
    { name: 'ParentPortal', label: 'Portal de Acudiente', icon: ParentPortalIcon },
    { name: 'StudentPortal', label: 'Portal Estudiantil', icon: StudentPortalIcon },
    { name: 'SimulacroICFES', label: 'Simulacro ICFES', icon: SimulacroICFESIcon },
];

// --- MOCK DATA ---

export const MOCK_STUDENTS: Student[] = [
  { id: 1, name: 'Sofía Alvarez', avatarUrl: 'https://picsum.photos/seed/sofia/100/100', grade: '11º', group: 'A', role: Role.STUDENT, lastIncident: 'Uso de celular', dateOfBirth: '2007-05-15', documentType: DocumentType.IDENTITY_CARD, documentNumber: '1001234567', password: 'password123', passwordChanged: true, jornada: 'Mañana' },
  { id: 2, name: 'Mateo Rojas', avatarUrl: 'https://picsum.photos/seed/mateo/100/100', grade: '11º', group: 'A', role: Role.STUDENT, dateOfBirth: '2007-03-22', documentType: DocumentType.IDENTITY_CARD, documentNumber: '1001234568', jornada: 'Mañana' },
  { id: 3, name: 'Camila Gómez', avatarUrl: 'https://picsum.photos/seed/camila/100/100', grade: '11º', group: 'B', role: Role.STUDENT, lastIncident: 'Falta de respeto', dateOfBirth: '2007-08-10', documentType: DocumentType.IDENTITY_CARD, documentNumber: '1001234569', jornada: 'Tarde' },
  { id: 4, name: 'Lucas Mendoza', avatarUrl: 'https://picsum.photos/seed/lucas/100/100', grade: '10º', group: 'A', role: Role.STUDENT, dateOfBirth: '2008-01-30', documentType: DocumentType.IDENTITY_CARD, documentNumber: '1001234570', jornada: 'Mañana' },
  { id: 5, name: 'Isabella Castillo', avatarUrl: 'https://picsum.photos/seed/isabella/100/100', grade: '10º', group: 'B', role: Role.STUDENT, dateOfBirth: '2008-11-05', documentType: DocumentType.IDENTITY_CARD, documentNumber: '1001234571', jornada: 'Tarde' },
];

export const MOCK_TEACHERS: Teacher[] = [
  { id: '123456789', name: 'Dr. Armando Paredes', avatarUrl: 'https://picsum.photos/seed/rector/100/100', role: Role.RECTOR, subject: 'Administrativos', email: 'rector@institucion.edu.co' },
  { id: '987654321', name: 'Prof. Ana María Velásquez', avatarUrl: 'https://picsum.photos/seed/coordinadora/100/100', role: Role.COORDINATOR, subject: 'Coordinadores', email: 'coordinacion@institucion.edu.co' },
  { id: '1037612345', name: 'Prof. Carlos Ramírez', avatarUrl: 'https://picsum.photos/seed/carlos/100/100', role: Role.TEACHER, subject: 'Matemáticas', email: 'carlos.ramirez@institucion.edu.co', isHomeroomTeacher: true, assignedGroup: { grade: '11º', group: 'A' } },
  { id: '234567890', name: 'Prof. Beatriz Pinzón', avatarUrl: 'https://picsum.photos/seed/beatriz/100/100', role: Role.TEACHER, subject: 'Lengua Castellana', email: 'beatriz.pinzon@institucion.edu.co', isHomeroomTeacher: true, assignedGroup: { grade: '10º', group: 'A' } },
  { id: '543210987', name: 'Dra. Isabel Cristina Estrada', avatarUrl: 'https://picsum.photos/seed/psicologa/100/100', role: Role.PSYCHOLOGY, subject: 'Psicología', email: 'psicologia@institucion.edu.co' },
];

export const MOCK_GUARDIANS: Guardian[] = [
    { id: 'g-1', name: 'Laura Alvarez', avatarUrl: 'https://picsum.photos/seed/laura-a/100/100', role: Role.GUARDIAN, studentIds: [1] },
    { id: 'g-2', name: 'Marcos Rojas', avatarUrl: 'https://picsum.photos/seed/marcos-r/100/100', role: Role.GUARDIAN, studentIds: [2] },
];

export const MOCK_ASSESSMENT_DATA: AssessmentData[] = [
  { competency: 'Comprensión Lectora', classAverage: 78, studentAverage: 85 },
  { competency: 'Resolución de Problemas', classAverage: 82, studentAverage: 90 },
  { competency: 'Pensamiento Crítico', classAverage: 75, studentAverage: 70 },
  { competency: 'Competencias Ciudadanas', classAverage: 88, studentAverage: 92 },
  { competency: 'Comunicación Escrita', classAverage: 70, studentAverage: 75 },
];

export const MOCK_RESOURCES: Resource[] = [
    { id: '1', title: 'Guía de Álgebra Lineal', description: 'PDF con ejercicios resueltos.', type: ResourceType.PDF, subjectArea: 'Matemáticas', url: '#' },
    { id: '2', title: 'Video: La Célula', description: 'Documental sobre la estructura celular.', type: ResourceType.Video, subjectArea: 'Biología', url: '#' },
    { id: '3', title: 'Infografía del Sistema Solar', description: 'Imagen detallada de los planetas.', type: ResourceType.Image, subjectArea: 'Física', url: '#' },
    { id: '4', title: 'Análisis de "Cien Años de Soledad"', description: 'Documento con análisis literario.', type: ResourceType.Document, subjectArea: 'Lengua Castellana', url: '#' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1',
    title: 'Reunión General de Padres de Familia',
    content: 'Se convoca a todos los padres de familia y acudientes a la reunión general del primer período académico. Se tratarán temas de interés general y se entregarán pre-informes. Su asistencia es de vital importancia.',
    recipients: 'all_parents',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: 'Rectoría',
  },
  {
    id: 'ann_2',
    title: 'Semana Cultural y Deportiva',
    content: '¡Prepárense para nuestra tradicional Semana Cultural y Deportiva! Del 15 al 19 de abril tendremos diversas actividades. Consulten la programación en el portal de eventos.',
    recipients: 'all',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: 'Coordinación',
  },
  {
    id: 'ann_3',
    title: 'Capacitación Docente: Nuevas Herramientas Digitales',
    content: 'Se invita a todo el personal docente a la capacitación sobre el uso de nuevas herramientas digitales para el aula. Se realizará el próximo viernes a las 2:00 PM en la sala de audiovisuales.',
    recipients: 'all_teachers',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: 'Rectoría',
  }
];

export const MOCK_STUDENT_ASSESSMENT_RESULTS: StudentAssessmentResult[] = [
    { id: 'asm_1_1', studentId: 1, assessmentId: 'asm_1', assessmentTitle: 'Examen de Biología Celular', score: 4.5, completedAt: '2023-10-25T10:00:00Z' },
    { id: 'asm_1_2', studentId: 2, assessmentId: 'asm_1', assessmentTitle: 'Examen de Biología Celular', score: 3.8, completedAt: '2023-10-25T10:05:00Z' },
];

export const MOCK_SUBJECT_GRADES: SubjectGrades[] = [
    {
        id: 'Matemáticas-11-A-PRIMERO',
        subject: 'Matemáticas',
        grade: '11º',
        group: 'A',
        period: AcademicPeriod.FIRST,
        teacherId: '1037612345',
        isLocked: false,
        gradeItems: [
            { id: 'm1', name: 'Quiz 1', weight: 0.25 },
            { id: 'm2', name: 'Taller Funciones', weight: 0.25 },
            { id: 'm3', name: 'Parcial 1', weight: 0.50 },
        ],
        scores: [
            { studentId: 1, gradeItemId: 'm1', score: 4.5 },
            { studentId: 1, gradeItemId: 'm2', score: 5.0 },
            { studentId: 1, gradeItemId: 'm3', score: 4.2 },
            { studentId: 2, gradeItemId: 'm1', score: 3.5 },
            { studentId: 2, gradeItemId: 'm2', score: 4.0 },
            { studentId: 2, gradeItemId: 'm3', score: 3.8 },
        ],
        observations: {
            1: 'Excelente desempeño en el período, demuestra gran habilidad para la resolución de problemas.',
            2: 'Buen trabajo, se recomienda reforzar el estudio para el próximo parcial.'
        },
        generalDesempenoIds: ['d-mat-1', 'd-mat-2'],
    },
];

export const MOCK_CITATIONS: Citation[] = [
  { id: '1', studentId: 1, studentName: 'Sofía Alvarez', studentAvatar: 'https://picsum.photos/seed/sofia/100/100', date: '2024-05-20', time: '08:00 AM', location: 'Coordinación', reason: 'Seguimiento académico bajo rendimiento', status: CitationStatus.PENDING },
  { id: '2', studentId: 3, studentName: 'Camila Gómez', studentAvatar: 'https://picsum.photos/seed/camila/100/100', date: '2024-05-22', time: '10:30 AM', location: 'Rectoría', reason: 'Incidencia de convivencia grave', status: CitationStatus.CONFIRMED },
  { id: '3', studentId: 1, studentName: 'Sofía Alvarez', studentAvatar: 'https://picsum.photos/seed/sofia/100/100', date: '2024-04-15', time: '09:00 AM', location: 'Coordinación', reason: 'Inasistencias reiteradas', status: CitationStatus.COMPLETED },
];

export const MOCK_CONVERSATIONS_DATA: Conversation[] = [
    {
        id: 'g-1-1037612345',
        participantIds: ['g-1', '1037612345'],
        messages: [
            { senderId: 'g-1', text: 'Buenos días, profesor Carlos. Quisiera saber cómo va Sofía en matemáticas.', timestamp: '2024-05-18T09:00:00Z' },
            { senderId: '1037612345', text: 'Buenos días, Sra. Laura. Sofía va muy bien, sus notas son excelentes. La felicito.', timestamp: '2024-05-18T09:05:00Z' },
        ]
    }
];

export const DESEMPENOS_BANK: DesempenoDescriptor[] = [
    { id: 'd-mat-1', area: 'Matemáticas', description: 'Resuelve problemas que involucran funciones y ecuaciones.' },
    { id: 'd-mat-2', area: 'Matemáticas', description: 'Aplica conceptos de cálculo en situaciones variadas.' },
    { id: 'd-len-1', area: 'Lengua Castellana', description: 'Analiza críticamente textos literarios y argumentativos.' },
    { id: 'd-all-1', area: 'Todas', description: 'Demuestra responsabilidad y compromiso con sus deberes académicos.' },
];

export const SCHOOL_LOCATIONS: string[] = [
    'Salón de Clase',
    'Patio de Recreo',
    'Baños',
    'Cafetería',
    'Biblioteca',
    'Laboratorio',
    'Pasillos',
    'Sala de Informática',
    'Canchas Deportivas',
    'Auditorio',
    'Entrada/Salida',
    'Otro'
];

export const GRADES = ["Jardín", "Transición", "1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º", "10º", "11º"];
export const GROUPS = ["A", "B", "C", "D", "E"];
export const JORNADAS: ('Mañana' | 'Tarde')[] = ['Mañana', 'Tarde'];
export const ACADEMIC_PERIODS: AcademicPeriod[] = [AcademicPeriod.FIRST, AcademicPeriod.SECOND, AcademicPeriod.THIRD, AcademicPeriod.FOURTH];

export const GRADE_GROUP_MAP: Record<string, string[]> = {
    "Jardín": ["A", "B"],
    "Transición": ["A", "B"],
    "1º": ["A", "B", "C"],
    "2º": ["A", "B", "C"],
    "3º": ["A", "B"],
    "4º": ["A", "B"],
    "5º": ["A", "B"],
    "6º": ["A", "B", "C", "D"],
    "7º": ["A", "B", "C", "D"],
    "8º": ["A", "B", "C"],
    "9º": ["A", "B", "C"],
    "10º": ["A", "B"],
    "11º": ["A", "B"],
};


export const RESOURCE_TYPES: ResourceType[] = Object.values(ResourceType);
export const SUBJECT_AREAS: SubjectArea[] = ['Matemáticas', 'Lengua Castellana', 'Inglés', 'Biología', 'Química', 'Física', 'Historia', 'Geografía', 'Constitución Política y Democracia', 'Educación Artística', 'Música', 'Educación Ética y en Valores Humanos', 'Filosofía', 'Educación Física', 'Educación Religiosa', 'Tecnología e Informática', 'Convivencia', 'Todas', 'Coordinadores', 'Administrativos', 'Psicología'];
export const COMPETENCIES: Competency[] = ['Comprensión Lectora', 'Resolución de Problemas', 'Pensamiento Crítico', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Análisis Científico', 'Expresión Artística', 'Competencia Digital', 'Pensamiento Histórico', 'Bilingüismo', 'Competencia Motriz'];


export const MOCK_INSTITUTION_PROFILE: InstitutionProfileData = {
  name: 'Institución Educativa Futuro Brillante',
  daneCode: '123456789012',
  nit: '900.123.456-7',
  rector: 'Dr. Armando Paredes',
  address: 'Calle Falsa 123, Medellín, Antioquia',
  phone: '(604) 123-4567',
  email: 'contacto@futurobrillante.edu.co',
  logoUrl: 'https://i.imgur.com/your-logo.png', // Replace with a real placeholder
  primaryColor: '#005A9C',
  secondaryColor: '#FFCD00',
};

// FIX: Explicitly type MOCK_COORDINATOR_USER as Teacher to fix type inference issues.
export const MOCK_COORDINATOR_USER: Teacher = {
    id: '987654321',
    name: 'Coordinación Académica',
    avatarUrl: 'https://picsum.photos/seed/coordinacion/100/100',
    role: Role.COORDINATOR,
    subject: 'Coordinadores'
};