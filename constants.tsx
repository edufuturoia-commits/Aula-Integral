import React from 'react';
// FIX: Import ResourceType as a value, not just a type, to access its members.
import type { Page, Student, AssessmentData, Question, SubjectArea, Competency, Resource } from './types';
import { ResourceType } from './types';

export const HomeIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
);
export const ClassroomIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 12a5.995 5.995 0 00-3-5.197M15 21a9 9 0 00-3-1.921" /></svg>
);
export const AssessmentsIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);
export const ResourcesIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
);
export const ProfileIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
export const IncidentsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
);

export interface SidebarItem {
    name: Page;
    label: string;
    icon: React.FC<{className?: string}>;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { name: 'Dashboard', label: 'Inicio', icon: HomeIcon },
  { name: 'Classroom', label: 'Mi Aula', icon: ClassroomIcon },
  { name: 'Incidents', label: 'Incidencias', icon: IncidentsIcon },
  { name: 'Assessments', label: 'Evaluaciones', icon: AssessmentsIcon },
  { name: 'Resources', label: 'Recursos', icon: ResourcesIcon },
  { name: 'Profile', label: 'Perfil', icon: ProfileIcon },
];

export const SUBJECT_AREAS: SubjectArea[] = [
  'Matemáticas', 'Lengua Castellana', 'Inglés', 'Biología', 'Química', 
  'Física', 'Historia', 'Geografía', 'Constitución Política y Democracia', 
  'Educación Artística', 'Música', 'Educación Ética y en Valores Humanos', 
  'Filosofía', 'Educación Física', 'Educación Religiosa', 'Tecnología e Informática'
];

export const GRADES: string[] = [
  'Prejardín', 'Jardín', 'Grado de Transición', '1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°', '11°'
];
export const GROUPS: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];


export const COMPETENCIES: Competency[] = [
  'Resolución de Problemas', 'Comprensión Lectora', 'Pensamiento Crítico', 
  'Competencias Ciudadanas', 'Comunicación Escrita', 'Análisis Científico',
  'Expresión Artística', 'Competencia Digital', 'Pensamiento Histórico',
  'Bilingüismo', 'Competencia Motriz'
];

export const SCHOOL_LOCATIONS: string[] = [
  'Salón de Clase',
  'Patio de Recreo',
  'Comedor',
  'Biblioteca',
  'Laboratorio de Ciencias',
  'Sala de Informática',
  'Gimnasio',
  'Pasillos',
  'Baños',
  'Oficina',
  'Otro',
];

// FIX: Use enum members instead of string literals to ensure type safety.
export const RESOURCE_TYPES: ResourceType[] = [ResourceType.PDF, ResourceType.Video, ResourceType.Image, ResourceType.Document];

export const MOCK_STUDENTS: Student[] = [
  { id: 1, name: 'Ana Sofía Rodríguez', avatarUrl: 'https://picsum.photos/seed/1/100/100', grade: '5°', group: '1', lastIncident: 'Hace 2 días' },
  { id: 2, name: 'Juan David Pérez', avatarUrl: 'https://picsum.photos/seed/2/100/100', grade: '5°', group: '1', lastIncident: 'Hoy' },
  { id: 3, name: 'María Camila Gómez', avatarUrl: 'https://picsum.photos/seed/3/100/100', grade: '5°', group: '1', lastIncident: 'Hace 1 semana' },
  { id: 4, name: 'Santiago Rojas', avatarUrl: 'https://picsum.photos/seed/4/100/100', grade: '5°', group: '2' },
  { id: 5, name: 'Valentina Díaz', avatarUrl: 'https://picsum.photos/seed/5/100/100', grade: '5°', group: '2', lastIncident: 'Ayer' },
  { id: 6, name: 'Mateo Hernández', avatarUrl: 'https://picsum.photos/seed/6/100/100', grade: '6°', group: '1' },
  { id: 7, name: 'Isabella Moreno', avatarUrl: 'https://picsum.photos/seed/7/100/100', grade: '6°', group: '2', lastIncident: 'Hoy' },
  { id: 8, name: 'Andrés Felipe Jiménez', avatarUrl: 'https://picsum.photos/seed/8/100/100', grade: '6°', group: '2' },
  { id: 9, name: 'Sofía Castro', avatarUrl: 'https://picsum.photos/seed/9/100/100', grade: 'Jardín', group: '1' },
  { id: 10, name: 'Daniel Martínez', avatarUrl: 'https://picsum.photos/seed/10/100/100', grade: '11°', group: '3' },
];

export const MOCK_ASSESSMENT_DATA: AssessmentData[] = [
  { competency: 'Comprensión Lectora', classAverage: 85, studentAverage: 92 },
  { competency: 'Resolución de Problemas', classAverage: 78, studentAverage: 75 },
  { competency: 'Pensamiento Crítico', classAverage: 82, studentAverage: 88 },
  { competency: 'Competencias Ciudadanas', classAverage: 90, studentAverage: 95 },
  { competency: 'Comunicación Escrita', classAverage: 75, studentAverage: 80 },
];

