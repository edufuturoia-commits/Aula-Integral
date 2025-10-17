import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import StudentList from '../components/StudentList';
import IncidentModal from '../components/IncidentModal';
import ImportStudentsModal from '../components/ImportStudentsModal';
import CitationModal from '../components/CitationModal';
import GroupMessageModal from '../components/GroupMessageModal';
import CancelCitationModal from '../components/CancelCitationModal';
import AddStudentModal from '../components/AddStudentModal'; // Import new modal
import type { Student, Incident, ParentMessage, Citation, CoordinationMessage, Teacher, SubjectGrades, AttendanceRecord, Announcement, IncidentType } from '../types';
import { CitationStatus, Role, IncidentStatus } from '../types';
import { addOrUpdateStudents } from '../db';
import { GRADES, GROUPS, MOCK_CITATIONS, MOCK_COORDINATOR_USER, GRADE_GROUP_MAP } from '../constants';
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

// --- Icons ---
const MoreVertIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
);

const ConvivenciaIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015.537 4.931l-3.537.442A5.001 5.001 0 011 16v-1a6.97 6.97 0 00-1.5-4.33A5 5 0 016 11z" />
  </svg>
);

const UniformeIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M5.5 3.5A2.5 2.5 0 018 1h4a2.5 2.5 0 012.5 2.5V5h-9V3.5z" />
    <path fillRule="evenodd" d="M3 6a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6zm3.5 1a.5.5 0 01.5.5v1.372l3.36 1.68a.5.5 0 00.28 0l3.36-1.68V7.5a.5.5 0 011 0v1.517a1.5 1.5 0 01-.842 1.35l-4 2a1.5 1.5 0 01-1.316 0l-4-2A1.5 1.5 0 015 9.017V7.5a.5.5 0 01.5-.5z" clipRule="evenodd" />
  </svg>
);

const DanosIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V5.236a1 1 0 00-1.447-.894l-4 2A1 1 0 0011 7.236V17zM4 6a2 2 0 012-2h2.553a1 1 0 01.894.447l1.447 2.894a1 1 0 010 1.109l-1.447 2.894A1 1 0 018.553 14H6a2 2 0 01-2-2V6z" />
  </svg>
);

const AcosoIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.083-4.418A7.001 7.001 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM4.76 11.362A.75.75 0 014 10.5v-1a.75.75 0 011.5 0v1c0 .197-.079.384-.21.524l-1.28 1.281a.75.75 0 01-1.06-1.061l1.28-1.281zM10 8a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 8zm4.76 3.362a.75.75 0 00-1.06-1.061l-1.28 1.281A.75.75 0 0012.21 12.1l1.28-1.28a.75.75 0 001.27 1.06l-1.28 1.281a.75.75 0 001.06 1.061l1.28-1.28z" clipRule="evenodd" />
  </svg>
);

const IncumplimientoIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
  </svg>
);

const FaltasAcademicasIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
    <path d="M15 7h2a1 1 0 011 1v8a1 1 0 01-1 1h-2v-2h1v-6h-1V7z" />
  </svg>
);

const OtroIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);

