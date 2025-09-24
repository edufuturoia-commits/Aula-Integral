import React, { useState, useMemo } from 'react';
import type { Student, Citation, Teacher } from '../types';
import { CitationStatus, Role } from '../types';
import { GRADES, GROUPS, GRADE_GROUP_MAP } from '../constants';

interface CitationModalProps {
  students: Student[];
  onClose: () => void;
  onSave: (citations: Citation[]) => void;
  currentUser: Teacher;
}

const CitationModal: React.FC<CitationModalProps> = ({ students, onClose, onSave, currentUser }) => {
  const [citationType, setCitationType] = useState<'individual' | 'group'>('individual');
  
  // Common fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('08:00');
  const [location, setLocation] = useState('Coordinación');
  const [reason, setReason] = useState('');

  // Individual state
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [individualGradeFilter, setIndividualGradeFilter] = useState('all');
  const [individualGroupFilter, setIndividualGroupFilter] = useState('all');

  // Group state
  const [selectedGrade, setSelectedGrade] = useState(GRADES[0]);
  const [selectedGroup, setSelectedGroup] = useState(GRADE_GROUP_MAP[GRADES[0]][0]);

  const handleIndividualGradeChange = (grade: string) => {
    setIndividualGradeFilter(grade);
    setIndividualGroupFilter('all');
  };

  const availableGroupsForIndividual = useMemo(() => {
    if (individualGradeFilter === 'all' || !GRADE_GROUP_MAP[individualGradeFilter]) {
        return ['all', ...GROUPS];
    }
    return ['all', ...GRADE_GROUP_MAP[individualGradeFilter]];
  }, [individualGradeFilter]);

  const handleGroupCitationGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    setSelectedGroup(GRADE_GROUP_MAP[grade]?.[0] || '');
  };

  const availableGroupsForGroupCitation = useMemo(() => {
    return GRADE_GROUP_MAP[selectedGrade] || [];
  }, [selectedGrade]);


  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (citationType === 'individual') {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (currentUser.role === Role.COORDINATOR || currentUser.role === Role.RECTOR) {
            const matchesGrade = individualGradeFilter === 'all' || student.grade === individualGradeFilter;
            const matchesGroup = individualGroupFilter === 'all' || student.group === individualGroupFilter;
            return matchesSearch && matchesGrade && matchesGroup;
        }
        return matchesSearch;
      }
      return true; // No filter needed for group mode list
    });
  }, [students, searchTerm, citationType, individualGradeFilter, individualGroupFilter, currentUser]);


  const handleToggleStudent = (studentId: number) => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allFilteredInListAreSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.has(s.id));

    setSelectedStudentIds(prevSelectedIds => {
        const newSelectedIds = new Set(prevSelectedIds);
        if (allFilteredInListAreSelected) {
            // If all visible students are already selected, deselect them
            filteredStudents.forEach(student => newSelectedIds.delete(student.id));
        } else {
            // Otherwise, select all visible students (add them to the set)
            filteredStudents.forEach(student => newSelectedIds.add(student.id));
        }
        return newSelectedIds;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim() || !location.trim()) {
      alert("Por favor complete todos los campos requeridos.");
      return;
    }

    let targetStudents: Student[] = [];

    if (citationType === 'individual') {
      if (selectedStudentIds.size === 0) {
        alert("Por favor, seleccione al menos un estudiante.");
        return;
      }
      targetStudents = students.filter(s => selectedStudentIds.has(s.id));
    } else { // citationType === 'group'
      targetStudents = students.filter(s => s.grade === selectedGrade && s.group === selectedGroup);
      if (targetStudents.length === 0) {
          alert(`No se encontraron estudiantes en ${selectedGrade} - Grupo ${selectedGroup}.`);
          return;
      }
    }

    const newCitations: Citation[] = targetStudents.map(student => ({
      id: `cit_${Date.now()}_${student.id}`,
      studentId: student.id,
      studentName: student.name,
      studentAvatar: student.avatarUrl,
      date,
      time,
      location,
      reason,
      status: CitationStatus.PENDING,
    }));
    
    onSave(newCitations);
  };
  
  const allFilteredInListSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.has(s.id));


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl mx-4 flex flex-col h-[90vh]">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Crear Nueva Citación</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 text-3xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="mb-4 flex-shrink-0">
                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                    <button type="button" onClick={() => setCitationType('individual')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${citationType === 'individual' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Individual / Varios Estudiantes</button>
                    <button type="button" onClick={() => setCitationType('group')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${citationType === 'group' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Grupo Completo</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {citationType === 'individual' && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Busca y selecciona uno o más estudiantes para enviarles la misma citación. La selección se mantendrá aunque cambies de grupo.</p>
                         {(currentUser.role === Role.COORDINATOR || currentUser.role === Role.RECTOR) && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                                <select value={individualGradeFilter} onChange={e => handleIndividualGradeChange(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200">
                                    <option value="all">Todos los Grados</option>
                                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <select value={individualGroupFilter} onChange={e => setIndividualGroupFilter(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200">
                                    {availableGroupsForIndividual.map(g => <option key={g} value={g}>{g === 'all' ? 'Todos los Grupos' : g}</option>)}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 sm:col-span-3"
                                />
                            </div>
                        )}
                         {currentUser.role === Role.TEACHER && (
                             <input
                                type="text"
                                placeholder="Buscar por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                            />
                        )}

                        <div className="border dark:border-gray-600 rounded-lg max-h-52 overflow-y-auto">
                           <div className="sticky top-0 bg-gray-50 dark:bg-gray-700 p-2 border-b dark:border-gray-600">
                                <label className="flex items-center cursor-pointer text-sm text-gray-700 dark:text-gray-200">
                                    <input type="checkbox" checked={allFilteredInListSelected} onChange={handleSelectAll} className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 text-primary focus:ring-primary" />
                                    <span className="ml-2 font-medium ">Seleccionar Todos ({selectedStudentIds.size} seleccionados)</span>
                                </label>
                            </div>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                                {filteredStudents.map(student => (
                                    <li key={student.id} onClick={() => handleToggleStudent(student.id)} className={`p-3 flex items-center space-x-3 cursor-pointer ${selectedStudentIds.has(student.id) ? 'bg-blue-50 dark:bg-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                        <input type="checkbox" readOnly checked={selectedStudentIds.has(student.id)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 text-primary focus:ring-primary pointer-events-none" />
                                        <img src={student.avatarUrl} alt={student.name} className="w-8 h-8 rounded-full" />
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{student.name}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{student.grade} - {student.group}</span>
                                    </li>
                                ))}
                                {filteredStudents.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 p-4">No se encontraron estudiantes.</p>}
                            </ul>
                        </div>
                        {selectedStudentIds.size > 0 && (
                            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg">
                                <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
                                    {selectedStudentIds.size} Estudiante(s) Seleccionado(s):
                                </h4>
                                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                    {students
                                        .filter(s => selectedStudentIds.has(s.id))
                                        .map(s => (
                                            <span key={s.id} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                                                {s.name} ({s.grade}-{s.group})
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStudent(s.id)}
                                                    className="ml-1.5 -mr-0.5 p-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    aria-label={`Quitar a ${s.name}`}
                                                >
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                  </svg>
                                                </button>
                                            </span>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {citationType === 'group' && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Selecciona el grado y grupo para enviar una citación a todos sus estudiantes.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grado</label>
                                <select value={selectedGrade} onChange={e => handleGroupCitationGradeChange(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grupo</label>
                                <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                    {availableGroupsForGroupCitation.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>
                         <div className="p-3 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-md text-sm text-blue-700 dark:text-blue-200">
                            La citación se enviará a los <strong>{students.filter(s => s.grade === selectedGrade && s.group === selectedGroup).length}</strong> estudiantes de <strong>{selectedGrade} - Grupo {selectedGroup}</strong>.
                        </div>
                    </div>
                )}
                 <hr className="my-6 dark:border-gray-600"/>
                 <div className="space-y-4">
                     <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Detalles de la Citación</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                        </div>
                         <div>
                            <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora</label>
                            <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lugar</label>
                        <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400" placeholder="Ej: Coordinación, Sala de Juntas"/>
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo</label>
                        <textarea id="reason" rows={3} value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400" placeholder="Ej: Seguimiento académico, Incidencia de convivencia..."></textarea>
                    </div>
                 </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t dark:border-gray-600 flex-shrink-0">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">Crear Citación</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CitationModal;