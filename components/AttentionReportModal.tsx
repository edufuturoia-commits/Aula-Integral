import React, { useState } from 'react';
import type { Student, AttentionReport, Teacher } from '../types';
import { AttentionReportStatus } from '../types';

interface AttentionReportModalProps {
  student: Student;
  reporter: Teacher;
  onClose: () => void;
  onSave: (report: AttentionReport) => void;
}

const AttentionReportModal: React.FC<AttentionReportModalProps> = ({ student, reporter, onClose, onSave }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("Por favor, describe el motivo del reporte.");
      return;
    }
    
    const conversationId = `psych_report_${student.id}_${Date.now()}`;

    const newReport: AttentionReport = {
      id: `att_${Date.now()}`,
      studentId: student.id,
      reporterId: reporter.id,
      reason,
      timestamp: new Date().toISOString(),
      status: AttentionReportStatus.OPEN,
      diagnoses: [],
      sessions: [],
      conversationId,
    };
    onSave(newReport);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg mx-4 animate-zoom-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Reporte de Atención Psicológica</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 text-3xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Estás creando un reporte confidencial para <strong className="text-primary dark:text-secondary">{student.name}</strong>. Esta información será compartida con el departamento de psicología, coordinación y rectoría.
            </p>
            <div className="mb-6">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo del Reporte</label>
                <textarea
                id="reason"
                rows={8}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500"
                placeholder="Describe de manera detallada y objetiva las situaciones observadas, cambios de comportamiento, preocupaciones o cualquier información relevante que justifique la necesidad de apoyo psicológico para el estudiante."
                required
                ></textarea>
            </div>
            <div className="flex justify-end space-x-4">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">Enviar Reporte Confidencial</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AttentionReportModal;