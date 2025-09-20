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
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">Añadir Nuevo Docente</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cédula (ID)</label>
                    <input type="text" name="id" value={formData.id} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Nombres y Apellidos</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Móvil</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"/>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Dirección</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Área Educativa</label>
                    <select name="subject" value={formData.subject} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                        {SUBJECT_AREAS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="pt-4 border-t">
                <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={formData.isHomeroomTeacher} onChange={handleHomeroomChange} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"/>
                    <span className="text-sm font-medium text-gray-700">Es Director de Grupo</span>
                </label>
                {formData.isHomeroomTeacher && (
                    <div className="grid grid-cols-2 gap-4 mt-4 pl-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Grado Asignado</label>
                            <select name="grade" value={formData.assignedGroup.grade} onChange={handleGroupChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Grupo Asignado</label>
                            <select name="group" value={formData.assignedGroup.group} onChange={handleGroupChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex justify-end space-x-4 pt-6 mt-4 border-t flex-shrink-0">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">Guardar Docente</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeacherModal;
