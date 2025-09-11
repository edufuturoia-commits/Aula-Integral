import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import StudentList from '../components/StudentList';
import IncidentModal from '../components/IncidentModal';
import ImportStudentsModal from '../components/ImportStudentsModal';
import CitationModal from '../components/CitationModal';
import GroupMessageModal from '../components/GroupMessageModal';
import CancelCitationModal from '../components/CancelCitationModal';
import AddStudentModal from '../components/AddStudentModal'; // Import new modal
import type { Student, Incident, ParentMessage, Citation, CoordinationMessage, Teacher, SubjectGrades, AttendanceRecord } from '../types';
import { CitationStatus, Role } from '../types';
import { addOrUpdateStudents } from '../db';
import { GRADES, GROUPS, MOCK_PARENT_MESSAGES, MOCK_CITATIONS, MOCK_MESSAGE_HISTORY, MOCK_COORDINATOR_USER, GRADE_GROUP_MAP } from '../constants';
import AttendanceTaker from '../components/AttendanceTaker';
import ManualViewer from '../components/ManualViewer';
import EventPostersViewer from '../components/EventPostersViewer';
import Calificaciones from './Calificaciones';


interface ClassroomProps {
  isOnline: boolean;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  currentUser: Teacher;
  subjectGradesData: SubjectGrades[];
  setSubjectGradesData: React.Dispatch<React.SetStateAction<SubjectGrades[]>>;
  attendanceRecords: AttendanceRecord[];
  onUpdateAttendance: (record: AttendanceRecord) => Promise<void>;
  onBulkUpdateAttendance: (records: AttendanceRecord[]) => Promise<void>;
  incidents: Incident[];
  onUpdateIncidents: (action: 'add' | 'update' | 'delete', data: Incident | string) => Promise<void>;
}

const MoreVertIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
);

