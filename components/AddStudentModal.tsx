import React, { useState } from 'react';
import { GRADES, GROUPS } from '../constants';

interface AddStudentModalProps {
  onClose: () => void;
  onSave: (student: { name: string; grade: string; group: string }) => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(GRADES[0]);
  const [group, setGroup] = useState(GROUPS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("El nombre del estudiante no puede estar vacío.");
      return;
    }
    onSave({ name, grade, group });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Añadir Nuevo Estudiante</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-3xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo del Estudiante</label>
              <input
                type="text"
                id="studentName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                placeholder="Ej: Juan David Restrepo"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grado</label>
                <select id="grade" value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="group" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grupo</label>
                <select id="group" value={group} onChange={e => setGroup(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                  {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-4 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
            <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">Guardar Estudiante</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudentModal;