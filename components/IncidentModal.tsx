

import React, { useState } from 'react';
import type { Student, Incident } from '../types';
import { IncidentType } from '../types';
import { SCHOOL_LOCATIONS } from '../constants';

interface IncidentModalProps {
  student: Student;
  onClose: () => void;
  onSave: (incident: Incident) => void;
}

const IncidentModal: React.FC<IncidentModalProps> = ({ student, onClose, onSave }) => {
  const [incidentType, setIncidentType] = useState<IncidentType>(IncidentType.CONVIVENCIA_ESCOLAR);
  const [otherTypeDescription, setOtherTypeDescription] = useState('');
  const [isVictim, setIsVictim] = useState(false);
  const [location, setLocation] = useState<string>(SCHOOL_LOCATIONS[0]);
  const [notes, setNotes] = useState('');
  
  const teacherName = 'Prof. Carmen'; // Mocked current user

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
        alert("Por favor, ingrese una descripción para la incidencia.");
        return;
    }
    if (incidentType === IncidentType.OTRO && !otherTypeDescription.trim()) {
        alert("Por favor, especifique el motivo para el tipo 'Otro'.");
        return;
    }
    const newIncident: Incident = {
        id: `inc_${Date.now()}`,
        studentId: student.id,
        studentName: student.name,
        type: incidentType,
        otherTypeDescription: incidentType === IncidentType.OTRO ? otherTypeDescription : undefined,
        isVictim,
        notes,
        timestamp: new Date().toISOString(),
        synced: false,
        teacherName,
        location,
        archived: false,
    };
    onSave(newIncident);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Registrar Incidencia</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Estudiante</label>
              <p className="mt-1 p-2 border border-gray-200 bg-gray-100 rounded-md">{student.name}</p>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Docente que Reporta</label>
              <p className="mt-1 p-2 border border-gray-200 bg-gray-100 rounded-md">{teacherName}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="incidentType" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Incidencia</label>
              <select
                id="incidentType"
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
              >
                {Object.values(IncidentType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Lugar del Suceso</label>
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
              >
                {SCHOOL_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>
          
          {incidentType === IncidentType.OTRO && (
            <div className="mb-4">
                <label htmlFor="otherTypeDescription" className="block text-sm font-medium text-gray-700 mb-1">Especifique el Motivo</label>
                <input
                    type="text"
                    id="otherTypeDescription"
                    value={otherTypeDescription}
                    onChange={(e) => setOtherTypeDescription(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Motivo de la incidencia..."
                    required
                />
            </div>
          )}

          <div className="mb-4">
            <label className="flex items-center space-x-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={isVictim}
                    onChange={(e) => setIsVictim(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Marcar si el reportado es una víctima</span>
            </label>
           </div>
          
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Descripción / Notas</label>
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
              placeholder="Añade una descripción detallada de lo ocurrido..."
            ></textarea>
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Cancelar</button>
            <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">Guardar Incidencia</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentModal;