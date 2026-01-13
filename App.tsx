import React, { useState, useCallback, useEffect, Suspense, lazy, useMemo, createContext, useContext } from 'react';

// New Pages for Auth Flow
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import ChangePasswordModal from './components/ChangePasswordModal';
import DemoExpiredModal from './components/DemoExpiredModal';


// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Types and DB
import { Page, Student, Teacher, Resource, InstitutionProfileData, Assessment, StudentAssessmentResult, Role, SubjectGrades, AttendanceRecord, IncidentType, Citation, Incident, Announcement, Guardian, UserRegistrationData, Conversation, Lesson, AttentionReport, Message, NotificationSettings, User } from './types';
import { getStudents, getTeachers, getDownloadedResources, addOrUpdateTeachers, getAssessments, addOrUpdateAssessments, getStudentResults, addOrUpdateStudentResult, addOrUpdateStudents, getSubjectGrades, addOrUpdateSubjectGrades, getAllAttendanceRecords, addOrUpdateAttendanceRecord, addOrUpdateAttendanceRecords, getIncidents, addIncident, updateIncident, deleteIncident, getAnnouncements, addAnnouncement, getGuardians, addOrUpdateGuardians, getTeacherByEmail, getStudentByDocumentId, getTeacherById, getGuardianById, updateTeacher, updateStudent, updateGuardian, getLessons, addLesson, updateLesson, getAttentionReports, addAttentionReport, updateAttentionReport } from './db';

// Constants
// FIX: Removed 'translations' from import as it is not exported from './constants'.
import { SIDEBAR_ITEMS, MOCK_INSTITUTION_PROFILE, MOCK_CITATIONS, MOCK_CONVERSATIONS_DATA } from './constants';

