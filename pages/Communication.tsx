import React, { useState, useEffect, useRef } from 'react';
import type { Teacher, InboxConversation } from '../types';
import { MOCK_INBOX_CONVERSATIONS, MOCK_TEACHER_INBOX_CONVERSATIONS } from '../constants';
import { Role } from '../types';

interface CommunicationProps {
  currentUser: Teacher;
}

const Communication: React.FC<CommunicationProps> = ({ currentUser }) => {
    const [conversations, setConversations] = useState<InboxConversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<InboxConversation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let initialConversations: InboxConversation[] = [];
        if (currentUser.role === Role.TEACHER) {
            initialConversations = MOCK_TEACHER_INBOX_CONVERSATIONS;
        } else { // Admin, Coordinator, Rector
            initialConversations = MOCK_INBOX_CONVERSATIONS;
        }
        setConversations(initialConversations);
        if (initialConversations.length > 0) {
            const firstConvo = initialConversations[0];
            setSelectedConversation(firstConvo);
             if (firstConvo.unread) {
                setConversations(prev =>
                    prev.map(c => c.id === firstConvo.id ? { ...c, unread: false } : c)
                );
            }
        } else {
            setSelectedConversation(null);
        }
    }, [currentUser]);


    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [selectedConversation]);

    const handleSelectConversation = (conversation: InboxConversation) => {
        setSelectedConversation(conversation);
        // Mark as read
        if (conversation.unread) {
            setConversations(prev =>
                prev.map(c => c.id === conversation.id ? { ...c, unread: false } : c)
            );
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        const message = {
            sender: 'self' as const,
            text: newMessage,
            timestamp: 'Ahora',
        };

        const updatedConversation = {
            ...selectedConversation,
            conversation: [...selectedConversation.conversation, message],
            lastMessage: newMessage,
            timestamp: 'Ahora',
        };

        setSelectedConversation(updatedConversation);
        setConversations(prev =>
            prev.map(c => c.id === updatedConversation.id ? updatedConversation : c)
               .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Sort to bring recent to top
        );
        setNewMessage('');
    };

    return (
        <div className="flex h-[calc(100vh-112px)] bg-white rounded-xl shadow-md overflow-hidden">
            {/* Conversation List */}
            <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Bandeja de Entrada</h2>
                </div>
                <ul className="overflow-y-auto flex-1">
                    {conversations.map(convo => (
                        <li
                            key={convo.id}
                            onClick={() => handleSelectConversation(convo)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-200 ${selectedConversation?.id === convo.id ? 'bg-blue-50' : ''}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="relative flex-shrink-0">
                                    <img src={convo.participantAvatar} alt={convo.participantName} className="w-12 h-12 rounded-full" />
                                    {convo.unread && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-accent ring-2 ring-white"></span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between text-sm">
                                        <p className="font-semibold text-gray-800 truncate">{convo.participantName}</p>
                                        <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{convo.timestamp}</p>
                                    </div>
                                    <p className="text-xs text-gray-500">{convo.participantRole}</p>
                                    <p className={`text-sm text-gray-600 truncate mt-1 ${convo.unread ? 'font-bold text-gray-900' : ''}`}>{convo.lastMessage}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                     {conversations.length === 0 && <p className="text-center text-gray-500 p-8">No hay conversaciones.</p>}
                </ul>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col hidden md:flex">
                {selectedConversation ? (
                    <>
                        <div className="p-4 border-b flex items-center space-x-4">
                            <img src={selectedConversation.participantAvatar} alt={selectedConversation.participantName} className="w-10 h-10 rounded-full" />
                            <div>
                                <h3 className="font-bold text-gray-800">{selectedConversation.participantName}</h3>
                                <p className="text-sm text-gray-500">{selectedConversation.participantRole}</p>
                            </div>
                        </div>
                        <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50">
                            {selectedConversation.conversation.map((msg, index) => (
                                <div key={index} className={`flex items-end gap-2 ${msg.sender === 'self' ? 'justify-end' : ''}`}>
                                    {msg.sender === 'participant' && <img src={selectedConversation.participantAvatar} className="w-8 h-8 rounded-full" alt="participant" />}
                                    <div className={`max-w-lg p-3 rounded-xl ${msg.sender === 'self' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                        <p className="text-xs opacity-70 mt-1 text-right">{msg.timestamp}</p>
                                    </div>
                                    {msg.sender === 'self' && <img src={currentUser.avatarUrl} className="w-8 h-8 rounded-full" alt="self" />}
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex items-center gap-4">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}}
                                placeholder="Escribe una respuesta..."
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary resize-none bg-gray-50"
                                rows={1}
                            />
                            <button type="submit" className="bg-primary text-white rounded-full p-3 hover:bg-primary-focus disabled:bg-gray-300" disabled={!newMessage.trim()}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        <h3 className="mt-4 text-lg font-semibold text-gray-700">Selecciona una conversación</h3>
                        <p className="text-gray-500 mt-1">Elige una conversación de la lista para ver los mensajes.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Communication;