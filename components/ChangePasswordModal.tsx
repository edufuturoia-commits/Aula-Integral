import React, { useState } from 'react';
import type { Teacher, Student } from '../types';
import { updateTeacher, updateStudent } from '../db';

interface ChangePasswordModalProps {
  user: Teacher | Student;
  onPasswordChanged: (user: Teacher | Student) => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ user, onPasswordChanged }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
        const updatedUser = { ...user, password: newPassword, passwordChanged: true };
        if ('subject' in updatedUser) { // It's a teacher
            await updateTeacher(updatedUser);
        } else { // It's a student
            await updateStudent(updatedUser);
        }
        onPasswordChanged(updatedUser);
    } catch (dbError) {
        console.error("Error updating password:", dbError);
        setError("No se pudo actualizar la contraseña. Inténtelo de nuevo.");
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md mx-4 animate-zoom-in">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Cambio de Contraseña Requerido</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Por seguridad, debes cambiar tu contraseña inicial antes de continuar.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nueva Contraseña</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          
          {error && <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
            >
              {isLoading ? 'Guardando...' : 'Guardar y Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;