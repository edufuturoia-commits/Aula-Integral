import React, { useState } from 'react';
import type { Student } from '../types';
import { DocumentType } from '../types';
import { GRADES, GROUPS } from '../constants';

interface EditStudentModalProps {
  student: Student;
  onClose: () => void;
  onSave: (student: Student) => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ student, onClose, onSave }) => {
  const [formData, setFormData] = useState<Student>(student);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">Editar Datos del Estudiante</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Correo Electrónico (Opcional)</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Grado</label>
                    <select name="grade" value={formData.grade} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Grupo</label>
                    <select name="group" value={formData.group} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                      {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"/>
                </div>
            </div>

            <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-700">Información de Documentación</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo de Documento</label>
                        <select name="documentType" value={formData.documentType || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                            <option value="">Seleccionar...</option>
                            <option value={DocumentType.REGISTRO_CIVIL}>{DocumentType.REGISTRO_CIVIL}</option>
                            <option value={DocumentType.TARJETA_IDENTIDAD}>{DocumentType.TARJETA_IDENTIDAD}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Número de Documento</label>
                        <input type="text" name="documentNumber" value={formData.documentNumber || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"/>
                    </div>
                 </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-6 mt-4 border-t flex-shrink-0">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">Guardar Cambios</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default EditStudentModal;