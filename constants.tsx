import React from 'react';
import type { Page, Student, AssessmentData, Question, SubjectArea, Competency, Resource, StudentAssessmentResult, ParentMessage, Citation, User, Announcement, Teacher, CoordinationMessage, InstitutionProfileData, EventPoster, SubjectGrades, InboxConversation } from './types';
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
    { name: 'Communication', label: 'Bandeja de Entrada', icon: CommunicationIcon },
    { name: 'Assessments', label: 'Evaluaciones', icon: AssessmentsIcon },
    { name: 'Calificaciones', label: 'Calificaciones', icon: GradesIcon },
    { name: 'Resources', label: 'Biblioteca', icon: ResourcesIcon },
    { name: 'Profile', label: 'Mi Perfil', icon: ProfileIcon },
    { name: 'Settings', label: 'Ajustes', icon: SettingsIcon },
    { name: 'Rectory', label: 'Rectoría', icon: RectoryIcon },
    { name: 'InstitutionProfile', label: 'Perfil Institucional', icon: InstitutionProfileIcon },
    { name: 'ParentPortal', label: 'Portal de Acudientes', icon: ParentPortalIcon },
    { name: 'StudentPortal', label: 'Portal del Estudiante', icon: StudentPortalIcon },
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
    },
    { id: 2, name: 'Sofía López', role: Role.STUDENT, avatarUrl: 'https://picsum.photos/seed/student2/100/100', grade: '11º', group: 'A', dateOfBirth: '2007-01-10', },
    { id: 3, name: 'Carlos Martínez', role: Role.STUDENT, avatarUrl: 'https://picsum.photos/seed/student3/100/100', grade: '11º', group: 'A', dateOfBirth: '2024-08-05', },
];


export const MOCK_PARENT_MESSAGES: ParentMessage[] = [
    { studentId: 1, studentName: 'Ana Sofía García', studentAvatar: 'https://picsum.photos/seed/1/100/100', lastMessage: 'Profe, ¿me confirma la fecha del examen?', timestamp: '10:45 AM', unread: true, conversation: [{ sender: 'parent', text: 'Profe, ¿me confirma la fecha del examen?', timestamp: '10:45 AM' }] },
    { studentId: 5, studentName: 'Carlos Andrés Ruiz', studentAvatar: 'https://picsum.photos/seed/5/100/100', lastMessage: 'Gracias por la retroalimentación.', timestamp: 'Ayer', unread: false, conversation: [{ sender: 'teacher', text: 'El trabajo de Carlos estuvo excelente.', timestamp: 'Ayer' }, { sender: 'parent', text: 'Gracias por la retroalimentación.', timestamp: 'Ayer' }] },
];

export const MOCK_CITATIONS: Citation[] = [
    { id: 'cit1', studentId: 3, studentName: 'Camila Rodriguez', studentAvatar: 'https://picsum.photos/seed/3/100/100', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], time: '08:00', location: 'Coordinación', reason: 'Seguimiento académico', status: CitationStatus.PENDING },
    { id: 'cit2', studentId: 10, studentName: 'Isabella Martínez', studentAvatar: 'https://picsum.photos/seed/10/100/100', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], time: '10:30', location: 'Coordinación', reason: 'Incidencia de convivencia', status: CitationStatus.CONFIRMED },
];

export const MOCK_MESSAGE_HISTORY: CoordinationMessage[] = [
    { id: 'cm1', sender: 'coordination', text: 'Profe, por favor recordar a los estudiantes del 11-A la reunión de mañana.', timestamp: 'Hace 3 horas', readByTeacher: false },
    { id: 'cm2', sender: 'teacher', text: 'Entendido, Coordinación. Yo les informo ahora en la primera hora.', timestamp: 'Hace 3 horas', readByTeacher: true },
    { id: 'cm3', sender: 'coordination', text: 'Perfecto, muchas gracias. Adicionalmente, necesitamos el listado de los estudiantes para la salida pedagógica.', timestamp: 'Hace 2 horas', readByTeacher: false },
    { id: 'cm4', sender: 'teacher', text: 'Claro, se lo envío al final de la jornada. Ya lo tengo listo.', timestamp: 'Hace 1 hora', readByTeacher: true },
];

