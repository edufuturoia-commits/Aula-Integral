import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Classroom from './pages/Classroom';
import Assessments from './pages/Assessments';
import Resources from './pages/Resources';
import Profile from './pages/Profile';
import Incidents from './pages/Incidents';
import { Page } from './types';
import { initDB } from './db';
import { SIDEBAR_ITEMS } from './constants';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [dbReady, setDbReady] = useState(false);

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
        }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const currentPageLabel = SIDEBAR_ITEMS.find(item => item.name === currentPage)?.label || currentPage;

  const renderPage = useCallback(() => {
    if (!dbReady && currentPage === 'Classroom') {
        return (
            <div className="flex justify-center items-center h-full">
                <p className="text-xl text-gray-500">Initializing local database...</p>
            </div>
        );
    }

    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Classroom':
        return <Classroom isOnline={isOnline} />;
      case 'Incidents':
        return <Incidents />;
      case 'Assessments':
        return <Assessments />;
      case 'Resources':
        return <Resources />;
      case 'Profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  }, [currentPage, isOnline, dbReady]);

  return (
    <div className="flex h-screen bg-neutral text-gray-800">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentPage={currentPageLabel} 
          isOnline={isOnline}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral p-6 md:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;