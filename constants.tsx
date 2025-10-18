import React from 'react';
import type { Page, Student, AssessmentData, Question, SubjectArea, Competency, Resource, StudentAssessmentResult, Citation, User, Announcement, Teacher, InstitutionProfileData, EventPoster, SubjectGrades, InboxConversation, DesempenoDescriptor, Guardian, Conversation } from './types';
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const IncidentsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const CommunicationIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

export const ParentPortalIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

export const StudentPortalIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-2.172 1.959a59.902 59.902 0 0010.399 5.841 59.902 59.902 0 0010.399-5.841l-2.172-1.959" />
    </svg>
);

export const RectoryIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

export const InstitutionProfileIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

export const CalendarIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export const ICFESIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l9-5-9-5-9 5 9 5z" transform="translate(0, 6)"/>
    </svg>
);


export const LogoutIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

// --- SIDEBAR ---

export const SIDEBAR_ITEMS: { name: Page; label: string; icon: React.FC<{className?: string}> }[] = [
    { name: 'Dashboard', label: 'Panel de Control', icon: DashboardIcon },
    { name: 'Classroom', label: 'Mi Salón de Clases', icon: ClassroomIcon },
    { name: 'Incidents', label: 'Coordinación Académica', icon: IncidentsIcon },
    { name: 'TutorMode', label: 'Modo Tutor', icon: TutorIcon },
    { name: 'Communication', label: 'Bandeja de Entrada', icon: CommunicationIcon },
    { name: 'Assessments', label: 'Evaluaciones', icon: AssessmentsIcon },
    { name: 'Calificaciones', label: 'Calificaciones', icon: GradesIcon },
    { name: 'Consolidado', label: 'Consolidados', icon: ConsolidadoIcon },
    { name: 'Resources', label: 'Biblioteca', icon: ResourcesIcon },
    { name: 'Eventos', label: 'Eventos', icon: CalendarIcon },
    { name: 'Profile', label: 'Mi Perfil', icon: ProfileIcon },
    { name: 'Settings', label: 'Ajustes', icon: SettingsIcon },
    { name: 'Rectory', label: 'Rectoría', icon: RectoryIcon },
    { name: 'InstitutionProfile', label: 'Perfil Institucional', icon: InstitutionProfileIcon },
    { name: 'ParentPortal', label: 'Portal de Acudientes', icon: ParentPortalIcon },
    { name: 'StudentPortal', label: 'Portal del Estudiante', icon: StudentPortalIcon },
    { name: 'SimulacroICFES', label: 'Simulacro ICFES', icon: ICFESIcon },
];

// --- MOCK DATA & CONSTANTS ---

const preschoolAndPrimaryGroups = ["A", "B", "C", "D"];
const secondaryGroups = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const highSchoolGroups = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "A", "B", "C", "D", "F", "H"];

export const GRADE_GROUP_MAP: Record<string, string[]> = {
  "Prejardín": preschoolAndPrimaryGroups,
  "Jardín": preschoolAndPrimaryGroups,
  "Transición": preschoolAndPrimaryGroups,
  "1º": preschoolAndPrimaryGroups,
  "2º": preschoolAndPrimaryGroups,
  "3º": preschoolAndPrimaryGroups,
  "4º": preschoolAndPrimaryGroups,
  "5º": preschoolAndPrimaryGroups,
  "6º": secondaryGroups,
  "7º": secondaryGroups,
  "8º": secondaryGroups,
  "9º": secondaryGroups,
  "10º": highSchoolGroups,
  "11º": highSchoolGroups,
};

export const GRADES = Object.keys(GRADE_GROUP_MAP);
export const GROUPS = [...new Set(Object.values(GRADE_GROUP_MAP).flat())];

export const SUBJECT_AREAS: SubjectArea[] = ['Matemáticas', 'Lengua Castellana', 'Inglés', 'Biología', 'Química', 'Física', 'Historia', 'Geografía', 'Constitución Política y Democracia', 'Educación Artística', 'Música', 'Educación Ética y en Valores Humanos', 'Filosofía', 'Educación Física', 'Educación Religiosa', 'Tecnología e Informática', 'Convivencia', 'Todas', 'Coordinadores', 'Administrativos'];
export const COMPETENCIES: Competency[] = ['Comprensión Lectora', 'Resolución de Problemas', 'Pensamiento Crítico', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Análisis Científico', 'Expresión Artística', 'Competencia Digital', 'Pensamiento Histórico', 'Bilingüismo', 'Competencia Motriz'];
export const RESOURCE_TYPES: ResourceType[] = [ResourceType.PDF, ResourceType.Video, ResourceType.Image, ResourceType.Document];
export const SCHOOL_LOCATIONS = ['Salón de Clases', 'Patio de Recreo', 'Baños', 'Pasillos', 'Comedor Escolar', 'Biblioteca', 'Sala de Informática', 'Laboratorio', 'Afueras de la Institución', 'Otro'];
export const ACADEMIC_PERIODS: AcademicPeriod[] = [AcademicPeriod.PRIMERO, AcademicPeriod.SEGUNDO, AcademicPeriod.TERCERO, AcademicPeriod.CUARTO];

export const MOCK_DESEMPENOS_BANK: DesempenoDescriptor[] = [
  { id: 'd-math-1', description: 'Identifica y usa los números naturales para contar y realizar operaciones básicas.', area: 'Matemáticas' },
  { id: 'd-math-2', description: 'Resuelve problemas de suma y resta con números naturales en diferentes contextos.', area: 'Matemáticas' },
  { id: 'd-math-3', description: 'Aplica conceptos de geometría para describir formas y figuras en su entorno.', area: 'Matemáticas' },
  { id: 'd-lang-1', description: 'Lee en voz alta con fluidez y entonación adecuadas, demostrando comprensión.', area: 'Lengua Castellana' },
  { id: 'd-lang-2', description: 'Produce textos escritos que responden a diversas necesidades comunicativas y siguen una estructura lógica.', area: 'Lengua Castellana' },
  { id: 'd-lang-3', description: 'Participa en conversaciones expresando sus ideas y respetando las opiniones de los demás.', area: 'Lengua Castellana' },
  { id: 'd-sci-1', description: 'Observa y describe los seres vivos y su entorno, identificando sus características.', area: 'Biología' },
];

export const MOCK_ASSESSMENT_DATA: AssessmentData[] = [
    { competency: 'Comprensión Lectora', classAverage: 82, studentAverage: 88 },
    { competency: 'Resolución de Problemas', classAverage: 75, studentAverage: 72 },
    { competency: 'Pensamiento Crítico', classAverage: 85, studentAverage: 91 },
    { competency: 'Competencias Ciudadanas', classAverage: 78, studentAverage: 85 },
    { competency: 'Análisis Científico', classAverage: 70, studentAverage: 78 },
];

export const MOCK_RESOURCES: Resource[] = [
    { id: '1', title: 'Guía de Álgebra', description: 'Ejercicios resueltos de ecuaciones lineales.', type: ResourceType.PDF, subjectArea: 'Matemáticas', url: '#' },
    { id: '2', title: 'Video: La Célula', description: 'Explicación animada de las partes de la célula.', type: ResourceType.Video, subjectArea: 'Biología', url: '#' },
    { id: '3', title: 'Mapa Conceptual del Sistema Solar', description: 'Infografía con los planetas y sus características.', type: ResourceType.Image, subjectArea: 'Geografía', url: '#' },
    { id: '4', title: 'Resumen de la Independencia', description: 'Documento con los hitos más importantes.', type: ResourceType.Document, subjectArea: 'Historia', url: '#' },
];

// Fix: Export MOCK_COORDINATOR_USER so it can be imported in other files.
export const MOCK_COORDINATOR_USER: Teacher = {
    id: '987654321', // Cedula
    name: 'Carlos Mendoza',
    role: Role.COORDINATOR,
    avatarUrl: 'https://picsum.photos/seed/coordinator/100/100',
    subject: 'Coordinadores',
    email: 'coordinacion@institucion.edu.co',
    phone: '3019876543',
    dateOfBirth: '1980-02-20',
    password: '987654321',
    passwordChanged: true,
    status: TeacherStatus.ACTIVE,
    notifications: {
        newIncident: true,
        weeklySummary: true,
        assessmentReminders: false,
    }
};

const MOCK_ADMIN_USER: Teacher = {
    id: 'admin',
    name: 'Administrador del Sistema',
    role: Role.ADMIN,
    avatarUrl: 'https://picsum.photos/seed/admin/100/100',
    subject: 'Administrativos',
    email: 'admin@institucion.edu.co',
    phone: '3001112233',
    dateOfBirth: '1980-01-01',
    password: 'admin',
    passwordChanged: true,
    status: TeacherStatus.ACTIVE,
    notifications: {
        newIncident: true,
        weeklySummary: true,
        assessmentReminders: true,
    }
};

const MOCK_RECTOR_USER: Teacher = {
    id: 'rector',
    name: 'Armando Paredes',
    role: Role.RECTOR,
    avatarUrl: 'https://picsum.photos/seed/rector/100/100',
    subject: 'Administrativos',
    email: 'rector@institucion.edu.co',
    phone: '3021112233',
    dateOfBirth: '1975-11-10',
    password: 'rector',
    passwordChanged: true,
    status: TeacherStatus.ACTIVE,
    notifications: {
        newIncident: true,
        weeklySummary: true,
        assessmentReminders: true,
    }
};

export const MOCK_TEACHERS: Teacher[] = [
    MOCK_ADMIN_USER,
    MOCK_COORDINATOR_USER,
    MOCK_RECTOR_USER,
    {
        id: '1037612345',
        name: 'Ana María Rojas',
        role: Role.TEACHER,
        avatarUrl: 'https://picsum.photos/seed/teacher1/100/100',
        subject: 'Matemáticas',
        email: 'profe.ana@institucion.edu.co',
        phone: '3101234567',
        dateOfBirth: '1990-05-15',
        isHomeroomTeacher: true,
        assignedGroup: { grade: '11º', group: 'A' },
        password: '1037612345',
        passwordChanged: true,
        status: TeacherStatus.ACTIVE,
    },
    {
        id: '1037612346',
        name: 'Carlos Pérez',
        role: Role.TEACHER,
        avatarUrl: 'https://picsum.photos/seed/teacher2/100/100',
        subject: 'Lengua Castellana',
        email: 'profe.carlos@institucion.edu.co',
        phone: '3111234567',
        dateOfBirth: '1985-04-10',
        password: '1037612346',
        passwordChanged: true,
        status: TeacherStatus.ACTIVE,
    },
    {
        id: '1037612347',
        name: 'Lucia Gómez',
        role: Role.TEACHER,
        avatarUrl: 'https://picsum.photos/seed/teacher3/100/100',
        subject: 'Inglés',
        email: 'profe.lucia@institucion.edu.co',
        phone: '3121234567',
        dateOfBirth: '1992-08-25',
        password: '1037612347',
        passwordChanged: true,
        status: TeacherStatus.ACTIVE,
    },
];

export const MOCK_STUDENTS: Student[] = [
     {
        id: 1,
        name: 'Juan David Pérez',
        role: Role.STUDENT,
        avatarUrl: 'https://picsum.photos/seed/student1/100/100',
        grade: '11º',
        group: 'A',
        email: 'juan.perez@email.com',
        dateOfBirth: '2007-03-20',
        password: '1122334455',
        passwordChanged: true,
        documentNumber: '1122334455',
    },
    { id: 2, name: 'Sofía López', role: Role.STUDENT, avatarUrl: 'https://picsum.photos/seed/student2/100/100', grade: '11º', group: 'A', dateOfBirth: '2007-01-10', },
    { id: 3, name: 'Carlos Martínez', role: Role.STUDENT, avatarUrl: 'https://picsum.photos/seed/student3/100/100', grade: '11º', group: 'A', dateOfBirth: '2024-08-05', },
];

export const MOCK_GUARDIANS: Guardian[] = [
    {
        id: '123456789',
        name: 'Luisa Fernanda Gonzalez',
        email: 'luisa.gonzalez@email.com',
        phone: '3151234567',
        studentIds: [1], // Guardian for Juan David Pérez
        password: '123456789',
        passwordChanged: true,
    }
];

export const MOCK_CITATIONS: Citation[] = [
    { id: 'cit1', studentId: 1, studentName: 'Juan David Pérez', studentAvatar: 'https://picsum.photos/seed/student1/100/100', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], time: '08:00', location: 'Coordinación', reason: 'Seguimiento académico', status: CitationStatus.PENDING },
    { id: 'cit2', studentId: 2, studentName: 'Sofía López', studentAvatar: 'https://picsum.photos/seed/student2/100/100', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], time: '10:30', location: 'Coordinación', reason: 'Incidencia de convivencia', status: CitationStatus.CONFIRMED },
];

