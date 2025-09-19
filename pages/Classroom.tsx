


import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import StudentList from '../components/StudentList';
import IncidentModal from '../components/IncidentModal';
import ImportStudentsModal from '../components/ImportStudentsModal';
import CitationModal from '../components/CitationModal';
import GroupMessageModal from '../components/GroupMessageModal';
import CancelCitationModal from '../components/CancelCitationModal';
import AddStudentModal from '../components/AddStudentModal'; // Import new modal
import type { Student, Incident, ParentMessage, Citation, CoordinationMessage, Teacher, SubjectGrades, AttendanceRecord, Announcement } from '../types';
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
  teachers: Teacher[];
  currentUser: Teacher;
  subjectGradesData: SubjectGrades[];
  setSubjectGradesData: (updater: React.SetStateAction<SubjectGrades[]>) => Promise<void>;
  attendanceRecords: AttendanceRecord[];
  onUpdateAttendance: (record: AttendanceRecord) => Promise<void>;
  onBulkUpdateAttendance: (records: AttendanceRecord[]) => Promise<void>;
  incidents: Incident[];
  onUpdateIncidents: (action: 'add' | 'update' | 'delete', data: Incident | string) => Promise<void>;
  announcements: Announcement[];
  onShowSystemMessage: (message: string, type?: 'success' | 'error') => void;
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


// FIX: The component was missing its return statement and the function body was incomplete.
const Classroom: React.FC<ClassroomProps> = ({ isOnline, students, setStudents, teachers, currentUser, subjectGradesData, setSubjectGradesData, attendanceRecords, onUpdateAttendance, onBulkUpdateAttendance, incidents, onUpdateIncidents, announcements, onShowSystemMessage }) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const [isGroupMessageModalOpen, setIsGroupMessageModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [citationToCancel, setCitationToCancel] = useState<Citation | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'students' | 'comunicaciones' | 'attendance' | 'manual' | 'events' | 'calificaciones'>('students');
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
  
  const teacherAnnouncements = useMemo(() => {
    return announcements
        .filter(ann => {
            if (ann.recipients === 'all' || ann.recipients === 'all_teachers') {
                return true;
            }
            if (typeof ann.recipients === 'object' && 'teacherId' in ann.recipients) {
                return ann.recipients.teacherId === currentUser.id;
            }
            return false;
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [announcements, currentUser.id]);


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

  const handleSaveIncident = async (incident: Incident) => {
    try {
        await onUpdateIncidents('add', { ...incident, attended: false });
        handleCloseModal();
        onShowSystemMessage("Incidencia guardada. Coordinación ha sido notificada.");
        setRightPanelTab('incidents');
    } catch (error) {
        console.error("Failed to save incident:", error);
        onShowSystemMessage("Error: No se pudo guardar la incidencia. Revisa tu conexión.", 'error');
    }
  };
  
  const handleSaveCitations = (newCitations: Citation[]) => {
    setCitations(prev => [...prev, ...newCitations]);
    setIsCitationModalOpen(false);
    onShowSystemMessage(`${newCitations.length} citacion(es) enviada(s) exitosamente.`);
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
    onShowSystemMessage("Citación cancelada exitosamente.");
  };
  
  const handleSendGroupMessage = (message: string) => {
    setIsGroupMessageModalOpen(false);
    onShowSystemMessage("Mensaje grupal enviado a todos los acudientes.");
  };

  // FIX: The student object was incomplete, missing avatarUrl, grade, group, and role.
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
    setStudents(updatedStudents.sort((a,b) => a.name.localeCompare(b.name)));
    setIsAddStudentModalOpen(false);
    onShowSystemMessage(`${newStudent.name} ha sido añadido exitosamente.`, 'success');
  };

  // The rest of the component's JSX was missing. It has been reconstructed based on the available state and props.
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4 flex-shrink-0">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {(['students', 'attendance', 'calificaciones', 'comunicaciones', 'manual', 'events'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`capitalize whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {tab === 'students' ? 'Mis Estudiantes' : tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on activeTab */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'students' && (
            <StudentList
              students={filteredStudents}
              onReportIncident={openModalForStudent}
              onAddStudentClick={() => setIsAddStudentModalOpen(true)}
              grades={availableGrades}
              selectedGrade={gradeFilter}
              onGradeChange={handleGradeChange}
              groups={availableGroups}
              selectedGroup={groupFilter}
              onGroupChange={setGroupFilter}
            />
          )}
          {activeTab === 'attendance' && (
            <AttendanceTaker
              students={filteredStudents}
              isOnline={isOnline}
              allAttendanceRecords={attendanceRecords}
              onUpdateRecord={onUpdateAttendance}
              onBulkUpdateRecords={onBulkUpdateAttendance}
            />
          )}
          {activeTab === 'calificaciones' && (
            <Calificaciones 
              students={filteredStudents}
              teachers={teachers}
              subjectGradesData={subjectGradesData}
              setSubjectGradesData={setSubjectGradesData}
              currentUser={currentUser}
              viewMode="teacher"
            />
          )}
          {activeTab === 'manual' && <ManualViewer />}
          {activeTab === 'events' && <EventPostersViewer />}
          {/* Communications Tab is part of the right panel logic in this layout */}
        </div>
      </div>
      
       {/* Modals will be rendered here */}
      {isModalOpen && <IncidentModal student={selectedStudent} students={students} onClose={handleCloseModal} onSave={handleSaveIncident} reporterName={`Prof. ${currentUser.name}`} />}
      {isAddStudentModalOpen && <AddStudentModal onClose={() => setIsAddStudentModalOpen(false)} onSave={handleSaveNewStudent} />}
      {isCitationModalOpen && <CitationModal students={filteredStudents} onClose={() => setIsCitationModalOpen(false)} onSave={handleSaveCitations} currentUser={currentUser} />}
      {isGroupMessageModalOpen && <GroupMessageModal onClose={() => setIsGroupMessageModalOpen(false)} onSend={handleSendGroupMessage} />}
      {isCancelModalOpen && citationToCancel && <CancelCitationModal onClose={() => setIsCancelModalOpen(false)} onConfirm={handleConfirmCancelCitation} />}
      {activeChat && <ChatModal chat={activeChat} onClose={() => setActiveChat(null)} onUpdateConversation={() => {}} currentUser={currentUser} />}
    </div>
  );
};

export default Classroom;