// FIX: Added translations object for i18n functionality.
const translations = {
  es: {
    studentLabel: 'Estudiante',
    close: 'Cerrar',
    success: 'Éxito',
    error: 'Error',
    'notifications.newIncident.title': 'Nueva Incidencia Reportada',
    'notifications.newIncident.message': 'Se ha reportado una nueva incidencia de tipo: {{incidentType}}.',
    'incidentTypes.Convivencia Escolar': 'Convivencia Escolar',
    'incidentTypes.Uso inapropiado del uniforme': 'Uso inapropiado del uniforme',
    'incidentTypes.Daños a la infraestructura': 'Daños a la infraestructura',
    'incidentTypes.Acoso y ciberacoso': 'Acoso y ciberacoso',
    'incidentTypes.Incumplimiento de deberes': 'Incumplimiento de deberes',
    'incidentTypes.Faltas Académicas': 'Faltas Académicas',
    'incidentTypes.Otro': 'Otro',
    loadingApp: 'Cargando aplicación',
    'login.success': 'Inicio de sesión exitoso',
    'login.invalidCredentials': 'Credenciales inválidas',
    'register.emailExists': 'El correo electrónico ya existe',
    'register.demoSuccess': 'Registro de demo exitoso',
    'notifications.accountUpgraded': 'Cuenta actualizada exitosamente',
    'notifications.attentionReportSent': 'Reporte de atención enviado',
    'notifications.psychologyReportUpdated': 'Reporte de psicología actualizado',
    loadingPortal: 'Cargando portal',
    settings: {
        notifications: {
            title: 'Notificaciones',
            saveSuccess: 'Configuración de notificaciones guardada.',
            newIncidentLabel: 'Nuevas Incidencias',
            newIncidentDescription: 'Recibir una alerta cuando se reporte una nueva incidencia.',
            weeklySummaryLabel: 'Resumen Semanal',
            weeklySummaryDescription: 'Recibir un resumen de actividad semanal por correo.',
            assessmentRemindersLabel: 'Recordatorios de Evaluaciones',
            assessmentRemindersDescription: 'Notificar sobre próximas evaluaciones o tareas.',
            assessmentResultsLabel: 'Resultados de Evaluaciones',
            assessmentResultsDescription: 'Notificar cuando estén disponibles los resultados de una evaluación.',
            messageAlertsLabel: 'Mensajes Nuevos',
            messageAlertsDescription: 'Recibir notificaciones de nuevos mensajes directos.'
        },
        language: {
            title: 'Idioma y Región',
            description: 'Selecciona tu idioma de preferencia.',
            spanish: 'Español',
            english: 'Inglés'
        },
        appearance: {
            title: 'Apariencia',
            description: 'Personaliza cómo se ve la aplicación.',
            light: 'Claro',
            dark: 'Oscuro',
            system: 'Automático (Sistema)'
        }
    },
    buttons: {
        cancel: 'Cancelar',
        saveChanges: 'Guardar Cambios',
        edit: 'Editar'
    }
  },
  en: {
    studentLabel: 'Student',
    close: 'Close',
    success: 'Success',
    error: 'Error',
    'notifications.newIncident.title': 'New Incident Reported',
    'notifications.newIncident.message': 'A new incident of type has been reported: {{incidentType}}.',
    'incidentTypes.Convivencia Escolar': 'School Coexistence',
    'incidentTypes.Uso inapropiado del uniforme': 'Inappropriate Uniform Use',
    'incidentTypes.Daños a la infraestructura': 'Infrastructure Damage',
    'incidentTypes.Acoso y ciberacoso': 'Bullying and Cyberbullying',
    'incidentTypes.Incumplimiento de deberes': 'Non-compliance with Duties',
    'incidentTypes.Faltas Académicas': 'Academic Misconduct',
    'incidentTypes.Otro': 'Other',
    loadingApp: 'Loading application',
    'login.success': 'Login successful',
    'login.invalidCredentials': 'Invalid credentials',
    'register.emailExists': 'Email already exists',
    'register.demoSuccess': 'Demo registration successful',
    'notifications.accountUpgraded': 'Account upgraded successfully',
    'notifications.attentionReportSent': 'Attention report sent',
    'notifications.psychologyReportUpdated': 'Psychology report updated',
    loadingPortal: 'Loading portal',
    settings: {
        notifications: {
            title: 'Notifications',
            saveSuccess: 'Notification settings saved.',
            newIncidentLabel: 'New Incidents',
            newIncidentDescription: 'Receive an alert when a new incident is reported.',
            weeklySummaryLabel: 'Weekly Summary',
            weeklySummaryDescription: 'Receive a weekly activity summary by email.',
            assessmentRemindersLabel: 'Assessment Reminders',
            assessmentRemindersDescription: 'Notify about upcoming assessments or assignments.',
            assessmentResultsLabel: 'Assessment Results',
            assessmentResultsDescription: 'Notify when assessment results are available.',
            messageAlertsLabel: 'New Messages',
            messageAlertsDescription: 'Receive notifications for new direct messages.'
        },
        language: {
            title: 'Language & Region',
            description: 'Choose your preferred language.',
            spanish: 'Spanish',
            english: 'English'
        },
        appearance: {
            title: 'Appearance',
            description: 'Customize how the application looks.',
            light: 'Light',
            dark: 'Dark',
            system: 'Automatic (System)'
        }
    },
    buttons: {
        cancel: 'Cancel',
        saveChanges: 'Save Changes',
        edit: 'Edit'
    }
  }
};

// --- I18N Context ---
interface LanguageContextType {
  lang: string;
  setLang: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'es',
  setLang: () => {},
});

export const useTranslation = () => {
    const { lang, setLang } = useContext(LanguageContext);

    const t = useCallback((key: string, options?: { [key: string]: string | number }) => {
        const langPack = translations[lang as 'es' | 'en'];
        const findValue = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc && acc[part], obj);
        
        // First try to resolve nested keys.
        let translation = findValue(langPack, key);
        
        // If not found as nested, try a direct lookup (for keys with dots).
        if (translation === undefined) {
            translation = (langPack as any)[key];
        }
        
        // Fallback to the key itself if no translation is found.
        translation = translation ?? key;
        
        // Apply options for interpolation.
        if (options && typeof translation === 'string') {
            Object.keys(options).forEach(optionKey => {
                const regex = new RegExp(`{{${optionKey}}}`, 'g');
                translation = translation.replace(regex, String(options[optionKey]));
            });
        }
        return translation;
    }, [lang]);

    return { lang, setLang, t };
};
// --- End I18N Context ---


