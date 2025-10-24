import React, { useState, useMemo } from 'react';
import type { Student, Teacher, Guardian } from '../types';
import { Role } from '../types';

interface NewConversationModalProps {
  students: Student[];
  teachers: Teacher[];
  guardians: Guardian[];
  onClose: () => void;
  onStartConversation: (participant: { id: string | number; name: string; avatarUrl: string; role: Role | 'Acudiente'; }) => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({ students, teachers, guardians, onClose, onStartConversation }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const lowerCaseSearch = searchTerm.toLowerCase();

    const studentResults = students
      .filter(s => s.name.toLowerCase().includes(lowerCaseSearch))
      .map(s => ({ id: s.id, name: s.name, avatarUrl: s.avatarUrl, role: Role.STUDENT, type: 'Estudiante' }));

    const teacherResults = teachers
      .filter(t => t.role !== Role.ADMIN && t.name.toLowerCase().includes(lowerCaseSearch))
      .map(t => ({ id: t.id, name: t.name, avatarUrl: t.avatarUrl, role: t.role, type: t.role }));
    
    const guardianResults = guardians
        .filter(g => g.name.toLowerCase().includes(lowerCaseSearch))
        .map(g => ({ id: g.id, name: g.name, avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(g.name)}&background=0D9488&color=fff`, role: 'Acudiente' as 'Acudiente', type: 'Acudiente' }));

    return [...studentResults, ...teacherResults, ...guardianResults].slice(0, 10);
  }, [searchTerm, students, teachers, guardians]);

  const handleSelect = (participant: { id: string | number; name: string; avatarUrl: string; role: Role | 'Acudiente'; }) => {
    onStartConversation(participant);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg mx-4 flex flex-col h-[70vh]">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Nueva Conversación</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
        </div>

        <div className="mb-4 flex-shrink-0">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de estudiante, docente o acudiente..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>

        <ul className="flex-1 overflow-y-auto space-y-2">
          {searchResults.map((result) => (
            <li
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className="p-3 flex items-center gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <img src={result.avatarUrl} alt={result.name} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{result.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{result.type}</p>
              </div>
            </li>
          ))}
          {searchTerm.trim() && searchResults.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No se encontraron resultados.</p>
          )}
           {!searchTerm.trim() && (
             <div className="text-center text-gray-400 py-8 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p>Escribe para buscar un destinatario</p>
             </div>
          )}
        </ul>
      </div>
    </div>
  );
};

export default NewConversationModal;