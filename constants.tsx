
import React from 'react';
import type { Page, Student, AssessmentData, Question, SubjectArea, Competency, Resource, StudentAssessmentResult, ParentMessage, Citation, User, Announcement, Teacher, CoordinationMessage, InstitutionProfileData, EventPoster } from './types';
import { ResourceType, CitationStatus, IncidentType, AttendanceStatus, DocumentType } from './types';

// --- ICONS ---

export const HomeIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 19v-4a2 2 0 012-2h10a2 2 0 012 2v4M5 19h14" /></svg>
);
export const ClassroomIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);
export const AssessmentsIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
);
export const ResourcesIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
);
export const ProfileIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
export const IncidentsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
export const ParentPortalIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);
export const StudentPortalIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM9 17v-1a4 4 0 014-4h2a4 4 0 014 4v1m-6 4H9a2 2 0 01-2-2v-1a2 2 0 012-2h6a2 2 0 012 2v1a2 2 0 01-2 2z" /></svg>
);
export const RectoryIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-4h1m-1 4h1m-1-8h1" /></svg>
);
export const InstitutionProfileIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-1.781-4.121M12 11c-3.333 0-6 2.686-6 6v1h12v-1c0-3.314-2.667-6-6-6z" /></svg>
);
export const LogoutIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
);


// --- SIDEBAR ---

export const SIDEBAR_ITEMS: { name: Page; label: string; icon: React.FC<{className?: string}> }[] = [
  { name: 'Dashboard', label: 'Panel de Control', icon: HomeIcon },
  { name: 'Classroom', label: 'Mi Aula', icon: ClassroomIcon },
  { name: 'Assessments', label: 'Evaluaciones', icon: AssessmentsIcon },
  { name: 'Resources', label: 'Recursos', icon: ResourcesIcon },
  { name: 'Profile', label: 'Mi Perfil', icon: ProfileIcon },
  { name: 'Incidents', label: 'Coordinación', icon: IncidentsIcon },
  { name: 'ParentPortal', label: 'Portal Acudientes', icon: ParentPortalIcon },
  { name: 'StudentPortal', label: 'Portal Estudiantes', icon: StudentPortalIcon },
  { name: 'Rectory', label: 'Rectoría', icon: RectoryIcon },
  { name: 'InstitutionProfile', label: 'Perfil Institucional', icon: InstitutionProfileIcon },
];

