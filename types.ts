export type Page = 'Dashboard' | 'Classroom' | 'Assessments' | 'Resources' | 'Profile' | 'Settings' | 'Incidents' | 'ParentPortal' | 'StudentPortal' | 'Rectory' | 'InstitutionProfile' | 'Calificaciones' | 'Communication';

export enum DocumentType {
  REGISTRO_CIVIL = 'Registro Civil',
  TARJETA_IDENTIDAD = 'Tarjeta de Identidad',
}

export enum Role {
  STUDENT = 'Estudiante',
  TEACHER = 'Docente',
  COORDINATOR = 'Coordinador',
  RECTOR = 'Rector',
  ADMIN = 'Administrador',
}

export interface Student {
  id: number;
  name: string;
  avatarUrl: string;
  grade: string;
  group: string;
  role: Role;
  lastIncident?: string;
  email?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  documentType?: DocumentType;
  documentNumber?: string;
  password?: string;
  passwordChanged?: boolean;
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

export enum IncidentStatus {
  ACTIVE = 'Activa',
  DECLINED = 'Declinada',
  ATTENDED = 'Atendida',
  ARCHIVED = 'Archivada',
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
  teacherName: string;
  location: string;
  status: IncidentStatus;
  // FIX: Added optional synced property to align with usage in IncidentModal and Incidents pages.
  synced?: boolean;
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

export type SubjectArea = 'Matemáticas' | 'Lengua Castellana' | 'Inglés' | 'Biología' | 'Química' | 'Física' | 'Historia' | 'Geografía' | 'Constitución Política y Democracia' | 'Educación Artística' | 'Música' | 'Educación Ética y en Valores Humanos' | 'Filosofía' | 'Educación Física' | 'Educación Religiosa' | 'Tecnología e Informática' | 'Convivencia' | 'Todas' | 'Coordinadores' | 'Administrativos';
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
    assignedGroups?: { grade: string; group: string }[];
    assignedStudentIds?: number[];
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
    // FIX: Add missing status property
    status: AttendanceStatus;
    // FIX: Added optional synced property to align with usage in AttendanceTaker.
    synced?: boolean;
}

export interface StudentAssessmentResult {
    id: string; // Composite key: `${assessmentId}_${studentId}`
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
    RESCHEDULE_REQUESTED = 'Reasignación Solicitada',
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
  recipients: 'all' | 'all_teachers' | 'all_parents' | 'all_students' | { grade: string; group: string } | { teacherId: string };
  timestamp: string;
  sentBy: string;
}

export enum TeacherStatus {
  ACTIVE = 'Activo',
  RETIRED = 'Pensionado',
  ON_COMMISSION = 'En Comisión',
}

export interface Teacher {
  id: string; // Cédula
  name: string;
  avatarUrl: string;
  role: Role;
  subject: SubjectArea;
  dateOfBirth?: string;
  address?: string;
  email?: string;
  phone?: string;
  status?: TeacherStatus;
  isHomeroomTeacher?: boolean;
  assignedGroup?: {
    grade: string;
    group: string;
  };
  password?: string;
  passwordChanged?: boolean;
  notifications?: NotificationSettings;
  isDemo?: boolean;
  demoStartDate?: string;
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

// --- Grade Management System Types ---

export enum AcademicPeriod {
  PRIMERO = 'Primer Período',
  SEGUNDO = 'Segundo Período',
  TERCERO = 'Tercer Período',
  CUARTO = 'Cuarto Período',
}

export enum Desempeno {
    SUPERIOR = 'Superior',
    ALTO = 'Alto',
    BASICO = 'Básico',
    BAJO = 'Bajo',
}


export interface GradeItem {
  id: string; // e.g., 'quiz1-math-p1'
  name: string; // e.g., 'Quiz de Fracciones'
  weight: number; // e.g., 0.20 for 20%
}

export interface StudentScore {
  studentId: number;
  gradeItemId: string;
  score: number | null; // null if not graded yet. Score is out of 5.0
}

// This represents the entire grade setup for a subject in a period for a specific class group
export interface SubjectGrades {
  id: string; // composite key e.g., 'Matemáticas-11-A-PRIMERO'
  subject: SubjectArea;
  grade: string;
  group: string;
  period: AcademicPeriod;
  gradeItems: GradeItem[];
  scores: StudentScore[];
  teacherId: string; // The teacher who manages this gradebook
  observations: Record<number, string>; // studentId -> observation text
  isLocked: boolean;
}

export interface UserRegistrationData {
    institutionName: string;
    rectorName: string;
    email: string;
    phone: string;
    password?: string;
    isDemo?: boolean;
}

export interface Guardian {
  id: string; // Cédula or unique ID
  name: string;
  email?: string;
  phone?: string;
  studentIds: number[]; // Array of IDs of the students they are a guardian for
  // FIX: Add missing password properties to support guardian login.
  password?: string;
  passwordChanged?: boolean;
}

export interface InboxConversation {
  id: string; // e.g., 'teacher-1037612345' or 'parent-1'
  participantId: string | number;
  participantName: string;
  participantAvatar: string;
  participantRole: Role;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  conversation: {
    sender: 'self' | 'participant';
    text: string;
    timestamp: string;
  }[];
}