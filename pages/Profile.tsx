import React, { useState, useRef, useEffect } from 'react';
import type { Teacher, Student, Guardian, Certification, Experience, ProfessionalDevelopment } from '../types';

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

  const handleArrayChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    field: 'certifications' | 'experience' | 'professionalDevelopment'
  ) => {
    const { name, value } = e.target;
    setUser(prevUser => {
      if (!('subject' in prevUser)) return prevUser; 
      
      const list = [...((prevUser as Teacher)[field] || [])];
      const itemToUpdate = { ...list[index] };
      (itemToUpdate as any)[name] = (e.target.type === 'number') ? parseFloat(value) || 0 : value;
      list[index] = itemToUpdate;
      
      return { ...prevUser, [field]: list };
    });
  };

  const handleAddItem = (field: 'certifications' | 'experience' | 'professionalDevelopment') => {
    setUser(prevUser => {
        if (!('subject' in prevUser)) return prevUser;

        let newItem;
        switch (field) {
            case 'certifications': newItem = { id: `cert_${Date.now()}`, name: '', issuer: '', year: '' }; break;
            case 'experience': newItem = { id: `exp_${Date.now()}`, position: '', institution: '', years: '' }; break;
            case 'professionalDevelopment': newItem = { id: `pd_${Date.now()}`, activity: '', hours: 0, date: '' }; break;
        }

        const list = (prevUser as any)[field] || [];
        return { ...prevUser, [field]: [...list, newItem] };
    });
  };

  const handleDeleteItem = (index: number, field: 'certifications' | 'experience' | 'professionalDevelopment') => {
     setUser(prevUser => {
        if (!('subject' in prevUser)) return prevUser;
        const list = [...((prevUser as Teacher)[field] || [])];
        list.splice(index, 1);
        return { ...prevUser, [field]: list };
    });
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
                        <input type="email" name="email" value={user.email || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-100"/>
                    </div>
                    {'phone' in user && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                            <input type="tel" name="phone" value={user.phone || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-100"/>
                        </div>
                    )}
                    {'dateOfBirth' in user && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Nacimiento</label>
                            <input type="date" name="dateOfBirth" value={user.dateOfBirth || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-100"/>
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
      
      {'subject' in user && (
        <>
          <ProfileSection title="Certificaciones Profesionales">
            {isEditing ? (
              <div className="space-y-4">
                {(user as Teacher).certifications?.map((cert, index) => (
                  <div key={cert.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center p-3 border dark:border-gray-700 rounded-lg">
                    <input type="text" placeholder="Nombre de la Certificación" name="name" value={cert.name} onChange={e => handleArrayChange(e, index, 'certifications')} className="md:col-span-2 mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                    <input type="text" placeholder="Emisor" name="issuer" value={cert.issuer} onChange={e => handleArrayChange(e, index, 'certifications')} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                    <div className="flex items-center gap-2">
                      <input type="text" placeholder="Año" name="year" value={cert.year} onChange={e => handleArrayChange(e, index, 'certifications')} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                      <button type="button" onClick={() => handleDeleteItem(index, 'certifications')} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">&times;</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => handleAddItem('certifications')} className="text-sm font-medium text-primary hover:underline">+ Añadir Certificación</button>
              </div>
            ) : (
              <div className="space-y-3">
                {(user as Teacher).certifications?.length > 0 ? (
                  (user as Teacher).certifications.map(cert => (
                    <div key={cert.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{cert.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{cert.issuer} - {cert.year}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No hay certificaciones registradas.</p>
                )}
              </div>
            )}
          </ProfileSection>

          <ProfileSection title="Experiencia Laboral">
            {isEditing ? (
              <div className="space-y-4">
                {(user as Teacher).experience?.map((exp, index) => (
                  <div key={exp.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center p-3 border dark:border-gray-700 rounded-lg">
                    <input type="text" placeholder="Cargo" name="position" value={exp.position} onChange={e => handleArrayChange(e, index, 'experience')} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                    <input type="text" placeholder="Institución" name="institution" value={exp.institution} onChange={e => handleArrayChange(e, index, 'experience')} className="md:col-span-2 mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                    <div className="flex items-center gap-2">
                      <input type="text" placeholder="Años (ej. 2020-2023)" name="years" value={exp.years} onChange={e => handleArrayChange(e, index, 'experience')} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                      <button type="button" onClick={() => handleDeleteItem(index, 'experience')} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">&times;</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => handleAddItem('experience')} className="text-sm font-medium text-primary hover:underline">+ Añadir Experiencia</button>
              </div>
            ) : (
              <div className="space-y-3">
                {(user as Teacher).experience?.length > 0 ? (
                  (user as Teacher).experience.map(exp => (
                    <div key={exp.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{exp.position}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{exp.institution} ({exp.years})</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No hay experiencia laboral registrada.</p>
                )}
              </div>
            )}
          </ProfileSection>

          <ProfileSection title="Desarrollo Profesional">
             {isEditing ? (
              <div className="space-y-4">
                {(user as Teacher).professionalDevelopment?.map((dev, index) => (
                  <div key={dev.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center p-3 border dark:border-gray-700 rounded-lg">
                    <input type="text" placeholder="Actividad/Curso" name="activity" value={dev.activity} onChange={e => handleArrayChange(e, index, 'professionalDevelopment')} className="md:col-span-2 mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                    <input type="date" name="date" value={dev.date} onChange={e => handleArrayChange(e, index, 'professionalDevelopment')} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                    <div className="flex items-center gap-2">
                      <input type="number" placeholder="Horas" name="hours" value={dev.hours} onChange={e => handleArrayChange(e, index, 'professionalDevelopment')} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                      <button type="button" onClick={() => handleDeleteItem(index, 'professionalDevelopment')} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">&times;</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => handleAddItem('professionalDevelopment')} className="text-sm font-medium text-primary hover:underline">+ Añadir Actividad</button>
              </div>
            ) : (
              <div className="space-y-3">
                 {(user as Teacher).professionalDevelopment?.length > 0 ? (
                  (user as Teacher).professionalDevelopment.map(dev => (
                    <div key={dev.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{dev.activity}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(dev.date + 'T00:00:00').toLocaleDateString('es-CO')} - {dev.hours} horas</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No hay actividades de desarrollo profesional registradas.</p>
                )}
              </div>
            )}
          </ProfileSection>
        </>
      )}

      {'password' in user && (
        <ProfileSection title="Seguridad">
            <form className="space-y-4" onSubmit={handleChangePassword}>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña Actual</label>
                    <input type="password" required className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-100"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nueva Contraseña</label>
                    <input type="password" required className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-100"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Nueva Contraseña</label>
                    <input type="password" required className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-100"/>
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