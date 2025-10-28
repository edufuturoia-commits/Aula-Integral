





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
import { Page, Student, Teacher, Resource, InstitutionProfileData, Assessment, StudentAssessmentResult, Role, SubjectGrades, AttendanceRecord, IncidentType, Citation, Incident, Announcement, Guardian, UserRegistrationData, Conversation, Lesson, AttentionReport, Message } from './types';
import { getStudents, getTeachers, getDownloadedResources, addOrUpdateTeachers, getAssessments, addOrUpdateAssessments, getStudentResults, addOrUpdateStudentResult, addOrUpdateStudents, getSubjectGrades, addOrUpdateSubjectGrades, getAllAttendanceRecords, addOrUpdateAttendanceRecord, addOrUpdateAttendanceRecords, getIncidents, addIncident, updateIncident, deleteIncident, getAnnouncements, addAnnouncement, getGuardians, addOrUpdateGuardians, getTeacherByEmail, getStudentByDocumentId, getTeacherById, getGuardianById, updateTeacher, updateStudent, updateGuardian, getLessons, addLesson, getAttentionReports, addAttentionReport, updateAttentionReport } from './db';

// Constants
import { SIDEBAR_ITEMS, MOCK_INSTITUTION_PROFILE, MOCK_CITATIONS, MOCK_CONVERSATIONS_DATA, translations } from './constants';

// --- I18N Context ---
interface LanguageContextType {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'es',
  setLang: () => {},
  t: (key) => key,
});

export const useTranslation = () => useContext(LanguageContext);
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

type User = Teacher | Student | Guardian;