export const MOCK_CONVERSATIONS_DATA: Conversation[] = [
  {
    id: '1037612345-123456789',
    participantIds: ['1037612345', '123456789'],
    messages: [
      { senderId: '123456789', text: 'Buenos días profe Ana, ¿cómo está el rendimiento de Juan David en matemáticas?', timestamp: new Date(Date.now() - 3600000 * 2).toISOString()},
      { senderId: '1037612345', text: 'Hola, buenos días. Juan David va muy bien, ha mejorado bastante en los últimos temas. Su participación es excelente.', timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString()},
      { senderId: '123456789', text: 'Muchas gracias por la información, profe.', timestamp: new Date(Date.now() - 3600000 * 1).toISOString()},
    ],
  },
  {
    id: '1037612346-123456789',
    participantIds: ['1037612346', '123456789'],
    messages: [
        { senderId: '123456789', text: 'Profesor Carlos, ¿podríamos agendar una reunión para hablar sobre el ensayo de Juan David?', timestamp: new Date(Date.now() - 86400000 * 2).toISOString()},
        { senderId: '1037612346', text: 'Sí, por supuesto. Puede pasar el viernes.', timestamp: new Date(Date.now() - 86400000 * 1).toISOString()},
    ],
  },
  {
    id: '987654321-123456789',
    participantIds: ['987654321', '123456789'],
    messages: [
        { senderId: '987654321', text: 'Buenos días, le recuerdo la reunión de seguimiento de Juan David el viernes.', timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
        { senderId: '123456789', text: 'Recibido, gracias.', timestamp: new Date(Date.now() - 86400000 * 3 + 60000).toISOString() },
    ],
  },
  {
    id: '987654321-1037612345',
    participantIds: ['987654321', '1037612345'],
    messages: [
        { senderId: '987654321', text: 'Hola Ana María, necesito por favor el reporte de notas del 11-A para el cierre de período. Plazo máximo mañana.', timestamp: new Date(Date.now() - 86400000 * 1).toISOString()},
        { senderId: '1037612345', text: 'Hola Coordinación. Claro que sí, ya casi lo termino. Se lo envío hoy en la tarde.', timestamp: new Date(Date.now() - 86400000 * 1 + 60000).toISOString()},
        { senderId: '987654321', text: 'Listo, quedo atento. Gracias.', timestamp: new Date(Date.now() - 86400000 * 1 + 120000).toISOString()},
    ]
  },
   {
    id: '987654321-3',
    participantIds: ['987654321', 3],
    messages: [
        { senderId: '987654321', text: 'Carlos, por favor preséntate en coordinación a la salida.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString()},
        { senderId: 3, text: 'Sí, señor. Entendido.', timestamp: new Date(Date.now() - 3600000 * 2 + 60000).toISOString()},
    ]
  }
];

// FIX: Add and export mock data for assessment results, subject grades, announcements, and institution profile to resolve import errors.
export const MOCK_STUDENT_ASSESSMENT_RESULTS: StudentAssessmentResult[] = [
    { id: 'asm_math_1_1', studentId: 1, assessmentId: 'asm_math_1', assessmentTitle: 'Quiz de Álgebra Básica', score: 4.5, completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'asm_math_1_2', studentId: 2, assessmentId: 'asm_math_1', assessmentTitle: 'Quiz de Álgebra Básica', score: 3.8, completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'asm_lang_1_1', studentId: 1, assessmentId: 'asm_lang_1', assessmentTitle: 'Comprensión Lectora', score: 4.8, completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
];

export const MOCK_SUBJECT_GRADES: SubjectGrades[] = [
  {
    id: 'Matemáticas-11º-A-Primer Período',
    subject: 'Matemáticas',
    grade: '11º',
    group: 'A',
    period: AcademicPeriod.PRIMERO,
    teacherId: '1037612345',
    gradeItems: [
      { id: 'quiz1', name: 'Quiz Fracciones', weight: 0.2 },
      { id: 'exam1', name: 'Parcial 1', weight: 0.3 },
      { id: 'homework1', name: 'Tarea Geometría', weight: 0.1 },
      { id: 'final1', name: 'Examen Final', weight: 0.4 },
    ],
    scores: [
      { studentId: 1, gradeItemId: 'quiz1', score: 4.5 },
      { studentId: 1, gradeItemId: 'exam1', score: 4.8 },
      { studentId: 1, gradeItemId: 'homework1', score: 5.0 },
      { studentId: 1, gradeItemId: 'final1', score: 4.2 },
      { studentId: 2, gradeItemId: 'quiz1', score: 3.5 },
      { studentId: 2, gradeItemId: 'exam1', score: 4.0 },
      { studentId: 2, gradeItemId: 'homework1', score: 4.8 },
      { studentId: 2, gradeItemId: 'final1', score: 3.9 },
      { studentId: 3, gradeItemId: 'quiz1', score: 2.5 },
      { studentId: 3, gradeItemId: 'exam1', score: 3.0 },
      { studentId: 3, gradeItemId: 'homework1', score: 4.0 },
      { studentId: 3, gradeItemId: 'final1', score: 2.8 },
    ],
    observations: {
      1: 'Excelente desempeño, Juan David demuestra gran habilidad para la resolución de problemas.',
      2: 'Sofía ha mostrado una mejora constante. Debe seguir practicando los temas del parcial.',
      3: 'Carlos necesita reforzar los conceptos básicos. Se recomienda tutoría.'
    },
    isLocked: false,
  },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    {
        id: 'ann1',
        title: 'Reunión General de Padres de Familia',
        content: 'Se convoca a todos los padres de familia y acudientes a la reunión general que se llevará a cabo el próximo viernes a las 7:00 AM en el auditorio principal.',
        recipients: 'all_parents',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        sentBy: 'Rectoría',
    },
    {
        id: 'ann2',
        title: 'Salida Pedagógica Grado 11º',
        content: 'Recordamos a los estudiantes de grado 11º que la salida pedagógica al museo se realizará el día de mañana. Por favor, no olvidar la autorización firmada.',
        recipients: { grade: '11º', group: 'A' },
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        sentBy: 'Coordinación',
    }
];

export const MOCK_INSTITUTION_PROFILE: InstitutionProfileData = {
  name: 'Institución Educativa Ficticia',
  daneCode: '123456789012',
  nit: '900.123.456-7',
  rector: 'Armando Paredes',
  address: 'Calle Falsa 123, Ciudad Ejemplo',
  phone: '300 123 4567',
  email: 'contacto@institucion.edu.co',
  // FIX: Add missing primaryColor and secondaryColor properties to match InstitutionProfileData type.
  logoUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjE1IiByeT0iMTUiIGZpbGw9IiMwMDVBOUMiLz48dGV4dCB4PSI1MCUiIHk9IjUyJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNlcmlmIiBmb250LXNpemU9IjQwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPkFJTTwvdGV4dD48L3N2Zz4=',
  primaryColor: '#005A9C',
  secondaryColor: '#FFC72C',
};