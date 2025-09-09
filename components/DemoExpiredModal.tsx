import React from 'react';

// Copy PriceCard component from LandingPage.tsx for reuse
const PriceCard: React.FC<{ plan: string; price: number; period: string; features: string[]; popular?: boolean, annualPrice?: number, onSelect: () => void }> = ({ plan, price, period, features, popular, annualPrice, onSelect }) => {
    const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
    
    return (
        <div className={`border rounded-xl p-6 flex flex-col ${popular ? 'border-primary shadow-lg' : 'border-gray-200'}`}>
            {popular && <span className="bg-secondary text-gray-800 text-xs font-bold px-3 py-1 rounded-full self-start mb-4">MÁS POPULAR</span>}
            <h3 className="text-xl font-bold text-gray-800">{plan}</h3>
            <p className="text-3xl font-extrabold text-primary my-3">{formatter.format(price)}</p>
            <p className="text-gray-500 font-semibold mb-4 text-sm">{period}</p>
            {annualPrice && <p className="text-xs text-gray-500 -mt-3 mb-4">Equivalente a {formatter.format(annualPrice)} mensual</p>}
            <ul className="space-y-2 text-gray-600 text-sm mb-6 flex-grow">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                        <svg className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            <button onClick={onSelect} className={`w-full text-center py-2 px-4 rounded-lg font-semibold transition-colors ${popular ? 'bg-primary text-white hover:bg-primary-focus' : 'bg-gray-100 text-primary hover:bg-gray-200'}`}>
                Seleccionar Plan
            </button>
        </div>
    )
};

interface DemoExpiredModalProps {
  onUpgrade: () => void;
  onLogout: () => void;
}

const DemoExpiredModal: React.FC<DemoExpiredModalProps> = ({ onUpgrade, onLogout }) => {
    const handleSelectPlan = () => {
        if (window.confirm("Esto simulará un pago exitoso y activará su cuenta. ¿Desea continuar?")) {
            onUpgrade();
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[999]">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-4 animate-zoom-in flex flex-col max-h-[90vh]">
                <div className="p-8 text-center border-b">
                    <h2 className="text-3xl font-bold text-accent">Tu Período de Prueba ha Terminado</h2>
                    <p className="text-gray-600 mt-2">¡Gracias por probar AULA INTEGRAL MAYA! Para continuar disfrutando de todas las funcionalidades, por favor elige un plan.</p>
                </div>

                <div className="p-8 flex-1 overflow-y-auto">
                    <div className="grid lg:grid-cols-2 gap-8">
                      <PriceCard 
                        plan="Plan Anual"
                        price={4000000}
                        period="COP / AÑO"
                        annualPrice={333333}
                        features={[
                            "Todos los beneficios del plan mensual",
                            "Ahorro del 20% en la suscripción",
                            "Soporte prioritario",
                            "Acceso a nuevas funcionalidades anticipadas"
                        ]}
                        popular
                        onSelect={handleSelectPlan}
                      />
                      <PriceCard 
                        plan="Plan Mensual"
                        price={600000}
                        period="COP / MES"
                        features={[
                            "Gestión de Estudiantes ilimitados",
                            "Módulo de Coordinación y Convivencia",
                            "Generador de Evaluaciones con IA",
                            "Portal de Acudientes y Estudiantes",
                            "Soporte técnico 24/7"
                        ]}
                        onSelect={handleSelectPlan}
                      />
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t text-center">
                    <p className="text-sm text-gray-600">¿No estás listo para comprar? Puedes cerrar sesión y volver más tarde.</p>
                    <button onClick={onLogout} className="mt-2 text-primary font-semibold hover:underline">
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DemoExpiredModal;