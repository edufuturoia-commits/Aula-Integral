


import React, { useState, useEffect } from 'react';
import type { Teacher, NotificationSettings, Student, Guardian } from '../types';
import { useTranslation } from '../App';

const ProfileSection: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center border-b dark:border-gray-700 pb-3 mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
            {action}
        </div>
        {children}
    </div>
);

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void; description: string; disabled?: boolean; }> = ({ label, enabled, onChange, description, disabled = false }) => (
    <div className="flex items-center justify-between py-3">
        <div>
            <span className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>{label}</span>
            <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>{description}</p>
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

interface SettingsProps {
    currentUser: Teacher | Student | Guardian;
    onUpdateUser: (user: Teacher | Student | Guardian) => Promise<void>;
    theme: string;
    setTheme: (theme: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateUser, theme, setTheme }) => {
    const { t, lang, setLang } = useTranslation();
    
    const defaultSettings: NotificationSettings = {
        newIncident: true,
        weeklySummary: false,
        assessmentReminders: true,
    };
    
    const [isEditing, setIsEditing] = useState(false);
    const [settings, setSettings] = useState<NotificationSettings>(currentUser.notifications || defaultSettings);
    const [originalSettings, setOriginalSettings] = useState<NotificationSettings>(currentUser.notifications || defaultSettings);
    
    useEffect(() => {
        const userSettings = currentUser.notifications || defaultSettings;
        setSettings(userSettings);
        setOriginalSettings(userSettings);
    }, [currentUser]);

    const handleToggleChange = (setting: keyof NotificationSettings) => {
        setSettings(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };
    
    const handleEdit = () => {
        setOriginalSettings(settings);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setSettings(originalSettings);
        setIsEditing(false);
    };

    const handleSaveChanges = async () => {
        const updatedUser = {
            ...currentUser,
            notifications: settings,
        };
        await onUpdateUser(updatedUser);
        setIsEditing(false);
        alert(t('settings.notifications.saveSuccess'));
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <ProfileSection 
                title={t('settings.notifications.title')}
                action={
                    isEditing ? (
                        <div className="flex space-x-3">
                            <button onClick={handleCancel} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 hover:bg-gray-300 text-sm font-semibold">{t('buttons.cancel')}</button>
                            <button onClick={handleSaveChanges} className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-focus text-sm font-semibold">{t('buttons.saveChanges')}</button>
                        </div>
                    ) : (
                        <button onClick={handleEdit} className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-focus text-sm font-semibold">{t('buttons.edit')}</button>
                    )
                }
            >
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    <ToggleSwitch 
                        label={t('settings.notifications.newIncidentLabel')}
                        description={t('settings.notifications.newIncidentDescription')}
                        enabled={settings.newIncident} 
                        onChange={() => handleToggleChange('newIncident')}
                        disabled={!isEditing}
                    />
                    <ToggleSwitch 
                        label={t('settings.notifications.weeklySummaryLabel')}
                        description={t('settings.notifications.weeklySummaryDescription')}
                        enabled={settings.weeklySummary} 
                        onChange={() => handleToggleChange('weeklySummary')}
                        disabled={!isEditing}
                    />
                    <ToggleSwitch 
                        label={t('settings.notifications.assessmentRemindersLabel')} 
                        description={t('settings.notifications.assessmentRemindersDescription')}
                        enabled={settings.assessmentReminders} 
                        onChange={() => handleToggleChange('assessmentReminders')}
                        disabled={!isEditing}
                    />
                </div>
            </ProfileSection>
            
            <ProfileSection title={t('settings.language.title')}>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('settings.language.description')}
                </p>
                <div className="space-y-2">
                    {[{id: 'es', label: t('settings.language.spanish')}, {id: 'en', label: t('settings.language.english')}].map((mode) => (
                        <label key={mode.id} className="flex items-center p-3 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <input
                                type="radio"
                                name="language"
                                value={mode.id}
                                checked={lang === mode.id}
                                onChange={() => setLang(mode.id)}
                                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                            />
                            <span className="ml-3 font-medium text-gray-800 dark:text-gray-200 capitalize">{mode.label}</span>
                        </label>
                    ))}
                </div>
            </ProfileSection>

             <ProfileSection title={t('settings.appearance.title')}>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('settings.appearance.description')}
                </p>
                <div className="space-y-2">
                    {[{id: 'light', label: t('settings.appearance.light')}, {id: 'dark', label: t('settings.appearance.dark')}, {id: 'system', label: t('settings.appearance.system')}].map((mode) => (
                        <label key={mode.id} className="flex items-center p-3 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <input
                                type="radio"
                                name="theme"
                                value={mode.id}
                                checked={theme === mode.id}
                                onChange={() => setTheme(mode.id)}
                                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                            />
                            <span className="ml-3 font-medium text-gray-800 dark:text-gray-200 capitalize">{mode.label}</span>
                        </label>
                    ))}
                </div>
            </ProfileSection>
        </div>
    );
};

export default Settings;