const IncidentTypeIcon: React.FC<{type: IncidentType, className?: string}> = ({ type, className = "h-5 w-5" }) => {
    switch (type) {
        case 'Convivencia Escolar': return <ConvivenciaIcon className={className} />;
        case 'Uso inapropiado del uniforme': return <UniformeIcon className={className} />;
        case 'Daños a la infraestructura': return <DanosIcon className={className} />;
        case 'Acoso y ciberacoso': return <AcosoIcon className={className} />;
        case 'Incumplimiento': return <IncumplimientoIcon className={className} />;
        case 'Faltas Académicas': return <FaltasAcademicasIcon className={className} />;
        case 'Otro': return <OtroIcon className={className} />;
        default: return <OtroIcon className={className} />;
    }
};


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
  const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'calificaciones' | 'manual'>('students');
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);


  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
            setActionMenuOpen(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      .filter(inc => inc.teacherName === currentUser.name && inc.status === IncidentStatus.ACTIVE)
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), 
  [incidents, currentUser.name]);

  const openModalForStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (incident: Incident) => {
    setEditingIncident(incident);
    setIsModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleDeclineIncident = async (incident: Incident) => {
    setActionMenuOpen(null);
    if (window.confirm("¿Estás seguro de que quieres declinar esta incidencia? No aparecerá más en tu lista de activas y se notificará a coordinación.")) {
        try {
            const updatedIncident = { ...incident, status: IncidentStatus.DECLINED };
            await onUpdateIncidents('update', updatedIncident);
            onShowSystemMessage("Incidencia declinada exitosamente.");
        } catch (error) {
            console.error("Failed to decline incident:", error);
            onShowSystemMessage("Error al declinar la incidencia.", 'error');
        }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
    setEditingIncident(null);
  };
  
  const handleSaveIncident = async (incidentData: Incident) => {
    try {
        if (editingIncident) {
            await onUpdateIncidents('update', incidentData);
            onShowSystemMessage("Incidencia actualizada correctamente.");
        } else {
            await onUpdateIncidents('add', { ...incidentData, status: IncidentStatus.ACTIVE });
            onShowSystemMessage("Incidencia guardada. Coordinación ha sido notificada.");
        }
        handleCloseModal();
    } catch (error) {
        console.error("Failed to save incident:", error);
        onShowSystemMessage("Error: No se pudo guardar la incidencia. Revisa tu conexión.", 'error');
    }
  };
  
  const handleSaveCitations = (newCitations: Citation[]) => {
    // This state is local to Incidents page, but we keep the handler signature for consistency
    setIsCitationModalOpen(false);
    onShowSystemMessage(`${newCitations.length} citacion(es) enviada(s) exitosamente (simulación).`);
  };

  const handleOpenCancelModal = (citation: Citation) => {
    setCitationToCancel(citation);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelCitation = (reason: string) => {
    // This state is local to Incidents page, but we keep the handler signature for consistency
    if (!citationToCancel) return;
    setIsCancelModalOpen(false);
    setCitationToCancel(null);
    onShowSystemMessage("Citación cancelada exitosamente (simulación).");
  };
  
  const handleSendGroupMessage = (message: string) => {
    setIsGroupMessageModalOpen(false);
    onShowSystemMessage("Mensaje grupal enviado a todos los acudientes.");
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
    setStudents(updatedStudents.sort((a,b) => a.name.localeCompare(b.name)));
    setIsAddStudentModalOpen(false);
    onShowSystemMessage(`${newStudent.name} ha sido añadido exitosamente.`, 'success');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4 flex-shrink-0">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {(['students', 'attendance', 'calificaciones', 'manual'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`capitalize whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {tab === 'students' ? 'Mis Estudiantes' : tab}
              </button>
            ))}
          </nav>
        </div>

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
              onShowSystemMessage={onShowSystemMessage}
            />
          )}
          {activeTab === 'manual' && <ManualViewer />}
        </div>
      </div>

      {/* Right side panel for incident management, only shown on students tab */}
      {activeTab === 'students' && (
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md h-full flex flex-col">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-3 flex justify-between items-center">
                  <span>Gestión de Incidencias</span>
                  <span className="text-base font-medium bg-primary/10 text-primary dark:bg-secondary/20 dark:text-secondary px-2 py-1 rounded-md">{myReportedIncidents.length}</span>
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {myReportedIncidents.length > 0 ? (
                      myReportedIncidents.map(inc => {
                        const student = studentMap.get(inc.studentId);
                        return (
                          <div key={inc.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
                              {/* Card Header */}
                              <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                      <img 
                                        src={student?.avatarUrl || `https://picsum.photos/seed/${inc.studentId}/100/100`} 
                                        alt={inc.studentName} 
                                        className="w-10 h-10 rounded-full object-cover" 
                                      />
                                      <div>
                                          <p className="font-bold text-gray-800 dark:text-gray-100">{inc.studentName}</p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(inc.timestamp).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                                          </p>
                                      </div>
                                  </div>
                                  <div className="relative" ref={actionMenuRef}>
                                      <button 
                                        onClick={() => setActionMenuOpen(actionMenuOpen === inc.id ? null : inc.id)}
                                        className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        aria-haspopup="true"
                                        aria-expanded={actionMenuOpen === inc.id}
                                      >
                                          <MoreVertIcon />
                                      </button>
                                      {actionMenuOpen === inc.id && (
                                          <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-900 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                                              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                                  <a href="#" onClick={(e) => { e.preventDefault(); handleOpenEditModal(inc); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" role="menuitem">Editar</a>
                                                  <a href="#" onClick={(e) => { e.preventDefault(); handleDeclineIncident(inc); }} className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800" role="menuitem">Declinar</a>
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              </div>

                              {/* Card Body */}
                              <div>
                                  <div className="flex items-center gap-2 mb-2">
                                      <IncidentTypeIcon type={inc.type as IncidentType} className="h-5 w-5 text-primary dark:text-secondary" />
                                      <span className="text-sm font-semibold text-primary dark:text-secondary">{inc.type}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">{inc.notes}</p>
                              </div>
                          </div>
                        )
                      })
                  ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8 flex flex-col items-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         <p className="mt-2 font-medium">Todo en orden</p>
                         <p className="text-xs mt-1">No has reportado incidencias activas. Usa el botón de alerta en la lista de estudiantes para registrar una.</p>
                      </div>
                  )}
              </div>
          </div>
        </div>
      )}
      
      {isModalOpen && (
          <IncidentModal
            student={selectedStudent}
            incident={editingIncident}
            students={students}
            onClose={handleCloseModal}
            onSave={handleSaveIncident}
            reporter={currentUser}
          />
      )}
      {isAddStudentModalOpen && <AddStudentModal onClose={() => setIsAddStudentModalOpen(false)} onSave={handleSaveNewStudent} />}
      {isCitationModalOpen && <CitationModal students={filteredStudents} onClose={() => setIsCitationModalOpen(false)} onSave={handleSaveCitations} currentUser={currentUser} />}
      {isGroupMessageModalOpen && <GroupMessageModal onClose={() => setIsGroupMessageModalOpen(false)} onSend={handleSendGroupMessage} />}
      {isCancelModalOpen && citationToCancel && <CancelCitationModal onClose={() => setIsCancelModalOpen(false)} onConfirm={handleConfirmCancelCitation} />}
    </div>
  );
};

export default Classroom;