// Lazy load page components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Classroom = lazy(() => import('./pages/Classroom'));
const Assessments = lazy(() => import('./pages/Assessments'));
const Resources = lazy(() => import('./pages/Resources'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Incidents = lazy(() => import('./pages/Incidents'));
const ParentPortal = lazy(() => import('./pages/ParentPortal'));
const StudentPortal = lazy(() => import('./pages/StudentPortal'));
const Rectory = lazy(() => import('./pages/Rectory'));
const InstitutionProfile = lazy(() => import('./pages/InstitutionProfile'));
const Calificaciones = lazy(() => import('./pages/Calificaciones'));
const Communication = lazy(() => import('./pages/Communication'));
const TutorMode = lazy(() => import('./pages/TutorMode'));
const Eventos = lazy(() => import('./pages/Eventos'));
const SimulacroICFES = lazy(() => import('./pages/SimulacroICFES'));
const QuickAccess = lazy(() => import('./pages/QuickAccess'));
const Consolidado = lazy(() => import('./pages/Consolidado'));
const Psychology = lazy(() => import('./pages/Psychology'));
const Secretaria = lazy(() => import('./pages/Secretaria'));
const AcademicDashboard = lazy(() => import('./pages/AcademicDashboard'));


interface NotificationToastProps {
  title: string;
  message: string;
  studentName: string;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ title, message, studentName, onClose }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed top-24 right-6 w-full max-w-sm bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 z-[100] animate-slide-in-right border-l-4 border-primary">
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300"><strong>{t('studentLabel')}:</strong> {studentName}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button onClick={onClose} className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <span className="sr-only">{t('close')}</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

interface SystemToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const SystemToast: React.FC<SystemToastProps> = ({ message, type, onClose }) => {
  const { t } = useTranslation();
  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-100 dark:bg-green-900/50 border-green-500' : 'bg-red-100 dark:bg-red-900/50 border-red-500';
  const textColor = isSuccess ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200';
  const icon = isSuccess ? (
    <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : (
    <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className={`fixed top-24 right-6 w-full max-w-sm shadow-lg rounded-xl p-4 z-[100] animate-slide-in-right border-l-4 ${bgColor}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">{icon}</div>
        <div className="ml-3 w-0 flex-1">
          <p className={`text-sm font-bold ${textColor}`}>{isSuccess ? t('success') : t('error')}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button onClick={onClose} className="bg-transparent rounded-md inline-flex text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <span className="sr-only">{t('close')}</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { t } = useTranslation();
  // App State Management
  // FIX: Changed currentUser state type from User to a union of specific user types for better type safety.
  const [currentUser, setCurrentUser] = useState<Student | Teacher | Guardian | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser && savedUser !== 'undefined') {
        try {
            return JSON.parse(savedUser);
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            localStorage.removeItem('currentUser');
            return null;
        }
    }
    return null;
  });

  const [appState, setAppState] = useState<'landing' | 'login' | 'quickAccess' | 'app'>(() => {
      return localStorage.getItem('currentUser') ? 'app' : 'landing';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [isDemoExpired, setIsDemoExpired] = useState(false);

  // Main App Page
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');


  // Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [studentResults, setStudentResults] = useState<StudentAssessmentResult[]>([]);
  const [subjectGrades, setSubjectGrades] = useState<SubjectGrades[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [citations, setCitations] = useState<Citation[]>(MOCK_CITATIONS);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS_DATA);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attentionReports, setAttentionReports] = useState<AttentionReport[]>([]);
  const [downloadedResourceIds, setDownloadedResourceIds] = useState<Set<string>>(new Set());
  const [institutionProfile, setInstitutionProfile] = useState<InstitutionProfileData>(() => {
    const savedProfile = localStorage.getItem('institutionProfile');
    if (savedProfile && savedProfile !== 'undefined') {
        try {
            return JSON.parse(savedProfile);
        } catch (e) {
            console.error("Failed to parse institutionProfile from localStorage", e);
            localStorage.removeItem('institutionProfile');
        }
    }
    return MOCK_INSTITUTION_PROFILE;
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  // Real-time notification state
  const [notification, setNotification] = useState<{ title: string; message: string; studentName: string; } | null>(null);
  const [systemMessage, setSystemMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Feature flags / settings
  const [icfesDrillSettings, setIcfesDrillSettings] = useState(() => {
    const saved = localStorage.getItem('icfesDrillSettings');
    return saved ? JSON.parse(saved) : { isActive: false, grades: [] };
  });

  const allUsersMap = useMemo(() => {
    const userMap = new Map<string | number, Student | Teacher | Guardian>();
    students.forEach(u => userMap.set(u.id, u));
    teachers.forEach(u => userMap.set(u.id, u));
    guardians.forEach(u => userMap.set(u.id, u));
    return userMap;
  }, [students, teachers, guardians]);

  const handleSetIcfesDrillSettings = (settings: { isActive: boolean, grades: string[] }) => {
      setIcfesDrillSettings(settings);
      localStorage.setItem('icfesDrillSettings', JSON.stringify(settings));
  };


  // Effects
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Effect to apply theme
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme]);


  // Effect to simulate WebSocket for real-time incident notifications
  useEffect(() => {
    if (appState !== 'app') return;
    let timeoutId: ReturnType<typeof setTimeout>;

    const showRandomNotification = () => {
        const canShowIncidentAlerts = (currentUser?.notifications as NotificationSettings | undefined)?.newIncident !== false;

        if (canShowIncidentAlerts && students.length > 0 && navigator.onLine) {
            const randomStudent = students[Math.floor(Math.random() * students.length)];
            const randomIncidentType = Object.values(IncidentType)[Math.floor(Math.random() * Object.values(IncidentType).length)];
            
            setNotification({
            title: t('notifications.newIncident.title'),
            message: t('notifications.newIncident.message', { incidentType: t(`incidentTypes.${randomIncidentType}`) }),
            studentName: randomStudent.name
            });
            setTimeout(() => setNotification(null), 7000);
        }
        const randomInterval = Math.random() * (45000 - 25000) + 25000;
        timeoutId = setTimeout(showRandomNotification, randomInterval);
    };
    timeoutId = setTimeout(showRandomNotification, 20000); 

    return () => clearTimeout(timeoutId);
  }, [students, appState, currentUser, t]);


  const loadResources = useCallback(async () => {
    try {
      const allResources = await getDownloadedResources();
      setResources(allResources.sort((a, b) => a.title.localeCompare(b.title)));
      setDownloadedResourceIds(new Set(allResources.map(r => r.id)));
    } catch (error) {
      console.error("Failed to load resources:", error);
    }
  }, []);

  const loadIncidents = useCallback(async () => {
    try {
        const data = await getIncidents();
        setIncidents(data);
    } catch (error) {
        console.error("Failed to load incidents:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [studentsData, teachersData, assessmentsData, resultsData, gradesData, attendanceData, announcementsData, guardiansData, lessonsData, attentionReportsData] = await Promise.all([
          getStudents(),
          getTeachers(),
          getAssessments(),
          getStudentResults(),
          getSubjectGrades(),
          getAllAttendanceRecords(),
          getAnnouncements(),
          getGuardians(),
          getLessons(),
          getAttentionReports(),
        ]);
        setStudents(studentsData);
        setTeachers(teachersData);
        setAssessments(assessmentsData);
        setStudentResults(resultsData);
        setSubjectGrades(gradesData);
        setAttendanceRecords(attendanceData);
        setAnnouncements(announcementsData);
        setGuardians(guardiansData);
        setLessons(lessonsData);
        setAttentionReports(attentionReportsData);
        setCitations(MOCK_CITATIONS);
        await loadIncidents();
        await loadResources();
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [loadResources, loadIncidents]);

  // Check for demo expiration
  useEffect(() => {
    if (currentUser && 'isDemo' in currentUser && currentUser.isDemo && currentUser.demoStartDate) {
      const startDate = new Date(currentUser.demoStartDate);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (new Date().getTime() - startDate.getTime() > sevenDays) {
        setIsDemoExpired(true);
      }
    } else {
        setIsDemoExpired(false);
    }
  }, [currentUser]);


  // --- AUTHENTICATION LOGIC ---

  const handleLogin = async (username: string, pass: string): Promise<{ success: boolean; message: string; }> => {
    let foundUser: User | Student | Teacher | Guardian | undefined;

    // Standard lookup by email or ID
    if (username.includes('@')) {
        foundUser = await getTeacherByEmail(username);
    } else {
        foundUser = await getStudentByDocumentId(username) || await getGuardianById(username) || await getTeacherById(username);
    }

    // Check password
    if (foundUser && 'password' in foundUser && foundUser.password === pass) {
        localStorage.setItem('currentUser', JSON.stringify(foundUser));
        setCurrentUser(foundUser as Student | Teacher | Guardian);

        if ('passwordChanged' in foundUser && !foundUser.passwordChanged) {
            setNeedsPasswordChange(true);
        } else {
            setAppState('app');
        }

        return { success: true, message: t('login.success') };
    } else {
        return { success: false, message: t('login.invalidCredentials') };
    }
  };
  
  const handleLogout = () => {
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      setAppState('landing');
      setCurrentPage('Dashboard');
  };
  
  const handlePasswordChanged = (user: Teacher | Student | Guardian) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setNeedsPasswordChange(false);
    setAppState('app');
  };

  const showSystemMessage = (message: string, type: 'success' | 'error' = 'success') => {
      setSystemMessage({ message, type });
      setTimeout(() => setSystemMessage(null), 5000);
  };

  const handleDemoRegister = async (userData: UserRegistrationData): Promise<{ success: boolean; message: string; }> => {
      const existingUser = await getTeacherByEmail(userData.email);
      if(existingUser) {
          return { success: false, message: t('register.emailExists') };
      }
      
      const newRector: Teacher = {
          id: userData.phone, // Use phone as unique ID for demo
          name: userData.rectorName,
          avatarUrl: `https://picsum.photos/seed/${userData.rectorName}/100/100`,
          role: Role.RECTOR,
          subject: 'Administrativos',
          email: userData.email,
          phone: userData.phone,
          password: userData.password,
          passwordChanged: true, // They set it on registration
          isDemo: true,
          demoStartDate: new Date().toISOString()
      };
      
      await addOrUpdateTeachers([...teachers, newRector]);
      
      // Also update institution profile
      const newProfile: InstitutionProfileData = {
          ...institutionProfile,
          name: userData.institutionName,
          rector: userData.rectorName,
          email: userData.email,
          phone: userData.phone,
      };
      setInstitutionProfile(newProfile);
      localStorage.setItem('institutionProfile', JSON.stringify(newProfile));
      
      // Auto-login
      localStorage.setItem('currentUser', JSON.stringify(newRector));
      setCurrentUser(newRector);
      setAppState('app');
      
      return { success: true, message: t('register.demoSuccess') };
  };
  
  const handleUpgradeFromDemo = () => {
    if (currentUser && 'isDemo' in currentUser) {
      const upgradedUser = { ...currentUser, isDemo: false, demoStartDate: undefined };
      setCurrentUser(upgradedUser as Teacher);
      localStorage.setItem('currentUser', JSON.stringify(upgradedUser));
      setIsDemoExpired(false);
      showSystemMessage(t('notifications.accountUpgraded'), 'success');
    }
  };
  
  // --- DATA HANDLERS ---
  const handleSetStudents = (updater: React.SetStateAction<Student[]>) => {
      const newStudents = typeof updater === 'function' ? updater(students) : updater;
      return addOrUpdateStudents(newStudents).then(() => setStudents(newStudents));
  };
  const handleSetTeachers = (updater: React.SetStateAction<Teacher[]>) => {
      const newTeachers = typeof updater === 'function' ? updater(teachers) : updater;
      return addOrUpdateTeachers(newTeachers).then(() => setTeachers(newTeachers));
  };
  const handleSetGuardians = (updater: React.SetStateAction<Guardian[]>) => {
      const newGuardians = typeof updater === 'function' ? updater(guardians) : updater;
      return addOrUpdateGuardians(newGuardians).then(() => setGuardians(newGuardians));
  }
  const handleSetAssessments = (newAssessments: Assessment[]) => addOrUpdateAssessments(newAssessments).then(() => setAssessments(newAssessments));
  const handleSetStudentResult = (result: StudentAssessmentResult) => addOrUpdateStudentResult(result).then(() => setStudentResults(prev => [...prev, result]));
  const handleSetSubjectGrades = (updater: React.SetStateAction<SubjectGrades[]>) => {
      const newGrades = typeof updater === 'function' ? updater(subjectGrades) : updater;
      return addOrUpdateSubjectGrades(newGrades).then(() => setSubjectGrades(newGrades));
  };

  const handleUpdateAttendanceRecord = (record: AttendanceRecord) => addOrUpdateAttendanceRecord(record).then(() => {
      setAttendanceRecords(prev => {
          const index = prev.findIndex(r => r.id === record.id);
          const newRecords = [...prev];
          if (index > -1) newRecords[index] = record;
          else newRecords.push(record);
          return newRecords;
      });
  });

  const handleBulkUpdateAttendanceRecords = (records: AttendanceRecord[]) => addOrUpdateAttendanceRecords(records).then(() => {
      setAttendanceRecords(prev => {
          const recordMap = new Map(prev.map(r => [r.id, r]));
          records.forEach(r => recordMap.set(r.id, r));
          return Array.from(recordMap.values());
      });
  });

  const handleUpdateIncidents = async (action: 'add' | 'update' | 'delete', data: Incident | string) => {
    if (action === 'add') await addIncident(data as Incident);
    if (action === 'update') await updateIncident(data as Incident);
    if (action === 'delete') await deleteIncident(data as string);
    await loadIncidents();
  };

  const handleNewAnnouncement = (announcement: Announcement) => addAnnouncement(announcement).then(() => setAnnouncements(prev => [announcement, ...prev]));

  const handleUpdateCurrentUser = async (user: Teacher | Student | Guardian) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    if('subject' in user) { // Teacher
        await updateTeacher(user as Teacher);
        setTeachers(prev => prev.map(t => t.id === user.id ? (user as Teacher) : t));
    } else if ('grade' in user) { // Student
        await updateStudent(user as Student);
        setStudents(prev => prev.map(s => s.id === user.id ? (user as Student) : s));
    } else { // Guardian
        await updateGuardian(user as Guardian);
        setGuardians(prev => prev.map(g => g.id === user.id ? (user as Guardian) : g));
    }
  };

  const handleUpdateConversation = (conversation: Conversation) => {
      setConversations(prev => prev.map(c => c.id === conversation.id ? conversation : c));
  };

  const handleCreateConversation = (conversation: Conversation) => {
      setConversations(prev => {
          if (prev.some(c => c.id === conversation.id)) return prev;
          return [...prev, conversation];
      });
  };
  
  const handleAddLesson = (lesson: Lesson) => addLesson(lesson).then(() => setLessons(prev => [lesson, ...prev]));
  const handleUpdateLesson = (lesson: Lesson) => updateLesson(lesson).then(() => setLessons(prev => prev.map(l => l.id === lesson.id ? lesson : l)));

  const handleNewAttentionReport = async (report: AttentionReport) => {
    await addAttentionReport(report);
    setAttentionReports(prev => [report, ...prev]);
    showSystemMessage(t('notifications.attentionReportSent'));
  };

  const handleUpdateAttentionReport = async (report: AttentionReport) => {
    await updateAttentionReport(report);
    setAttentionReports(prev => prev.map(r => r.id === report.id ? report : r));
    showSystemMessage(t('notifications.psychologyReportUpdated'));
  };


  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-neutral dark:bg-gray-900 text-gray-800 dark:text-gray-100">{t('loadingApp')}...</div>;
  }
  
  if (isDemoExpired) {
    return <DemoExpiredModal onUpgrade={handleUpgradeFromDemo} onLogout={handleLogout} />;
  }

  if (needsPasswordChange && currentUser) {
    return <ChangePasswordModal user={currentUser} onPasswordChanged={handlePasswordChanged} />;
  }
  
  if (appState === 'landing') {
      return <LandingPage onShowLogin={() => setAppState('login')} onDemoRegister={handleDemoRegister} />;
  }
  
  if (appState === 'login') {
      return <Login onLogin={handleLogin} onBackToHome={() => setAppState('landing')} onShowQuickAccess={() => setAppState('quickAccess')} />;
  }
  
  if (appState === 'quickAccess') {
      return <QuickAccess onLogin={handleLogin} onBack={() => setAppState('login')} />
  }

  // The main app view
  if (appState === 'app' && currentUser) {
    return (
      <div className="flex h-screen bg-neutral dark:bg-gray-900">
        <Sidebar 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage} 
            currentUser={currentUser}
            onLogout={handleLogout}
            icfesDrillSettings={icfesDrillSettings}
            isMobileOpen={isMobileSidebarOpen}
            setIsMobileOpen={setIsMobileSidebarOpen}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            currentPage={currentPage}
            isOnline={isOnline}
            currentUser={currentUser as {name: string, avatarUrl: string, role: string}}
            onLogout={handleLogout}
            onNavigate={setCurrentPage}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          />
          <main className="flex-1 p-4 md:p-6 bg-neutral dark:bg-gray-900 overflow-y-auto">
             <Suspense fallback={<div className="text-center p-8">{t('loadingApp')}...</div>}>
                {currentPage === 'Dashboard' && <Dashboard students={students} teachers={teachers} citations={citations} onNavigate={setCurrentPage} />}
                {currentPage === 'Classroom' && (currentUser.role === Role.TEACHER || currentUser.role === Role.ADMIN) && <Classroom isOnline={isOnline} students={students} setStudents={handleSetStudents} teachers={teachers} currentUser={currentUser as Teacher} subjectGradesData={subjectGrades} setSubjectGradesData={handleSetSubjectGrades} attendanceRecords={attendanceRecords} onUpdateAttendance={handleUpdateAttendanceRecord} onBulkUpdateAttendance={handleBulkUpdateAttendanceRecords} incidents={incidents} onUpdateIncidents={handleUpdateIncidents} announcements={announcements} onShowSystemMessage={showSystemMessage} onReportAttention={handleNewAttentionReport} />}
                {currentPage === 'Assessments' && <Assessments students={students} assessments={assessments} setAssessments={handleSetAssessments} studentResults={studentResults} />}
                {currentPage === 'Resources' && <Resources resources={resources} downloadedIds={downloadedResourceIds} onUpdate={loadResources}/>}
                {currentPage === 'Profile' && <Profile currentUser={currentUser} onUpdateUser={handleUpdateCurrentUser} />}
                {currentPage === 'Settings' && <Settings currentUser={currentUser} onUpdateUser={handleUpdateCurrentUser} theme={theme} setTheme={setTheme} />}
                {currentPage === 'Incidents' && (currentUser.role === Role.COORDINATOR || currentUser.role === Role.RECTOR || currentUser.role === Role.ADMIN) && <Incidents isOnline={isOnline} students={students} setStudents={handleSetStudents} teachers={teachers} setTeachers={handleSetTeachers} currentUser={currentUser as Teacher} subjectGradesData={subjectGrades} setSubjectGradesData={handleSetSubjectGrades} allAttendanceRecords={attendanceRecords} citations={citations} onUpdateCitations={setCitations} incidents={incidents} onUpdateIncidents={handleUpdateIncidents} announcements={announcements} onUpdateAnnouncements={handleNewAnnouncement} guardians={guardians} onUpdateGuardians={handleSetGuardians} onShowSystemMessage={showSystemMessage} onReportAttention={handleNewAttentionReport} />}
                {/* FIX: The 'allUsersMap' was incorrectly typed due to the 'Guardian' type not fully conforming to the 'User' type. The 'Guardian' type in 'types.ts' has been corrected, which resolves this mapping issue. I am also casting the map to the expected type as a safeguard. */}
                {currentPage === 'ParentPortal' && <ParentPortal students={students} teachers={teachers} resources={resources} subjectGrades={subjectGrades} institutionProfile={institutionProfile} citations={citations} onUpdateCitations={setCitations} incidents={incidents} announcements={announcements} conversations={conversations} onUpdateConversation={handleUpdateConversation} onCreateConversation={handleCreateConversation} allUsersMap={allUsersMap as Map<string | number, User>} currentUser={currentUser as Guardian} />}
                {currentPage === 'StudentPortal' && <StudentPortal loggedInUser={currentUser as Student | Teacher} allStudents={students} teachers={teachers} subjectGrades={subjectGrades} resources={resources} assessments={assessments} studentResults={studentResults} onAddResult={handleSetStudentResult} citations={citations} icfesDrillSettings={icfesDrillSettings}/>}
                {currentPage === 'Rectory' && (currentUser.role === Role.RECTOR || currentUser.role === Role.ADMIN) && <Rectory students={students} teachers={teachers} announcements={announcements} onUpdateAnnouncements={handleNewAnnouncement} onShowSystemMessage={showSystemMessage} currentUser={currentUser as Teacher} />}
                {currentPage === 'InstitutionProfile' && (currentUser.role === Role.RECTOR || currentUser.role === Role.ADMIN || currentUser.role === Role.COORDINATOR) && <InstitutionProfile profile={institutionProfile} setProfile={setInstitutionProfile} />}
                {currentPage === 'Calificaciones' && <Calificaciones students={students} teachers={teachers} subjectGradesData={subjectGrades} setSubjectGradesData={handleSetSubjectGrades} currentUser={currentUser as Teacher} onShowSystemMessage={showSystemMessage} />}
                {currentPage === 'Communication' && <Communication currentUser={currentUser as Teacher} students={students} teachers={teachers} guardians={guardians} conversations={conversations} onUpdateConversation={handleUpdateConversation} onCreateConversation={handleCreateConversation} allUsersMap={allUsersMap} />}
                {currentPage === 'TutorMode' && <TutorMode lessons={lessons} onAddLesson={handleAddLesson} onUpdateLesson={handleUpdateLesson} currentUser={currentUser} institutionProfile={institutionProfile}/>}
                {currentPage === 'Eventos' && <Eventos currentUser={currentUser} />}
                {currentPage === 'SimulacroICFES' && (currentUser.role === Role.ADMIN || currentUser.role === Role.RECTOR || currentUser.role === Role.COORDINATOR) && (
                    <SimulacroICFES settings={icfesDrillSettings} onSettingsChange={handleSetIcfesDrillSettings} />
                )}
                {currentPage === 'Consolidado' && <Consolidado students={students} subjectGradesData={subjectGrades} />}
                {currentPage === 'AcademicDashboard' && (currentUser.role === Role.ADMIN || currentUser.role === Role.RECTOR || currentUser.role === Role.COORDINATOR) && (
                    <AcademicDashboard students={students} subjectGradesData={subjectGrades} setStudents={handleSetStudents} setSubjectGradesData={handleSetSubjectGrades} onShowSystemMessage={showSystemMessage}/>
                )}
                {currentPage === 'Psychology' && (currentUser.role === Role.PSYCHOLOGY || currentUser.role === Role.COORDINATOR || currentUser.role === Role.RECTOR || currentUser.role === Role.ADMIN) && (
                    <Psychology reports={attentionReports} onUpdateReport={handleUpdateAttentionReport} students={students} allUsersMap={allUsersMap} conversations={conversations} onUpdateConversation={handleUpdateConversation} currentUser={currentUser as Teacher} institutionProfile={institutionProfile} />
                )}
                {currentPage === 'Secretaria' && (currentUser.role === Role.ADMIN || currentUser.role === Role.COORDINATOR || currentUser.role === Role.RECTOR) && (
                    <Secretaria students={students} setStudents={handleSetStudents} guardians={guardians} onUpdateGuardians={handleSetGuardians} subjectGradesData={subjectGrades} institutionProfile={institutionProfile} onShowSystemMessage={showSystemMessage} currentUser={currentUser as Teacher} conversations={conversations} onUpdateConversation={handleUpdateConversation} onCreateConversation={handleCreateConversation} />
                )}
             </Suspense>
          </main>
        </div>
        {notification && <NotificationToast {...notification} onClose={() => setNotification(null)} />}
        {systemMessage && <SystemToast {...systemMessage} onClose={() => setSystemMessage(null)} />}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-neutral dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        {t('loadingPortal')}...
    </div>
  );
};


export const App: React.FC = () => {
    const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'es');

    useEffect(() => {
        localStorage.setItem('lang', lang);
    }, [lang]);
    
    return (
        <LanguageContext.Provider value={{ lang, setLang }}>
            <AppContent />
        </LanguageContext.Provider>
    )
}