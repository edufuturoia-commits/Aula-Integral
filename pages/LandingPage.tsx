import React, { useState } from 'react';
import PaymentModal from '../components/PaymentModal';
import RegistrationModal from '../components/RegistrationModal';
import { UserRegistrationData } from '../types';

interface LandingPageProps {
  onShowLogin: () => void;
  onDemoRegister: (userData: UserRegistrationData) => Promise<{ success: boolean; message: string }>;
}

interface PlanDetails {
    name: string;
    price: number;
    period: string;
}

const FeatureCard: React.FC<{ icon: JSX.Element; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="bg-white p-6 rounded-lg shadow-md transition-transform transform hover:-translate-y-1">
        <div className="text-primary mb-4">{icon}</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
    </div>
);

const PriceCard: React.FC<{ plan: string; price: number; period: string; features: string[]; popular?: boolean, annualPrice?: number, onSelect: () => void }> = ({ plan, price, period, features, popular, annualPrice, onSelect }) => {
    const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
    
    return (
        <div className={`border rounded-xl p-8 flex flex-col ${popular ? 'border-primary shadow-xl' : 'border-gray-200'}`}>
            {popular && <span className="bg-secondary text-gray-800 text-xs font-bold px-3 py-1 rounded-full self-start mb-4">MÁS POPULAR</span>}
            <h3 className="text-2xl font-bold text-gray-800">{plan}</h3>
            <p className="text-4xl font-extrabold text-primary my-4">{price === 0 ? 'Gratis' : formatter.format(price)}</p>
            <p className="text-gray-500 font-semibold mb-6">{period}</p>
            {annualPrice && <p className="text-sm text-gray-500 -mt-4 mb-6">Equivalente a {formatter.format(annualPrice)} mensual</p>}
            <ul className="space-y-3 text-gray-600 mb-8 flex-grow">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        {feature}
                    </li>
                ))}
            </ul>
            <button onClick={onSelect} className={`w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors ${popular ? 'bg-primary text-white hover:bg-primary-focus' : 'bg-gray-100 text-primary hover:bg-gray-200'}`}>
                {price === 0 ? 'Empezar Gratis' : 'Seleccionar Plan'}
            </button>
        </div>
    )
};


const LandingPage: React.FC<LandingPageProps> = ({ onShowLogin, onDemoRegister }) => {
    const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
    const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
    const [registeredUserData, setRegisteredUserData] = useState<UserRegistrationData | null>(null);

    const handleSelectPlan = (planDetails: PlanDetails) => {
        setSelectedPlan(planDetails);
        setIsRegistrationModalOpen(true);
    };
    
    const handleRegister = async (userData: UserRegistrationData): Promise<{ success: boolean; message: string; } | void> => {
        if (userData.isDemo) {
            // It's a demo, call the handler from App.tsx
            return await onDemoRegister(userData);
        } else {
            // It's a paid plan, go to payment modal
            setRegisteredUserData(userData);
            setIsRegistrationModalOpen(false);
            setIsPaymentModalOpen(true);
        }
    };

    const closeAllModals = () => {
        setIsRegistrationModalOpen(false);
        setIsPaymentModalOpen(false);
        setSelectedPlan(null);
        setRegisteredUserData(null);
    };
    
    const handleScrollToPricing = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const pricingSection = document.getElementById('pricing');
        if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth' });
        }
    };


  return (
    <div className="bg-neutral min-h-screen text-gray-800">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">AULA INTEGRAL MAYA</h1>
          <button onClick={onShowLogin} className="bg-primary text-white font-semibold py-2 px-5 rounded-lg hover:bg-primary-focus transition-colors">
            Acceder
          </button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="text-center py-20 px-6 bg-white">
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-4 animate-fade-in">
            La Gestión Escolar, Reinventada.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Una plataforma todo-en-uno que integra la gestión académica, la coordinación y la comunicación para potenciar el futuro de tu institución.
          </p>
          <div className="space-x-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <a href="#pricing" onClick={handleScrollToPricing} className="bg-secondary text-gray-800 font-bold py-3 px-8 rounded-lg hover:bg-yellow-400 transition-colors shadow-md">
              Ver Planes
            </a>
            <button onClick={onShowLogin} className="bg-transparent border-2 border-primary text-primary font-bold py-3 px-8 rounded-lg hover:bg-primary hover:text-white transition-colors">
              Acceder a la Plataforma
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-800">Todo lo que necesitas en un solo lugar</h3>
              <p className="text-gray-600 mt-2">Funcionalidades diseñadas para optimizar cada aspecto de tu institución.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    title="Gestión de Estudiantes"
                    description="Administra perfiles, asistencia y seguimiento detallado de cada estudiante de forma centralizada y segura."
                />
                <FeatureCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    title="Coordinación y Convivencia"
                    description="Registra incidencias, gestiona citaciones y mantén una comunicación fluida entre docentes y coordinación."
                />
                <FeatureCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                    title="Evaluaciones y Recursos con IA"
                    description="Crea evaluaciones y material de estudio personalizados en segundos, adaptados a tus necesidades curriculares."
                />
                <FeatureCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                    title="Calificaciones Completas"
                    description="Sistema de calificaciones flexible con ponderaciones, observaciones y generación de boletines e informes."
                />
                 <FeatureCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                    title="Portales para Padres y Estudiantes"
                    description="Involucra a toda la comunidad educativa con portales dedicados para la comunicación y el seguimiento."
                />
                <FeatureCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                    title="Administración Central"
                    description="Desde Rectoría, gestiona el perfil institucional, docentes, comunicados y obtén una visión global del colegio."
                />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-6 bg-white">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-800">Planes Simples y Transparentes</h3>
              <p className="text-gray-600 mt-2">Elige el plan que mejor se adapte a las necesidades de tu institución.</p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
               <PriceCard 
                plan="Demo Gratuito"
                price={0}
                period="GRATIS / 1 MES"
                features={[
                    "Acceso completo por 30 días",
                    "Todas las funcionalidades premium",
                    "Sin tarjeta de crédito requerida",
                    "Soporte por correo electrónico",
                ]}
                onSelect={() => handleSelectPlan({ name: 'Demo Gratuito', price: 0, period: 'GRATIS / 1 MES' })}
              />
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
                onSelect={() => handleSelectPlan({ name: 'Plan Anual', price: 4000000, period: 'COP / AÑO' })}
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
                onSelect={() => handleSelectPlan({ name: 'Plan Mensual', price: 600000, period: 'COP / MES' })}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-12 px-6">
        <div className="container mx-auto text-center">
            <p>&copy; {new Date().getFullYear()} AULA INTEGRAL MAYA. Todos los derechos reservados.</p>
        </div>
      </footer>

      {isRegistrationModalOpen && selectedPlan && (
        <RegistrationModal 
            plan={selectedPlan}
            onClose={closeAllModals}
            onRegister={handleRegister}
        />
      )}
      
      {isPaymentModalOpen && selectedPlan && registeredUserData && (
        <PaymentModal 
          plan={selectedPlan}
          userData={registeredUserData}
          onClose={closeAllModals}
        />
      )}
    </div>
  );
};

export default LandingPage;