import React from 'react';

interface IcfesDrillSettings {
    isActive: boolean;
    grades: string[];
}

interface SimulacroICFESProps {
    settings: IcfesDrillSettings;
    onSettingsChange: (settings: IcfesDrillSettings) => void;
}

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void; description?: string; disabled?: boolean; }> = ({ label, enabled, onChange, description, disabled = false }) => (
    <div className="flex items-center justify-between py-3">
        <div>
            <span className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>{label}</span>
            {description && <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>{description}</p>}
        </div>
        <button
            onClick={() => onChange(!enabled)}
            disabled={disabled}
            className={`${enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-300`}
            aria-label={label}
        >
            <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
        </button>
    </div>
);


const SimulacroICFES: React.FC<SimulacroICFESProps> = ({ settings, onSettingsChange }) => {
    
    const ELIGIBLE_GRADES = ['9º', '10º', '11º'];

    const handleMainToggle = (isActive: boolean) => {
        onSettingsChange({
            ...settings,
            isActive,
            // If we deactivate, clear the selected grades.
            grades: isActive ? settings.grades : [], 
        });
    };

    const handleGradeToggle = (grade: string) => {
        const currentGrades = settings.grades || [];
        const newGrades = currentGrades.includes(grade)
            ? currentGrades.filter(g => g !== grade)
            : [...currentGrades, grade];
        
        onSettingsChange({
            ...settings,
            grades: newGrades,
        });
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión Simulacro ICFES</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Activa o desactiva el acceso al simulacro de las pruebas ICFES Saber 11 para los grados correspondientes.
                </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 border-b dark:border-gray-700 pb-3 mb-4">Estado General</h2>
                <ToggleSwitch
                    label={settings.isActive ? 'Simulacro ACTIVO' : 'Simulacro INACTIVO'}
                    description="Activa esta opción para habilitar el simulacro en toda la institución."
                    enabled={settings.isActive}
                    onChange={handleMainToggle}
                />
            </div>
            
            <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-opacity duration-300 ${settings.isActive ? 'opacity-100' : 'opacity-50'}`}>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 border-b dark:border-gray-700 pb-3 mb-4">Grados Habilitados</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Selecciona los grados que tendrán acceso al simulacro en su portal de estudiante. El simulacro está diseñado para los grados 9º, 10º y 11º.
                </p>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {ELIGIBLE_GRADES.map(grade => (
                         <div key={grade} className={`py-3 ${!settings.isActive ? 'cursor-not-allowed' : ''}`}>
                             <div className="flex items-center justify-between">
                                <div>
                                    <span className={`font-medium ${!settings.isActive ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>Grado {grade}</span>
                                </div>
                                <button
                                    onClick={() => handleGradeToggle(grade)}
                                    disabled={!settings.isActive}
                                    className={`${(settings.grades || []).includes(grade) ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-500`}
                                    aria-label={`Activar para grado ${grade}`}
                                >
                                    <span className={`${(settings.grades || []).includes(grade) ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
                                </button>
                            </div>
                         </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default SimulacroICFES;