// --- STATIC ARRAYS ---
export const GRADES = ['Prejardín', 'Jardín', 'Transición', '1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º', '11º'];
export const GROUPS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'B', 'C', 'D', 'F'];
export const SUBJECT_AREAS: SubjectArea[] = ['Matemáticas', 'Lengua Castellana', 'Inglés', 'Biología', 'Química', 'Física', 'Historia', 'Geografía', 'Constitución Política y Democracia', 'Educación Artística', 'Música', 'Educación Ética y en Valores Humanos', 'Filosofía', 'Educación Física', 'Educación Religiosa', 'Tecnología e Informática'];
export const COMPETENCIES: Competency[] = ['Comprensión Lectora', 'Resolución de Problemas', 'Pensamiento Crítico', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Análisis Científico', 'Expresión Artística', 'Competencia Digital', 'Pensamiento Histórico', 'Bilingüismo', 'Competencia Motriz'];
export const RESOURCE_TYPES: ResourceType[] = [ResourceType.PDF, ResourceType.Video, ResourceType.Image, ResourceType.Document];
export const SCHOOL_LOCATIONS = ['Salón de clases', 'Patio de recreo', 'Cafetería', 'Biblioteca', 'Laboratorio', 'Sala de informática', 'Cancha', 'Baños', 'Pasillos', 'Otro'];

// --- MOCK DATA ---

export const MOCK_STUDENTS: Student[] = [
  { id: 1, name: 'Ana María Rojas', avatarUrl: 'https://picsum.photos/seed/1/100/100', grade: '8º', group: 'A', lastIncident: 'Uso inapropiado del uniforme' },
  { id: 2, name: 'Juan David Pérez', avatarUrl: 'https://picsum.photos/seed/2/100/100', grade: '8º', group: 'A' },
  { id: 3, name: 'Sofía Castro', avatarUrl: 'https://picsum.photos/seed/3/100/100', grade: '8º', group: 'A' },
  { id: 4, name: 'Carlos Andrés Vélez', avatarUrl: 'https://picsum.photos/seed/4/100/100', grade: '8º', group: 'B', lastIncident: 'Faltas Académicas' },
  { id: 5, name: 'Valentina Restrepo', avatarUrl: 'https://picsum.photos/seed/5/100/100', grade: '8º', group: 'B' },
  { id: 6, name: 'Mateo González', avatarUrl: 'https://picsum.photos/seed/6/100/100', grade: '9º', group: 'A' },
  { id: 7, name: 'Isabella Gómez', avatarUrl: 'https://picsum.photos/seed/7/100/100', grade: '9º', group: 'A' },
  { id: 8, name: 'Santiago Rodríguez', avatarUrl: 'https://picsum.photos/seed/8/100/100', grade: '9º', group: 'B' },
  { id: 9, name: 'Mariana López', avatarUrl: 'https://picsum.photos/seed/9/100/100', grade: '9º', group: 'B', lastIncident: 'Convivencia Escolar' },
  { id: 10, name: 'Sebastián Díaz', avatarUrl: 'https://picsum.photos/seed/10/100/100', grade: '10º', group: 'C' },
];

export const MOCK_TEACHERS: Teacher[] = [
    { id: '1037612345', name: 'Carlos Zapata', avatarUrl: 'https://picsum.photos/seed/teacher1/100/100', subject: 'Matemáticas', email: 'carlos.zapata@institucion.edu.co', phone: '3101234567', isHomeroomTeacher: true, assignedGroup: {grade: '8º', group: 'A'} },
    { id: '43567890', name: 'Lucía Fernández', avatarUrl: 'https://picsum.photos/seed/teacher2/100/100', subject: 'Lengua Castellana', email: 'lucia.fernandez@institucion.edu.co', phone: '3119876543' },
    { id: '79812345', name: 'Andrés Morales', avatarUrl: 'https://picsum.photos/seed/teacher3/100/100', subject: 'Biología', email: 'andres.morales@institucion.edu.co', phone: '3205558899' },
    { id: '12345678', name: 'Profesor de Prueba', avatarUrl: 'https://picsum.photos/seed/teacher4/100/100', subject: 'Tecnología e Informática', email: 'profe@test.com', phone: '3001112233', password: '123456', passwordChanged: false },
];

export const MOCK_ADMIN_USER: Teacher = {
  id: 'admin',
  name: 'Admin User',
  avatarUrl: 'https://picsum.photos/seed/admin/100/100',
  subject: 'Tecnología e Informática',
  email: 'admin@test.com',
  phone: '3000000000',
  password: 'admin',
  passwordChanged: true,
};


export const MOCK_ASSESSMENT_DATA: AssessmentData[] = [
    { competency: 'Comprensión Lectora', classAverage: 78, studentAverage: 85 },
    { competency: 'Resolución de Problemas', classAverage: 82, studentAverage: 90 },
    { competency: 'Pensamiento Crítico', classAverage: 75, studentAverage: 72 },
    { competency: 'Competencias Ciudadanas', classAverage: 88, studentAverage: 92 },
    { competency: 'Comunicación Escrita', classAverage: 70, studentAverage: 78 },
    { competency: 'Análisis Científico', classAverage: 81, studentAverage: 83 },
];

export const MOCK_QUESTIONS: Question[] = [];
export const MOCK_STUDENT_ASSESSMENT_RESULTS: StudentAssessmentResult[] = [
    { studentId: 1, assessmentId: 'asm_hist_1', assessmentTitle: 'Evaluación de Historia Universal', score: 88, completedAt: '2024-05-10T10:00:00Z'},
    { studentId: 1, assessmentId: 'asm_math_1', assessmentTitle: 'Examen de Álgebra', score: 76, completedAt: '2024-05-12T14:30:00Z'},
];
export const MOCK_RESOURCES: Resource[] = [
    { id: 'res1', title: 'Guía de Laboratorio: Célula', description: 'Práctica para identificar las partes de la célula.', type: ResourceType.PDF, subjectArea: 'Biología', url: '#'},
    { id: 'res2', title: 'Video: La Revolución Francesa', description: 'Documental de 20 minutos sobre las causas y consecuencias.', type: ResourceType.Video, subjectArea: 'Historia', url: '#'},
    { id: 'res3', title: 'Ejercicios de Fracciones', description: 'Taller práctico con 20 ejercicios de suma, resta, multiplicación y división de fracciones.', type: ResourceType.PDF, subjectArea: 'Matemáticas', url: '#'},
];

export const MOCK_PARENT_MESSAGES: ParentMessage[] = [
  { studentId: 1, studentName: 'Ana María Rojas', studentAvatar: 'https://picsum.photos/seed/1/100/100', lastMessage: 'Entendido, profe. Gracias.', timestamp: 'Hace 2 horas', unread: false, conversation: [ {sender: 'parent', text: 'Buenas tardes profe, ¿cómo va Ana en el taller?', timestamp: 'Hace 3 horas'}, {sender: 'teacher', text: '¡Hola! Muy bien, ya casi lo termina.', timestamp: 'Hace 2 horas'}, {sender: 'parent', text: 'Entendido, profe. Gracias.', timestamp: 'Hace 2 horas'} ] },
  { studentId: 4, studentName: 'Carlos Andrés Vélez', studentAvatar: 'https://picsum.photos/seed/4/100/100', lastMessage: 'Profe, buenas, una pregunta sobre la tarea...', timestamp: 'Ayer', unread: true, conversation: [ {sender: 'parent', text: 'Profe, buenas, una pregunta sobre la tarea...', timestamp: 'Ayer'} ] },
];

export const MOCK_CITATIONS: Citation[] = [
  { id: 'cit1', studentId: 9, studentName: 'Mariana López', studentAvatar: 'https://picsum.photos/seed/9/100/100', date: '2024-08-05', time: '08:00', location: 'Coordinación', reason: 'Seguimiento por incidencia de convivencia', status: CitationStatus.PENDING },
  { id: 'cit2', studentId: 1, studentName: 'Ana María Rojas', studentAvatar: 'https://picsum.photos/seed/1/100/100', date: '2024-08-02', time: '10:30', location: 'Coordinación', reason: 'Revisión de desempeño académico', status: CitationStatus.CONFIRMED },
  { id: 'cit3', studentId: 4, studentName: 'Carlos Andrés Vélez', studentAvatar: 'https://picsum.photos/seed/4/100/100', date: '2024-07-28', time: '09:00', location: 'Rectoría', reason: 'Faltas académicas recurrentes', status: CitationStatus.COMPLETED },
];

export const MOCK_COORDINATION_MESSAGES: CoordinationMessage[] = [
    { id: 'coord1', sender: 'coordination', text: 'Profe, por favor recordar a los estudiantes de 8A sobre la salida pedagógica de mañana.', timestamp: 'Hace 3 horas', readByTeacher: false },
    { id: 'coord2', sender: 'teacher', text: 'Recibido. Ya les recordé y envié la autorización a los acudientes.', timestamp: 'Hace 1 hora', readByTeacher: true },
];

export const MOCK_USER: User = { name: 'Adriana Botero', avatarUrl: 'https://picsum.photos/seed/coordinator/100/100', role: 'Coordinador(a)' };
export const COORDINATOR_PROFILE: User = { name: 'Adriana Botero', avatarUrl: 'https://picsum.photos/seed/coordinator/100/100', role: 'Coordinador(a)' };

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    { id: 'ann1', title: 'Reunión General de Padres', content: 'Se les recuerda a todos los padres de familia la reunión general que se llevará a cabo el próximo viernes a las 6:00 PM en el auditorio.', recipients: 'all', timestamp: '2024-07-28T10:00:00Z', sentBy: 'Rectoría' },
    { id: 'ann2', title: 'Salida Pedagógica Grado 8', content: 'Recordamos a los estudiantes de grado 8 que la salida al parque explora es mañana. No olvidar el uniforme de educación física y el carnet.', recipients: { grade: '8º', group: 'A' }, timestamp: '2024-07-29T08:00:00Z', sentBy: 'Coordinación' },
];

export const MOCK_INSTITUTION_PROFILE: InstitutionProfileData = {
    name: "Institución Educativa Ficticia",
    daneCode: "123456789012",
    nit: "900.123.456-7",
    rector: "Dr. Armando Casas",
    address: "Calle Falsa 123, Ciudad Ejemplo, Colombia",
    phone: "(+57) 604 123 4567",
    email: "contacto@institucionficticia.edu.co",
    logoUrl: "https://via.placeholder.com/150/005A9C/FFFFFF?text=Logo",
    primaryColor: "#005A9C",
    secondaryColor: "#FFCD00",
};

export const MOCK_EVENT_POSTERS: EventPoster[] = [];
