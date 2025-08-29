export type Page = 'Dashboard' | 'Classroom' | 'Assessments' | 'Resources' | 'Profile' | 'Incidents' | 'ParentPortal' | 'StudentPortal' | 'Rectory' | 'InstitutionProfile';

export enum DocumentType {
  REGISTRO_CIVIL = 'Registro Civil',
  TARJETA_IDENTIDAD = 'Tarjeta de Identidad',
}

export interface Student {
  id: number;
  name: string;
  avatarUrl: string;
  grade: string;
  group: string;
  lastIncident?: string;
  email?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  documentType?: DocumentType;
  documentNumber?: string;
}

export enum IncidentType {
  CONVIVENCIA_ESCOLAR = 'Convivencia Escolar',
  USO_UNIFORME = 'Uso inapropiado del uniforme',
  DANOS_INFRAESTRUCTRUCTURA = 'Daños a la infraestructura',
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

export type SubjectArea = 'Matemáticas' | 'Lengua Castellana' | 'Inglés' | 'Biología' | 'Química' | 'Física' | 'Historia' | 'Geografía' | 'Constitución Política y Democracia' | 'Educación Artística' | 'Música' | 'Educación Ética y en Valores Humanos' | 'Filosofía' | 'Educación Física' | 'Educación Religiosa' | 'Tecnología e Informática';
export type Competency = 'Comprensión Lectora' | 'Resolución de Problemas' | 'Pensamiento Crítico' | 'Competencias Ciudadanas' | 'Comunicación Escrita' | 'Análisis Científico' | 'Expresión Artística' | 'Competencia Digital' | 'Pensamiento Histórico' | 'Bilingüismo' | 'Competencia Motriz';

export interface Question {
    id: string;
    text: string;
    area: SubjectArea;
    grade: string;
    competency: Competency;
    options?: string[];
    correctAnswer?: number;
}

export interface Assessment {
    id: string;
    title: string;
    createdAt: string;
    questions: Question[];
}

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
    url: string;
    content?: string; // For AI-generated content
}

export enum AttendanceStatus {
    PRESENT = 'Presente',
    ABSENT = 'Ausente',
    TARDY = 'Tarde',
    EXCUSED = 'Excusa',
    SPECIAL_PERMIT = 'Permiso Especial',
}

export interface AttendanceRecord {
    id: string; // e.g., `${studentId}-${date}`
    studentId: number;
    date: string; // YYYY-MM-DD
    status: AttendanceStatus;
    synced: boolean;
}

export interface StudentAssessmentResult {
    studentId: number;
    assessmentId: string;
    assessmentTitle: string;
    score: number;
    completedAt: string;
}

export interface ParentMessage {
    studentId: number;
    studentName: string;
    studentAvatar: string;
    lastMessage: string;
    timestamp: string;
    unread: boolean;
    conversation: { sender: 'teacher' | 'parent'; text: string; timestamp: string }[];
}

export interface CoordinationMessage {
    id: string;
    sender: 'teacher' | 'coordination';
    text: string;
    timestamp: string;
    readByTeacher: boolean;
}

export enum CitationStatus {
    PENDING = 'Pendiente',
    CONFIRMED = 'Confirmada',
    COMPLETED = 'Realizada',
    CANCELLED = 'Cancelada',
}

export interface Citation {
    id: string;
    studentId: number;
    studentName: string;
    studentAvatar: string;
    date: string;
    time: string;
    location: string;
    reason: string;
    status: CitationStatus;
    cancellationReason?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  recipients: 'all' | { grade: string; group: string };
  timestamp: string;
  sentBy: string;
}

export interface Teacher {
  id: string; // Cédula
  name: string;
  avatarUrl: string;
  subject: SubjectArea;
  dateOfBirth?: string;
  address?: string;
  email?: string;
  phone?: string;
  isHomeroomTeacher?: boolean;
  assignedGroup?: {
    grade: string;
    group: string;
  };
  password?: string;
  passwordChanged?: boolean;
}

export interface InstitutionProfileData {
  name: string;
  daneCode: string;
  nit: string;
  rector: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string; // base64 data URL
  primaryColor: string;
  secondaryColor: string;
}

export interface EventPoster {
  id: string;
  title: string;
  imageUrl: string; // base64 data URL
  eventDate: string; // YYYY-MM-DD
  createdAt: string; // ISO string
}