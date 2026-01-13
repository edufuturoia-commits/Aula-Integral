// types.ts

// Enums
export enum Role {
  ADMIN = 'Administrador',
  RECTOR = 'Rector',
  COORDINATOR = 'Coordinador',
  TEACHER = 'Docente',
  STUDENT = 'Estudiante',
  PSYCHOLOGY = 'Psicología',
  GUARDIAN = 'Acudiente',
}

export enum DocumentType {
  IDENTITY_CARD = 'Tarjeta de Identidad',
  CIVIL_REGISTRY = 'Registro Civil',
}

export enum ResourceType {
  PDF = 'PDF',
  Video = 'Video',
  Image = 'Imagen',
  Document = 'Documento',
}

export enum CitationStatus {
  PENDING = 'Pendiente',
  CONFIRMED = 'Confirmada',
  COMPLETED = 'Realizada',
  CANCELLED = 'Cancelada',
  RESCHEDULE_REQUESTED = 'Reprogramación Solicitada',
}

export enum IncidentType {
  SCHOOL_COEXISTENCE = 'Convivencia Escolar',
  UNIFORM_MISUSE = 'Uso inapropiado del uniforme',
  INFRASTRUCTURE_DAMAGE = 'Daños a la infraestructura',
  BULLYING_CYBERBULLYING = 'Acoso y ciberacoso',
  NON_COMPLIANCE = 'Incumplimiento de deberes',
  ACADEMIC_MISCONDUCT = 'Faltas Académicas',
  OTHER = 'Otro',
}

export enum IncidentStatus {
    ACTIVE = 'Activa',
    ATTENDED = 'Atendida',
    ARCHIVED = 'Archivada',
    DECLINED = 'Declinada',
}

export enum AttendanceStatus {
  PRESENT = 'Presente',
  ABSENT = 'Ausente',
  TARDY = 'Tarde',
  EXCUSED = 'Excusado',
  SPECIAL_PERMIT = 'Permiso Especial',
}

export enum AcademicPeriod {
  FIRST = 'PRIMERO',
  SECOND = 'SEGUNDO',
  THIRD = 'TERCERO',
  FOURTH = 'CUARTO',
}

export enum TeacherStatus {
    ACTIVE = 'Activo',
    INACTIVE = 'Inactivo',
}

export enum Desempeno {
    SUPERIOR = 'SUPERIOR',
    HIGH = 'ALTO',
    BASIC = 'BASICO',
    LOW = 'BAJO',
}

export enum DiagnosisArea {
    FAMILY_DEVELOPMENT = 'Familiar y Desarrollo',
    EMOTIONAL = 'Emocional',
    BEHAVIORAL = 'Comportamental',
    ACADEMIC = 'Académico',
    SOCIAL = 'Social',
    OTHER = 'Otro',
}

export enum AttentionReportStatus {
    OPEN = 'Abierto',
    IN_PROGRESS = 'En Progreso',
    CLOSED = 'Cerrado',
}

export type SessionProgress = 'Sin Evaluar' | 'Estancamiento' | 'Leve Mejora' | 'Progreso Notable' | 'Logro de Objetivo';


// General Types
export type Page = 
    | 'Dashboard' | 'Classroom' | 'Assessments' | 'Resources' | 'Profile' | 'Settings'
    | 'Incidents' | 'ParentPortal' | 'StudentPortal' | 'Rectory' | 'InstitutionProfile'
    | 'Calificaciones' | 'Communication' | 'TutorMode' | 'Eventos' | 'SimulacroICFES'
    | 'QuickAccess' | 'Consolidado' | 'Psychology' | 'Secretaria' | 'AcademicDashboard';

export type SubjectArea = 'Matemáticas' | 'Lengua Castellana' | 'Inglés' | 'Biología' | 'Química' | 'Física' | 'Historia' | 'Geografía' | 'Constitución Política y Democracia' | 'Educación Artística' | 'Música' | 'Educación Ética y en Valores Humanos' | 'Filosofía' | 'Educación Física' | 'Educación Religiosa' | 'Tecnología e Informática' | 'Convivencia' | 'Todas' | 'Coordinadores' | 'Administrativos' | 'Psicología';

export type Competency = 'Comprensión Lectora' | 'Resolución de Problemas' | 'Pensamiento Crítico' | 'Competencias Ciudadanas' | 'Comunicación Escrita' | 'Análisis Científico' | 'Expresión Artística' | 'Competencia Digital' | 'Pensamiento Histórico' | 'Bilingüismo' | 'Competencia Motriz';


// User Types
export interface User {
  id: string | number;
  name: string;
  avatarUrl: string;
  role: Role;
  email?: string;
  phone?: string;
  password?: string;
  passwordChanged?: boolean;
  notifications?: NotificationSettings;
}

export interface Student extends User {
  role: Role.STUDENT;
  grade: string;
  group: string;
  lastIncident?: string;
  dateOfBirth?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  address?: string;
  jornada?: 'Mañana' | 'Tarde';
}

export interface Certification {
    id: string;
    name: string;
    issuer: string;
    year: string;
}

export interface Experience {
    id: string;
    position: string;
    institution: string;
    years: string;
}

export interface ProfessionalDevelopment {
    id: string;
    activity: string;
    hours: number;
    date: string;
}

