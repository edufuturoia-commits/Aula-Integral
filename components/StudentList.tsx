import React, { useState } from 'react';
import type { Student } from '../types';

interface StudentListProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onImportClick?: () => void;
  onAddStudentClick?: () => void;
  grades: string[];
  selectedGrade: string;
  onGradeChange: (grade: string) => void;
  groups: string[];
  selectedGroup: string;
  onGroupChange: (group: string) => void;
}

const StudentCard: React.FC<{student: Student, onSelect: () => void}> = ({ student, onSelect }) => (
    <div onClick={onSelect} className="bg-white rounded-lg shadow p-4 flex items-center space-x-4 cursor-pointer hover:shadow-lg transition-shadow">
        <img src={student.avatarUrl} alt={student.name} className="w-16 h-16 rounded-full object-cover"/>
        <div className="flex-1">
            <p className="font-bold text-gray-800">{student.name}</p>
            <p className="text-sm text-gray-500">{student.grade} - Grupo {student.group}</p>
            {student.lastIncident && <p className="text-xs text-amber-600 mt-1">Última incidencia: {student.lastIncident}</p>}
        </div>
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
    </div>
);

const StudentList: React.FC<StudentListProps> = ({ students, onSelectStudent, onImportClick, onAddStudentClick, grades, selectedGrade, onGradeChange, groups, selectedGroup, onGroupChange }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                 <h2 className="text-xl font-bold text-gray-800">Mis Estudiantes ({students.length})</h2>
                 <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                    <select
                        value={selectedGrade}
                        onChange={(e) => onGradeChange(e.target.value)}
                        className="w-full sm:w-auto p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
                    >
                        {grades.map(grade => (
                            <option key={grade} value={grade}>{grade === 'all' ? 'Todos los Grados' : grade}</option>
                        ))}
                    </select>
                     <select
                        value={selectedGroup}
                        onChange={(e) => onGroupChange(e.target.value)}
                        className="w-full sm:w-auto p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
                    >
                        {groups.map(group => (
                            <option key={group} value={group}>{group === 'all' ? 'Todos los Grupos' : group}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Buscar estudiante..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-auto p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    />
                    {onImportClick && (
                         <button 
                            onClick={onImportClick}
                            className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors flex items-center space-x-2 flex-shrink-0"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            <span className="hidden sm:inline">Importar</span>
                        </button>
                    )}
                    {onAddStudentClick && (
                        <button 
                            onClick={onAddStudentClick}
                            className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors flex items-center space-x-2 flex-shrink-0"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            <span className="hidden sm:inline">Añadir Estudiante</span>
                        </button>
                    )}
                 </div>
            </div>
           
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                        <StudentCard key={student.id} student={student} onSelect={() => onSelectStudent(student)} />
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-8">No se encontraron estudiantes.</p>
                )}
            </div>
        </div>
    );
};

export default StudentList;