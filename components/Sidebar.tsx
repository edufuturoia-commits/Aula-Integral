import React, { useMemo } from 'react';
import type { Page, Teacher, Student } from '../types';
import { Role } from '../types';
import { SIDEBAR_ITEMS, LogoutIcon } from '../constants';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  currentUser: Teacher | Student;
  onLogout: () => void;
  icfesDrillSettings?: { isActive: boolean, grades: string[] };
}

const PAGE_ACCESS: Partial<Record<Role, Page[]>> = {
  [Role.ADMIN]: ['Dashboard', 'Classroom', 'Incidents', 'Psychology', 'Secretaria', 'TutorMode', 'Communication', 'Assessments', 'Calificaciones', 'Consolidado', 'Resources', 'Eventos', 'Profile', 'Settings', 'Rectory', 'InstitutionProfile', 'ParentPortal', 'StudentPortal', 'SimulacroICFES'],
  [Role.RECTOR]: ['Dashboard', 'Incidents', 'Psychology', 'Secretaria', 'Communication', 'Rectory', 'Calificaciones', 'Consolidado', 'Resources', 'Eventos', 'Profile', 'Settings', 'InstitutionProfile', 'ParentPortal', 'SimulacroICFES', 'TutorMode'],
  [Role.COORDINATOR]: ['Dashboard', 'Incidents', 'Psychology', 'Secretaria', 'Communication', 'Calificaciones', 'Consolidado', 'Resources', 'Eventos', 'Profile', 'Settings', 'InstitutionProfile', 'ParentPortal', 'SimulacroICFES', 'TutorMode'],
  [Role.TEACHER]: ['Dashboard', 'Classroom', 'Communication', 'Assessments', 'Calificaciones', 'Consolidado', 'Resources', 'Eventos', 'Profile', 'Settings', 'TutorMode'],
  [Role.STUDENT]: ['Dashboard', 'StudentPortal', 'Resources', 'Eventos', 'Profile', 'TutorMode'],
  [Role.PSYCHOLOGY]: ['Dashboard', 'Psychology', 'Communication', 'Resources', 'Profile', 'Settings'],
};

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, currentUser, onLogout, icfesDrillSettings }) => {
  const visibleItems = useMemo(() => {
    if (!currentUser) return [];

    const allowedPages = PAGE_ACCESS[currentUser.role] || [];
    return SIDEBAR_ITEMS.filter(item => allowedPages.includes(item.name));
  }, [currentUser]);


  return (
    <div className="w-20 lg:w-64 bg-primary text-white flex flex-col">
      <div className="flex items-center justify-center h-16 border-b border-primary-focus">
        <h1 className="text-xl font-bold hidden lg:block">AULA INTEGRAL MAYA</h1>
        <h1 className="text-xl font-bold lg:hidden">AIM</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
        {visibleItems.map((item) => (
          <a
            key={item.name}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(item.name);
            }}
            className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
              currentPage === item.name
                ? 'bg-primary-focus text-white'
                : 'text-gray-300 hover:bg-primary-focus hover:text-white dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <item.icon className="h-6 w-6" />
            <span className="ml-4 font-medium hidden lg:block">{item.label}</span>
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
            className="flex items-center p-3 rounded-lg transition-colors duration-200 text-gray-300 hover:bg-red-500/80 hover:text-white"
            title={"Cerrar Sesión"}
        >
            <LogoutIcon className="h-6 w-6" />
            <span className="ml-4 font-medium hidden lg:block">{"Cerrar Sesión"}</span>
        </a>
      </div>
      <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500 hidden lg:block">
        <p>Derechos de autor - EduFuturo</p>
        <p>Educadores que trascienden</p>
      </div>
    </div>
  );
};

export default Sidebar;