const ChatModal: React.FC<{
  chat: ParentMessage;
  onClose: () => void;
  onUpdateConversation: (studentId: number, newConversation: ParentMessage['conversation']) => void;
  currentUser: Teacher;
}> = ({ chat, onClose, onUpdateConversation, currentUser }) => {
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
                <div className="p-4 border-b flex items-center space-x-3 min-w-0">
                     <img src={chat.studentAvatar} alt={chat.studentName} className="w-10 h-10 rounded-full flex-shrink-0" />
                     <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold">Chat con Acudiente de</h3>
                        <p className="text-sm text-gray-600 break-words">{chat.studentName}</p>
                     </div>
                </div>
                <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50">
                    {currentConversation.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.sender === 'teacher' ? 'justify-end' : ''}`}>
                             {msg.sender === 'parent' && <img src={chat.studentAvatar} className="w-8 h-8 rounded-full" alt="parent" />}
                            <div className={`max-w-md p-3 rounded-xl ${msg.sender === 'teacher' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                <p className="text-xs opacity-70 mt-1 text-right">{msg.timestamp}</p>
                            </div>
                            {msg.sender === 'teacher' && <img src={currentUser.avatarUrl} className="w-8 h-8 rounded-full" alt="teacher" />}
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex items-center gap-4">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}}
                        placeholder="Escribe una respuesta..."
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-gray-50 text-gray-900 placeholder-gray-500"
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


const Classroom: React.FC<ClassroomProps> = ({ isOnline, students, setStudents, currentUser, subjectGradesData, setSubjectGradesData, attendanceRecords, onUpdateAttendance, onBulkUpdateAttendance, incidents, onUpdateIncidents }) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const [isGroupMessageModalOpen, setIsGroupMessageModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [citationToCancel, setCitationToCancel] = useState<Citation | null>(null);
  const [showSnackbar, setShowSnackbar] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'manual' | 'events' | 'calificaciones'>('students');
  const [rightPanelTab, setRightPanelTab] = useState<'incidents' | 'messages' | 'citations' | 'coordination'>('incidents');
  const [parentMessages, setParentMessages] = useState<ParentMessage[]>(MOCK_PARENT_MESSAGES);
  const [activeChat, setActiveChat] = useState<ParentMessage | null>(null);
  const [citations, setCitations] = useState<Citation[]>(MOCK_CITATIONS);
  const [coordinationConversation, setCoordinationConversation] = useState<CoordinationMessage[]>(MOCK_MESSAGE_HISTORY);
  const [newCoordinationMessage, setNewCoordinationMessage] = useState('');
  const coordinationChatRef = useRef<HTMLDivElement>(null);

  const availableGrades = useMemo(() => ['all', ...GRADES], []);
  const availableGroups = useMemo(() => {
    if (gradeFilter === 'all' || !GRADE_GROUP_MAP[gradeFilter]) {
        return ['all', ...GROUPS];
    }
    return ['all', ...GRADE_GROUP_MAP[gradeFilter]];
  }, [gradeFilter]);

  const handleGradeChange = (grade: string) => {
    setGradeFilter(grade);
    setGroupFilter('all');
  };

  const filteredStudents = useMemo(() => {
      return students.filter(student => {
          const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;
          const matchesGroup = groupFilter === 'all' || student.group === groupFilter;
          return matchesGrade && matchesGroup;
      });
  }, [students, gradeFilter, groupFilter]);
  
  const myReportedIncidents = useMemo(() => 
    incidents
      .filter(inc => inc.teacherName === currentUser.name && !inc.archived)
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), 
  [incidents, currentUser.name]);
  
  const sortedCitations = useMemo(() => citations.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [citations]);

  useEffect(() => {
    if (coordinationChatRef.current) {
        coordinationChatRef.current.scrollTop = coordinationChatRef.current.scrollHeight;
    }
  }, [coordinationConversation]);


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
    try {
        await onUpdateIncidents('add', { ...incident, attended: false });
        handleCloseModal();
        showSyncMessage("Incidencia guardada. Coordinación ha sido notificada.");
        setRightPanelTab('incidents');
    } catch (error) {
        console.error("Failed to save incident:", error);
        showSyncMessage("Error: No se pudo guardar la incidencia. Revisa tu conexión.");
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

  const handleSaveNewStudent = async (newStudentData: { name: string; grade: string; group: string }) => {
    const newStudent: Student = {
        id: Date.now(),
        name: newStudentData.name,
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/100/100`,
        grade: newStudentData.grade,
        group: newStudentData.group,
        role: Role.STUDENT,
    };
    const updatedStudents = [...students, newStudent];
    await addOrUpdateStudents(updatedStudents);
    setStudents(updatedStudents.sort((a, b) => a.name.localeCompare(b.name)));
    setIsAddStudentModalOpen(false);
    showSyncMessage(`${newStudent.name} ha sido añadido exitosamente.`);
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
    
    const handleSendToCoordination = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCoordinationMessage.trim()) return;

        const readConversation = coordinationConversation.map(m => ({ ...m, readByTeacher: true }));
        
        const teacherMessage: CoordinationMessage = {
            id: `cm_${Date.now()}`,
            sender: 'teacher',
            text: newCoordinationMessage,
            timestamp: 'Ahora',
            readByTeacher: true,
        };

        setCoordinationConversation([...readConversation, teacherMessage]);
        setNewCoordinationMessage('');

        setTimeout(() => {
            const coordinationReply: CoordinationMessage = {
                id: `cm_${Date.now() + 1}`,
                sender: 'coordination',
                text: 'Recibido, profe. Gracias por la información, lo revisaremos a la brevedad.',
                timestamp: 'Ahora',
                readByTeacher: false,
            };
            setCoordinationConversation(prev => [...prev, coordinationReply]);
        }, 2000);
    };

  const handleFabClick = () => {
    switch (rightPanelTab) {
        case 'incidents':
            setSelectedStudent(null);
            setIsModalOpen(true);
            break;
        case 'citations':
            setIsCitationModalOpen(true);
            break;
        case 'messages':
            setIsGroupMessageModalOpen(true);
            break;
        default:
            console.log("No default FAB action for this tab.");
    }
  };

  const getFabTitle = () => {
    switch(rightPanelTab) {
        case 'incidents':
            return 'Registrar Incidencia';
        case 'citations':
            return 'Crear Nueva Citación';
        case 'messages':
            return 'Nuevo Mensaje Grupal';
        default:
            return '';
    }
  }

  const unreadMessagesCount = parentMessages.filter(m => m.unread).length;
  const pendingCitationsCount = citations.filter(c => c.status === CitationStatus.PENDING).length;
  const unreadCoordinationMessagesCount = useMemo(() => coordinationConversation.filter(m => m.sender === 'coordination' && !m.readByTeacher).length, [coordinationConversation]);
  
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
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'students' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        aria-current={activeTab === 'students' ? 'page' : undefined}
                    >
                        Estudiantes e Incidencias
                    </button>
                    <button
                        onClick={() => setActiveTab('calificaciones')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'calificaciones' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Calificaciones
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'attendance' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        aria-current={activeTab === 'attendance' ? 'page' : undefined}
                    >
                        Control de Asistencia
                    </button>
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'events' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Eventos Institucionales
                    </button>
                     <button
                        onClick={() => setActiveTab('manual')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'manual' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        aria-current={activeTab === 'manual' ? 'page' : undefined}
                    >
                        Manual de Convivencia
                    </button>
                </nav>
            </div>
      </div>

        <div className={activeTab === 'students' ? '' : 'hidden'}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <StudentList 
                        students={filteredStudents} 
                        onSelectStudent={openModalForStudent}
                        onAddStudentClick={() => setIsAddStudentModalOpen(true)} 
                        grades={availableGrades}
                        selectedGrade={gradeFilter}
                        onGradeChange={handleGradeChange}
                        groups={availableGroups}
                        selectedGroup={groupFilter}
                        onGroupChange={setGroupFilter}
                    />
                </div>
                <div className="bg-white rounded-xl shadow-md flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-4 overflow-x-auto px-4 sm:px-0" aria-label="Right Panel Tabs">
                             <button onClick={() => setRightPanelTab('incidents')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${rightPanelTab === 'incidents' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                Mis Reportes
                             </button>
                             <button onClick={() => setRightPanelTab('messages')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${rightPanelTab === 'messages' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                Acudientes
                                {unreadMessagesCount > 0 && <span className="bg-accent text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{unreadMessagesCount}</span>}
                             </button>
                             <button onClick={() => setRightPanelTab('citations')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${rightPanelTab === 'citations' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                Citaciones
                                 {pendingCitationsCount > 0 && <span className="bg-yellow-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{pendingCitationsCount}</span>}
                             </button>
                             <button onClick={() => setRightPanelTab('coordination')} className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${rightPanelTab === 'coordination' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                Coordinación
                                 {unreadCoordinationMessagesCount > 0 && <span className="bg-blue-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{unreadCoordinationMessagesCount}</span>}
                             </button>
                        </nav>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                        {rightPanelTab === 'incidents' && (
                             <ul className="space-y-3 h-full max-h-[60vh] overflow-y-auto p-4">
                                {myReportedIncidents.map(incident => (
                                    <li key={incident.id} className="p-3 rounded-md border bg-gray-50 border-gray-200">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 pr-2">
                                                <p className="font-semibold text-gray-900">{incident.studentName}</p>
                                                <p className="text-sm text-gray-600">{incident.type}</p>
                                                <p className="text-sm text-gray-500 mt-2">{incident.notes}</p>
                                            </div>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${incident.attended ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {incident.attended ? 'Revisado' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="border-t mt-2 pt-2 flex justify-between items-center text-xs text-gray-500">
                                            <span>{new Date(incident.timestamp).toLocaleDateString()}</span>
                                            <span>@ {incident.location}</span>
                                        </div>
                                    </li>
                                ))}
                                {myReportedIncidents.length === 0 && <p className="text-gray-500 text-center py-8">No has reportado incidencias.</p>}
                            </ul>
                        )}
                        {rightPanelTab === 'messages' && (
                            <div className="p-4 flex-1 flex flex-col overflow-hidden">
                                 <button onClick={() => setIsGroupMessageModalOpen(true)} className="w-full mb-4 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors flex items-center justify-center space-x-2 flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-.293-.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
                                    <span>Nuevo Mensaje Grupal</span>
                                </button>
                                <ul className="space-y-3 flex-1 overflow-y-auto">
                                    {parentMessages.map(msg => (
                                        <li key={msg.studentId} onClick={() => setActiveChat(msg)} className="p-3 rounded-md border bg-gray-50 border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300">
                                            <div className="flex items-start gap-3">
                                                <div className="relative flex-shrink-0">
                                                    <img src={msg.studentAvatar} alt={msg.studentName} className="w-10 h-10 rounded-full" />
                                                    {msg.unread && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-white"></span>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between text-sm">
                                                        <p className="font-semibold">{msg.studentName}</p>
                                                        <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{msg.timestamp}</p>
                                                    </div>
                                                    <p className={`text-sm text-gray-600 ${msg.unread ? 'font-bold text-gray-800' : ''}`}>{msg.lastMessage}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                    {parentMessages.length === 0 && <p className="text-gray-500 text-center py-8">No hay mensajes de acudientes.</p>}
                                </ul>
                            </div>
                        )}
                         {rightPanelTab === 'citations' && (
                            <div className="p-4 flex-1 flex flex-col overflow-hidden">
                                 <button onClick={() => setIsCitationModalOpen(true)} className="w-full mb-4 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors flex items-center justify-center space-x-2 flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                                    <span>Crear Nueva Citación</span>
                                </button>
                                <ul className="space-y-3 flex-1 overflow-y-auto">
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
                         {rightPanelTab === 'coordination' && (
                             <div className="flex-1 flex flex-col overflow-hidden">
                                <div ref={coordinationChatRef} className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50">
                                     {coordinationConversation.map((msg, index) => (
                                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'teacher' ? 'justify-end' : ''}`}>
                                            {msg.sender === 'coordination' && <img src={MOCK_COORDINATOR_USER.avatarUrl} className="w-8 h-8 rounded-full" alt="coordinator" />}
                                            <div className={`max-w-md p-3 rounded-xl ${msg.sender === 'teacher' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                                <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                                <p className="text-xs opacity-70 mt-1 text-right">{msg.timestamp}</p>
                                            </div>
                                            {msg.sender === 'teacher' && <img src={currentUser.avatarUrl} className="w-8 h-8 rounded-full" alt="teacher" />}
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleSendToCoordination} className="p-4 border-t bg-white flex items-center gap-4">
                                     <textarea value={newCoordinationMessage} onChange={e => setNewCoordinationMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendToCoordination(e); }}} placeholder="Escribe un mensaje a coordinación..." className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary resize-none bg-gray-50" rows={1}/>
                                     <button type="submit" className="bg-primary text-white rounded-full p-3 hover:bg-primary-focus disabled:bg-gray-300" disabled={!newCoordinationMessage.trim()}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
                                </form>
                             </div>
                         )}
                    </div>

                    {rightPanelTab !== 'coordination' && (
                         <div className="p-4 border-t">
                            <button
                                onClick={handleFabClick}
                                title={getFabTitle()}
                                className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors flex items-center justify-center space-x-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                <span>{getFabTitle()}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className={activeTab === 'calificaciones' ? '' : 'hidden'}>
            <Calificaciones
                students={students}
                subjectGradesData={subjectGradesData}
                setSubjectGradesData={setSubjectGradesData}
                currentUser={currentUser}
                viewMode="teacher"
            />
        </div>

        <div className={activeTab === 'attendance' ? '' : 'hidden'}>
            <AttendanceTaker 
                isOnline={isOnline} 
                students={filteredStudents}
                allAttendanceRecords={attendanceRecords}
                onUpdateRecord={onUpdateAttendance}
                onBulkUpdateRecords={onBulkUpdateAttendance}
            />
        </div>

        <div className={activeTab === 'events' ? '' : 'hidden'}>
            <EventPostersViewer />
        </div>

        <div className={activeTab === 'manual' ? '' : 'hidden'}>
            <ManualViewer />
        </div>
      
      {isModalOpen && <IncidentModal student={selectedStudent} students={students} onClose={handleCloseModal} onSave={handleSaveIncident} reporterName={currentUser.name} />}
      {isAddStudentModalOpen && <AddStudentModal onClose={() => setIsAddStudentModalOpen(false)} onSave={handleSaveNewStudent} />}
      {isCitationModalOpen && <CitationModal students={filteredStudents} onClose={() => setIsCitationModalOpen(false)} onSave={handleSaveCitations} currentUser={currentUser}/>}
      {isGroupMessageModalOpen && <GroupMessageModal onClose={() => setIsGroupMessageModalOpen(false)} onSend={handleSendGroupMessage} />}
      {isCancelModalOpen && citationToCancel && <CancelCitationModal onClose={() => setIsCancelModalOpen(false)} onConfirm={handleConfirmCancelCitation} />}
      {activeChat && <ChatModal chat={activeChat} onClose={() => setActiveChat(null)} onUpdateConversation={handleUpdateConversation} currentUser={currentUser} />}

      {showSnackbar.visible && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-fade-in">
          {showSnackbar.message}
        </div>
      )}
    </div>
  );
};

export default Classroom;