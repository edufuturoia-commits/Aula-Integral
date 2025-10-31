import React, { useMemo } from 'react';
import type { Page, Teacher, Student, Guardian } from '../types';
import { Role } from '../types';
import { SIDEBAR_ITEMS, LogoutIcon } from '../constants';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  currentUser: Teacher | Student | Guardian;
  onLogout: () => void;
  icfesDrillSettings?: { isActive: boolean, grades: string[] };
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const PAGE_ACCESS: Partial<Record<Role, Page[]>> = {
  [Role.ADMIN]: ['Dashboard', 'Classroom', 'Incidents', 'Psychology', 'Secretaria', 'TutorMode', 'Communication', 'Assessments', 'Calificaciones', 'Consolidado', 'Resources', 'Eventos', 'Profile', 'Settings', 'Rectory', 'InstitutionProfile', 'ParentPortal', 'StudentPortal', 'SimulacroICFES'],
  [Role.RECTOR]: ['Dashboard', 'Incidents', 'Psychology', 'Secretaria', 'Communication', 'Rectory', 'Calificaciones', 'Consolidado', 'Resources', 'Eventos', 'Profile', 'Settings', 'InstitutionProfile', 'ParentPortal', 'SimulacroICFES', 'TutorMode'],
  [Role.COORDINATOR]: ['Dashboard', 'Incidents', 'Psychology', 'Secretaria', 'Communication', 'Calificaciones', 'Consolidado', 'Resources', 'Eventos', 'Profile', 'Settings', 'InstitutionProfile', 'ParentPortal', 'SimulacroICFES', 'TutorMode'],
  [Role.TEACHER]: ['Dashboard', 'Classroom', 'Communication', 'Assessments', 'Calificaciones', 'Consolidado', 'Resources', 'Eventos', 'Profile', 'Settings', 'TutorMode'],
  [Role.STUDENT]: ['Dashboard', 'StudentPortal', 'Resources', 'Eventos', 'Profile', 'TutorMode'],
  [Role.PSYCHOLOGY]: ['Dashboard', 'Psychology', 'Communication', 'Resources', 'Profile', 'Settings'],
  [Role.GUARDIAN]: ['ParentPortal', 'Communication', 'Profile', 'Settings', 'Eventos'],
};

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, currentUser, onLogout, icfesDrillSettings, isMobileOpen, setIsMobileOpen }) => {
  const visibleItems = useMemo(() => {
    if (!currentUser) return [];

    const allowedPages = PAGE_ACCESS[currentUser.role] || [];
    return SIDEBAR_ITEMS.filter(item => allowedPages.includes(item.name));
  }, [currentUser]);

  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    // Close sidebar on navigation, especially for mobile
    setIsMobileOpen(false);
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={`bg-primary text-white flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out
          transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          w-64 lg:w-20 xl:w-64
          lg:relative lg:translate-x-0`}
      >
        <div className="flex items-center justify-center h-16 border-b border-primary-focus flex-shrink-0">
          <h1 className="text-xl font-bold hidden xl:block">AULA INTEGRAL MAYA</h1>
          <h1 className="text-xl font-bold xl:hidden">AIM</h1>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          {visibleItems.map((item) => (
            <a
              key={item.name}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation(item.name);
              }}
              className={`flex items-center p-3 rounded-lg transition-colors duration-200 lg:justify-center xl:justify-start ${
                currentPage === item.name
                  ? 'bg-primary-focus text-white'
                  : 'text-gray-300 hover:bg-primary-focus hover:text-white dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <item.icon className="h-6 w-6 flex-shrink-0" />
              <span className="ml-4 font-medium hidden xl:block">{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="px-2 py-4 mt-auto border-t border-primary-focus/50">
          <a
              href="#"
              onClick={(e) => {
                  e.preventDefault();
                  onLogout();
              }}
              className="flex items-center p-3 rounded-lg transition-colors duration-200 text-gray-300 hover:bg-red-500/80 hover:text-white lg:justify-center xl:justify-start"
              title={"Cerrar Sesión"}
          >
              <LogoutIcon className="h-6 w-6 flex-shrink-0" />
              <span className="ml-4 font-medium hidden xl:block">{"Cerrar Sesión"}</span>
          </a>
        </div>
        <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500 hidden xl:block">
          <p>Derechos de autor - EduFuturo</p>
          <p>Educadores que trascienden</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;