
import React, { useState } from 'react';
import type { Citation } from '../types';

interface EditCitationModalProps {
  citation: Citation;
  onClose: () => void;
  onSave: (updatedCitation: Citation) => void;
}

const EditCitationModal: React.FC<EditCitationModalProps> = ({ citation, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    date: citation.date,
    time: citation.time,
    location: citation.location,
    reason: citation.reason,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim() || !formData.location.trim()) {
      alert("El motivo y el lugar no pueden estar vacíos.");
      return;
    }
    onSave({
      ...citation,
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Editar Citación para {citation.studentName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900" />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input type="time" id="time" name="time" value={formData.time} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900" />
            </div>
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Lugar</label>
            <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900" placeholder="Ej: Coordinación"/>
          </div>
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <textarea id="reason" name="reason" rows={3} value={formData.reason} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900" placeholder="Ej: Seguimiento académico..."></textarea>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCitationModal;