export const MOCK_INBOX_CONVERSATIONS: InboxConversation[] = [
  {
    id: 'parent-1',
    participantId: 1,
    participantName: 'Acudiente de Juan David Pérez',
    participantAvatar: 'https://picsum.photos/seed/student1/100/100',
    participantRole: Role.STUDENT,
    lastMessage: 'Perfecto, muchas gracias por la aclaración.',
    timestamp: '10:30 AM',
    unread: false,
    conversation: [
        { sender: 'participant', text: 'Buenos días, quisiera saber cómo va Juan David en Matemáticas.', timestamp: '9:15 AM'},
        { sender: 'self', text: 'Buenos días. Juan David ha mejorado mucho, especialmente en cálculo. Su última nota fue 4.5.', timestamp: '9:20 AM'},
        { sender: 'participant', text: 'Perfecto, muchas gracias por la aclaración.', timestamp: '10:30 AM'},
    ]
  },
  {
    id: 'teacher-1037612345',
    participantId: '1037612345',
    participantName: 'Ana María Rojas',
    participantAvatar: 'https://picsum.photos/seed/teacher1/100/100',
    participantRole: Role.TEACHER,
    lastMessage: 'Listo, quedo atento. Gracias.',
    timestamp: 'Ayer',
    unread: true,
    conversation: [
        { sender: 'self', text: 'Hola Ana María, necesito por favor el reporte de notas del 11-A para el cierre de período. Plazo máximo mañana.', timestamp: 'Ayer'},
        { sender: 'participant', text: 'Hola Coordinación. Claro que sí, ya casi lo termino. Se lo envío hoy en la tarde.', timestamp: 'Ayer'},
        { sender: 'self', text: 'Listo, quedo atento. Gracias.', timestamp: 'Ayer'},
    ]
  },
   {
    id: 'student-3',
    participantId: 3,
    participantName: 'Carlos Martínez',
    participantAvatar: 'https://picsum.photos/seed/student3/100/100',
    participantRole: Role.STUDENT,
    lastMessage: 'Sí, señor. Entendido.',
    timestamp: 'Hace 2 horas',
    unread: false,
    conversation: [
        { sender: 'self', text: 'Carlos, por favor preséntate en coordinación a la salida.', timestamp: 'Hace 2 horas'},
        { sender: 'participant', text: 'Sí, señor. Entendido.', timestamp: 'Hace 2 horas'},
    ]
  },
];

export const MOCK_TEACHER_INBOX_CONVERSATIONS: InboxConversation[] = [
  {
    id: 'parent-1',
    participantId: 1,
    participantName: 'Acudiente de Juan David Pérez',
    participantAvatar: 'https://picsum.photos/seed/student1/100/100',
    participantRole: Role.STUDENT, 
    lastMessage: 'Muchas gracias por la información, profe.',
    timestamp: '11:00 AM',
    unread: true,
    conversation: [
        { sender: 'participant', text: 'Buenos días profe Ana, ¿cómo está el rendimiento de Juan David en matemáticas?', timestamp: '10:50 AM'},
        { sender: 'self', text: 'Hola, buenos días. Juan David va muy bien, ha mejorado bastante en los últimos temas. Su participación es excelente.', timestamp: '10:55 AM'},
        { sender: 'participant', text: 'Muchas gracias por la información, profe.', timestamp: '11:00 AM'},
    ]
  },
  {
    id: 'parent-2',
    participantId: 2,
    participantName: 'Acudiente de Sofía López',
    participantAvatar: 'https://picsum.photos/seed/student2/100/100',
    participantRole: Role.STUDENT,
    lastMessage: 'Entendido, estaré pendiente. Gracias.',
    timestamp: 'Ayer',
    unread: false,
    conversation: [
        { sender: 'self', text: 'Buenas tardes, le recuerdo que mañana es la entrega del taller de geometría para Sofía.', timestamp: 'Ayer'},
        { sender: 'participant', text: 'Entendido, estaré pendiente. Gracias.', timestamp: 'Ayer'},
    ]
  },
  {
    id: 'coordination-987654321',
    participantId: '987654321',
    participantName: 'Carlos Mendoza',
    participantAvatar: 'https://picsum.photos/seed/coordinator/100/100',
    participantRole: Role.COORDINATOR,
    lastMessage: 'Perfecto, gracias.',
    timestamp: 'Hace 2 días',
    unread: false,
    conversation: [
        { sender: 'participant', text: 'Profe Ana, por favor no olvide entregar las planillas de notas del 11-A mañana.', timestamp: 'Hace 2 días'},
        { sender: 'self', text: 'Claro que sí, Coordinación. Mañana a primera hora las tiene en su oficina.', timestamp: 'Hace 2 días'},
        { sender: 'participant', text: 'Perfecto, gracias.', timestamp: 'Hace 2 días'},
    ]
  }
];

export const MOCK_PARENT_PORTAL_CONVERSATIONS: InboxConversation[] = [
  {
    id: 'teacher-1037612345',
    participantId: '1037612345',
    participantName: 'Ana María Rojas (Matemáticas)',
    participantAvatar: 'https://picsum.photos/seed/teacher1/100/100',
    participantRole: Role.TEACHER,
    lastMessage: 'Hola, buenos días. Juan David va muy bien...',
    timestamp: '10:55 AM',
    unread: false,
    conversation: [
        { sender: 'self', text: 'Buenos días profe Ana, ¿cómo está el rendimiento de Juan David en matemáticas?', timestamp: '10:50 AM'},
        { sender: 'participant', text: 'Hola, buenos días. Juan David va muy bien, ha mejorado bastante en los últimos temas. Su participación es excelente.', timestamp: '10:55 AM'},
    ]
  },
  {
    id: 'teacher-1037612346',
    participantId: '1037612346',
    participantName: 'Carlos Pérez (Lengua Castellana)',
    participantAvatar: 'https://picsum.photos/seed/teacher2/100/100',
    participantRole: Role.TEACHER,
    lastMessage: 'Sí, por supuesto. Puede pasar el viernes.',
    timestamp: 'Ayer',
    unread: true,
    conversation: [
        { sender: 'self', text: 'Profesor Carlos, ¿podríamos agendar una reunión para hablar sobre el ensayo de Juan David?', timestamp: 'Ayer'},
        { sender: 'participant', text: 'Sí, por supuesto. Puede pasar el viernes.', timestamp: 'Ayer'},
    ]
  },
  {
    id: 'coordination-987654321',
    participantId: '987654321',
    participantName: 'Coordinación Académica',
    participantAvatar: 'https://picsum.photos/seed/coordinator/100/100',
    participantRole: Role.COORDINATOR,
    lastMessage: 'Recibido, lo revisaremos y le daremos respuesta.',
    timestamp: 'Hace 3 días',
    unread: false,
    conversation: [
        { sender: 'self', text: 'Buenos días Coordinación, quisiera solicitar un permiso de salida temprano para Juan David el próximo lunes.', timestamp: 'Hace 3 días'},
        { sender: 'participant', text: 'Recibido, lo revisaremos y le daremos respuesta.', timestamp: 'Hace 3 días'},
    ]
  },
];


export const MOCK_INSTITUTION_PROFILE: InstitutionProfileData = {
    name: 'Institución Educativa Integral Maya',
    daneCode: '123456789012',
    nit: '900.123.456-7',
    rector: 'Dr. Armando Paredes',
    address: 'Calle Falsa 123, Ciudad Primavera',
    phone: '(+57) 300 123 4567',
    email: 'contacto@iemaya.edu.co',
    logoUrl: 'https://picsum.photos/seed/logo/200/200',
    primaryColor: '#005A9C',
    secondaryColor: '#FFCD00',
};

