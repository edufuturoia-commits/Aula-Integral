import React from 'react';
import type { Page, Student, AssessmentData, Question, SubjectArea, Competency, Resource, StudentAssessmentResult, ParentMessage, Citation, User, Announcement, Teacher } from './types';
import { ResourceType, CitationStatus, IncidentType, AttendanceStatus } from './types';

// --- ICONS ---

export const HomeIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
);
export const ClassroomIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);
export const AssessmentsIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
);
export const ResourcesIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
);
export const IncidentsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
export const ProfileIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
export const ParentPortalIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>
);

// --- NAVIGATION ---

export const SIDEBAR_ITEMS: { name: Page; label: string; icon: React.FC<{className?: string}> }[] = [
  { name: 'Dashboard', label: 'Dashboard', icon: HomeIcon },
  { name: 'Classroom', label: 'Mi Aula', icon: ClassroomIcon },
  { name: 'Incidents', label: 'Coordinación', icon: IncidentsIcon },
  { name: 'Assessments', label: 'Evaluaciones', icon: AssessmentsIcon },
  { name: 'Resources', label: 'Recursos', icon: ResourcesIcon },
  { name: 'ParentPortal', label: 'Portal Acudientes', icon: ParentPortalIcon },
  { name: 'Profile', label: 'Mi Perfil', icon: ProfileIcon },
];

// --- MOCK DATA ---

export const MOCK_USER: User = {
  name: 'Ana Milena Rojas',
  avatarUrl: 'https://picsum.photos/seed/user/100/100',
  role: 'Coordinador(a)',
};

export const MOCK_TEACHERS: Teacher[] = [
  { id: 't_math_01', name: 'Carlos Mendoza', subject: 'Matemáticas', avatarUrl: 'https://picsum.photos/seed/teacher1/100/100', isHomeroomTeacher: true, assignedGroup: { grade: '6º', group: 'A' } },
  { id: 't_span_02', name: 'Lucía Fernández', subject: 'Lengua Castellana', avatarUrl: 'https://picsum.photos/seed/teacher2/100/100', isHomeroomTeacher: false },
  { id: 't_sci_03', name: 'Javier Gómez', subject: 'Biología', avatarUrl: 'https://picsum.photos/seed/teacher3/100/100', isHomeroomTeacher: true, assignedGroup: { grade: '7º', group: 'C' } },
  { id: 't_eng_04', name: 'Sofia Vergara', subject: 'Inglés', avatarUrl: 'https://picsum.photos/seed/teacher4/100/100', isHomeroomTeacher: false },
];

export const GRADES = ['Prejardín', 'Jardín', 'Transición', '1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º', '11º'];
export const GROUPS = ['A', 'B', 'C', 'D', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export const MOCK_STUDENTS: Student[] = [
  { id: 1, name: 'Ana Sofía Cadavid', avatarUrl: 'https://picsum.photos/seed/1/100/100', grade: '6º', group: 'A', lastIncident: 'Uso de celular' },
  { id: 2, name: 'Juan David Restrepo', avatarUrl: 'https://picsum.photos/seed/2/100/100', grade: '6º', group: 'A' },
  { id: 3, name: 'Mariana Gallego', avatarUrl: 'https://picsum.photos/seed/3/100/100', grade: '6º', group: 'B' },
  { id: 4, name: 'Samuel Londoño', avatarUrl: 'https://picsum.photos/seed/4/100/100', grade: '7º', group: 'C', lastIncident: 'Falta de respeto' },
  { id: 5, name: 'Valentina Zapata', avatarUrl: 'https://picsum.photos/seed/5/100/100', grade: '7º', group: 'C' },
  { id: 6, name: 'Matías Osorio', avatarUrl: 'https://picsum.photos/seed/6/100/100', grade: '8º', group: '1' },
  { id: 7, name: 'Isabella Montoya', avatarUrl: 'https://picsum.photos/seed/7/100/100', grade: '8º', group: '1' },
  { id: 8, name: 'Andrés Felipe Correa', avatarUrl: 'https://picsum.photos/seed/8/100/100', grade: '9º', group: '2' },
  { id: 9, name: 'Luciana Ramírez', avatarUrl: 'https://picsum.photos/seed/9/100/100', grade: '9º', group: '2' },
  { id: 10, name: 'Jerónimo Bedoya', avatarUrl: 'https://picsum.photos/seed/10/100/100', grade: '10º', group: 'A' },
  { id: 11, name: 'Salomé Henao', avatarUrl: 'https://picsum.photos/seed/11/100/100', grade: '11º', group: 'B' },
  { id: 12, name: 'Emmanuel Giraldo', avatarUrl: 'https://picsum.photos/seed/12/100/100', grade: 'Transición', group: 'D' },
];

export const MOCK_ASSESSMENT_DATA: AssessmentData[] = [
  { competency: 'Comprensión Lectora', classAverage: 85, studentAverage: 92 },
  { competency: 'Resolución de Problemas', classAverage: 78, studentAverage: 81 },
  { competency: 'Pensamiento Crítico', classAverage: 82, studentAverage: 75 },
  { competency: 'Competencias Ciudadanas', classAverage: 90, studentAverage: 95 },
  { competency: 'Bilingüismo', classAverage: 75, studentAverage: 88 },
];

export const SUBJECT_AREAS: SubjectArea[] = ['Matemáticas', 'Lengua Castellana', 'Inglés', 'Biología', 'Química', 'Física', 'Historia', 'Geografía', 'Constitución Política y Democracia', 'Educación Artística', 'Música', 'Educación Ética y en Valores Humanos', 'Filosofía', 'Educación Física', 'Educación Religiosa', 'Tecnología e Informática'];
export const COMPETENCIES: Competency[] = ['Comprensión Lectora', 'Resolución de Problemas', 'Pensamiento Crítico', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Análisis Científico', 'Expresión Artística', 'Competencia Digital', 'Pensamiento Histórico', 'Bilingüismo', 'Competencia Motriz'];
export const RESOURCE_TYPES: ResourceType[] = [ResourceType.PDF, ResourceType.Video, ResourceType.Image, ResourceType.Document];
export const SCHOOL_LOCATIONS: string[] = ['Salón de Clase', 'Patio de Recreo', 'Comedor', 'Biblioteca', 'Gimnasio', 'Laboratorio', 'Baños', 'Pasillos', 'Entrada/Salida', 'Otro'];


export const MOCK_QUESTIONS: Question[] = []; // Usually generated by AI

export const MOCK_RESOURCES: Resource[] = [
  { id: '1', title: 'Guía de Fracciones', description: 'PDF con ejercicios de suma y resta de fracciones.', type: ResourceType.PDF, subjectArea: 'Matemáticas', url: '#' },
  { id: '2', title: 'El Ciclo del Agua', description: 'Video explicativo sobre las fases del ciclo del agua.', type: ResourceType.Video, subjectArea: 'Biología', url: '#' },
  { id: '3', title: 'Mapa Político de Colombia', description: 'Imagen en alta resolución del mapa de Colombia.', type: ResourceType.Image, subjectArea: 'Geografía', url: '#' },
];

export const MOCK_STUDENT_ASSESSMENT_RESULTS: StudentAssessmentResult[] = [
    { studentId: 1, assessmentId: 'asm_math_1', assessmentTitle: 'Evaluación de Álgebra Trimestre 1', score: 88, completedAt: '2024-05-10' },
    { studentId: 1, assessmentId: 'asm_lang_1', assessmentTitle: 'Comprensión Lectora: El Ensayo', score: 95, completedAt: '2024-05-15' },
    { studentId: 1, assessmentId: 'asm_sci_1', assessmentTitle: 'Laboratorio de Química: Reacciones', score: 76, completedAt: '2024-05-20' },
];

export const MOCK_PARENT_MESSAGES: ParentMessage[] = [
    { studentId: 1, studentName: 'Ana Sofía Cadavid', studentAvatar: 'https://picsum.photos/seed/1/100/100', lastMessage: 'Entendido, profe. Muchas gracias por la aclaración.', timestamp: 'Ayer', unread: false, conversation: [] },
    { studentId: 4, studentName: 'Samuel Londoño', studentAvatar: 'https://picsum.photos/seed/4/100/100', lastMessage: 'Buenas tardes, quería saber si es posible tener una reunión.', timestamp: 'Hace 2 días', unread: true, conversation: [] },
];

export const MOCK_CITATIONS: Citation[] = [
    { id: 'cit_1', studentId: 4, studentName: 'Samuel Londoño', studentAvatar: 'https://picsum.photos/seed/4/100/100', date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0], time: '07:30', location: 'Coordinación', reason: 'Seguimiento por incidencias recurrentes', status: CitationStatus.PENDING },
    { id: 'cit_2', studentId: 1, studentName: 'Ana Sofía Cadavid', studentAvatar: 'https://picsum.photos/seed/1/100/100', date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0], time: '10:00', location: 'Rectoría', reason: 'Reconocimiento académico', status: CitationStatus.CONFIRMED },
    { id: 'cit_3', studentId: 3, studentName: 'Mariana Gallego', studentAvatar: 'https://picsum.photos/seed/3/100/100', date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split('T')[0], time: '09:00', location: 'Coordinación', reason: 'Acuerdos de convivencia', status: CitationStatus.COMPLETED },
    { id: 'cit_4', studentId: 8, studentName: 'Andrés Felipe Correa', studentAvatar: 'https://picsum.photos/seed/8/100/100', date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], time: '11:00', location: 'Coordinación', reason: 'Revisión de rendimiento académico', status: CitationStatus.CANCELLED, cancellationReason: 'Acudiente reporta incapacidad médica.' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1',
    title: 'Reunión General de Acudientes - Tercer Trimestre',
    content: 'Estimados acudientes, les recordamos que la reunión general para la entrega de informes del tercer trimestre se llevará a cabo el próximo viernes a las 7:00 AM en el auditorio principal. Su asistencia es de vital importancia.',
    recipients: 'all',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    sentBy: 'Coord. Académica',
  },
  {
    id: 'ann_2',
    title: 'Campaña de Vacunación',
    content: 'Se informa a los acudientes de los grados Prejardín, Jardín y Transición que la jornada de vacunación se realizará el día lunes en las instalaciones del colegio. Por favor, enviar el carnet de vacunación.',
    recipients: { grade: 'Transición', group: 'D' },
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    sentBy: 'Coord. Convivencia',
  },
  {
    id: 'ann_3',
    title: 'Salida Pedagógica - Grado 5º',
    content: 'Recordamos a los padres de familia del grado 5º que la salida pedagógica al museo interactivo es este miércoles. Los estudiantes deben venir con el uniforme de educación física y traer su almuerzo.',
    recipients: { grade: '5º', group: 'A' },
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    sentBy: 'Coord. Académica',
  },
];