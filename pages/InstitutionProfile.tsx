import React, { useState, useRef } from 'react';
import type { InstitutionProfileData } from '../types';
import PEISummary from '../components/PEISummary';
import EventPosterManager from '../components/EventPosterManager';
import GenerateLogoModal from '../components/GenerateLogoModal';

interface InstitutionProfileProps {
    profile: InstitutionProfileData;
    setProfile: React.Dispatch<React.SetStateAction<InstitutionProfileData>>;
}

const ProfileSection: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
    <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            {action}
        </div>
        {children}
    </div>
);

const InfoRow: React.FC<{ label: string; value: string | React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-gray-800 font-semibold">{value}</p>
    </div>
);

const InputField: React.FC<{ label: string; name: keyof InstitutionProfileData; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            type="text"
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 text-gray-900"
        />
    </div>
);

const CameraIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);

const InstitutionProfile: React.FC<InstitutionProfileProps> = ({ profile, setProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<InstitutionProfileData>(profile);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'pei' | 'posters'>('info');
    const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);


    const handleEditToggle = () => {
        if (!isEditing) {
            setFormData(profile);
        }
        setIsEditing(!isEditing);
    };

    const handleCancel = () => {
        setFormData(profile); // Revert changes
        setIsEditing(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData(prev => ({ ...prev, logoUrl: event.target?.result as string }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSave = () => {
        setProfile(formData);
        localStorage.setItem('institutionProfile', JSON.stringify(formData));
        setIsEditing(false);
    };

    const handleLogoGenerated = (logoUrl: string) => {
        const updatedProfile = { ...formData, logoUrl };
        setFormData(updatedProfile);
        setProfile(updatedProfile);
        localStorage.setItem('institutionProfile', JSON.stringify(updatedProfile));
        setIsLogoModalOpen(false);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
             <input type="file" ref={fileInputRef} onChange={handleLogoChange} className="hidden" accept="image/*" />
             <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Información Institucional
                    </button>
                    <button
                        onClick={() => setActiveTab('pei')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pei' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Resumen Interactivo PEI
                    </button>
                    <button
                        onClick={() => setActiveTab('posters')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'posters' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Portal Informativo
                    </button>
                </nav>
            </div>
            
            <div className={activeTab === 'info' ? '' : 'hidden'}>
                <ProfileSection 
                    title="Información de la Institución"
                    action={
                        isEditing ? (
                            <div className="flex items-center space-x-3">
                                 <button onClick={() => setIsLogoModalOpen(true)} className="px-4 py-2 rounded-md text-primary bg-primary/10 hover:bg-primary/20 text-sm font-semibold flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                    Generar Logo con IA
                                </button>
                                <button onClick={handleCancel} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 text-sm font-semibold">Cancelar</button>
                                <button onClick={handleSave} className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-focus text-sm font-semibold">Guardar Cambios</button>
                            </div>
                        ) : (
                            <button onClick={handleEditToggle} className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-focus text-sm font-semibold">Editar Perfil</button>
                        )
                    }
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* General Info */}
                        <div className="md:col-span-2 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700">Información General</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {isEditing ? (
                                <>
                                    <InputField label="Nombre de la Institución" name="name" value={formData.name} onChange={handleChange} />
                                    <InputField label="Código DANE" name="daneCode" value={formData.daneCode} onChange={handleChange} />
                                    <InputField label="NIT" name="nit" value={formData.nit} onChange={handleChange} />
                                    <InputField label="Rector(a)" name="rector" value={formData.rector} onChange={handleChange} />
                                </>
                            ) : (
                                <>
                                    <InfoRow label="Nombre de la Institución" value={profile.name} />
                                    <InfoRow label="Código DANE" value={profile.daneCode} />
                                    <InfoRow label="NIT" value={profile.nit} />
                                    <InfoRow label="Rector(a)" value={profile.rector} />
                                </>
                            )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 pt-4">Datos de Contacto</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {isEditing ? (
                                <>
                                    <InputField label="Dirección" name="address" value={formData.address} onChange={handleChange} />
                                    <InputField label="Teléfono" name="phone" value={formData.phone} onChange={handleChange} />
                                    <div className="sm:col-span-2">
                                        <InputField label="Correo Electrónico" name="email" value={formData.email} onChange={handleChange} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <InfoRow label="Dirección" value={profile.address} />
                                    <InfoRow label="Teléfono" value={profile.phone} />
                                    <div className="sm:col-span-2">
                                        <InfoRow label="Correo Electrónico" value={profile.email} />
                                    </div>
                                </>
                            )}
                            </div>
                        </div>
                        {/* Visual Identity */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700">Identidad Visual</h3>
                            <div className="flex flex-col items-center space-y-4">
                                <div className="relative">
                                    <img src={isEditing ? formData.logoUrl : profile.logoUrl} alt="Logo Institucional" className="w-32 h-32 object-contain p-2 border-2 border-dashed rounded-lg" />
                                    {isEditing && (
                                        <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full p-2 hover:bg-primary-focus">
                                            <CameraIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-500">Paleta de Colores</p>
                                    <div className="flex space-x-4 mt-2">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: profile.primaryColor }}></div>
                                            <span className="text-xs">Primario</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: profile.secondaryColor }}></div>
                                            <span className="text-xs">Secundario</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ProfileSection>
            </div>

            <div className={activeTab === 'pei' ? '' : 'hidden'}>
                <PEISummary />
            </div>

            <div className={activeTab === 'posters' ? '' : 'hidden'}>
                <EventPosterManager />
            </div>

            {isLogoModalOpen && (
                <GenerateLogoModal 
                    onClose={() => setIsLogoModalOpen(false)}
                    onLogoGenerated={handleLogoGenerated}
                    primaryColor={profile.primaryColor}
                    secondaryColor={profile.secondaryColor}
                />
            )}
        </div>
    );
};

export default InstitutionProfile;