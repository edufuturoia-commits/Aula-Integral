
import React from 'react';
import type { Student } from '../types';

interface StudentCardProps {
    student: Student;
    onSelect?: () => void;
    onEdit?: () => void;
    onReportIncident?: () => void;
    onReportAttention?: () => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onSelect, onEdit, onReportIncident, onReportAttention }) => {
    const hasButtons = onEdit || onReportIncident || onReportAttention;
    const isClickable = !hasButtons && onSelect;

    return (
        <div 
            onClick={isClickable ? onSelect : undefined} 
            className={`bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex items-center space-x-4 ${isClickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
        >
            <img src={student.avatarUrl} alt={student.name} className="w-16 h-16 rounded-full object-cover"/>
            <div className="flex-1">
                <p className="font-bold text-gray-800 dark:text-gray-100">{student.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{student.grade} - Grupo {student.group}</p>
                {student.lastIncident && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Última incidencia: {student.lastIncident}</p>}
            </div>
            {hasButtons ? (
                <div className="flex items-center space-x-2">
                    {onReportAttention && (
                        <button onClick={onReportAttention} className="p-2 rounded-full text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900/50" title="Reportar para Atención Psicológica">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                    {onReportIncident && (
                        <button onClick={onReportIncident} className="p-2 rounded-full text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50" title="Reportar Incidencia">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                    {onEdit && (
                        <button onClick={onEdit} className="p-2 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50" title="Editar Estudiante">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
            ) : null}
        </div>
    );
};

interface StudentListProps {
  students: Student[];
  onReportIncident?: (student: Student) => void;
  onReportAttention?: (student: Student) => void;
  onAddStudentClick?: () => void;
  onImportClick?: () => void;
  onEditStudent?: (student: Student) => void;
  grades: string[];
  selectedGrade: string;
  onGradeChange: (grade: string) => void;
  groups: string[];
  selectedGroup: string;
  onGroupChange: (group: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({
  students,
  onReportIncident,
  onReportAttention,
  onAddStudentClick,
  onImportClick,
  onEditStudent,
  grades,
  selectedGrade,
  onGradeChange,
  groups,
  selectedGroup,
  onGroupChange,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Lista de Estudiantes ({students.length})</h3>
        <div className="flex flex-wrap items-center gap-2">
            <select value={selectedGrade} onChange={e => onGradeChange(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                {grades.map(g => <option key={g} value={g}>{g === 'all' ? 'Todos los Grados' : g}</option>)}
            </select>
            <select value={selectedGroup} onChange={e => onGroupChange(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                {groups.map(g => <option key={g} value={g}>{g === 'all' ? 'Todos los Grupos' : `Grupo ${g}`}</option>)}
            </select>
          {onAddStudentClick && (
            <button onClick={onAddStudentClick} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors">Añadir Estudiante</button>
          )}
          {onImportClick && (
            <button onClick={onImportClick} className="bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200">Importar</button>
          )}
        </div>
      </div>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {students.length > 0 ? (
          students.map(student => (
            <StudentCard 
              key={student.id} 
              student={student} 
              onReportIncident={onReportIncident ? () => onReportIncident(student) : undefined}
              onReportAttention={onReportAttention ? () => onReportAttention(student) : undefined}
              onEdit={onEditStudent ? () => onEditStudent(student) : undefined}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No hay estudiantes en el grado/grupo seleccionado.</p>
        )}
      </div>
    </div>
  );
};

export default StudentList;
