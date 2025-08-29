
import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Classroom from './pages/Classroom';
import Assessments from './pages/Assessments';
import Resources from './pages/Resources';
import Profile from './pages/Profile';
import Incidents from './pages/Incidents';
import ParentPortal from './pages/ParentPortal';
import StudentPortal from './pages/StudentPortal';
import Rectory from './pages/Rectory';
import InstitutionProfile from './pages/InstitutionProfile';
import Login from './pages/Login';
import ChangePasswordModal from './components/ChangePasswordModal';
import { Page, Student, Teacher, Resource, InstitutionProfileData } from './types';
import { initDB, getStudents, getTeachers, getDownloadedResources, getTeacherByEmail, addOrUpdateTeachers } from './db';
import { SIDEBAR_ITEMS, MOCK_RESOURCES, MOCK_INSTITUTION_PROFILE } from './constants';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [dbReady, setDbReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [downloadedResourceIds, setDownloadedResourceIds] = useState<Set<string>>(new Set());
  const [institutionProfile, setInstitutionProfile] = useState<InstitutionProfileData>(() => {
    const savedProfile = localStorage.getItem('institutionProfile');
    return savedProfile ? JSON.parse(savedProfile) : MOCK_INSTITUTION_PROFILE;
  });

  // Auth State
  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [userForPasswordChange, setUserForPasswordChange] = useState<Teacher | null>(null);


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
            await Promise.all([
                getStudents().then(setStudents),
                getTeachers().then(setTeachers),
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
  }, [dbReady, loadResources]);

  const handleLogin = async (email: string, pass: string): Promise<{success: boolean, message: string}> => {
    const teacher = await getTeacherByEmail(email);

    if (!teacher) {
        return { success: false, message: 'Usuario o contraseña incorrectos.' };
    }
    
    if (teacher.password !== pass) {
        return { success: false, message: 'Usuario o contraseña incorrectos.' };
    }

    if (!teacher.passwordChanged) {
        setUserForPasswordChange(teacher);
        setShowChangePasswordModal(true);
        // We don't log them in yet. The modal will handle it.
        return { success: true, message: 'Redirigiendo para cambiar contraseña.' };
    }
    
    setCurrentUser(teacher);
    setCurrentPage('Dashboard');
    return { success: true, message: 'Inicio de sesión exitoso.' };
  };

  const handlePasswordChanged = (user: Teacher) => {
      setShowChangePasswordModal(false);
      setUserForPasswordChange(null);
      setCurrentUser(user); // Now log them in
      setTeachers(prev => prev.map(t => t.id === user.id ? user : t));
  };
  
  const handleLogout = () => {
      setCurrentUser(null);
  };
  
  const handleUpdateUser = async (user: Teacher) => {
      const updatedTeachers = teachers.map(t => t.id === user.id ? user : t);
      await addOrUpdateTeachers(updatedTeachers);
      setTeachers(updatedTeachers);
      setCurrentUser(user);
  };
  
  const currentPageLabel = SIDEBAR_ITEMS.find(item => item.name === currentPage)?.label || currentPage;

  const renderPage = useCallback(() => {
    if (isLoading || !currentUser) {
        return (
            <div className="flex justify-center items-center h-full">
                <p className="text-xl text-gray-500">Cargando datos de la institución...</p>
            </div>
        );
    }

    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard students={students} teachers={teachers} />;
      case 'Rectory':
        return <Rectory students={students} setStudents={setStudents} teachers={teachers} />;
      case 'InstitutionProfile':
        return <InstitutionProfile profile={institutionProfile} setProfile={setInstitutionProfile} />;
      case 'Classroom':
        return <Classroom isOnline={isOnline} students={students} setStudents={setStudents} currentUser={currentUser} />;
      case 'Incidents':
        return <Incidents isOnline={isOnline} students={students} setStudents={setStudents} teachers={teachers} setTeachers={setTeachers} />;
      case 'Assessments':
        return <Assessments />;
      case 'Resources':
        return <Resources resources={resources} downloadedIds={downloadedResourceIds} onUpdate={loadResources} />;
      case 'Profile':
        return <Profile currentUser={currentUser} onUpdateUser={handleUpdateUser} />;
      case 'ParentPortal':
        return <ParentPortal students={students} teachers={teachers} resources={resources} />;
      case 'StudentPortal':
        return <StudentPortal students={students} setStudents={setStudents} resources={resources} />;
      default:
        return <Dashboard students={students} teachers={teachers} />;
    }
  }, [currentPage, isOnline, isLoading, students, teachers, resources, loadResources, institutionProfile, currentUser, handleUpdateUser]);
  
  if (!dbReady) {
       return (
            <div className="flex justify-center items-center h-screen bg-neutral">
                <p className="text-xl text-gray-500 animate-pulse">Iniciando base de datos...</p>
            </div>
        );
  }
  
  if (!currentUser) {
      return (
          <>
            <Login onLogin={handleLogin} />
            {showChangePasswordModal && userForPasswordChange && (
                <ChangePasswordModal 
                    user={userForPasswordChange}
                    onPasswordChanged={handlePasswordChanged}
                />
            )}
          </>
      );
  }

  return (
    <div className="flex h-screen bg-neutral text-gray-800">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} currentUser={currentUser} onLogout={handleLogout}/>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentPage={currentPageLabel} 
          isOnline={isOnline}
          currentUser={currentUser}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral p-6 md:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
