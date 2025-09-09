import React, { useState } from 'react';
import { UserRegistrationData } from '../types';

interface PlanDetails {
  name: string;
  price: number;
  period: string;
}

interface RegistrationModalProps {
  plan: PlanDetails;
  onClose: () => void;
  onRegister: (userData: UserRegistrationData) => Promise<{ success: boolean; message: string; } | void>;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ plan, onClose, onRegister }) => {
    const [formData, setFormData] = useState({
        institutionName: '',
        rectorName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const isDemoPlan = plan.price === 0;

    const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        
        setIsLoading(true);

        const result = await onRegister({
            institutionName: formData.institutionName,
            rectorName: formData.rectorName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            isDemo: isDemoPlan,
        });

        setIsLoading(false);

        if (result && !result.success) {
            setError(result.message);
        }
        // If successful, the parent component handles closing the modal or navigating away.
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 animate-zoom-in flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                {isDemoPlan ? 'Crea tu Cuenta de Demostración' : 'Crea tu Cuenta'}
                            </h2>
                            <p className="text-gray-500">
                                {isDemoPlan ? 'Paso 1: Registra tu institución para acceder' : `Paso 1 de 2: Registra tu institución para el ${plan.name}`}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl">&times;</button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre de la Institución</label>
                            <input type="text" name="institutionName" onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre del Rector(a)</label>
                            <input type="text" name="rectorName" onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900"/>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Correo Electrónico (será tu usuario)</label>
                        <input type="email" name="email" onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Teléfono de Contacto</label>
                        <input type="tel" name="phone" onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900"/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                            <input type="password" name="password" onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                            <input type="password" name="confirmPassword" onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900"/>
                        </div>
                    </div>

                    {error && <p className="text-red-600 text-sm text-center">{error}</p>}
                    
                    <div className="pt-4 text-center">
                         {!isDemoPlan && <p className="text-lg font-bold">Total a Pagar: {formatter.format(plan.price)}</p>}
                        <button type="submit" disabled={isLoading} className="w-full mt-4 bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-gray-400">
                           {isLoading ? 'Procesando...' : (isDemoPlan ? 'Crear Cuenta y Acceder' : 'Continuar al Pago')}
                        </button>
                         <p className="text-xs text-gray-400 mt-4">Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegistrationModal;
