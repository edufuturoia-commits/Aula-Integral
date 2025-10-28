

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import StudentList from '../components/StudentList';
import IncidentModal from '../components/IncidentModal';
import ImportStudentsModal from '../components/ImportStudentsModal';
import CitationModal from '../components/CitationModal';
import GroupMessageModal from '../components/GroupMessageModal';
import CancelCitationModal from '../components/CancelCitationModal';
import AddStudentModal from '../components/AddStudentModal'; // Import new modal
// FIX: Move IncidentType from 'import type' to a value import
import type { Student, Incident, ParentMessage, Citation, CoordinationMessage, Teacher, SubjectGrades, AttendanceRecord, Announcement, AttentionReport } from '../types';
import { CitationStatus, Role, IncidentStatus, IncidentType } from '../types';
import { addOrUpdateStudents } from '../db';
import { GRADES, GROUPS, MOCK_CITATIONS, MOCK_COORDINATOR_USER, GRADE_GROUP_MAP } from '../constants';
import AttendanceTaker from '../components/AttendanceTaker';
import ManualViewer from '../components/ManualViewer';
import EventPostersViewer from '../components/EventPostersViewer';
import Calificaciones from './Calificaciones';
import AttentionReportModal from '../components/AttentionReportModal';


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
  onReportAttention: (report: AttentionReport) => void;
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
        case IncidentType.SCHOOL_COEXISTENCE: return <ConvivenciaIcon className={className} />;
        case IncidentType.UNIFORM_MISUSE: return <UniformeIcon className={className} />;
        case IncidentType.INFRASTRUCTURE_DAMAGE: return <DanosIcon className={className} />;
        case IncidentType.BULLYING_CYBERBULLYING: return <AcosoIcon className={className} />;
        case IncidentType.NON_COMPLIANCE: return <IncumplimientoIcon className={className} />;
        case IncidentType.ACADEMIC_MISCONDUCT: return <FaltasAcademicasIcon className={className} />;
        case IncidentType.OTHER: return <OtroIcon className={className} />;
        default: return <OtroIcon className={className} />;
    }
};


const Classroom: React.FC<ClassroomProps> = ({ isOnline, students, setStudents, teachers, currentUser, subjectGradesData, setSubjectGradesData, attendanceRecords, onUpdateAttendance, onBulkUpdateAttendance, incidents, onUpdateIncidents, announcements, onShowSystemMessage, onReportAttention }) => {
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
  const [isAttentionReportModalOpen, setIsAttentionReportModalOpen] = useState(false);
  const [studentForAttention, setStudentForAttention] = useState<Student | null>(null);

  const availableGrades = useMemo(() => ['all', ...GRADES], []);
  
  const availableGroups = useMemo(() => {
    if (gradeFilter === 'all') {
        return ['all', ...GROUPS];
    }
    return ['all', ...GRADE_GROUP_MAP[gradeFilter] || []];
  }, [gradeFilter]);


  useEffect(() => {
    // If the current grade filter is no longer in the list of available grades (e.g., teacher changed), reset it.
    if (gradeFilter !== 'all' && !availableGrades.includes(gradeFilter)) {
        setGradeFilter('all');
    }
  }, [availableGrades, gradeFilter]);
  
  useEffect(() => {
    if(groupFilter !== 'all' && !availableGroups.includes(groupFilter)) {
        setGroupFilter('all');
    }
  }, [availableGroups, groupFilter]);

  const filteredStudents = useMemo(() => {
    // If no specific filter is set, a homeroom teacher should see their class by default.
    if (gradeFilter === 'all' && groupFilter === 'all') {
        const homeroomGroup = currentUser.isHomeroomTeacher && currentUser.assignedGroup;
        if(homeroomGroup) {
            return students.filter(s => s.grade === homeroomGroup.grade && s.group === homeroomGroup.group);
        }
        // If not a homeroom teacher and no filter, show all students (or could be an empty list based on requirements)
        return students;
    }
    return students.filter(s => {
      const gradeMatch = gradeFilter === 'all' || s.grade === gradeFilter;
      const groupMatch = groupFilter === 'all' || s.group === groupFilter;
      return gradeMatch && groupMatch;
    });
  }, [students, gradeFilter, groupFilter, currentUser]);

  const incidentsByStudentId = useMemo(() => {
    const map = new Map<number, Incident[]>();
    incidents.forEach(incident => {
        if (!map.has(incident.studentId)) {
            map.set(incident.studentId, []);
        }
        map.get(incident.studentId)!.push(incident);
    });
    // Sort incidents for each student by most recent
    map.forEach(studentIncidents => {
        studentIncidents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
    return map;
  }, [incidents]);
  
  const handleSaveIncident = async (incidentData: Incident) => {
    if (editingIncident) {
        await onUpdateIncidents('update', incidentData);
        onShowSystemMessage("Incidencia actualizada exitosamente.");
    } else {
        await onUpdateIncidents('add', incidentData);
        onShowSystemMessage("Incidencia reportada exitosamente.");
    }
    setIsModalOpen(false);
    setSelectedStudent(null);
    setEditingIncident(null);
  };
  
  const handleSaveNewStudent = async (newStudentData: {name: string, grade: string, group: string}) => {
      const newStudent: Student = {
          id: Date.now(),
          name: newStudentData.name,
          avatarUrl: `https://picsum.photos/seed/${Date.now()}/100/100`,
          grade: newStudentData.grade,
          group: newStudentData.group,
          role: Role.STUDENT,
      };
      
      const newStudents = [...students, newStudent];
      await addOrUpdateStudents(newStudents);
      setStudents(newStudents);
      
      setIsAddStudentModalOpen(false);
      onShowSystemMessage(`${newStudent.name} ha sido añadido exitosamente.`, 'success');
  };

  const handleSaveAttentionReport = (report: AttentionReport) => {
      onReportAttention(report);
      setIsAttentionReportModalOpen(false);
      setStudentForAttention(null);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {(['students', 'attendance', 'calificaciones', 'manual'] as const).map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                 >
                     {
                         tab === 'students' ? 'Estudiantes' :
                         tab === 'attendance' ? 'Asistencia' :
                         tab === 'calificaciones' ? 'Calificaciones' :
                         'Manual y Eventos'
                     }
                 </button>
            ))}
        </nav>
      </div>

      {activeTab === 'students' && (
        <StudentList 
            students={filteredStudents} 
            onReportIncident={(student) => { setSelectedStudent(student); setIsModalOpen(true); }}
            onAddStudentClick={() => setIsAddStudentModalOpen(true)}
            grades={availableGrades}
            selectedGrade={gradeFilter}
            onGradeChange={setGradeFilter}
            groups={availableGroups}
            selectedGroup={groupFilter}
            onGroupChange={setGroupFilter}
            onReportAttention={(student) => { setStudentForAttention(student); setIsAttentionReportModalOpen(true); }}
        />
      )}

      {activeTab === 'attendance' && <AttendanceTaker students={filteredStudents} isOnline={isOnline} allAttendanceRecords={attendanceRecords} onUpdateRecord={onUpdateAttendance} onBulkUpdateRecords={onBulkUpdateAttendance} />}
      
      {activeTab === 'calificaciones' && <Calificaciones students={students} teachers={teachers} subjectGradesData={subjectGradesData} setSubjectGradesData={setSubjectGradesData} currentUser={currentUser} viewMode='teacher' onShowSystemMessage={onShowSystemMessage} />}

      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-1"><ManualViewer /></div>
            <div className="lg:col-span-1"><EventPostersViewer /></div>
        </div>
      )}
      
      {isModalOpen && (selectedStudent || editingIncident) && (
        <IncidentModal 
            student={selectedStudent} 
            incident={editingIncident}
            students={students}
            onClose={() => { setIsModalOpen(false); setSelectedStudent(null); setEditingIncident(null); }} 
            onSave={handleSaveIncident}
            reporter={currentUser}
        />
      )}
      {isAddStudentModalOpen && (
          <AddStudentModal
            onClose={() => setIsAddStudentModalOpen(false)}
            onSave={handleSaveNewStudent}
          />
      )}
      {isAttentionReportModalOpen && studentForAttention && (
        <AttentionReportModal 
            student={studentForAttention}
            reporter={currentUser}
            onClose={() => setIsAttentionReportModalOpen(false)}
            onSave={handleSaveAttentionReport}
        />
      )}
    </div>
  );
};

export default Classroom;
