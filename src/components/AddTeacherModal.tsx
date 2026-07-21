import React, { useState } from 'react';
import type { Teacher } from '../types';
import { Role } from '../types';
import { GRADES, GROUPS, SUBJECT_AREAS } from '../constants';

interface AddTeacherModalProps {
  onClose: () => void;
  onSave: (teacher: Omit<Teacher, 'avatarUrl' | 'role' | 'passwordChanged' | 'password'>) => void;
}

const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    subject: SUBJECT_AREAS[0],
    isHomeroomTeacher: false,
    assignedGroup: { grade: GRADES[0], group: GROUPS[0] }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHomeroomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setFormData(prev => ({
        ...prev,
        isHomeroomTeacher: isChecked,
    }));
  };
  
  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
          ...prev,
          assignedGroup: {
              ...(prev.assignedGroup!),
              [name]: value
          }
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id.trim() || !formData.name.trim()) {
        alert("La Cédula y el Nombre son obligatorios.");
        return;
    }
    const teacherDataToSave: Omit<Teacher, 'avatarUrl' | 'role' | 'passwordChanged' | 'password'> = {
        ...formData,
        assignedGroup: formData.isHomeroomTeacher ? formData.assignedGroup : undefined,
    };

    onSave(teacherDataToSave);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Añadir Nuevo Docente</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-3xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cédula (ID)</label>
                    <input type="text" name="id" value={formData.id} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombres y Apellidos</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Móvil</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Nacimiento</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Área Educativa</label>
                    <select name="subject" value={formData.subject} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        {SUBJECT_AREAS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="pt-4 border-t dark:border-gray-700">
                <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={formData.isHomeroomTeacher} onChange={handleHomeroomChange} className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"/>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Es Director de Grupo</span>
                </label>
                {formData.isHomeroomTeacher && (
                    <div className="grid grid-cols-2 gap-4 mt-4 pl-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Grado Asignado</label>
                            <select name="grade" value={formData.assignedGroup.grade} onChange={handleGroupChange} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Grupo Asignado</label>
                            <select name="group" value={formData.assignedGroup.group} onChange={handleGroupChange} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex justify-end space-x-4 pt-6 mt-4 border-t dark:border-gray-700 flex-shrink-0">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">Guardar Docente</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeacherModal;