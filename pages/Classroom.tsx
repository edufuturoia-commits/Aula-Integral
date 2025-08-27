import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import StudentList from '../components/StudentList';
import IncidentModal from '../components/IncidentModal';
import ImportStudentsModal from '../components/ImportStudentsModal';
import type { Student, Incident } from '../types';
import { addIncident, getIncidents, getUnsyncedIncidents, updateIncident, deleteIncident } from '../db';
import { MOCK_STUDENTS, GRADES, GROUPS } from '../constants';


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


const Classroom: React.FC<ClassroomProps> = ({ isOnline }) => {
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showSnackbar, setShowSnackbar] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [isSyncing, setIsSyncing] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
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

  return (
    <div className="relative">
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
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Incidencias Recientes</h2>
                {pendingSyncCount > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                        {isSyncing ? <SyncingIcon className="h-4 w-4" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        <span>{pendingSyncCount} por sincronizar</span>
                    </div>
                )}
            </div>
            <ul className="space-y-3 h-full max-h-[60vh] overflow-y-auto">
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
                                    <div 
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200"
                                        onMouseLeave={() => setOpenMenuId(null)}
                                    >
                                        <ul className="py-1">
                                            <li>
                                                <button 
                                                    onClick={() => handleArchiveIncident(incident.id)}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 001.414 0l2.414-2.414a1 1 0 01.707-.293H20" /></svg>
                                                    Archivar
                                                </button>
                                            </li>
                                            <li>
                                                <button 
                                                    onClick={() => handleDeleteIncident(incident.id)}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    Eliminar
                                                </button>
                                            </li>
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
                {activeIncidents.length === 0 && <p className="text-gray-500 text-center py-8">No hay incidencias activas registradas.</p>}
            </ul>
        </div>
      </div>

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

      <button 
        onClick={() => alert("Seleccione un estudiante de la lista para registrar una incidencia.")}
        className="absolute bottom-8 right-8 bg-accent text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-red-700 transition-transform transform hover:scale-110"
        title="Registrar Incidencia"
      >
        +
      </button>

      {showSnackbar.visible && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg z-50">
          {showSnackbar.message}
        </div>
      )}
    </div>
  );
};

export default Classroom;