const AppContent: React.FC = () => {
  const { t } = useTranslation();
  // App State Management
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
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
        const canShowIncidentAlerts = currentUser?.notifications?.newIncident !== false;

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
    let foundUser: User | undefined;

    if (username.includes('@')) { // Staff login
        foundUser = await getTeacherByEmail(username);
        if (foundUser && foundUser.id === pass) {
            // Correct password is document ID for staff
        } else {
            foundUser = undefined;
        }
    } else { // Student or Guardian login
        foundUser = await getStudentByDocumentId(username);
        if (foundUser && foundUser.password === pass) {
            // Correct password
        } else {
            foundUser = await getGuardianById(username);
            if(foundUser && (foundUser as Guardian).password === pass) {
                // Correct password
            } else {
                foundUser = await getTeacherById(username); // Staff can also login with ID
                 if (foundUser && foundUser.id === pass) {
                    // Correct password is document ID for staff
                } else {
                    foundUser = undefined;
                }
            }
        }
    }

    if (foundUser) {
        localStorage.setItem('currentUser', JSON.stringify(foundUser));
        setCurrentUser(foundUser);
        if ('passwordChanged' in foundUser && (foundUser as Student | Teacher).passwordChanged === false) {
            setNeedsPasswordChange(true);
        }
        if (!('role' in foundUser)) { // It's a guardian
            setCurrentPage('ParentPortal');
        }
        setAppState('app');
        return { success: true, message: t('login.success') };
    }

    return { success: false, message: t('login.invalidCredentials') };
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setAppState('landing');
    setCurrentPage('Dashboard');
  };
  
  const handlePasswordChanged = (user: User) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setNeedsPasswordChange(false);
  };
  
  const handleDemoRegister = async (userData: UserRegistrationData): Promise<{success: boolean, message: string}> => {
    const existingUser = await getTeacherByEmail(userData.email);
    if (existingUser) {
        return { success: false, message: t('register.emailExists') };
    }
    const newDemoAdmin: Teacher = {
        id: `demo_${Date.now()}`,
        name: userData.rectorName,
        email: userData.email,
        password: userData.password,
        avatarUrl: `https://picsum.photos/seed/${userData.rectorName}/100/100`,
        role: Role.RECTOR,
        subject: 'Administrativos',
        passwordChanged: true, // They set it on registration
        isDemo: true,
        demoStartDate: new Date().toISOString()
    };
    await addOrUpdateTeachers([newDemoAdmin]);
    const updatedTeachers = await getTeachers();
    setTeachers(updatedTeachers);
    
    localStorage.setItem('currentUser', JSON.stringify(newDemoAdmin));
    setCurrentUser(newDemoAdmin);
    setAppState('app');
    return { success: true, message: t('register.demoSuccess')};
  };

  const handleUpgradeFromDemo = async () => {
    if(currentUser && 'isDemo' in currentUser) {
        const upgradedUser = {...currentUser, isDemo: false, demoStartDate: undefined};
        await updateTeacher(upgradedUser as Teacher);
        localStorage.setItem('currentUser', JSON.stringify(upgradedUser));
        setCurrentUser(upgradedUser);
        setIsDemoExpired(false);
        showSystemMessage(t('notifications.accountUpgraded'), 'success');
    }
  };


  // Data Handlers
  const showSystemMessage = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setSystemMessage({ message, type });
    setTimeout(() => {
        setSystemMessage(null);
    }, 5000);
  }, []);

  const handleUpdateUser = async (user: User) => {
    if ('role' in user) { // Teacher or Student
        if ('subject' in user) { // Teacher
            await updateTeacher(user as Teacher);
            const updated = await getTeachers();
            setTeachers(updated);
        } else { // Student
            await updateStudent(user as Student);
            const updated = await getStudents();
            setStudents(updated);
        }
    } else { // Guardian
        await updateGuardian(user as Guardian);
        const updated = await getGuardians();
        setGuardians(updated);
    }
    if (currentUser?.id === user.id) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
    }
  };

  const handleSetInstitutionProfile = (profile: React.SetStateAction<InstitutionProfileData>) => {
    const newProfile = typeof profile === 'function' ? profile(institutionProfile) : profile;
    setInstitutionProfile(newProfile);
    localStorage.setItem('institutionProfile', JSON.stringify(newProfile));
  };
  
  const handleSetAssessments = async (assessments: Assessment[]) => {
    await addOrUpdateAssessments(assessments);
    setAssessments(assessments);
  };
  
  const handleAddResult = async (result: StudentAssessmentResult) => {
    await addOrUpdateStudentResult(result);
    setStudentResults(prev => [...prev.filter(r => r.id !== result.id), result]);
  };
  
  const handleSetSubjectGrades = async (updater: React.SetStateAction<SubjectGrades[]>) => {
    const newGrades = typeof updater === 'function' 
        ? (updater as (prevState: SubjectGrades[]) => SubjectGrades[])(subjectGrades) 
        : updater;
    
    await addOrUpdateSubjectGrades(newGrades);
    setSubjectGrades(newGrades);
  };
  
  const handleUpdateCitations = (updater: React.SetStateAction<Citation[]>) => {
      const newCitations = typeof updater === 'function' 
          ? (updater as (prevState: Citation[]) => Citation[])(citations) 
          : updater;
      // In a real app, you would save this to the DB
      // await addOrUpdateCitations(newCitations); 
      setCitations(newCitations);
  };

  const handleUpdateIncidents = async (action: 'add' | 'update' | 'delete', data: Incident | string) => {
    if (action === 'add') {
        await addIncident(data as Incident);
    } else if (action === 'update') {
        await updateIncident(data as Incident);
    } else if (action === 'delete') {
        await deleteIncident(data as string);
    }
    await loadIncidents(); // Refresh state from DB
  };
  
  const handleUpdateAnnouncements = async (announcement: Announcement) => {
    await addAnnouncement(announcement);
    const announcementsData = await getAnnouncements();
    setAnnouncements(announcementsData);
  };

  const handleAddOrUpdateAttendanceRecord = async (record: AttendanceRecord) => {
    await addOrUpdateAttendanceRecord(record);
    setAttendanceRecords(prev => {
      const recordsMap = new Map(prev.map(r => [r.id, r]));
      recordsMap.set(record.id, record);
      return Array.from(recordsMap.values()).sort((a: AttendanceRecord, b: AttendanceRecord) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  };

  const handleBulkUpdateAttendance = async (records: AttendanceRecord[]) => {
    await addOrUpdateAttendanceRecords(records);
    setAttendanceRecords(prev => {
      const recordsMap = new Map(prev.map(r => [r.id, r]));
      records.forEach(r => recordsMap.set(r.id, r));
      return Array.from(recordsMap.values()).sort((a: AttendanceRecord, b: AttendanceRecord) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  };

  const handleSetGuardians = async (newGuardians: Guardian[]) => {
      await addOrUpdateGuardians(newGuardians);
      const data = await getGuardians();
      setGuardians(data);
  };

  const handleUpdateConversation = (updatedConversation: Conversation) => {
    setConversations(prev => {
        const newConversations = prev.map(c => c.id === updatedConversation.id ? updatedConversation : c);
        // sort by most recent message
        newConversations.sort((a,b) => {
            const lastMsgA = new Date(a.messages[a.messages.length - 1]?.timestamp || 0).getTime();
            const lastMsgB = new Date(b.messages[b.messages.length - 1]?.timestamp || 0).getTime();
            return lastMsgB - lastMsgA;
        });
        return newConversations;
    });
  };

  const handleCreateConversation = (newConversation: Conversation) => {
      // Check if conversation already exists to prevent duplicates
      const exists = conversations.some(c => c.id === newConversation.id);
      if (!exists) {
        setConversations(prev => [newConversation, ...prev]);
      }
  };

  const handleAddLesson = async (lesson: Lesson) => {
    await addLesson(lesson);
    const data = await getLessons();
    setLessons(data);
  };

  const handleCreateAttentionReport = async (report: AttentionReport) => {
      const student = allUsersMap.get(report.studentId) as Student;
      const guardian = guardians.find(g => g.studentIds.includes(report.studentId));
      const psychologist = teachers.find(t => t.role === Role.PSYCHOLOGY);
      const rector = teachers.find(t => t.role === Role.RECTOR);

      const participantIds: (string | number)[] = [report.reporterId];
      if (guardian) participantIds.push(guardian.id);
      if (psychologist) participantIds.push(psychologist.id);
      if (rector) participantIds.push(rector.id);

      const newConversation: Conversation = {
          id: report.conversationId,
          participantIds: [...new Set(participantIds)],
          messages: [{
              senderId: report.reporterId,
              text: `Reporte de atención iniciado para ${student?.name}.\nMotivo: ${report.reason}`,
              timestamp: new Date().toISOString()
          }],
      };
      
      await addAttentionReport(report);
      setAttentionReports(prev => [report, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      handleCreateConversation(newConversation);
      showSystemMessage(t('notifications.attentionReportSent'), 'success');
  };

  const handleUpdateAttentionReport = async (report: AttentionReport) => {
      await updateAttentionReport(report);
      setAttentionReports(prev => prev.map(r => r.id === report.id ? report : r));
      showSystemMessage(t('notifications.psychologyReportUpdated'), 'success');
  };


  // Render Logic
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">{t('loadingApp')}...</div>;
  }
  
  if (appState === 'landing') {
    return <LandingPage onShowLogin={() => setAppState('login')} onDemoRegister={handleDemoRegister} />;
  }

  if (appState === 'login') {
      return <Login onLogin={handleLogin} onBackToHome={() => setAppState('landing')} onShowQuickAccess={() => setAppState('quickAccess')} />;
  }
  
  if (appState === 'quickAccess') {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">{t('loadingProfiles')}...</div>}>
            <QuickAccess onLogin={handleLogin} onBack={() => setAppState('login')} />
        </Suspense>
    );
  }


  if (appState === 'app' && currentUser) {
      const userRole = 'role' in currentUser ? currentUser.role : 'Guardian';
      const isUserStudent = userRole === Role.STUDENT;
      const isAdmin = userRole === Role.ADMIN;
      const canSeeParentPortal = userRole === Role.ADMIN || userRole === Role.RECTOR || userRole === Role.COORDINATOR;
      
      const getDescriptiveRole = (user: User): string => {
        if (!('role' in user)) { // Guardian
            return t('roles.GUARDIAN');
        }

        if (user.role === Role.TEACHER && 'subject' in user) {
            return t('roles.SUBJECT_TEACHER', { subject: t(`subjects.${user.subject}`) });
        }
        
        return t(`roles.${user.role}`);
      };
      
      const userForHeader = {
        name: currentUser.name,
        avatarUrl: 'avatarUrl' in currentUser ? currentUser.avatarUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=005A9C&color=fff`,
        role: getDescriptiveRole(currentUser)
      };

      // Guardian (Parent) Layout
      if (userRole === 'Guardian') {
        return (
            <div className="flex flex-col h-screen bg-neutral dark:bg-gray-900 font-sans">
                <Header 
                    currentPage={currentPage}
                    isOnline={isOnline}
                    currentUser={userForHeader}
                    onLogout={handleLogout}
                    onNavigate={setCurrentPage}
                />
                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    <Suspense fallback={<div className="flex items-center justify-center h-full">{t('loadingPortal')}...</div>}>
                        {currentPage === 'ParentPortal' && <ParentPortal students={students} teachers={teachers} resources={resources} subjectGrades={subjectGrades} institutionProfile={institutionProfile} citations={citations} onUpdateCitations={handleUpdateCitations} incidents={incidents} announcements={announcements} conversations={conversations} onUpdateConversation={handleUpdateConversation} onCreateConversation={handleCreateConversation} allUsersMap={allUsersMap} currentUser={currentUser as Guardian} />}
                        {currentPage === 'Profile' && <Profile currentUser={currentUser} onUpdateUser={handleUpdateUser} />}
                    </Suspense>
                </main>
                 {notification && <NotificationToast title={notification.title} message={notification.message} studentName={notification.studentName} onClose={() => setNotification(null)} />}
                 {systemMessage && <SystemToast message={systemMessage.message} type={systemMessage.type} onClose={() => setSystemMessage(null)} />}
            </div>
        );
      }
      
      // Student Layout
      if (isUserStudent) {
        return (
           <div className="flex flex-col h-screen bg-neutral dark:bg-gray-900 font-sans">
                <Header 
                    currentPage={currentPage}
                    isOnline={isOnline}
                    currentUser={userForHeader}
                    onLogout={handleLogout}
                    onNavigate={setCurrentPage}
                />
                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    <Suspense fallback={<div className="flex items-center justify-center h-full">{t('loadingPortal')}...</div>}>
                        {currentPage === 'StudentPortal' && <StudentPortal loggedInUser={currentUser as Student} allStudents={students} teachers={teachers} subjectGrades={subjectGrades} resources={resources} assessments={assessments} studentResults={studentResults} onAddResult={handleAddResult} citations={citations} icfesDrillSettings={icfesDrillSettings} />}
                        {currentPage === 'Profile' && <Profile currentUser={currentUser} onUpdateUser={handleUpdateUser} />}
                        {currentPage === 'TutorMode' && <TutorMode lessons={lessons} onAddLesson={handleAddLesson} currentUser={currentUser}/>}
                    </Suspense>
                </main>
                 {notification && <NotificationToast title={notification.title} message={notification.message} studentName={notification.studentName} onClose={() => setNotification(null)} />}
                 {systemMessage && <SystemToast message={systemMessage.message} type={systemMessage.type} onClose={() => setSystemMessage(null)} />}
            </div>
        )
      }

      // Teacher / Admin Layout
      return (
        <div className="flex h-screen bg-neutral dark:bg-gray-800 font-sans">
          {isDemoExpired && <DemoExpiredModal onUpgrade={handleUpgradeFromDemo} onLogout={handleLogout} />}
          {needsPasswordChange && <ChangePasswordModal user={currentUser as Teacher | Student} onPasswordChanged={handlePasswordChanged} />}
          
          <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} currentUser={currentUser as Teacher} onLogout={handleLogout} icfesDrillSettings={icfesDrillSettings}/>
          
          <div className="flex-1 flex flex-col">
            <Header 
                currentPage={currentPage}
                isOnline={isOnline}
                currentUser={userForHeader}
                onLogout={handleLogout}
                onNavigate={setCurrentPage}
            />
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
              <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-300">Cargando página...</div>}>
                {currentPage === 'Dashboard' && <Dashboard students={students} teachers={teachers} citations={citations} onNavigate={setCurrentPage} />}
                {currentPage === 'Classroom' && <Classroom isOnline={isOnline} students={students} setStudents={async (updater) => { const newStudents = typeof updater === 'function' ? updater(students) : updater; await addOrUpdateStudents(newStudents); setStudents(newStudents); }} teachers={teachers} currentUser={currentUser as Teacher} subjectGradesData={subjectGrades} setSubjectGradesData={handleSetSubjectGrades} attendanceRecords={attendanceRecords} onUpdateAttendance={handleAddOrUpdateAttendanceRecord} onBulkUpdateAttendance={handleBulkUpdateAttendance} incidents={incidents} onUpdateIncidents={handleUpdateIncidents} announcements={announcements} onShowSystemMessage={showSystemMessage} onReportAttention={handleCreateAttentionReport} />}
                {currentPage === 'Assessments' && <Assessments students={students} assessments={assessments} setAssessments={handleSetAssessments} studentResults={studentResults} />}
                {currentPage === 'Resources' && <Resources resources={resources} downloadedIds={downloadedResourceIds} onUpdate={loadResources} />}
                {currentPage === 'Profile' && <Profile currentUser={currentUser} onUpdateUser={handleUpdateUser} />}
                {currentPage === 'Settings' && <Settings currentUser={currentUser as Teacher} onUpdateUser={handleUpdateUser} theme={theme} setTheme={setTheme} />}
                {currentPage === 'Incidents' && <Incidents isOnline={isOnline} students={students} setStudents={async (updater) => { const newStudents = typeof updater === 'function' ? updater(students) : updater; await addOrUpdateStudents(newStudents); setStudents(newStudents); }} teachers={teachers} setTeachers={async (updater) => { const newTeachers = typeof updater === 'function' ? updater(teachers) : updater; await addOrUpdateTeachers(newTeachers); setTeachers(newTeachers); }} currentUser={currentUser as Teacher} subjectGradesData={subjectGrades} setSubjectGradesData={handleSetSubjectGrades} allAttendanceRecords={attendanceRecords} citations={citations} onUpdateCitations={handleUpdateCitations} incidents={incidents} onUpdateIncidents={handleUpdateIncidents} announcements={announcements} onUpdateAnnouncements={handleUpdateAnnouncements} guardians={guardians} onUpdateGuardians={handleSetGuardians} onShowSystemMessage={showSystemMessage} onReportAttention={handleCreateAttentionReport} />}
                {currentPage === 'Rectory' && <Rectory students={students} teachers={teachers} currentUser={currentUser as Teacher} announcements={announcements} onUpdateAnnouncements={handleUpdateAnnouncements} onShowSystemMessage={showSystemMessage} />}
                {currentPage === 'InstitutionProfile' && <InstitutionProfile profile={institutionProfile} setProfile={handleSetInstitutionProfile} />}
                {currentPage === 'Calificaciones' && <Calificaciones students={students} teachers={teachers} subjectGradesData={subjectGrades} setSubjectGradesData={handleSetSubjectGrades} currentUser={currentUser as Teacher} onShowSystemMessage={showSystemMessage} />}
                {currentPage === 'Communication' && <Communication currentUser={currentUser as Teacher} students={students} teachers={teachers} guardians={guardians} conversations={conversations} onUpdateConversation={handleUpdateConversation} onCreateConversation={handleCreateConversation} allUsersMap={allUsersMap} />}
                {currentPage === 'TutorMode' && <TutorMode lessons={lessons} onAddLesson={handleAddLesson} currentUser={currentUser}/>}
                {currentPage === 'Eventos' && <Eventos />}
                {currentPage === 'SimulacroICFES' && (isAdmin || userRole === Role.RECTOR) && <SimulacroICFES settings={icfesDrillSettings} onSettingsChange={handleSetIcfesDrillSettings} />}
                {currentPage === 'Consolidado' && <Consolidado students={students} subjectGradesData={subjectGrades}/>}
                {currentPage === 'Psychology' && <Psychology reports={attentionReports} onUpdateReport={handleUpdateAttentionReport} students={students} allUsersMap={allUsersMap} conversations={conversations} onUpdateConversation={handleUpdateConversation} currentUser={currentUser as Teacher} institutionProfile={institutionProfile} />}
                {currentPage === 'Secretaria' && <Secretaria students={students} setStudents={async (updater) => { const newStudents = typeof updater === 'function' ? updater(students) : updater; await addOrUpdateStudents(newStudents); setStudents(newStudents); }} guardians={guardians} onUpdateGuardians={handleSetGuardians} subjectGradesData={subjectGrades} institutionProfile={institutionProfile} onShowSystemMessage={showSystemMessage} currentUser={currentUser as Teacher} conversations={conversations} onUpdateConversation={handleUpdateConversation} onCreateConversation={handleCreateConversation} />}

                
                {/* Admin-only views of portals */}
                {canSeeParentPortal && currentPage === 'ParentPortal' && guardians.length > 0 && <ParentPortal students={students.filter(s => guardians[0].studentIds.includes(s.id))} teachers={teachers} resources={resources} subjectGrades={subjectGrades} institutionProfile={institutionProfile} citations={citations} onUpdateCitations={handleUpdateCitations} incidents={incidents} announcements={announcements} conversations={conversations} onUpdateConversation={handleUpdateConversation} onCreateConversation={handleCreateConversation} allUsersMap={allUsersMap} currentUser={guardians[0]} />}
                {isAdmin && currentPage === 'StudentPortal' && <StudentPortal loggedInUser={currentUser as Teacher} allStudents={students} teachers={teachers} subjectGrades={subjectGrades} resources={resources} assessments={assessments} studentResults={studentResults} onAddResult={handleAddResult} citations={citations} icfesDrillSettings={icfesDrillSettings} />}

              </Suspense>
            </main>
          </div>
           {notification && <NotificationToast title={notification.title} message={notification.message} studentName={notification.studentName} onClose={() => setNotification(null)} />}
           {systemMessage && <SystemToast message={systemMessage.message} type={systemMessage.type} onClose={() => setSystemMessage(null)} />}
        </div>
      );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300">Redirigiendo...</p>
    </div>
  );
};


export const App: React.FC = () => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('lang') || 'es';
  });

  const setLanguage = useCallback((newLang: string) => {
    if (newLang === 'en' || newLang === 'es') {
      localStorage.setItem('lang', newLang);
      setLang(newLang);
    }
  }, []);

  const t = useCallback((key: string, options?: { [key: string]: string | number }) => {
    const langPack = translations[lang as keyof typeof translations] || translations.es;
    
    let translation = key.split('.').reduce((obj: any, k: string) => {
        return (obj && typeof obj === 'object' && k in obj) ? obj[k] : undefined;
    }, langPack) as string | undefined;

    // Fallback to Spanish if key not found
    if (translation === undefined) {
        const esLangPack = translations.es;
        translation = key.split('.').reduce((obj: any, k: string) => {
            return (obj && typeof obj === 'object' && k in obj) ? obj[k] : undefined;
        }, esLangPack) as string | undefined;
    }

    if (translation && options) {
      Object.keys(options).forEach(optKey => {
        translation = translation!.replace(`{{${optKey}}}`, String(options[optKey]));
      });
    }

    return translation || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang: setLanguage, t }}>
      <AppContent />
    </LanguageContext.Provider>
  );
};