export const MOCK_QUESTION_BANK: Question[] = [
  // Matemáticas
  { id: 'm1', text: 'Si un tren viaja a 120 km/h, ¿qué distancia recorrerá en 30 minutos?', area: 'Matemáticas', grade: '5°', competency: 'Resolución de Problemas' },
  { id: 'm2', text: 'Calcula el área de un rectángulo con lados de 15 cm y 10 cm.', area: 'Matemáticas', grade: '5°', competency: 'Resolución de Problemas' },
  { id: 'm3', text: 'Explica por qué la suma de los ángulos de un triángulo siempre es 180 grados.', area: 'Matemáticas', grade: '6°', competency: 'Pensamiento Crítico' },
  { id: 'm4', text: '¿Cuál es el siguiente número en la secuencia: 2, 4, 8, 16, ...?', area: 'Matemáticas', grade: '6°', competency: 'Resolución de Problemas' },
  
  // Humanidades: Lengua Castellana & Inglés
  { id: 'l1', text: 'Lee el siguiente párrafo y resume la idea principal en una oración.', area: 'Lengua Castellana', grade: '5°', competency: 'Comprensión Lectora' },
  { id: 'l2', text: 'Escribe un ensayo corto sobre la importancia del reciclaje.', area: 'Lengua Castellana', grade: '6°', competency: 'Comunicación Escrita' },
  { id: 'l3', text: 'Translate the following sentence to English: "El perro marrón corre rápidamente por el parque".', area: 'Inglés', grade: '5°', competency: 'Bilingüismo' },
  { id: 'l4', text: 'What is the past tense of the verb "to run"?', area: 'Inglés', grade: '6°', competency: 'Bilingüismo' },

  // Ciencias Naturales: Biología, Química, Física
  { id: 'cn1', text: 'Describe el proceso de la fotosíntesis en las plantas.', area: 'Biología', grade: '6°', competency: 'Análisis Científico' },
  { id: 'cn2', text: '¿Cuáles son los tres estados de la materia? Da un ejemplo de cada uno.', area: 'Química', grade: '5°', competency: 'Análisis Científico' },
  { id: 'cn3', text: 'Explica el concepto de gravedad con un ejemplo simple.', area: 'Física', grade: '6°', competency: 'Pensamiento Crítico' },

  // Ciencias Sociales: Historia, Geografía, Constitución
  { id: 'cs1', text: 'Explica dos derechos y dos deberes que tienen los niños en Colombia.', area: 'Constitución Política y Democracia', grade: '5°', competency: 'Competencias Ciudadanas' },
  { id: 'cs2', text: '¿Cuál es la capital de Colombia y dónde se ubica geográficamente?', area: 'Geografía', grade: '5°', competency: 'Pensamiento Histórico' },
  { id: 'cs3', text: 'Nombra un evento importante de la independencia de Colombia.', area: 'Historia', grade: '6°', competency: 'Pensamiento Histórico' },
  
  // Otras Áreas
  { id: 'ea1', text: 'Dibuja un paisaje que represente tu lugar favorito.', area: 'Educación Artística', grade: '5°', competency: 'Expresión Artística' },
  { id: 'ev1', text: '¿Qué significa el valor del "respeto" y cómo lo aplicas en tu vida diaria?', area: 'Educación Ética y en Valores Humanos', grade: '6°', competency: 'Pensamiento Crítico' },
  { id: 'ef1', text: 'Describe las reglas básicas del fútbol.', area: 'Educación Física', grade: '5°', competency: 'Competencia Motriz' },
  { id: 'er1', text: 'Relata una parábola o historia importante de una tradición religiosa que conozcas.', area: 'Educación Religiosa', grade: '5°', competency: 'Comprensión Lectora' },
  { id: 'ti1', text: '¿Cómo crearías una presentación de diapositivas sobre tu animal favorito?', area: 'Tecnología e Informática', grade: '6°', competency: 'Competencia Digital' },
];

// FIX: Use enum members instead of string literals to ensure type safety.
export const MOCK_RESOURCES: Resource[] = [
    { id: 'res_pdf_01', title: 'Guía de Multiplicaciones', description: 'Ejercicios prácticos para reforzar las tablas de multiplicar.', type: ResourceType.PDF, subjectArea: 'Matemáticas', url: '#' },
    { id: 'res_vid_01', title: 'El Ciclo del Agua', description: 'Video animado explicando las fases del ciclo del agua.', type: ResourceType.Video, subjectArea: 'Biología', url: '#' },
    { id: 'res_img_01', title: 'Mapa de Colombia', description: 'Mapa político de Colombia con sus departamentos y capitales.', type: ResourceType.Image, subjectArea: 'Geografía', url: '#' },
    { id: 'res_doc_01', title: 'Taller de Comprensión Lectora', description: 'Cuento corto con preguntas para evaluar la comprensión.', type: ResourceType.Document, subjectArea: 'Lengua Castellana', url: '#' },
    { id: 'res_pdf_02', title: 'Fotosíntesis para Niños', description: 'Infografía detallada sobre el proceso de la fotosíntesis.', type: ResourceType.PDF, subjectArea: 'Biología', url: '#' },
    { id: 'res_vid_02', title: 'La Batalla de Boyacá', description: 'Corto documental sobre el evento histórico.', type: ResourceType.Video, subjectArea: 'Historia', url: '#' },
    { id: 'res_pdf_03', title: 'English Verb Tenses', description: 'Tabla resumen con los tiempos verbales en inglés.', type: ResourceType.PDF, subjectArea: 'Inglés', url: '#' },
    { id: 'res_img_02', title: 'El Sistema Solar', description: 'Ilustración de los planetas del sistema solar.', type: ResourceType.Image, subjectArea: 'Física', url: '#' },
];