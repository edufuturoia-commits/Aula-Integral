import React from 'react';
import WompiForm from './WompiForm';
import { UserRegistrationData } from '../types';

interface PlanDetails {
  name: string;
  price: number;
  period: string;
}

interface PaymentModalProps {
  plan: PlanDetails;
  userData: UserRegistrationData;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ plan, userData, onClose }) => {
    const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

    const amountInCents = (plan.price * 100).toString();
    const reference = `AIM-${userData.email.split('@')[0]}-${Date.now()}`;
    
    // WARNING: In a real-world application, this signature MUST be generated on a secure backend.
    // The signature is a hash of the reference, amount, currency, and a secret key.
    // The signature provided is an example and will likely only work for its specific reference and amount.
    // Using it here for other amounts will result in an error from Wompi.
    const signature = "AV-2013-sn2m20000000COPprod_integrity_2989ADKvGcquFIK76ofUADw4lvSd4hTc";


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 animate-zoom-in" onClick={e => e.stopPropagation()}>
                <div className="p-8">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Confirmar Pago</h2>
                            <p className="text-gray-500">Paso 2 de 2: Completa la transacción</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl">&times;</button>
                     </div>
                     <div className="text-center space-y-4">
                        <p className="text-gray-600">
                            Hola, <strong>{userData.rectorName}</strong>. Estás a punto de activar el <strong>{plan.name}</strong> para <strong>{userData.institutionName}</strong>.
                        </p>
                        <p className="text-2xl font-bold text-primary">{formatter.format(plan.price)}</p>
                        <p className="text-gray-600">Serás dirigido a la pasarela de pagos segura de Wompi para completar tu transacción.</p>
                        <div className="flex justify-center pt-4">
                           <WompiForm 
                                amountInCents={amountInCents}
                                reference={reference}
                                signature={signature}
                           />
                        </div>
                        <p className="text-xs text-gray-400 pt-4">Al hacer clic en el botón de pago, aceptas los términos y condiciones de AULA INTEGRAL MAYA y Wompi.</p>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;