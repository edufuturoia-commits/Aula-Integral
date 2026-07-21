import React, { useState } from 'react';
import EventPostersViewer from '../components/EventPostersViewer';
import EventPosterManager from '../components/EventPosterManager';
import { Role, Teacher, Student, Guardian } from '../types';

interface EventosPageProps {
    currentUser?: Teacher | Student | Guardian;
}

const EventosPage: React.FC<EventosPageProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState<'viewer' | 'manager'>('viewer');

    const canManage = currentUser && (
        currentUser.role === Role.ADMIN || 
        currentUser.role === Role.RECTOR || 
        currentUser.role === Role.COORDINATOR
    );

    if (!canManage) {
        return (
            <div className="space-y-6">
                <EventPostersViewer />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('viewer')}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'viewer' ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Ver Portal de Eventos
                        </button>
                        <button
                            onClick={() => setActiveTab('manager')}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'manager' ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Gestionar Eventos
                        </button>
                    </nav>
                </div>
            </div>

            <div className="animate-fade-in">
                {activeTab === 'viewer' ? <EventPostersViewer /> : <EventPosterManager />}
            </div>
        </div>
    );
};

export default EventosPage;