export interface Teacher extends User {
  role: Role.TEACHER | Role.ADMIN | Role.RECTOR | Role.COORDINATOR | Role.PSYCHOLOGY;
  subject: SubjectArea;
  isHomeroomTeacher?: boolean;
  assignedGroup?: { grade: string; group: string; };
  isDemo?: boolean;
  demoStartDate?: string;
  certifications?: Certification[];
  experience?: Experience[];
  professionalDevelopment?: ProfessionalDevelopment[];
  // FIX: Added optional dateOfBirth and address to Teacher type for consistency
  dateOfBirth?: string;
  address?: string;
}

// FIX: Corrected Guardian interface to properly conform to the User type by making the 'role' property mandatory and of the correct enum type.
export interface Guardian extends Omit<User, 'role'> {
  role: Role.GUARDIAN;
  studentIds: (string | number)[];
}

export interface NotificationSettings {
  newIncident: boolean;
  weeklySummary: boolean;
  assessmentReminders: boolean;
  assessmentResults: boolean;
  messageAlerts: boolean;
}

// Data structures
export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  subjectArea: SubjectArea;
  url: string;
  content?: string;
}

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    area: SubjectArea;
    grade: string;
    competency: Competency;
}

export interface Assessment {
    id: string;
    title: string;
    createdAt: string;
    questions: Question[];
    assignedGroups?: { grade: string; group: string }[];
    assignedStudentIds?: (string | number)[];
}

export interface StudentAssessmentResult {
  id: string;
  studentId: string | number;
  assessmentId: string;
  assessmentTitle: string;
  score: number;
  completedAt: string;
}

export interface GradeItem {
    id: string;
    name: string;
    weight: number;
    desempenoIds?: string[];
}

export interface Score {
    studentId: string | number;
    gradeItemId: string;
    score: number | null;
}

export interface SubjectGrades {
    id: string;
    subject: SubjectArea;
    grade: string;
    group: string;
    period: AcademicPeriod;
    teacherId: string;
    gradeItems: GradeItem[];
    scores: Score[];
    observations: Record<string | number, string>;
    isLocked: boolean;
    generalDesempenoIds?: string[];
}

export interface AttendanceRecord {
  id: string;
  studentId: string | number;
  date: string;
  status: AttendanceStatus;
  synced: boolean;
}

export interface Incident {
  id: string;
  studentId: string | number;
  studentName: string;
  type: IncidentType;
  otherTypeDescription?: string;
  isVictim: boolean;
  notes: string;
  timestamp: string;
  teacherName: string;
  location: string;
  synced: boolean;
  status: IncidentStatus;
}

export interface Citation {
  id: string;
  studentId: string | number;
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
  recipients: 'all' | 'all_teachers' | 'all_parents' | string; // string for specific groups
  timestamp: string;
  sentBy: string;
}

export interface InstitutionProfileData {
  name: string;
  daneCode: string;
  nit: string;
  rector: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface Message {
    senderId: string | number;
    text: string;
    timestamp: string;
}

export interface Conversation {
    id: string;
    participantIds: (string | number)[];
    messages: Message[];
}

export interface UserRegistrationData {
    institutionName: string;
    rectorName: string;
    email: string;
    phone: string;
    password: string;
    isDemo: boolean;
}

export interface AssessmentData {
  competency: string;
  classAverage: number;
  studentAverage: number;
}

export interface EventPoster {
  id: string;
  title: string;
  imageUrl: string;
  eventDate: string;
  createdAt: string;
}

export interface InboxConversation {
  id: string;
  participantId: string | number;
  participantName: string;
  participantAvatar: string;
  participantRole: Role | 'Acudiente';
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  conversation: {
    sender: 'self' | 'participant';
    text: string;
    timestamp: string;
  }[];
}

export interface DesempenoDescriptor {
  id: string;
  area: SubjectArea;
  description: string;
}


// --- Tutor Mode Types ---
export interface PracticalTask {
    id: string;
    statement: string;
    options: string[];
    correctAnswerIndex: number;
}

export interface LessonContent {
    title: string;
    introduction: string;
    development: string;
    deepening: string;
    conclusion: string;
    practiceQuestions: {
        question: string;
        options: string[];
        correctAnswerIndex: number;
        explanation: string;
    }[];
    practicalTasks?: PracticalTask[];
}

export interface Lesson {
    id: string;
    userId: string | number;
    createdAt: string;
    topic: string;
    grade: string;
    subject: SubjectArea;
    content: LessonContent;
}

// --- Psychology Types ---
export interface Diagnosis {
    id: string;
    authorId: string | number;
    text: string;
    source?: string;
    area: DiagnosisArea;
    timestamp: string;
}

export interface SessionLog {
    id: string;
    authorId: string | number;
    date: string;
    startTime: string;
    endTime: string;
    sessionType: 'Individual' | 'Grupal' | 'Familiar';
    progressIndicator: SessionProgress;
    notes: string;
}

export interface AttentionReport {
    id: string;
    studentId: string | number;
    reporterId: string | number;
    reason: string;
    timestamp: string;
    status: AttentionReportStatus;
    familyBackground?: string;
    schoolBackground?: string;
    medicalBackground?: string;
    diagnoses: Diagnosis[];
    interventionPlan?: string;
    sessions: SessionLog[];
    closingSummary?: string;
    conversationId: string;
}