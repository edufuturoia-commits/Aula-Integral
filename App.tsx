


import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Classroom from './pages/Classroom';
import Assessments from './pages/Assessments';
import Resources from './pages/Resources';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Incidents from './pages/Incidents';
import ParentPortal from './pages/ParentPortal';
import StudentPortal from './pages/StudentPortal';
import Rectory from './pages/Rectory';
import InstitutionProfile from './pages/InstitutionProfile';
import Login from './pages/Login';
import Calificaciones from './pages/Calificaciones';
import ChangePasswordModal from './components/ChangePasswordModal';
import DemoExpiredModal from './components/DemoExpiredModal';
import { Page, Student, Teacher, Resource, InstitutionProfileData, Assessment, StudentAssessmentResult, Role, SubjectGrades, UserRegistrationData, AttendanceRecord } from './types';
import { initDB, getStudents, getTeachers, getDownloadedResources, getTeacherByEmail, addOrUpdateTeachers, getAssessments, addOrUpdateAssessments, getStudentResults, addOrUpdateStudentResult, getStudentByEmail, addOrUpdateStudents, getSubjectGrades, addOrUpdateSubjectGrades, getAllAttendanceRecords, addOrUpdateAttendanceRecord, addOrUpdateAttendanceRecords } from './db';
import { SIDEBAR_ITEMS, MOCK_RESOURCES, MOCK_INSTITUTION_PROFILE, MOCK_STUDENTS, MOCK_TEACHERS } from './constants';
import LandingPage from './pages/LandingPage';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [dbReady, setDbReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [studentResults, setStudentResults] = useState<StudentAssessmentResult[]>([]);
  const [subjectGrades, setSubjectGrades] = useState<SubjectGrades[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [downloadedResourceIds, setDownloadedResourceIds] = useState<Set<string>>(new Set());
  const [institutionProfile, setInstitutionProfile] = useState<InstitutionProfileData>(() => {
    const savedProfile = localStorage.getItem('institutionProfile');
    return savedProfile ? JSON.parse(savedProfile) : MOCK_INSTITUTION_PROFILE;
  });

  // Auth State
  const [currentUser, setCurrentUser] = useState<Teacher | Student | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDemoExpiredModal, setShowDemoExpiredModal] = useState(false);
  const [userForPasswordChange, setUserForPasswordChange] = useState<Teacher | Student | null>(null);
  const [showLogin, setShowLogin] = useState(false);


  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    initDB().then(success => {
        if(success) {
            setDbReady(true);
        } else {
            console.error("Failed to initialize database.");
            setIsLoading(false);
        }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const seedDatabase = useCallback(async () => {
      const dbStudents = await getStudents();
      const dbTeachers = await getTeachers();

      if (dbStudents.length === 0 && dbTeachers.length === 0) {
          console.log("Database is empty. Seeding with mock data...");
          await addOrUpdateStudents(MOCK_STUDENTS);
          await addOrUpdateTeachers(MOCK_TEACHERS);
          console.log("Seeding complete.");
      }
  }, []);

  const loadResources = useCallback(async () => {
    try {
        const resourcesMap = new Map<string, Resource>(
            MOCK_RESOURCES.map(res => [res.id, res])
        );

        const localResources = await getDownloadedResources();
        
        localResources.forEach(res => {
            resourcesMap.set(res.id, res);
        });

        setDownloadedResourceIds(new Set(localResources.map(r => r.id)));

        const sortedResources = Array.from(resourcesMap.values()).sort((a, b) => {
            const aIsAi = !!a.content;
            const bIsAi = !!b.content;
            if (aIsAi && !bIsAi) return -1;
            if (!aIsAi && bIsAi) return 1;
            return a.title.localeCompare(b.title);
        });
        setResources(sortedResources);
    } catch (error) {
        console.error("Failed to load resources:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        try {
            await seedDatabase();
            await Promise.all([
                getStudents().then(setStudents),
                getTeachers().then(setTeachers),
                getAssessments().then(setAssessments),
                getStudentResults().then(setStudentResults),
                getSubjectGrades().then(setSubjectGrades),
                getAllAttendanceRecords().then(setAttendanceRecords),
                loadResources()
            ]);
        } catch (error) {
            console.error("Failed to load initial data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (dbReady) {
        loadData();
    }
  }, [dbReady, loadResources, seedDatabase]);

  const handleUpdateUser = async (user: Teacher | Student) => {
      if ('subject' in user) { // It's a Teacher
        const updatedTeachers = teachers.map(t => t.id === user.id ? user : t);
        await addOrUpdateTeachers(updatedTeachers);
        setTeachers(updatedTeachers);
      } else { // It's a Student
         const updatedStudents = students.map(s => s.id === user.id ? user : s);
         await addOrUpdateStudents(updatedStudents);
         setStudents(updatedStudents);
      }
      if (currentUser?.id === user.id) {
        setCurrentUser(user);
      }
  };

  const handleLogin = async (email: string, pass: string): Promise<{success: boolean, message: string}> => {
    let user: Teacher | Student | undefined = await getTeacherByEmail(email);
    
    if (!user) {
        user = await getStudentByEmail(email);
    }

    if (!user) {
        return { success: false, message: 'Usuario o contraseña incorrectos.' };
    }
    
    if (user.password !== pass) {
        return { success: false, message: 'Usuario o contraseña incorrectos.' };
    }

    if ('isDemo' in user && user.isDemo && user.demoStartDate) {
        const startDate = new Date(user.demoStartDate);
        const expirationDate = new Date(startDate);
        expirationDate.setMonth(startDate.getMonth() + 1); // 1 month trial

        if (new Date() > expirationDate) {
            setCurrentUser(user);
            setShowDemoExpiredModal(true);
            return { success: true, message: 'La demostración ha expirado.' };
        }
    }

    if (!user.passwordChanged) {
        setUserForPasswordChange(user);
        setShowChangePasswordModal(true);
        return { success: true, message: 'Redirigiendo para cambiar contraseña.' };
    }
    
    setCurrentUser(user);
    
    if (user.role === Role.STUDENT) {
        setCurrentPage('StudentPortal');
    } else {
        setCurrentPage('Dashboard');
    }

    return { success: true, message: 'Inicio de sesión exitoso.' };
  };
  
  const handleDemoRegister = async (userData: UserRegistrationData): Promise<{ success: boolean, message: string }> => {
    // Check if email is already taken
    const existingTeacher = await getTeacherByEmail(userData.email!);
    const existingStudent = await getStudentByEmail(userData.email!);
    if (existingTeacher || existingStudent) {
        return { success: false, message: 'Este correo electrónico ya se encuentra registrado.' };
    }
    
    // Create new user (Rector)
    const newRector: Teacher = {
        id: userData.email!, // Using email as ID for demo
        name: userData.rectorName,
        avatarUrl: `https://picsum.photos/seed/${userData.email}/100/100`,
        role: Role.RECTOR,
        subject: 'Administración',
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        passwordChanged: true, // For demo, assume it's changed
        isDemo: true,
        demoStartDate: new Date().toISOString()
    };

    await addOrUpdateTeachers([...teachers, newRector]);
    setTeachers(prev => [...prev, newRector]);
    
    // Also update institution profile for this demo user
    const newProfile: InstitutionProfileData = {
        ...MOCK_INSTITUTION_PROFILE,
        name: userData.institutionName,
        rector: userData.rectorName,
        email: userData.email,
        phone: userData.phone,
    };
    handleSetInstitutionProfile(newProfile);

    // Automatically log in
    setCurrentUser(newRector);
    setCurrentPage('Dashboard');
    
    return { success: true, message: 'Registro de demostración exitoso. ¡Bienvenido!' };
  };

  const handlePasswordChanged = (user: Teacher | Student) => {
    setCurrentUser(user);
    setShowChangePasswordModal(false);
    setUserForPasswordChange(null);
     if (user.role === Role.STUDENT) {
        setCurrentPage('StudentPortal');
    } else {
        setCurrentPage('Dashboard');
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
    
    setSubjectGrades(newGrades); // Optimistic UI update
    await addOrUpdateSubjectGrades(newGrades); // Persist to DB
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
  
  const handleLogout = () => {
      setCurrentUser(null);
      setShowLogin(false);
      setCurrentPage('Dashboard');
  };
  
  const handleUpgrade = async () => {
      if (currentUser && 'isDemo' in currentUser) {
          const updatedUser = { ...currentUser, isDemo: false, demoStartDate: undefined };
          await handleUpdateUser(updatedUser);
          setShowDemoExpiredModal(false);
          alert("¡Gracias por tu compra! Tu cuenta ha sido activada.");
      }
  };

  if (!currentUser) {
      if (showLogin) {
          return <Login onLogin={handleLogin} onBackToHome={() => setShowLogin(false)} />;
      }
      return (
        <LandingPage 
            onShowLogin={() => setShowLogin(true)} 
            onDemoRegister={handleDemoRegister}
        />
      );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} currentUser={currentUser} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentPage={SIDEBAR_ITEMS.find(item => item.name === currentPage)?.label || currentPage} isOnline={isOnline} currentUser={currentUser} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-neutral">
            <div className={currentPage === 'Dashboard' ? '' : 'hidden'}>
                <Dashboard students={students} teachers={teachers} />
            </div>
            <div className={currentPage === 'Classroom' ? '' : 'hidden'}>
                {currentUser.role !== Role.STUDENT && <Classroom isOnline={isOnline} students={students} setStudents={setStudents} currentUser={currentUser as Teacher} subjectGradesData={subjectGrades} setSubjectGradesData={handleSetSubjectGrades} attendanceRecords={attendanceRecords} onUpdateAttendance={handleAddOrUpdateAttendanceRecord} onBulkUpdateAttendance={handleBulkUpdateAttendance} />}
            </div>
            <div className={currentPage === 'Assessments' ? '' : 'hidden'}>
                 {currentUser.role !== Role.STUDENT && <Assessments students={students} assessments={assessments} setAssessments={handleSetAssessments} studentResults={studentResults} />}
            </div>
            <div className={currentPage === 'Resources' ? '' : 'hidden'}>
                <Resources resources={resources} downloadedIds={downloadedResourceIds} onUpdate={loadResources}/>
            </div>
            <div className={currentPage === 'Profile' ? '' : 'hidden'}>
                <Profile currentUser={currentUser} onUpdateUser={handleUpdateUser} />
            </div>
            <div className={currentPage === 'Settings' ? '' : 'hidden'}>
                 {currentUser.role !== Role.STUDENT && <Settings currentUser={currentUser as Teacher} onUpdateUser={handleUpdateUser as (user: Teacher) => Promise<void>} />}
            </div>
            <div className={currentPage === 'Incidents' ? '' : 'hidden'}>
                {(currentUser.role === Role.COORDINATOR || currentUser.role === Role.RECTOR || currentUser.role === Role.ADMIN) && <Incidents isOnline={isOnline} students={students} setStudents={setStudents} teachers={teachers} setTeachers={setTeachers} currentUser={currentUser as Teacher} subjectGradesData={subjectGrades} setSubjectGradesData={handleSetSubjectGrades} allAttendanceRecords={attendanceRecords} />}
            </div>
            <div className={currentPage === 'ParentPortal' ? '' : 'hidden'}>
                <ParentPortal students={students} teachers={teachers} resources={resources} subjectGrades={subjectGrades} institutionProfile={institutionProfile} />
            </div>
            <div className={currentPage === 'StudentPortal' ? '' : 'hidden'}>
                 {currentUser.role === Role.STUDENT && <StudentPortal students={students} setStudents={setStudents} resources={resources} assessments={assessments} studentResults={studentResults} onAddResult={handleAddResult}/>}
            </div>
            <div className={currentPage === 'Rectory' ? '' : 'hidden'}>
                {(currentUser.role === Role.RECTOR || currentUser.role === Role.ADMIN) && <Rectory students={students} setStudents={setStudents} teachers={teachers} subjectGradesData={subjectGrades} setSubjectGradesData={handleSetSubjectGrades} currentUser={currentUser as Teacher}/>}
            </div>
            <div className={currentPage === 'InstitutionProfile' ? '' : 'hidden'}>
                {(currentUser.role === Role.ADMIN || currentUser.role === Role.RECTOR) && <InstitutionProfile profile={institutionProfile} setProfile={handleSetInstitutionProfile} />}
            </div>
            <div className={currentPage === 'Calificaciones' ? '' : 'hidden'}>
                 {currentUser.role !== Role.STUDENT && <Calificaciones students={students} subjectGradesData={subjectGrades} setSubjectGradesData={handleSetSubjectGrades} currentUser={currentUser as Teacher}/>}
            </div>
        </main>
      </div>
      {showChangePasswordModal && userForPasswordChange && <ChangePasswordModal user={userForPasswordChange} onPasswordChanged={handlePasswordChanged} />}
      {showDemoExpiredModal && <DemoExpiredModal onUpgrade={handleUpgrade} onLogout={handleLogout} />}
    </div>
  );
};

export default App;