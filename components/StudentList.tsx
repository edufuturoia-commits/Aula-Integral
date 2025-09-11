import React, { useState } from 'react';
import type { Student } from '../types';

interface StudentCardProps {
    student: Student;
    onSelect?: () => void;
    onEdit?: () => void;
    onReportIncident?: () => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onSelect, onEdit, onReportIncident }) => {
    const hasButtons = onEdit || onReportIncident;
    const isClickable = !hasButtons && onSelect;

    return (
        <div 
            onClick={isClickable ? onSelect : undefined} 
            className={`bg-white rounded-lg shadow p-4 flex items-center space-x-4 ${isClickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
        >
            <img src={student.avatarUrl} alt={student.name} className="w-16 h-16 rounded-full object-cover"/>
            <div className="flex-1">
                <p className="font-bold text-gray-800">{student.name}</p>
                <p className="text-sm text-gray-500">{student.grade} - Grupo {student.group}</p>
                {student.lastIncident && <p className="text-xs text-amber-600 mt-1">Última incidencia: {student.lastIncident}</p>}
            </div>
            {hasButtons ? (
                <div className="flex items-center space-x-2">
                    {onReportIncident && (
                        <button onClick={onReportIncident} className="p-2 rounded-full text-amber-600 hover:bg-amber-100" title="Reportar Incidencia">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                    {onEdit && (
                        <button onClick={onEdit} className="p-2 rounded-full text-blue-600 hover:bg-blue-100" title="Editar Estudiante">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
            ) : (
                isClickable && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
            )}
        </div>
    );
};


interface StudentListProps {
  students: Student[];
  onSelectStudent?: (student: Student) => void;
  onImportClick?: () => void;
  onAddStudentClick?: () => void;
  onEditStudent?: (student: Student) => void;
  onReportIncident?: (student: Student) => void;
  grades: string[];
  selectedGrade: string;
  onGradeChange: (grade: string) => void;
  groups: string[];
  selectedGroup: string;
  onGroupChange: (group: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onSelectStudent, onImportClick, onAddStudentClick, onEditStudent, onReportIncident, grades, selectedGrade, onGradeChange, groups, selectedGroup, onGroupChange }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                 <h2 className="text-xl font-bold text-gray-800">Estudiantes ({students.length})</h2>
                 <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                    <select
                        value={selectedGrade}
                        onChange={(e) => onGradeChange(e.target.value)}
                        className="w-full sm:w-auto p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 text-gray-900"
                    >
                        {grades.map(grade => (
                            <option key={grade} value={grade}>{grade === 'all' ? 'Todos los Grados' : grade}</option>
                        ))}
                    </select>
                     <select
                        value={selectedGroup}
                        onChange={(e) => onGroupChange(e.target.value)}
                        className="w-full sm:w-auto p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 text-gray-900"
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
                        className="w-full sm:w-auto p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500"
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
                        <StudentCard 
                            key={student.id} 
                            student={student} 
                            onSelect={onSelectStudent ? () => onSelectStudent(student) : undefined} 
                            onEdit={onEditStudent ? () => onEditStudent(student) : undefined}
                            onReportIncident={onReportIncident ? () => onReportIncident(student) : undefined}
                        />
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-8">No se encontraron estudiantes.</p>
                )}
            </div>
        </div>
    );
};

export default StudentList;