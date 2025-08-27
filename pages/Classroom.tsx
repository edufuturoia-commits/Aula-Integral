import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import StudentList from '../components/StudentList';
import IncidentModal from '../components/IncidentModal';
import ImportStudentsModal from '../components/ImportStudentsModal';
import CitationModal from '../components/CitationModal';
import GroupMessageModal from '../components/GroupMessageModal';
import CancelCitationModal from '../components/CancelCitationModal';
import type { Student, Incident, ParentMessage, Citation } from '../types';
import { CitationStatus } from '../types';
import { addIncident, getIncidents, getUnsyncedIncidents, updateIncident, deleteIncident } from '../db';
import { MOCK_STUDENTS, GRADES, GROUPS, MOCK_PARENT_MESSAGES, MOCK_CITATIONS } from '../constants';
import AttendanceTaker from '../components/AttendanceTaker';


interface ClassroomProps {
  isOnline: boolean;
}

const SyncingIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const MoreVertIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
);

const ChatModal: React.FC<{
  chat: ParentMessage;
  onClose: () => void;
  onUpdateConversation: (studentId: number, newConversation: ParentMessage['conversation']) => void;
}> = ({ chat, onClose, onUpdateConversation }) => {
    const [newMessage, setNewMessage] = useState('');
    const [currentConversation, setCurrentConversation] = useState(chat.conversation);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [currentConversation]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const teacherMessage = {
            sender: 'teacher' as const,
            text: newMessage,
            timestamp: 'Ahora'
        };

        const updatedConversation = [...currentConversation, teacherMessage];
        setCurrentConversation(updatedConversation);
        onUpdateConversation(chat.studentId, updatedConversation);
        setNewMessage('');
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 flex flex-col h-[70vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex items-center space-x-3">
                     <img src={chat.studentAvatar} alt={chat.studentName} className="w-10 h-10 rounded-full" />
                     <div>
                        <h3 className="text-lg font-bold">Chat con Acudiente de</h3>
                        <p className="text-sm text-gray-600">{chat.studentName}</p>
                     </div>
                </div>
                <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50">
                    {currentConversation.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.sender === 'teacher' ? 'justify-end' : ''}`}>
                             {msg.sender === 'parent' && <img src={chat.studentAvatar} className="w-8 h-8 rounded-full" alt="parent" />}
                            <div className={`max-w-md p-3 rounded-xl ${msg.sender === 'teacher' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                <p className="text-sm">{msg.text}</p>
                                <p className="text-xs opacity-70 mt-1 text-right">{msg.timestamp}</p>
                            </div>
                            {msg.sender === 'teacher' && <img src="https://picsum.photos/seed/user/100/100" className="w-8 h-8 rounded-full" alt="teacher" />}
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex items-center gap-4">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}}
                        placeholder="Escribe una respuesta..."
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-white text-gray-900 placeholder-gray-500"
                        rows={1}
                    />
                    <button type="submit" className="bg-primary text-white rounded-full p-3 hover:bg-primary-focus transition-colors disabled:bg-gray-300" disabled={!newMessage.trim()}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};


const Classroom: React.FC<ClassroomProps> = ({ isOnline }) => {
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const [isGroupMessageModalOpen, setIsGroupMessageModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [citationToCancel, setCitationToCancel] = useState<Citation | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showSnackbar, setShowSnackbar] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [isSyncing, setIsSyncing] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'attendance'>('students');
  const [rightPanelTab, setRightPanelTab] = useState<'incidents' | 'messages' | 'citations'>('incidents');
  const [parentMessages, setParentMessages] = useState<ParentMessage[]>(MOCK_PARENT_MESSAGES);
  const [activeChat, setActiveChat] = useState<ParentMessage | null>(null);
  const [citations, setCitations] = useState<Citation[]>(MOCK_CITATIONS);

  
  const isInitialMount = useRef(true);

  const availableGrades = useMemo(() => ['all', ...GRADES], []);
  const availableGroups = useMemo(() => ['all', ...GROUPS], []);
  
  const filteredStudents = useMemo(() => {
      return students.filter(student => {
          const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;
          const matchesGroup = groupFilter === 'all' || student.group === groupFilter;
          return matchesGrade && matchesGroup;
      });
  }, [students, gradeFilter, groupFilter]);
  
  const activeIncidents = useMemo(() => incidents.filter(inc => !inc.archived), [incidents]);
  
  const sortedCitations = useMemo(() => citations.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [citations]);

  const loadIncidents = useCallback(async () => {
    const data = await getIncidents();
    setIncidents(data);
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const openModalForStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };
  
  const showSyncMessage = (message: string) => {
      setShowSnackbar({ message, visible: true });
      setTimeout(() => setShowSnackbar({ message: '', visible: false }), 4000);
  }

  const handleSaveIncident = async (incident: Incident) => {
    const newIncident: Incident = { ...incident, synced: isOnline };
    await addIncident(newIncident);
    await loadIncidents();
    handleCloseModal();
    if(isOnline) {
      showSyncMessage("Incidencia guardada y sincronizada.");
    } else {
      showSyncMessage("Incidencia guardada localmente. Se sincronizará al recuperar la conexión.");
    }
  };
  
  const handleSaveCitations = (newCitations: Citation[]) => {
    setCitations(prev => [...prev, ...newCitations]);
    setIsCitationModalOpen(false);
    showSyncMessage(`${newCitations.length} citacion(es) enviada(s) exitosamente.`);
  };

  const handleOpenCancelModal = (citation: Citation) => {
    setCitationToCancel(citation);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelCitation = (reason: string) => {
    if (!citationToCancel) return;
    setCitations(prev => prev.map(c => 
        c.id === citationToCancel.id 
        ? { ...c, status: CitationStatus.CANCELLED, cancellationReason: reason }
        : c
    ));
    setIsCancelModalOpen(false);
    setCitationToCancel(null);
    showSyncMessage("Citación cancelada exitosamente.");
  };
  
  const handleSendGroupMessage = (message: string) => {
    setIsGroupMessageModalOpen(false);
    showSyncMessage("Mensaje grupal enviado a todos los acudientes.");
  };

  const handleImportStudents = (studentNames: string[], grade: string, group: string) => {
      const newStudents: Student[] = studentNames.map((name, index) => ({
          id: Date.now() + index,
          name,
          avatarUrl: `https://picsum.photos/seed/${Date.now() + index}/100/100`,
          grade: grade,
          group: group,
      }));
      setStudents(prev => [...prev, ...newStudents].sort((a, b) => a.name.localeCompare(b.name)));
      setIsImportModalOpen(false);
      showSyncMessage(`${newStudents.length} estudiante(s) añadido(s) a ${grade} - Grupo ${group} exitosamente.`);
      setGradeFilter(grade);
      setGroupFilter(group);
  }
  
    const handleArchiveIncident = async (id: string) => {
        const incidentToUpdate = incidents.find(inc => inc.id === id);
        if (incidentToUpdate) {
            await updateIncident({ ...incidentToUpdate, archived: true });
            await loadIncidents();
            showSyncMessage("Incidencia archivada.");
        }
        setOpenMenuId(null);
    };

    const handleDeleteIncident = async (id: string) => {
        if (confirm("¿Estás seguro de que quieres eliminar esta incidencia permanentemente? Esta acción no se puede deshacer.")) {
            await deleteIncident(id);
            await loadIncidents();
            showSyncMessage("Incidencia eliminada.");
        }
        setOpenMenuId(null);
    };

    const handleUpdateConversation = (studentId: number, newConversation: ParentMessage['conversation']) => {
        setParentMessages(prevMessages => 
            prevMessages.map(msg => 
                msg.studentId === studentId
                ? { ...msg, conversation: newConversation, lastMessage: newConversation[newConversation.length - 1].text, timestamp: 'Ahora', unread: false }
                : msg
            )
        );
        setActiveChat(prevChat => 
            prevChat ? { ...prevChat, conversation: newConversation } : null
        );
    };

  const syncPendingIncidents = useCallback(async () => {
    setIsSyncing(true);
    const pendingIncidents = await getUnsyncedIncidents();
    
    if (pendingIncidents.length > 0) {
      showSyncMessage(`Sincronizando ${pendingIncidents.length} incidencia(s)...`);
      
      const syncPromises = pendingIncidents.map(inc => {
        return new Promise(resolve => setTimeout(resolve, 500)).then(() => 
          updateIncident({ ...inc, synced: true })
        );
      });

      await Promise.all(syncPromises);

      await loadIncidents();
      showSyncMessage("Sincronización completada.");
    }
    setIsSyncing(false);
  }, [loadIncidents]);

  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }

    if (isOnline && !isSyncing) {
      syncPendingIncidents();
    }
  }, [isOnline, isSyncing, syncPendingIncidents]);

  const pendingSyncCount = activeIncidents.filter(i => !i.synced).length;
  const unreadMessagesCount = parentMessages.filter(m => m.unread).length;
  const pendingCitationsCount = citations.filter(c => c.status === CitationStatus.PENDING).length;
  
  const getStatusClass = (status: CitationStatus) => {
    switch (status) {
        case CitationStatus.CONFIRMED: return 'bg-green-100 text-green-800';
        case CitationStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
        case CitationStatus.COMPLETED: return 'bg-blue-100 text-blue-800';
        case CitationStatus.CANCELLED: return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative">
      <div className="mb-6">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'students' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        aria-current={activeTab === 'students' ? 'page' : undefined}
                    >
                        Estudiantes e Incidencias
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'attendance' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        aria-current={activeTab === 'attendance' ? 'page' : undefined}
                    >
                        Control de Asistencia
                    </button>
                </nav>
            </div>
      </div>

      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <StudentList 
                students={filteredStudents} 
                onSelectStudent={openModalForStudent}
                onImportClick={() => setIsImportModalOpen(true)} 
                grades={availableGrades}
                selectedGrade={gradeFilter}
                onGradeChange={setGradeFilter}
                groups={availableGroups}
                selectedGroup={groupFilter}
                onGroupChange={setGroupFilter}
                />
            </div>
            <div className="bg-white rounded-xl shadow-md flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4" aria-label="Right Panel Tabs">
                         <button onClick={() => setRightPanelTab('incidents')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${rightPanelTab === 'incidents' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Incidencias
                            {pendingSyncCount > 0 && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingSyncCount}</span>}
                         </button>
                         <button onClick={() => setRightPanelTab('messages')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${rightPanelTab === 'messages' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Mensajes
                            {unreadMessagesCount > 0 && <span className="bg-accent text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{unreadMessagesCount}</span>}
                         </button>
                         <button onClick={() => setRightPanelTab('citations')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${rightPanelTab === 'citations' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Citaciones
                             {pendingCitationsCount > 0 && <span className="bg-yellow-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{pendingCitationsCount}</span>}
                         </button>
                    </nav>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    {rightPanelTab === 'incidents' && (
                         <ul className="space-y-3 h-full max-h-[60vh]">
                            {activeIncidents.map(incident => (
                                <li key={incident.id} className={`p-3 rounded-md border ${incident.synced ? 'bg-gray-50 border-gray-200' : 'bg-amber-50 border-amber-200'}`}>
                                    <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-2">
                                            <p className="font-semibold">{incident.studentName} - <span className="font-normal text-gray-600">{incident.type}</span></p>
                                            <p className="text-sm text-gray-500 mt-1">{incident.notes}</p>
                                    </div>
                                    <div className="relative flex-shrink-0">
                                            <button onClick={() => setOpenMenuId(openMenuId === incident.id ? null : incident.id)} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                                <MoreVertIcon />
                                            </button>
                                            {openMenuId === incident.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200" onMouseLeave={() => setOpenMenuId(null)}>
                                                    <ul className="py-1">
                                                        <li><button onClick={() => handleArchiveIncident(incident.id)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 001.414 0l2.414-2.414a1 1 0 01.707-.293H20" /></svg>Archivar</button></li>
                                                        <li><button onClick={() => handleDeleteIncident(incident.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Eliminar</button></li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="border-t mt-2 pt-2 flex justify-between items-center text-xs text-gray-500">
                                        <span>{incident.teacherName} @ {incident.location}</span>
                                        <span>{new Date(incident.timestamp).toLocaleString()}</span>
                                    </div>
                                </li>
                            ))}
                            {activeIncidents.length === 0 && <p className="text-gray-500 text-center py-8">No hay incidencias activas.</p>}
                        </ul>
                    )}
                    {rightPanelTab === 'messages' && (
                        <div>
                             <button onClick={() => setIsGroupMessageModalOpen(true)} className="w-full mb-4 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors flex items-center justify-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-.293-.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
                                <span>Nuevo Mensaje Grupal</span>
                            </button>
                            <ul className="space-y-3 h-full max-h-[55vh] overflow-y-auto">
                                {parentMessages.map(msg => (
                                    <li key={msg.studentId} onClick={() => setActiveChat(msg)} className="p-3 rounded-md border bg-gray-50 border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300">
                                        <div className="flex items-start gap-3">
                                            <div className="relative">
                                                <img src={msg.studentAvatar} alt={msg.studentName} className="w-10 h-10 rounded-full" />
                                                {msg.unread && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-white"></span>}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between text-sm">
                                                    <p className="font-semibold">{msg.studentName}</p>
                                                    <p className="text-xs text-gray-500">{msg.timestamp}</p>
                                                </div>
                                                <p className={`text-sm text-gray-600 truncate ${msg.unread ? 'font-bold text-gray-800' : ''}`}>{msg.lastMessage}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                {parentMessages.length === 0 && <p className="text-gray-500 text-center py-8">No hay mensajes de acudientes.</p>}
                            </ul>
                        </div>
                    )}
                     {rightPanelTab === 'citations' && (
                        <div>
                             <button onClick={() => setIsCitationModalOpen(true)} className="w-full mb-4 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors flex items-center justify-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                                <span>Crear Nueva Citación</span>
                            </button>
                            <ul className="space-y-3 h-full max-h-[55vh] overflow-y-auto">
                                {sortedCitations.map(cit => (
                                    <li key={cit.id} className={`p-3 rounded-md border ${cit.status === CitationStatus.CANCELLED ? 'bg-gray-200 border-gray-300' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-start gap-3">
                                            <img src={cit.studentAvatar} alt={cit.studentName} className="w-10 h-10 rounded-full" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center text-sm">
                                                    <p className="font-semibold">{cit.studentName}</p>
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(cit.status)}`}>{cit.status}</span>
                                                </div>
                                                <p className="text-sm text-gray-600">{cit.reason}</p>
                                                <p className="text-xs text-gray-500 mt-1">{new Date(cit.date).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {cit.time}</p>
                                            </div>
                                        </div>
                                        {cit.status === CitationStatus.CANCELLED && cit.cancellationReason && (
                                            <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
                                                <p><strong className="font-semibold">Cancelada:</strong> {cit.cancellationReason}</p>
                                            </div>
                                        )}
                                        {[CitationStatus.PENDING, CitationStatus.CONFIRMED].includes(cit.status) && (
                                            <div className="mt-3 text-right">
                                                <button onClick={() => handleOpenCancelModal(cit)} className="text-xs font-semibold text-red-600 hover:text-red-800">
                                                    Cancelar
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                                {citations.length === 0 && <p className="text-gray-500 text-center py-8">No hay citaciones programadas.</p>}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <AttendanceTaker students={filteredStudents} isOnline={isOnline} />
      )}


      {isModalOpen && selectedStudent && (
        <IncidentModal
          student={selectedStudent}
          onClose={handleCloseModal}
          onSave={handleSaveIncident}
        />
      )}

      {isImportModalOpen && (
          <ImportStudentsModal
            onClose={() => setIsImportModalOpen(false)}
            onSave={handleImportStudents}
          />
      )}

      {isCitationModalOpen && (
        <CitationModal 
            students={students}
            onClose={() => setIsCitationModalOpen(false)}
            onSave={handleSaveCitations}
        />
      )}
      
      {isGroupMessageModalOpen && (
        <GroupMessageModal
            onClose={() => setIsGroupMessageModalOpen(false)}
            onSend={handleSendGroupMessage}
        />
      )}

      {isCancelModalOpen && citationToCancel && (
          <CancelCitationModal 
              onClose={() => setIsCancelModalOpen(false)}
              onConfirm={handleConfirmCancelCitation}
          />
      )}
      
      {activeChat && (
        <ChatModal 
            chat={activeChat}
            onClose={() => setActiveChat(null)}
            onUpdateConversation={handleUpdateConversation}
        />
      )}

      {activeTab === 'students' && (
        <button 
            onClick={() => alert("Seleccione un estudiante de la lista para registrar una incidencia.")}
            className="absolute bottom-8 right-8 bg-accent text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-red-700 transition-transform transform hover:scale-110"
            title="Registrar Incidencia"
        >
            +
        </button>
      )}


      {showSnackbar.visible && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg z-50">
          {showSnackbar.message}
        </div>
      )}
    </div>
  );
};

export default Classroom;