import React, { useState } from 'react';
import { AcademicPeriod } from '../types';
import { ACADEMIC_PERIODS } from '../constants';

interface ReportCardModalProps {
  onClose: () => void;
  onGenerate: (period: AcademicPeriod) => void;
}

const ReportCardModal: React.FC<ReportCardModalProps> = ({ onClose, onGenerate }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod>(ACADEMIC_PERIODS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(selectedPeriod);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md mx-4 animate-zoom-in">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Descargar Boletín</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Selecciona el período académico que deseas descargar.</p>
        <form onSubmit={handleSubmit}>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as AcademicPeriod)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {ACADEMIC_PERIODS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <div className="flex justify-end space-x-4 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">Generar y Descargar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportCardModal;