import React, { useState } from 'react';

interface CancelCitationModalProps {
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const CancelCitationModal: React.FC<CancelCitationModalProps> = ({ onClose, onConfirm }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("Por favor, ingrese un motivo para la cancelación.");
      return;
    }
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Cancelar Citación</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Por favor, especifica el motivo de la cancelación. Esta información será visible para la otra parte.</p>
        <form onSubmit={handleSubmit}>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-300"
            placeholder="Motivo de la cancelación..."
            required
          ></textarea>
          <div className="flex justify-end space-x-4 mt-6">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cerrar</button>
            <button type="submit" className="px-6 py-2 rounded-md text-white bg-accent hover:bg-red-700 transition-colors">Confirmar Cancelación</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelCitationModal;