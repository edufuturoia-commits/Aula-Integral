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


export const ResourcesIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const PsychologyIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

export const SecretariaIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

export const InstitutionProfileIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

export const ParentPortalIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" />
  </svg>
);

export const StudentPortalIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

export const EventosIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export const IcfesIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-9.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-9.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222 4 2.222V20M12 12.5L4 8l8-4.444 8 4.444L12 12.5z" />
    </svg>
);


export const LogoutIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);


// --- SIDEBAR CONFIG ---
export const SIDEBAR_ITEMS: { name: Page; label: string; icon: React.FC<{className?: string}> }[] = [
  { name: 'Dashboard', label: 'Dashboard', icon: DashboardIcon },
  { name: 'Classroom', label: 'Mi Salón', icon: ClassroomIcon },
  { name: 'Assessments', label: 'Evaluaciones', icon: AssessmentsIcon },
  { name: 'Calificaciones', label: 'Calificaciones', icon: GradesIcon },
  { name: 'Consolidado', label: 'Consolidado', icon: ConsolidadoIcon },
  { name: 'TutorMode', label: 'Tutor IA', icon: TutorIcon },
  { name: 'Resources', label: 'Recursos', icon: ResourcesIcon },
  { name: 'Eventos', label: 'Eventos', icon: EventosIcon },
  { name: 'Incidents', label: 'Coordinación', icon: IncidentsIcon },
  { name: 'Psychology', label: 'Psicología', icon: PsychologyIcon },
  { name: 'Secretaria', label: 'Secretaría', icon: SecretariaIcon },
  { name: 'Communication', label: 'Comunicación', icon: CommunicationIcon },
  { name: 'Rectory', label: 'Rectoría', icon: RectoryIcon },
  { name: 'InstitutionProfile', label: 'Perfil Institucional', icon: InstitutionProfileIcon },
  { name: 'ParentPortal', label: 'Portal Acudiente', icon: ParentPortalIcon },
  { name: 'StudentPortal', label: 'Portal Estudiante', icon: StudentPortalIcon },
  { name: 'SimulacroICFES', label: 'Simulacro ICFES', icon: IcfesIcon },
  { name: 'Profile', label: 'Mi Perfil', icon: ProfileIcon },
  { name: 'Settings', label: 'Configuración', icon: SettingsIcon },
];

// MOCK DATA
export const MOCK_STUDENTS: Student[] = [
    { id: 1, name: 'Ana Sofía Rodríguez', avatarUrl: 'https://picsum.photos/seed/Ana/100/100', grade: '11º', group: 'A', role: Role.STUDENT, lastIncident: 'Uso inapropiado del uniforme', documentType: DocumentType.IDENTITY_CARD, documentNumber: '1010101010', password: 'password123', passwordChanged: false, dateOfBirth: '2006-05-15' },
    { id: 2, name: 'Carlos Andrés Pérez', avatarUrl: 'https://picsum.photos/seed/Carlos/100/100', grade: '11º', group: 'A', role: Role.STUDENT, documentType: DocumentType.IDENTITY_CARD, documentNumber: '2020202020', password: 'password123', passwordChanged: true, dateOfBirth: '2006-08-22' },
    { id: 3, name: 'Mariana Gómez', avatarUrl: 'https://picsum.photos/seed/Mariana/100/100', grade: '10º', group: 'B', role: Role.STUDENT, documentType: DocumentType.IDENTITY_CARD, documentNumber: '3030303030', password: 'password123', passwordChanged: true, dateOfBirth: '2007-02-10' },
    { id: 4, name: 'Juan David Vélez', avatarUrl: 'https://picsum.photos/seed/Juan/100/100', grade: '11º', group: 'A', role: Role.STUDENT, lastIncident: 'Incumplimiento de deberes', documentType: DocumentType.IDENTITY_CARD, documentNumber: '4040404040', password: 'password123', passwordChanged: true, dateOfBirth: '2006-11-01' },
    { id: 5, name: 'Isabela Zapata', avatarUrl: 'https://picsum.photos/seed/Isabela/100/100', grade: '11º', group: 'B', role: Role.STUDENT, documentType: DocumentType.IDENTITY_CARD, documentNumber: '5050505050', password: 'password123', passwordChanged: true, dateOfBirth: '2006-03-30' },
];

export const MOCK_TEACHERS: Teacher[] = [
    { id: '1037612345', name: 'Ricardo Pérez', avatarUrl: 'https://picsum.photos/seed/Ricardo/100/100', role: Role.TEACHER, subject: 'Matemáticas', isHomeroomTeacher: true, assignedGroup: {grade: '11º', group: 'A'}, email: 'rperez@example.com', password: '1037612345', passwordChanged: false, dateOfBirth: '1985-10-20' },
    { id: '987654321', name: 'Mónica Rodríguez', avatarUrl: 'https://picsum.photos/seed/Monica/100/100', role: Role.COORDINATOR, subject: 'Coordinadores', email: 'mrodriguez@example.com', password: '987654321', passwordChanged: true, dateOfBirth: '1980-04-12' },
    { id: 'rector', name: 'Elena Zapata', avatarUrl: 'https://picsum.photos/seed/Elena/100/100', role: Role.RECTOR, subject: 'Administrativos', email: 'ezapata@example.com', password: 'rector', passwordChanged: true, dateOfBirth: '1975-01-05' },
    { id: '123456789', name: 'Laura Castaño', avatarUrl: 'https://picsum.photos/seed/Laura/100/100', role: Role.PSYCHOLOGY, subject: 'Psicología', email: 'lcastano@example.com', password: '123456789', passwordChanged: true, dateOfBirth: '1990-09-18' }
];

export const MOCK_COORDINATOR_USER: Teacher = {
    id: '987654321',
    name: 'Coordinación Académica',
    avatarUrl: 'https://picsum.photos/seed/Coord/100/100',
    role: Role.COORDINATOR,
    subject: 'Coordinadores'
};

export const MOCK_GUARDIANS: Guardian[] = [
    { id: 'g123456', name: 'Luisa Fernanda Ríos', email: 'lrios@email.com', studentIds: [1], password: 'password123', passwordChanged: true }
];

export const MOCK_ASSESSMENT_DATA: AssessmentData[] = [
    { competency: 'Comprensión Lectora', classAverage: 85, studentAverage: 92 },
    { competency: 'Resolución de Problemas', classAverage: 78, studentAverage: 81 },
    { competency: 'Pensamiento Crítico', classAverage: 82, studentAverage: 79 },
    { competency: 'Competencias Ciudadanas', classAverage: 90, studentAverage: 95 },
    { competency: 'Comunicación Escrita', classAverage: 76, studentAverage: 88 },
];

export const MOCK_QUESTIONS: Question[] = [
    { id: 'q1', text: '¿Cuál es la capital de Colombia?', area: 'Geografía', grade: '6º', competency: 'Pensamiento Histórico', options: ['Medellín', 'Bogotá', 'Cali', 'Barranquilla'], correctAnswer: 1 },
    { id: 'q2', text: 'Resuelve la ecuación: 2x + 5 = 15', area: 'Matemáticas', grade: '8º', competency: 'Resolución de Problemas', options: ['x=3', 'x=5', 'x=7', 'x=10'], correctAnswer: 1 },
];

export const MOCK_RESOURCES: Resource[] = [
    { id: 'res1', title: 'Guía de Algebra Lineal', description: 'Documento con ejercicios resueltos de algebra.', type: ResourceType.PDF, subjectArea: 'Matemáticas', url: '#' },
    { id: 'res2', title: 'Video: La Célula', description: 'Explicación animada sobre las partes de la célula.', type: ResourceType.Video, subjectArea: 'Biología', url: '#' },
];

export const MOCK_STUDENT_ASSESSMENT_RESULTS: StudentAssessmentResult[] = [
    { id: 'asm1_1', studentId: 1, assessmentId: 'asm1', assessmentTitle: 'Prueba de Biología Celular', score: 4.5, completedAt: new Date().toISOString() },
    { id: 'asm1_2', studentId: 2, assessmentId: 'asm1', assessmentTitle: 'Prueba de Biología Celular', score: 3.8, completedAt: new Date().toISOString() },
];

export const MOCK_CITATIONS: Citation[] = [
    { id: 'cit1', studentId: 1, studentName: 'Ana Sofía Rodríguez', studentAvatar: 'https://picsum.photos/seed/Ana/100/100', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], time: '08:00 AM', location: 'Coordinación', reason: 'Seguimiento académico', status: CitationStatus.PENDING },
    { id: 'cit2', studentId: 4, studentName: 'Juan David Vélez', studentAvatar: 'https://picsum.photos/seed/Juan/100/100', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], time: '10:30 AM', location: 'Rectoría', reason: 'Incidencia de convivencia', status: CitationStatus.CONFIRMED },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    { id: 'ann1', title: 'Reunión de Padres de Familia', content: 'Se les recuerda a todos los padres de familia la reunión general el próximo viernes a las 6 PM en el auditorio.', recipients: 'all_parents', timestamp: new Date().toISOString(), sentBy: 'Rectoría' }
];

export const MOCK_INSTITUTION_PROFILE: InstitutionProfileData = {
    name: 'Institución Educativa Futuro Brillante',
    daneCode: '123456789012',
    nit: '900.123.456-7',
    rector: 'Elena Zapata',
    address: 'Calle Ficticia 123, Ciudad Ejemplo',
    phone: '300 123 4567',
    email: 'contacto@futurobrillante.edu.co',
    logoUrl: 'https://picsum.photos/seed/logo/200/200',
    primaryColor: '#005A9C', // A deep blue
    secondaryColor: '#FFC72C', // A bright yellow
};

export const MOCK_EVENT_POSTERS: EventPoster[] = [];

export const MOCK_SUBJECT_GRADES: SubjectGrades[] = [
    {
        id: 'Matemáticas-11-A-PRIMERO',
        subject: 'Matemáticas',
        grade: '11º',
        group: 'A',
        period: AcademicPeriod.FIRST,
        teacherId: '1037612345',
        gradeItems: [
            { id: 'item-1', name: 'Quiz 1: Funciones', weight: 0.20, desempenoIds: ['d-math-1'] },
            { id: 'item-2', name: 'Taller de Límites', weight: 0.30 },
            { id: 'item-3', name: 'Examen Parcial', weight: 0.50, desempenoIds: ['d-math-1', 'd-math-2'] },
        ],
        scores: [
            { studentId: 1, gradeItemId: 'item-1', score: 4.8 },
            { studentId: 1, gradeItemId: 'item-2', score: 4.2 },
            { studentId: 1, gradeItemId: 'item-3', score: 4.5 },
            { studentId: 2, gradeItemId: 'item-1', score: 3.5 },
            { studentId: 2, gradeItemId: 'item-2', score: 4.0 },
            { studentId: 2, gradeItemId: 'item-3', score: 3.2 },
            { studentId: 4, gradeItemId: 'item-1', score: 2.5 },
            { studentId: 4, gradeItemId: 'item-2', score: 3.0 },
            { studentId: 4, gradeItemId: 'item-3', score: 2.8 },
        ],
        observations: {
            1: "Excelente desempeño, demuestra gran dominio de los temas.",
            2: "Buen trabajo, se recomienda reforzar el estudio de límites para mejorar el promedio.",
        },
        isLocked: false
    }
];

export const MOCK_CONVERSATIONS_DATA: Conversation[] = [
  {
    id: '1037612345-g123456',
    participantIds: ['1037612345', 'g123456'],
    messages: [
      { senderId: 'g123456', text: 'Buenos días, profesor Ricardo. Quería preguntarle sobre el desempeño de Ana Sofía en Matemáticas.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { senderId: '1037612345', text: 'Hola, Sra. Luisa. Ana Sofía va muy bien, tiene un excelente promedio. La felicito.', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }
    ]
  }
];

export const MOCK_INBOX_CONVERSATIONS: InboxConversation[] = [];

export const MOCK_DESEMPENOS_BANK: DesempenoDescriptor[] = [
    { id: 'd-math-1', description: 'Aplica conceptos de funciones para modelar situaciones.', area: 'Matemáticas' },
    { id: 'd-math-2', description: 'Calcula límites y derivadas de funciones polinómicas.', area: 'Matemáticas' },
    { id: 'd-all-1', description: 'Participa activamente en clase.', area: 'Todas' },
];

// --- GLOBAL CONSTANTS ---
export const SUBJECT_AREAS: SubjectArea[] = ['Matemáticas', 'Lengua Castellana', 'Inglés', 'Biología', 'Química', 'Física', 'Historia', 'Geografía', 'Constitución Política y Democracia', 'Educación Artística', 'Música', 'Educación Ética y en Valores Humanos', 'Filosofía', 'Educación Física', 'Educación Religiosa', 'Tecnología e Informática', 'Convivencia', 'Todas', 'Coordinadores', 'Administrativos', 'Psicología'];
export const COMPETENCIES: Competency[] = ['Comprensión Lectora', 'Resolución de Problemas', 'Pensamiento Crítico', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Análisis Científico', 'Expresión Artística', 'Competencia Digital', 'Pensamiento Histórico', 'Bilingüismo', 'Competencia Motriz'];
export const RESOURCE_TYPES: ResourceType[] = [ResourceType.PDF, ResourceType.Video, ResourceType.Image, ResourceType.Document];
export const GRADES = ['6º', '7º', '8º', '9º', '10º', '11º'];
export const GROUPS = ['A', 'B', 'C', 'D'];
export const GRADE_GROUP_MAP: { [key: string]: string[] } = {
    '6º': ['A', 'B', 'C'],
    '7º': ['A', 'B'],
    '8º': ['A', 'B', 'C'],
    '9º': ['A', 'B'],
    '10º': ['A', 'B'],
    '11º': ['A', 'B'],
};
export const ACADEMIC_PERIODS: AcademicPeriod[] = [AcademicPeriod.FIRST, AcademicPeriod.SECOND, AcademicPeriod.THIRD, AcademicPeriod.FOURTH];
export const SCHOOL_LOCATIONS = ['Salón de Clase', 'Patio de Recreo', 'Baños', 'Cafetería', 'Biblioteca', 'Auditorio', 'Pasillos', 'Fuera de la Institución'];

export const translations = {
  es: {
    close: 'Cerrar',
    studentLabel: 'Estudiante',
    notifications: {
      newIncident: {
        title: 'Nueva Incidencia Reportada',
        message: 'Se ha registrado una nueva incidencia de tipo {{incidentType}}.'
      },
      attentionReportSent: 'Reporte de atención enviado a psicología.',
      psychologyReportUpdated: 'Reporte psicológico actualizado.',
      accountUpgraded: '¡Tu cuenta ha sido activada! Gracias por tu compra.',
    },
    success: 'Éxito',
    error: 'Error',
    loadingApp: 'Cargando aplicación',
    loadingProfiles: 'Cargando perfiles',
    loadingPortal: 'Cargando portal',
    login: {
      success: 'Inicio de sesión exitoso.',
      invalidCredentials: 'Las credenciales son inválidas.'
    },
    register: {
        emailExists: 'El correo electrónico ya está registrado.',
        demoSuccess: '¡Registro de demostración exitoso! Bienvenido.'
    },
    roles: {
      STUDENT: 'Estudiante',
      TEACHER: 'Docente',
      COORDINATOR: 'Coordinador(a)',
      RECTOR: 'Rector(a)',
      ADMIN: 'Administrador',
      PSYCHOLOGY: 'Psicología',
      GUARDIAN: 'Acudiente',
      SUBJECT_TEACHER: 'Docente de {{subject}}'
    },
    subjects: {
        'Matemáticas': 'Matemáticas',
        'Lengua Castellana': 'Lengua Castellana',
        // Add all other subjects here
    },
    incidentTypes: {
        [IncidentType.SCHOOL_COEXISTENCE]: 'Convivencia Escolar',
        [IncidentType.UNIFORM_MISUSE]: 'Uso inapropiado del uniforme',
        [IncidentType.INFRASTRUCTURE_DAMAGE]: 'Daños a la infraestructura',
        [IncidentType.BULLYING_CYBERBULLYING]: 'Acoso y ciberacoso',
        [IncidentType.NON_COMPLIANCE]: 'Incumplimiento de deberes',
        [IncidentType.ACADEMIC_MISCONDUCT]: 'Faltas Académicas',
        [IncidentType.OTHER]: 'Otro',
    },
    settings: {
        notifications: {
            title: 'Notificaciones',
            saveSuccess: 'Configuración de notificaciones guardada.',
            newIncidentLabel: 'Nuevas Incidencias',
            newIncidentDescription: 'Recibir una notificación cuando se reporte una nueva incidencia.',
            weeklySummaryLabel: 'Resumen Semanal',
            weeklySummaryDescription: 'Recibir un email con el resumen de actividades de la semana.',
            assessmentRemindersLabel: 'Recordatorios de Evaluación',
            assessmentRemindersDescription: 'Notificaciones sobre próximas fechas de evaluación.'
        },
        language: {
            title: 'Idioma',
            description: 'Selecciona el idioma de la interfaz.',
            spanish: 'Español',
            english: 'Inglés'
        },
        appearance: {
            title: 'Apariencia',
            description: 'Elige cómo se ve la aplicación.',
            light: 'Claro',
            dark: 'Oscuro',
            system: 'Sistema'
        }
    },
    buttons: {
        edit: 'Editar',
        cancel: 'Cancelar',
        saveChanges: 'Guardar Cambios'
    }
  },
  en: {
    close: 'Close',
    studentLabel: 'Student',
    notifications: {
      newIncident: {
        title: 'New Incident Reported',
        message: 'A new incident of type {{incidentType}} has been registered.'
      },
      attentionReportSent: 'Attention report sent to psychology department.',
      psychologyReportUpdated: 'Psychology report updated.',
      accountUpgraded: 'Your account has been activated! Thank you for your purchase.',
    },
    success: 'Success',
    error: 'Error',
    loadingApp: 'Loading application',
    loadingProfiles: 'Loading profiles',
    loadingPortal: 'Loading portal',
    login: {
      success: 'Login successful.',
      invalidCredentials: 'Invalid credentials.'
    },
    register: {
        emailExists: 'This email is already registered.',
        demoSuccess: 'Demo registration successful! Welcome.'
    },
    roles: {
      STUDENT: 'Student',
      TEACHER: 'Teacher',
      COORDINATOR: 'Coordinator',
      RECTOR: 'Rector',
      ADMIN: 'Admin',
      PSYCHOLOGY: 'Psychology',
      GUARDIAN: 'Guardian',
      SUBJECT_TEACHER: '{{subject}} Teacher'
    },
    subjects: {
        'Matemáticas': 'Mathematics',
        'Lengua Castellana': 'Spanish Language',
        // Add all other subjects here
    },
    incidentTypes: {
        [IncidentType.SCHOOL_COEXISTENCE]: 'School Coexistence',
        [IncidentType.UNIFORM_MISUSE]: 'Improper use of uniform',
        [IncidentType.INFRASTRUCTURE_DAMAGE]: 'Infrastructure Damage',
        [IncidentType.BULLYING_CYBERBULLYING]: 'Bullying and Cyberbullying',
        [IncidentType.NON_COMPLIANCE]: 'Non-compliance with duties',
        [IncidentType.ACADEMIC_MISCONDUCT]: 'Academic Misconduct',
        [IncidentType.OTHER]: 'Other',
    },
     settings: {
        notifications: {
            title: 'Notifications',
            saveSuccess: 'Notification settings saved.',
            newIncidentLabel: 'New Incidents',
            newIncidentDescription: 'Receive a notification when a new incident is reported.',
            weeklySummaryLabel: 'Weekly Summary',
            weeklySummaryDescription: 'Receive an email with a summary of the week\'s activities.',
            assessmentRemindersLabel: 'Assessment Reminders',
            assessmentRemindersDescription: 'Notifications about upcoming assessment dates.'
        },
        language: {
            title: 'Language',
            description: 'Select the interface language.',
            spanish: 'Spanish',
            english: 'English'
        },
        appearance: {
            title: 'Appearance',
            description: 'Choose how the application looks.',
            light: 'Light',
            dark: 'Dark',
            system: 'System'
        }
    },
    buttons: {
        edit: 'Edit',
        cancel: 'Cancel',
        saveChanges: 'Save Changes'
    }
  }
};
