import React, { useState, useRef, useEffect } from 'react';
import type { Teacher, Student, Guardian, Certification, Experience, ProfessionalDevelopment } from '../types';

interface ProfileProps {
    currentUser: Teacher | Student | Guardian;
    onUpdateUser: (user: Teacher | Student | Guardian) => Promise<void>;
}

const ProfileSection: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center border-b dark:border-gray-700 pb-3 mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
            {action && <div className="flex-shrink-0">{action}</div>}
        </div>
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
    setUser(prevUser => ({
        ...prevUser,
        [name]: value,
    }));
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
    // FIX: Renamed the destructured `name` variable to `inputName` to prevent a potential variable shadowing conflict.
    const { name: inputName, value } = e.target;
    setUser(prevUser => {
      if (!('subject' in prevUser)) return prevUser; // Type guard for Teacher

      switch (field) {
        case 'certifications': {
          const list = [...(prevUser.certifications || [])];
          const item = list[index];
          if (item) {
            const updatedItem: Certification = { ...item };
            if (inputName === 'name') updatedItem.name = value;
            else if (inputName === 'issuer') updatedItem.issuer = value;
            else if (inputName === 'year') updatedItem.year = value;
            list[index] = updatedItem;
          }
          return { ...prevUser, certifications: list };
        }
        case 'experience': {
          const list = [...(prevUser.experience || [])];
          const item = list[index];
          if (item) {
            const updatedItem: Experience = { ...item };
            if (inputName === 'position') updatedItem.position = value;
            else if (inputName === 'institution') updatedItem.institution = value;
            else if (inputName === 'years') updatedItem.years = value;
            list[index] = updatedItem;
          }
          return { ...prevUser, experience: list };
        }
        case 'professionalDevelopment': {
          const list = [...(prevUser.professionalDevelopment || [])];
          const item = list[index];
            if (item) {
                const updatedItem: ProfessionalDevelopment = { ...item };
                if (inputName === 'hours') {
                    updatedItem.hours = parseFloat(value) || 0;
                } else if (inputName === 'activity') {
                    updatedItem.activity = value;
                } else if (inputName === 'date') {
                    updatedItem.date = value;
                }
                list[index] = updatedItem;
            }
          return { ...prevUser, professionalDevelopment: list };
        }
        // FIX: The exhaustive check was removed, which can lead to cryptic type errors. Restoring it to ensure type safety.
        default: {
          const _exhaustiveCheck: never = field;
          return prevUser;
        }
      }
    });
  };

  const handleAddItem = (field: 'certifications' | 'experience' | 'professionalDevelopment') => {
    setUser(prevUser => {
        if (!('subject' in prevUser)) return prevUser; // Type guard for Teacher

        switch (field) {
            case 'certifications': {
                const newItem: Certification = { id: `cert_${Date.now()}`, name: '', issuer: '', year: '' };
                return { ...prevUser, certifications: [...(prevUser.certifications || []), newItem] };
            }
            case 'experience': {
                const newItem: Experience = { id: `exp_${Date.now()}`, position: '', institution: '', years: '' };
                return { ...prevUser, experience: [...(prevUser.experience || []), newItem] };
            }
            case 'professionalDevelopment': {
                const newItem: ProfessionalDevelopment = { id: `pd_${Date.now()}`, activity: '', hours: 0, date: '' };
                return { ...prevUser, professionalDevelopment: [...(prevUser.professionalDevelopment || []), newItem] };
            }
            // FIX: Added exhaustive check to prevent type errors.
            default: {
                const _exhaustiveCheck: never = field;
                return prevUser;
            }
        }
    });
  };

  const handleDeleteItem = (index: number, field: 'certifications' | 'experience' | 'professionalDevelopment') => {
     setUser(prevUser => {
        if (!('subject' in prevUser)) return prevUser;
        switch (field) {
            case 'certifications': {
                const list = [...(prevUser.certifications || [])];
                list.splice(index, 1);
                return { ...prevUser, certifications: list };
            }
            case 'experience': {
                const list = [...(prevUser.experience || [])];
                list.splice(index, 1);
                return { ...prevUser, experience: list };
            }
            case 'professionalDevelopment': {
                const list = [...(prevUser.professionalDevelopment || [])];
                list.splice(index, 1);
                return { ...prevUser, professionalDevelopment: list };
            }
            default:
                return prevUser;
        }
    });
  };

  const avatarUrl = 'avatarUrl' in user ? user.avatarUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=005A9C&color=fff`;
  const userRole = 'role' in user ? user.role : 'Acudiente';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
      <div className="flex items-start justify-between bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <div className="flex items-center space-x-6">
            <div className="relative">
                <img src={avatarUrl} alt={user.name} className="w-24 h-24 rounded-full object-cover border-4 border-primary" />
                {isEditing && 'avatarUrl' in user && (
                    <button onClick={handleAvatarClick} className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-opacity" aria-label="Cambiar foto de perfil">
                        <CameraIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={user.name}
                  onChange={handleInputChange}
                  className="text-3xl font-bold text-gray-800 dark:text-gray-100 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-primary dark:focus:border-secondary"
                  aria-label="Nombre de usuario"
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{user.name}</h1>
              )}
              <p className="text-gray-500 dark:text-gray-400">{userRole}</p>
            </div>
        </div>
        <div>
            {isEditing ? (
                <div className="flex items-center space-x-3">
                    <button onClick={handleCancel} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 text-sm font-semibold">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-focus text-sm font-semibold">Guardar Cambios</button>
                </div>
            ) : (
                <button onClick={handleEdit} className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-focus text-sm font-semibold">Editar Perfil</button>
            )}
        </div>
      </div>
      
      <ProfileSection title="Información Personal">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Correo Electrónico</label>
                {isEditing ? <input type="email" name="email" value={user.email || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm text-gray-900 dark:text-gray-100"/> : <p className="text-gray-800 dark:text-gray-100">{user.email || 'No especificado'}</p>}
            </div>
            {'phone' in user && <div><label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Teléfono</label>{isEditing ? <input type="tel" name="phone" value={user.phone || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm text-gray-900 dark:text-gray-100"/> : <p className="text-gray-800 dark:text-gray-100">{user.phone || 'No especificado'}</p>}</div>}
            {'dateOfBirth' in user && <div><label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Nacimiento</label>{isEditing ? <input type="date" name="dateOfBirth" value={user.dateOfBirth || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm text-gray-900 dark:text-gray-100"/> : <p className="text-gray-800 dark:text-gray-100">{user.dateOfBirth ? new Date(user.dateOfBirth + 'T00:00:00').toLocaleDateString() : 'No especificada'}</p>}</div>}
            {'address' in user && <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Dirección</label>{isEditing ? <input type="text" name="address" value={user.address || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm text-gray-900 dark:text-gray-100"/> : <p className="text-gray-800 dark:text-gray-100">{user.address || 'No especificada'}</p>}</div>}
        </div>
      </ProfileSection>

      {'subject' in user && (
        <>
        <ProfileSection title="Certificaciones y Formación" action={isEditing && <button onClick={() => handleAddItem('certifications')} className="text-sm font-semibold text-primary dark:text-secondary hover:underline">+ Añadir</button>}>
            <div className="space-y-4">
                {(user as Teacher).certifications?.map((cert, index) => (
                isEditing ? (
                    <div key={cert.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                        <input name="name" value={cert.name} onChange={(e) => handleArrayChange(e, index, 'certifications')} placeholder="Nombre Certificación" className="md:col-span-2 mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                        <input name="issuer" value={cert.issuer} onChange={(e) => handleArrayChange(e, index, 'certifications')} placeholder="Emisor" className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                        <div className="flex items-center gap-2">
                           <input name="year" value={cert.year} onChange={(e) => handleArrayChange(e, index, 'certifications')} placeholder="Año" className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                           <button onClick={() => handleDeleteItem(index, 'certifications')} className="text-red-500 hover:text-red-700">&times;</button>
                        </div>
                    </div>
                ) : (
                    <div key={cert.id}><p><strong>{cert.name}</strong> - {cert.issuer} ({cert.year})</p></div>
                )
                ))}
                 {(!(user as Teacher).certifications || (user as Teacher).certifications?.length === 0) && !isEditing && <p className="text-gray-500 dark:text-gray-400">No hay certificaciones registradas.</p>}
            </div>
        </ProfileSection>

        <ProfileSection title="Experiencia Laboral" action={isEditing && <button onClick={() => handleAddItem('experience')} className="text-sm font-semibold text-primary dark:text-secondary hover:underline">+ Añadir</button>}>
            <div className="space-y-4">
            {(user as Teacher).experience?.map((exp, index) => (
                isEditing ? (
                    <div key={exp.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                        <input name="position" value={exp.position} onChange={(e) => handleArrayChange(e, index, 'experience')} placeholder="Cargo" className="md:col-span-2 mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                        <input name="institution" value={exp.institution} onChange={(e) => handleArrayChange(e, index, 'experience')} placeholder="Institución" className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                         <div className="flex items-center gap-2">
                            <input name="years" value={exp.years} onChange={(e) => handleArrayChange(e, index, 'experience')} placeholder="Años" className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                            <button onClick={() => handleDeleteItem(index, 'experience')} className="text-red-500 hover:text-red-700">&times;</button>
                        </div>
                    </div>
                ) : (
                    <div key={exp.id}><p><strong>{exp.position}</strong> en {exp.institution} ({exp.years} años)</p></div>
                )
            ))}
             {(!(user as Teacher).experience || (user as Teacher).experience?.length === 0) && !isEditing && <p className="text-gray-500 dark:text-gray-400">No hay experiencia laboral registrada.</p>}
            </div>
        </ProfileSection>

        <ProfileSection title="Desarrollo Profesional" action={isEditing && <button onClick={() => handleAddItem('professionalDevelopment')} className="text-sm font-semibold text-primary dark:text-secondary hover:underline">+ Añadir</button>}>
            <div className="space-y-4">
            {(user as Teacher).professionalDevelopment?.map((pd, index) => (
                isEditing ? (
                    <div key={pd.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                        <input name="activity" value={pd.activity} onChange={(e) => handleArrayChange(e, index, 'professionalDevelopment')} placeholder="Actividad/Curso" className="md:col-span-2 mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                        <input name="date" type="date" value={pd.date} onChange={(e) => handleArrayChange(e, index, 'professionalDevelopment')} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                         <div className="flex items-center gap-2">
                           <input name="hours" type="number" value={pd.hours} onChange={(e) => handleArrayChange(e, index, 'professionalDevelopment')} placeholder="Horas" className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
                           <button onClick={() => handleDeleteItem(index, 'professionalDevelopment')} className="text-red-500 hover:text-red-700">&times;</button>
                        </div>
                    </div>
                ) : (
                    <div key={pd.id}><p><strong>{pd.activity}</strong> ({pd.hours} horas) - {new Date(pd.date + 'T00:00:00').toLocaleDateString()}</p></div>
                )
            ))}
            {(!(user as Teacher).professionalDevelopment || (user as Teacher).professionalDevelopment?.length === 0) && !isEditing && <p className="text-gray-500 dark:text-gray-400">No hay registros de desarrollo profesional.</p>}
            </div>
        </ProfileSection>
        </>
      )}

      <ProfileSection title="Seguridad">
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nueva Contraseña</label>
                <input type="password" name="newPassword" required className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Contraseña</label>
                <input type="password" name="confirmPassword" required className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm"/>
            </div>
            <div className="text-right">
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-focus text-sm font-semibold">Cambiar Contraseña</button>
            </div>
        </form>
      </ProfileSection>
    </div>
  );
};

export default Profile;