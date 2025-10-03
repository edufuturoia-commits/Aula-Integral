import React from 'react';
import type { Page } from '../types';
import { LogoutIcon } from '../constants';

interface HeaderProps {
  currentPage: string;
  isOnline: boolean;
  currentUser: {
    name: string;
    avatarUrl: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (page: Page) => void;
}

const StatusIndicator: React.FC<{isOnline: boolean}> = ({ isOnline }) => (
  <div className="flex items-center space-x-2">
    <div className="relative flex items-center">
        <span className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
        {isOnline && <span className={`absolute h-3 w-3 rounded-full bg-green-500 opacity-75 animate-ping`}></span>}
    </div>
    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden md:block">
      {isOnline ? 'En Línea' : 'Sin Conexión'}
    </span>
  </div>
);

const Header: React.FC<HeaderProps> = ({ currentPage, isOnline, currentUser, onLogout, onNavigate }) => {
  return (
    <header className="h-20 bg-base-100 dark:bg-gray-800 shadow-md dark:shadow-none dark:border-b dark:border-gray-700 flex items-center justify-between px-4 md:px-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 truncate pr-4">{currentPage}</h1>
      <div className="flex items-center space-x-2 md:space-x-4">
        <StatusIndicator isOnline={isOnline} />
        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
        <button 
          onClick={() => onNavigate('Profile')}
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Ver Perfil"
        >
          <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-10 w-10 rounded-full object-cover" />
          <div className="hidden sm:block text-left">
            <p className="font-semibold text-gray-700 dark:text-gray-200 truncate">{currentUser.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">{currentUser.role}</p>
          </div>
        </button>
        <button
            onClick={onLogout}
            className="p-3 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Cerrar Sesión"
        >
            <LogoutIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;