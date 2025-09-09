import React, { useMemo } from 'react';
import type { Page, Teacher, Student } from '../types';
import { Role } from '../types';
import { SIDEBAR_ITEMS, LogoutIcon } from '../constants';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  currentUser: Teacher | Student;
  onLogout: () => void;
}

const PAGE_ACCESS: Partial<Record<Role, Page[]>> = {
  [Role.ADMIN]: ['Dashboard', 'Classroom', 'Incidents', 'Assessments', 'Calificaciones', 'Resources', 'Profile', 'Settings', 'Rectory', 'InstitutionProfile', 'ParentPortal', 'StudentPortal'],
  [Role.RECTOR]: ['Dashboard', 'Incidents', 'Rectory', 'Resources', 'Profile', 'Settings', 'InstitutionProfile', 'ParentPortal'],
  [Role.COORDINATOR]: ['Dashboard', 'Incidents', 'Resources', 'Profile', 'Settings', 'InstitutionProfile', 'ParentPortal'],
  [Role.TEACHER]: ['Dashboard', 'Classroom', 'Assessments', 'Calificaciones', 'Resources', 'Profile', 'Settings'],
  [Role.STUDENT]: ['Dashboard', 'StudentPortal', 'Resources', 'Profile'],
};

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, currentUser, onLogout }) => {
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
                : 'text-gray-300 hover:bg-primary-focus hover:text-white'
            }`}
          >
            <item.icon className="h-6 w-6" />
            <span className="ml-4 font-medium hidden lg:block">{item.label}</span>
          </a>
        ))}
      </nav>
      <div className="p-4 text-center text-xs text-gray-400 hidden lg:block">
        <p>Copyright - EduFuturo</p>
        <p>Educadores que Trascienden</p>
      </div>
      <div className="p-2 border-t border-primary-focus">
         <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onLogout();
            }}
            className="flex items-center p-3 rounded-lg transition-colors duration-200 text-gray-300 hover:bg-accent hover:text-white"
          >
            <LogoutIcon className="h-6 w-6" />
            <span className="ml-4 font-medium hidden lg:block">Cerrar Sesión</span>
          </a>
      </div>
    </div>
  );
};

export default Sidebar;