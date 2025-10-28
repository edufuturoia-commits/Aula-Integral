import React, { useState } from 'react';
import { MOCK_TEACHERS, MOCK_STUDENTS, MOCK_GUARDIANS } from '../constants';
import { Role } from '../types';

interface QuickAccessProps {
  onLogin: (id: string, pass: string) => Promise<{success: boolean, message: string}>;
  onBack: () => void;
}

const TEST_PROFILES = [
    {
        ...MOCK_TEACHERS.find(t => t.role === Role.RECTOR)!,
        loginId: 'rector',
        password: 'rector'
    },
    {
        ...MOCK_TEACHERS.find(t => t.role === Role.COORDINATOR)!,
        loginId: '987654321',
        password: '987654321'
    },
    {
        ...MOCK_TEACHERS.find(t => t.role === Role.TEACHER)!,
        loginId: '1037612345',
        password: '1037612345'
    },
    {
        ...MOCK_STUDENTS[0],
        loginId: MOCK_STUDENTS[0].documentNumber!,
        password: 'password123'
    },
    {
        ...MOCK_GUARDIANS[0],
        role: 'Acudiente',
        loginId: MOCK_GUARDIANS[0].id,
        password: 'password123'
    }
];

const ProfileCard: React.FC<{ profile: any, onSelect: () => Promise<void>, isLoading: boolean }> = ({ profile, onSelect, isLoading }) => {
    return (
        <button
            onClick={onSelect}
            disabled={isLoading}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col items-center space-y-3 transition-transform transform hover:-translate-y-1 text-center disabled:opacity-50 disabled:cursor-wait w-full h-full"
        >
            <img src={profile.avatarUrl} alt={profile.name} className="w-16 h-16 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700 flex-shrink-0" />
            <div className="flex-grow">
                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{profile.name}</p>
                <p className="text-xs font-medium text-primary dark:text-secondary">{profile.role}</p>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t w-full border-gray-200 dark:border-gray-700">
                <p>Usuario: <span className="font-mono font-semibold text-gray-600 dark:text-gray-300 break-all">{profile.loginId}</span></p>
                <p>Clave: <span className="font-mono font-semibold text-gray-600 dark:text-gray-300 break-all">{profile.password}</span></p>
            </div>
        </button>
    );
};

const QuickAccess: React.FC<QuickAccessProps> = ({ onLogin, onBack }) => {
    const [isLoading, setIsLoading] = useState<string | null>(null); // Store the loading profile's ID
    const [error, setError] = useState<string | null>(null);

    const handleSelectProfile = async (profile: any) => {
        setIsLoading(profile.loginId);
        setError(null);
        const result = await onLogin(profile.loginId, profile.password);
        if (!result.success) {
            setError(`Error al iniciar sesión como ${profile.name}: ${result.message}`);
            setIsLoading(null);
        }
        // On success, App.tsx will change state, so no need to reset loading here
    };

    return (
        <div className="min-h-screen bg-neutral dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <div className="bg-base-100 dark:bg-gray-800 rounded-2xl shadow-xl p-8 animate-zoom-in">
                    <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-focus mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Volver a Iniciar Sesión
                    </a>
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-primary">Perfiles de Prueba</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Selecciona un perfil para acceder a la plataforma.</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-lg mb-6" role="alert">
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {TEST_PROFILES.map(profile => (
                            <ProfileCard 
                                key={profile.id} 
                                profile={profile} 
                                onSelect={() => handleSelectProfile(profile)}
                                isLoading={isLoading === profile.loginId}
                            />
                        ))}
                    </div>

                    {isLoading && (
                        <div className="text-center mt-6 text-gray-600 dark:text-gray-400">
                            <p>Iniciando sesión...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuickAccess;