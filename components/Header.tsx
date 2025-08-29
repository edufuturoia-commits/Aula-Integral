import React from 'react';
import type { Teacher } from '../types';

interface HeaderProps {
  currentPage: string;
  isOnline: boolean;
  currentUser: Teacher;
}

const StatusIndicator: React.FC<{isOnline: boolean}> = ({ isOnline }) => (
  <div className="flex items-center space-x-2">
    <div className="relative flex items-center">
        <span className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
        {isOnline && <span className={`absolute h-3 w-3 rounded-full bg-green-500 opacity-75 animate-ping`}></span>}
    </div>
    <span className="text-sm font-medium text-gray-600 hidden md:block">
      {isOnline ? 'En Línea' : 'Sin Conexión'}
    </span>
  </div>
);

const Header: React.FC<HeaderProps> = ({ currentPage, isOnline, currentUser }) => {
  return (
    <header className="h-20 bg-base-100 shadow-md flex items-center justify-between px-6">
      <h1 className="text-2xl font-bold text-gray-800">{currentPage}</h1>
      <div className="flex items-center space-x-6">
        <StatusIndicator isOnline={isOnline} />
        <div className="w-px h-8 bg-gray-200"></div>
        <div className="flex items-center space-x-3">
          <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-10 w-10 rounded-full object-cover" />
          <div className="hidden md:block">
            <p className="font-semibold text-gray-700">{currentUser.name}</p>
            <p className="text-xs text-gray-500">Docente</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;