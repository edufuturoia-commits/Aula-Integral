import React, { useState } from 'react';

interface GroupMessageModalProps {
  onClose: () => void;
  onSend: (message: string) => void;
}

const GroupMessageModal: React.FC<GroupMessageModalProps> = ({ onClose, onSend }) => {
  const [message, setMessage] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert("El mensaje no puede estar vacío.");
      return;
    }
    onSend(message);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Enviar Mensaje Grupal</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
        </div>
        
        <form onSubmit={handleSend}>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Destinatarios</label>
                <p className="mt-1 p-2 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900/50 rounded-md text-sm text-gray-800 dark:text-gray-200">Todos los Acudientes</p>
            </div>
            <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensaje</label>
                <textarea
                id="message"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Escribe tu comunicado o anuncio aquí..."
                ></textarea>
            </div>
            <div className="flex justify-end space-x-4">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">Enviar a Todos</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default GroupMessageModal;