export const MOCK_STUDENT_ASSESSMENT_RESULTS: StudentAssessmentResult[] = [
    { id: 'asm_1_stud_1', studentId: 1, assessmentId: 'asm_1', assessmentTitle: 'Examen de Biología Celular', score: 85, completedAt: new Date().toISOString() },
    { id: 'asm_2_stud_1', studentId: 1, assessmentId: 'asm_2', assessmentTitle: 'Quiz de Comprensión Lectora', score: 92, completedAt: new Date().toISOString() },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    {
        id: 'ann_1',
        title: 'Reunión General de Padres de Familia',
        content: 'Se convoca a todos los padres de familia a la reunión general que se llevará a cabo el próximo viernes a las 7:00 AM en el auditorio.',
        recipients: 'all',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        sentBy: 'Rectoría',
    },
     {
        id: 'ann_2',
        title: 'Día Deportivo - Grado 11',
        content: 'El próximo lunes se realizará el día deportivo para los estudiantes de grado 11. Recuerden traer uniforme de educación física e hidratación.',
        recipients: { grade: '11º', group: 'A' },
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        sentBy: 'Coordinación de Deportes',
    }
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
            { id: 'mat-11a-p1-item1', name: 'Taller de Límites', weight: 0.25 },
            { id: 'mat-11a-p1-item2', name: 'Quiz de Derivadas', weight: 0.25 },
            { id: 'mat-11a-p1-item3', name: 'Examen Parcial', weight: 0.30 },
            { id: 'mat-11a-p1-item4', name: 'Actitud y Participación', weight: 0.20 },
        ],
        scores: [
            { studentId: 1, gradeItemId: 'mat-11a-p1-item1', score: 4.5 },
            { studentId: 1, gradeItemId: 'mat-11a-p1-item2', score: 3.8 },
            { studentId: 1, gradeItemId: 'mat-11a-p1-item3', score: 4.2 },
            { studentId: 1, gradeItemId: 'mat-11a-p1-item4', score: 5.0 },
            { studentId: 2, gradeItemId: 'mat-11a-p1-item1', score: 3.0 },
            { studentId: 2, gradeItemId: 'mat-11a-p1-item2', score: 3.5 },
            { studentId: 2, gradeItemId: 'mat-11a-p1-item3', score: 2.8 },
            { studentId: 2, gradeItemId: 'mat-11a-p1-item4', score: 4.0 },
            { studentId: 3, gradeItemId: 'mat-11a-p1-item1', score: 5.0 },
            { studentId: 3, gradeItemId: 'mat-11a-p1-item2', score: null },
            { studentId: 3, gradeItemId: 'mat-11a-p1-item3', score: 4.8 },
            { studentId: 3, gradeItemId: 'mat-11a-p1-item4', score: 4.5 },
        ],
        observations: {
            1: "Juan David ha demostrado un excelente dominio de los temas del período. Su participación es destacada. ¡Sigue así!",
            2: "Sofía necesita reforzar los conceptos vistos para el examen parcial. Se recomienda estudiar los talleres en clase.",
            3: "Carlos muestra gran potencial, pero debe asegurarse de presentar todas las evaluaciones para tener una nota completa.",
        },
        isLocked: false,
    },
    {
        id: 'Lengua Castellana-11º-A-Primer Período',
        subject: 'Lengua Castellana',
        grade: '11º',
        group: 'A',
        period: AcademicPeriod.PRIMERO,
        teacherId: '1037612346',
        gradeItems: [
            { id: 'len-11a-p1-item1', name: 'Ensayo', weight: 0.40 },
            { id: 'len-11a-p1-item2', name: 'Exposición', weight: 0.40 },
            { id: 'len-11a-p1-item3', name: 'Autoevaluación', weight: 0.20 },
        ],
        scores: [
            { studentId: 1, gradeItemId: 'len-11a-p1-item1', score: 4.8 },
            { studentId: 1, gradeItemId: 'len-11a-p1-item2', score: 4.0 },
            { studentId: 1, gradeItemId: 'len-11a-p1-item3', score: 5.0 },
            { studentId: 2, gradeItemId: 'len-11a-p1-item1', score: 3.2 },
            { studentId: 2, gradeItemId: 'len-11a-p1-item2', score: 3.8 },
            { studentId: 2, gradeItemId: 'len-11a-p1-item3', score: 4.0 },
        ],
        observations: {
            1: "Excelente capacidad de argumentación en el ensayo.",
            2: "Debe mejorar la fluidez y seguridad en las exposiciones orales."
        },
        isLocked: false,
    },
];
