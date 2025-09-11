

import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Types and DB
import { Page, Student, Teacher, Resource, InstitutionProfileData, Assessment, StudentAssessmentResult, Role, SubjectGrades, AttendanceRecord, IncidentType, Citation, Incident } from './types';
import { getStudents, getTeachers, getDownloadedResources, addOrUpdateTeachers, getAssessments, addOrUpdateAssessments, getStudentResults, addOrUpdateStudentResult, addOrUpdateStudents, getSubjectGrades, addOrUpdateSubjectGrades, getAllAttendanceRecords, addOrUpdateAttendanceRecord, addOrUpdateAttendanceRecords, getIncidents, addIncident, updateIncident, deleteIncident } from './db';

// Constants
import { SIDEBAR_ITEMS, MOCK_INSTITUTION_PROFILE, MOCK_CITATIONS } from './constants';

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


interface NotificationToastProps {
  title: string;
  message: string;
  studentName: string;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ title, message, studentName, onClose }) => {
  return (
    <div className="fixed top-24 right-6 w-full max-w-sm bg-white shadow-lg rounded-xl p-4 z-[100] animate-slide-in-right border-l-4 border-primary">
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-600"><strong>Estudiante:</strong> {studentName}</p>
          <p className="mt-1 text-sm text-gray-500">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button onClick={onClose} className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <span className="sr-only">Cerrar</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  // App State Management
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Teacher | Student | null>(null);

  // Main App Page
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');

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
  const isAdmin = currentUser?.role === Role.ADMIN;
  
  // Real-time notification state
  const [notification, setNotification] = useState<{ title: string; message: string; studentName: string; } | null>(null);


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

  // Effect to simulate WebSocket for real-time incident notifications
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const showRandomNotification = () => {
      // Ensure there are students and the app is online to simulate a realistic scenario
      if (students.length > 0 && navigator.onLine) {
        const randomStudent = students[Math.floor(Math.random() * students.length)];
        const randomIncidentType = Object.values(IncidentType)[Math.floor(Math.random() * Object.values(IncidentType).length)];
        
        setNotification({
          title: 'Nueva Incidencia Reportada',
          message: `Se ha reportado un nuevo incidente de tipo "${randomIncidentType}".`,
          studentName: randomStudent.name
        });

        // Automatically hide after 7 seconds
        setTimeout(() => {
          setNotification(null);
        }, 7000);
      }

      // Schedule next notification
      const randomInterval = Math.random() * (45000 - 25000) + 25000; // between 25 and 45 seconds
      timeoutId = setTimeout(showRandomNotification, randomInterval);
    };

    // Start the simulation after an initial delay
    timeoutId = setTimeout(showRandomNotification, 20000); 

    return () => clearTimeout(timeoutId);
  }, [students]); // Dependency on students ensures we have data to show.


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
        const [studentsData, teachersData, assessmentsData, resultsData, gradesData, attendanceData] = await Promise.all([
          getStudents(),
          getTeachers(),
          getAssessments(),
          getStudentResults(),
          getSubjectGrades(),
          getAllAttendanceRecords(),
        ]);
        setStudents(studentsData);
        setTeachers(teachersData);
        setAssessments(assessmentsData);
        setStudentResults(resultsData);
        setSubjectGrades(gradesData);
        setAttendanceRecords(attendanceData);
        setCitations(MOCK_CITATIONS);
        await loadIncidents();
        
        // Auto-login as admin for testing purposes
        const adminUser = teachersData.find(t => t.role === Role.ADMIN);
        if (adminUser) {
            setCurrentUser(adminUser);
        } else {
            console.error("Admin user not found. Please ensure the database is seeded.");
        }

        await loadResources();
      } catch (error) {
        console.error("Failed to load initial data from server:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [loadResources, loadIncidents]);

  // Data Handlers
  const handleUpdateUser = async (user: Teacher | Student) => {
    if ('subject' in user) { // Teacher
        const updated = teachers.map(t => t.id === user.id ? user : t);
        await addOrUpdateTeachers(updated);
        setTeachers(updated);
    } else { // Student
        const updated = students.map(s => s.id === user.id ? user : s);
        await addOrUpdateStudents(updated);
        setStudents(updated);
    }
    if (currentUser?.id === user.id) {
        setCurrentUser(user);
    }
  };

  const handleSetInstitutionProfile = (profile: InstitutionProfileData) => {
    setInstitutionProfile(profile);
    localStorage.setItem('institutionProfile', JSON.stringify(profile));
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

  const handleAddOrUpdateAttendanceRecord = async (record: AttendanceRecord) => {
    await addOrUpdateAttendanceRecord(record);
    setAttendanceRecords(prev => {
      const index = prev.findIndex(r => r.id === record.id);
      if (index > -1) {
          const newRecords = [...prev];
          newRecords[index] = record;
          return newRecords;
      }
      return [...prev, record];
    });
  };

  const handleBulkUpdateAttendance = async (records: AttendanceRecord[]) => {
    await addOrUpdateAttendanceRecords(records);
    setAttendanceRecords(prev => {
      const recordsMap = new Map(prev.map(r => [r.id, r]));
      records.forEach(r => recordsMap.set(r.id, r));
      return Array.from(recordsMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  };

  // Render Logic
  if (isLoading || !currentUser) {
    return <div className="flex items-center justify-center h-screen">Cargando aplicación...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} currentUser={currentUser} />
        <div className="flex-1 flex flex-col overflow-hidden">
            <Header currentPage={SIDEBAR_ITEMS.find(item => item.name === currentPage)?.label || currentPage} isOnline={isOnline} currentUser={currentUser} />
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-neutral">
                <Suspense fallback={<div className="flex items-center justify-center h-full">Cargando página...</div>}>
                    {currentPage === 'Dashboard' && <Dashboard students={students} teachers={teachers} />}
                    {currentPage === 'Classroom' && (isAdmin || currentUser.role !== Role.STUDENT) && <Classroom isOnline={isOnline} students={students} setStudents={setStudents} currentUser={currentUser as Teacher} subjectGradesData={subjectGrades} setSubjectGradesData={handleSetSubjectGrades} attendanceRecords={attendanceRecords} onUpdateAttendance={handleAddOrUpdateAttendanceRecord} onBulkUpdateAttendance={handleBulkUpdateAttendance} incidents={incidents} onUpdateIncidents={handleUpdateIncidents} />}
                    {currentPage === 'Assessments' && (isAdmin || currentUser.role !== Role.STUDENT) && <Assessments students={students} assessments={assessments} setAssessments={handleSetAssessments} studentResults={studentResults} />}
                    {currentPage === 'Resources' && <Resources resources={resources} downloadedIds={downloadedResourceIds} onUpdate={loadResources}/>}
                    {currentPage === 'Profile' && <Profile currentUser={currentUser} onUpdateUser={handleUpdateUser} />}
                    {currentPage === 'Settings' && (isAdmin || currentUser.role !== Role.STUDENT) && <Settings currentUser={currentUser as Teacher} onUpdateUser={handleUpdateUser as (user: Teacher) => Promise<void>} />}
                    {currentPage === 'Incidents' && (isAdmin || currentUser.role === Role.COORDINATOR || currentUser.role === Role.RECTOR) && <Incidents isOnline={isOnline} students={students} setStudents={setStudents} teachers={teachers} setTeachers={setTeachers} currentUser={currentUser as Teacher} subjectGradesData={subjectGrades} setSubjectGradesData={handleSetSubjectGrades} allAttendanceRecords={attendanceRecords} citations={citations} onUpdateCitations={handleUpdateCitations} incidents={incidents} onUpdateIncidents={handleUpdateIncidents} />}
                    {currentPage === 'ParentPortal' && <ParentPortal students={students} teachers={teachers} resources={resources} subjectGrades={subjectGrades} institutionProfile={institutionProfile} citations={citations} onUpdateCitations={handleUpdateCitations} incidents={incidents} />}
                    {currentPage === 'StudentPortal' && (isAdmin || currentUser.role === Role.STUDENT) && <StudentPortal 
                        loggedInUser={currentUser}
                        allStudents={students}
                        teachers={teachers} 
                        subjectGrades={subjectGrades} 
                        resources={resources} 
                        assessments={assessments} 
                        studentResults={studentResults} 
                        onAddResult={handleAddResult}
                        citations={citations}/>}
                    {currentPage === 'Rectory' && (isAdmin || currentUser.role === Role.RECTOR) && <Rectory students={students} setStudents={setStudents} teachers={teachers} subjectGradesData={subjectGrades} setSubjectGradesData={handleSetSubjectGrades} currentUser={currentUser as Teacher}/>}
                    {currentPage === 'InstitutionProfile' && (isAdmin || currentUser.role === Role.RECTOR) && <InstitutionProfile profile={institutionProfile} setProfile={handleSetInstitutionProfile} />}
                    {currentPage === 'Calificaciones' && (isAdmin || currentUser.role !== Role.STUDENT) && <Calificaciones students={students} subjectGradesData={subjectGrades} setSubjectGradesData={handleSetSubjectGrades} currentUser={currentUser as Teacher}/>}
                    {currentPage === 'Communication' && (isAdmin || currentUser.role === Role.COORDINATOR || currentUser.role === Role.RECTOR || currentUser.role === Role.TEACHER) && <Communication currentUser={currentUser as Teacher} />}
                </Suspense>
            </main>
        </div>
         {notification && (
            <NotificationToast 
                title={notification.title} 
                message={notification.message} 
                studentName={notification.studentName}
                onClose={() => setNotification(null)}
            />
        )}
    </div>
  );
};

export default App;