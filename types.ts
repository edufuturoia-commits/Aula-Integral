


export type Page = 'Dashboard' | 'Classroom' | 'Assessments' | 'Resources' | 'Profile' | 'Incidents';

export interface Student {
  id: number;
  name: string;
  avatarUrl: string;
  grade: string;
  group: string;
  lastIncident?: string;
}

export enum IncidentType {
  CONVIVENCIA_ESCOLAR = 'Convivencia Escolar',
  USO_UNIFORME = 'Uso inapropiado del uniforme',
  DANOS_INFRAESTRUCTURA = 'Daños a la infraestructura',
  ACOSO_CIBERACOSO = 'Acoso y ciberacoso',
  INCUMPLIMIENTO = 'Incumplimiento',
  FALTAS_ACADEMICAS = 'Faltas Académicas',
  OTRO = 'Otro',
}

export interface Incident {
  id: string;
  studentId: number;
  studentName: string;
  type: IncidentType;
  otherTypeDescription?: string;
  isVictim: boolean;
  notes: string;
  timestamp: string;
  synced: boolean;
  teacherName: string;
  location: string;
  archived?: boolean;
}

export interface NotificationSettings {
  newIncident: boolean;
  weeklySummary: boolean;
  assessmentReminders: boolean;
}

export interface User {
  name: string;
  avatarUrl: string;
  role: string;
  email?: string;
  phone?: string;
  notifications?: NotificationSettings;
}

export interface AssessmentData {
  competency: string;
  classAverage: number;
  studentAverage: number;
}

// Nuevos tipos para el módulo de Evaluaciones
export type SubjectArea =
  | 'Matemáticas'
  | 'Lengua Castellana'
  | 'Inglés'
  | 'Biología'
  | 'Química'
  | 'Física'
  | 'Historia'
  | 'Geografía'
  | 'Constitución Política y Democracia'
  | 'Educación Artística'
  | 'Música'
  | 'Educación Ética y en Valores Humanos'
  | 'Filosofía'
  | 'Educación Física'
  | 'Educación Religiosa'
  | 'Tecnología e Informática';

export type Competency =
  | 'Comprensión Lectora'
  | 'Resolución de Problemas'
  | 'Pensamiento Crítico'
  | 'Competencias Ciudadanas'
  | 'Comunicación Escrita'
  | 'Análisis Científico'
  | 'Expresión Artística'
  | 'Competencia Digital'
  | 'Pensamiento Histórico'
  | 'Bilingüismo'
  | 'Competencia Motriz';


export interface Question {
  id: string;
  text: string;
  area: SubjectArea;
  grade: string;
  competency: Competency;
}

export interface Assessment {
  id: string;
  title: string;
  createdAt: string;
  questions: Question[];
}

// Nuevos tipos para el módulo de Recursos
export enum ResourceType {
    PDF = 'PDF',
    Video = 'Video',
    Image = 'Imagen',
    Document = 'Documento',
}

export interface Resource {
    id: string;
    title: string;
    description: string;
    type: ResourceType;
    subjectArea: SubjectArea;
    url: string; // En un caso real, sería la URL al bucket de S3/GCS
    content?: string; // Contenido generado por IA
}