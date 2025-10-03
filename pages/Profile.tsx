import React, { useState, useRef, useEffect } from 'react';
import type { Teacher, Student, Guardian } from '../types';

interface ProfileProps {
    currentUser: Teacher | Student | Guardian;
    onUpdateUser: (user: Teacher | Student | Guardian) => Promise<void>;
}

const ProfileSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 border-b dark:border-gray-700 pb-3 mb-4">{title}</h2>
        {children}
    </div>
);

const CameraIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);

const Profile: React.FC<ProfileProps> = ({ currentUser, onUpdateUser }) => {
  const [user, setUser] = useState(currentUser);
  const [isEditing, setIsEditing] = useState(false);
  const [originalUser, setOriginalUser] = useState(currentUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setUser(currentUser);
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEdit = () => {
    setOriginalUser(user);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setUser(originalUser);
    setIsEditing(false);
  };

  const handleSave = async () => {
      await onUpdateUser(user);
      setIsEditing(false);
      alert("Perfil guardado exitosamente.");
  }
  
  const handleChangePassword = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // Simulate password change
      alert("Contraseña actualizada exitosamente.");
      e.currentTarget.reset();
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const avatarUrl = event.target?.result as string;
              if ('avatarUrl' in user) {
                  setUser(prev => ({...prev, avatarUrl }));
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const avatarUrl = 'avatarUrl' in user ? user.avatarUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=005A9C&color=fff`;
  const userRole = 'role' in user ? user.role : 'Acudiente';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            className="hidden" 
            accept="image/*"
        />
      <div className="flex items-center space-x-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
         <div className="relative">
            <img src={avatarUrl} alt={user.name} className="w-24 h-24 rounded-full object-cover border-4 border-primary" />
            {isEditing && 'avatarUrl' in user && (
                <button
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-opacity"
                    aria-label="Cambiar foto de perfil"
                >
                    <CameraIcon className="h-5 w-5" />
                </button>
            )}
         </div>
         <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{user.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">{userRole}</p>
         </div>
      </div>

      <ProfileSection title="Información Personal">
        {isEditing ? (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
                        <input type="email" name="email" value={user.email || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200"/>
                    </div>
                    {'phone' in user && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                            <input type="tel" name="phone" value={user.phone || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200"/>
                        </div>
                    )}
                    {'dateOfBirth' in user && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Nacimiento</label>
                            <input type="date" name="dateOfBirth" value={user.dateOfBirth || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200"/>
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={handleCancel} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">Guardar Cambios</button>
                </div>
            </div>
        ) : (
            <div className="space-y-4 text-gray-800 dark:text-gray-200">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p><strong className="font-medium text-gray-600 dark:text-gray-400">Correo Electrónico:</strong> {user.email || 'No especificado'}</p>
                    {'phone' in user && <p><strong className="font-medium text-gray-600 dark:text-gray-400">Teléfono:</strong> {user.phone || 'No especificado'}</p>}
                    {'dateOfBirth' in user && <p><strong className="font-medium text-gray-600 dark:text-gray-400">Fecha de Nacimiento:</strong> {user.dateOfBirth ? new Date(user.dateOfBirth + 'T00:00:00').toLocaleDateString('es-CO') : 'No especificado'}</p>}
                 </div>
                 <div className="text-right pt-4">
                    <button onClick={handleEdit} className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">Editar Perfil</button>
                </div>
            </div>
        )}
      </ProfileSection>

      {'password' in user && (
        <ProfileSection title="Seguridad">
            <form className="space-y-4" onSubmit={handleChangePassword}>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña Actual</label>
                    <input type="password" required className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nueva Contraseña</label>
                    <input type="password" required className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Nueva Contraseña</label>
                    <input type="password" required className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200"/>
                </div>
                <div className="text-right pt-2">
                    <button type="submit" className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-focus">Cambiar Contraseña</button>
                </div>
            </form>
        </ProfileSection>
      )}
    </div>
  );
};

export default Profile;