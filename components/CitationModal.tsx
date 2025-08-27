import React, { useState, useMemo } from 'react';
import type { Student, Citation } from '../types';
import { CitationStatus } from '../types';
import { GRADES, GROUPS, MOCK_USER } from '../constants';

interface CitationModalProps {
  students: Student[];
  onClose: () => void;
  onSave: (citations: Citation[]) => void;
}

const CitationModal: React.FC<CitationModalProps> = ({ students, onClose, onSave }) => {
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
  const [selectedGroup, setSelectedGroup] = useState(GROUPS[0]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (citationType === 'individual') {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (MOCK_USER.role === 'Coordinador(a)') {
            const matchesGrade = individualGradeFilter === 'all' || student.grade === individualGradeFilter;
            const matchesGroup = individualGroupFilter === 'all' || student.group === individualGroupFilter;
            return matchesSearch && matchesGrade && matchesGroup;
        }
        return matchesSearch;
      }
      return true; // No filter needed for group mode list
    });
  }, [students, searchTerm, citationType, individualGradeFilter, individualGroupFilter]);


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
    const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.has(s.id));
    if (allFilteredSelected) {
      setSelectedStudentIds(new Set());
    } else {
      const allFilteredIds = new Set(filteredStudents.map(s => s.id));
      setSelectedStudentIds(allFilteredIds);
    }
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
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl mx-4 flex flex-col h-[90vh]">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">Crear Nueva Citación</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="mb-4 flex-shrink-0">
                <div className="flex bg-gray-200 rounded-lg p-1">
                    <button type="button" onClick={() => setCitationType('individual')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${citationType === 'individual' ? 'bg-white shadow' : 'text-gray-600'}`}>Individual / Varios Estudiantes</button>
                    <button type="button" onClick={() => setCitationType('group')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${citationType === 'group' ? 'bg-white shadow' : 'text-gray-600'}`}>Grupo Completo</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {citationType === 'individual' && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">Busca y selecciona uno o más estudiantes para enviarles la misma citación.</p>
                         {MOCK_USER.role === 'Coordinador(a)' && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 bg-gray-100 rounded-md">
                                <select value={individualGradeFilter} onChange={e => {setIndividualGradeFilter(e.target.value); setSelectedStudentIds(new Set())}} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                                    <option value="all">Todos los Grados</option>
                                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <select value={individualGroupFilter} onChange={e => {setIndividualGroupFilter(e.target.value); setSelectedStudentIds(new Set())}} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                                    <option value="all">Todos los Grupos</option>
                                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-500 sm:col-span-3"
                                />
                            </div>
                        )}
                         {MOCK_USER.role !== 'Coordinador(a)' && (
                             <input
                                type="text"
                                placeholder="Buscar por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                            />
                        )}

                        <div className="border rounded-lg max-h-52 overflow-y-auto">
                           <div className="sticky top-0 bg-gray-50 p-2 border-b">
                                <label className="flex items-center cursor-pointer text-sm">
                                    <input type="checkbox" checked={allFilteredInListSelected} onChange={handleSelectAll} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                    <span className="ml-2 font-medium">Seleccionar Todos ({selectedStudentIds.size} seleccionados)</span>
                                </label>
                            </div>
                            <ul className="divide-y divide-gray-200">
                                {filteredStudents.map(student => (
                                    <li key={student.id} onClick={() => handleToggleStudent(student.id)} className={`p-3 flex items-center space-x-3 cursor-pointer ${selectedStudentIds.has(student.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                        <input type="checkbox" readOnly checked={selectedStudentIds.has(student.id)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary pointer-events-none" />
                                        <img src={student.avatarUrl} alt={student.name} className="w-8 h-8 rounded-full" />
                                        <span className="text-sm font-medium">{student.name}</span>
                                        <span className="text-xs text-gray-500 ml-auto">{student.grade} - {student.group}</span>
                                    </li>
                                ))}
                                {filteredStudents.length === 0 && <p className="text-center text-gray-500 p-4">No se encontraron estudiantes.</p>}
                            </ul>
                        </div>
                    </div>
                )}

                {citationType === 'group' && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">Selecciona el grado y grupo para enviar una citación a todos sus estudiantes.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Grado</label>
                                <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                                <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>
                         <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                            La citación se enviará a los <strong>{students.filter(s => s.grade === selectedGrade && s.group === selectedGroup).length}</strong> estudiantes de <strong>{selectedGrade} - Grupo {selectedGroup}</strong>.
                        </div>
                    </div>
                )}
                 <hr className="my-6"/>
                 <div className="space-y-4">
                     <h3 className="text-lg font-semibold text-gray-800">Detalles de la Citación</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900" />
                        </div>
                         <div>
                            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                            <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Lugar</label>
                        <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-500" placeholder="Ej: Coordinación, Sala de Juntas"/>
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                        <textarea id="reason" rows={3} value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-500" placeholder="Ej: Seguimiento académico, Incidencia de convivencia..."></textarea>
                    </div>
                 </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t flex-shrink-0">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">Crear Citación</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CitationModal;