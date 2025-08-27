import React from 'react';
import type { Page } from '../types';
import { SIDEBAR_ITEMS } from '../constants';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  return (
    <div className="w-20 lg:w-64 bg-primary text-white flex flex-col">
      <div className="flex items-center justify-center h-20 border-b border-primary-focus">
        <h1 className="text-2xl font-bold hidden lg:block">Aula Integral</h1>
        <h1 className="text-2xl font-bold lg:hidden">AI</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {SIDEBAR_ITEMS.map((item) => (
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
      <div className="p-4 border-t border-primary-focus">
         {/* Footer or user info can go here */}
      </div>
    </div>
  );
};

export default Sidebar;