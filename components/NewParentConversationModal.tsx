import React from 'react';
import type { Teacher } from '../types';
import { Role } from '../types';

interface NewParentConversationModalProps {
  contacts: Teacher[];
  onClose: () => void;
  onStartConversation: (contact: Teacher) => void;
}

const NewParentConversationModal: React.FC<NewParentConversationModalProps> = ({ contacts, onClose, onStartConversation }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md mx-4 flex flex-col h-[70vh]">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">Iniciar Conversación</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
        </div>
        <p className="text-sm text-gray-600 mb-4">Selecciona un destinatario para empezar a chatear.</p>
        <ul className="flex-1 overflow-y-auto space-y-2">
          {contacts.map((contact) => (
            <li
              key={contact.id}
              onClick={() => onStartConversation(contact)}
              className="p-3 flex items-center gap-4 cursor-pointer hover:bg-gray-100 rounded-lg"
            >
              <img src={contact.avatarUrl} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="font-semibold text-gray-800">{contact.name}</p>
                <p className="text-sm text-gray-500">{contact.role === Role.TEACHER ? contact.subject : contact.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NewParentConversationModal;
