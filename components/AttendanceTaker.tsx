import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Student, AttendanceRecord } from '../types';
import { AttendanceStatus } from '../types';

// Icons
const CheckCircleIcon = ({ className = '' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const XCircleIcon = ({ className = '' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
const ClockIcon = ({ className = '' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
const DocumentTextIcon = ({ className = '' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
const ShieldCheckIcon = ({ className = '' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 002.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0010 1.944zM14.707 9.293a1 1 0 00-1.414-1.414L9 12.172l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clipRule="evenodd" /></svg>;

interface AttendanceTakerProps {
  students: Student[];
  isOnline: boolean;
  allAttendanceRecords: AttendanceRecord[];
  onUpdateRecord: (record: AttendanceRecord) => Promise<void>;
  onBulkUpdateRecords: (records: AttendanceRecord[]) => Promise<void>;
}

const getStatusClass = (status: AttendanceStatus) => {
    switch(status) {
        case AttendanceStatus.PRESENT: return { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-200', border: 'border-green-500 dark:border-green-600', icon: 'text-green-600 dark:text-green-400' };
        case AttendanceStatus.ABSENT: return { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-200', border: 'border-red-500 dark:border-red-600', icon: 'text-red-600 dark:text-red-400' };
        case AttendanceStatus.TARDY: return { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-500 dark:border-yellow-600', icon: 'text-yellow-600 dark:text-yellow-400' };
        case AttendanceStatus.EXCUSED: return { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-500 dark:border-blue-600', icon: 'text-blue-600 dark:text-blue-400' };
        case AttendanceStatus.SPECIAL_PERMIT: return { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-500 dark:border-purple-600', icon: 'text-purple-600 dark:text-purple-400' };
        default: return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', border: 'border-gray-500 dark:border-gray-600', icon: 'text-gray-600 dark:text-gray-400' };
    }
}

const AttendanceTaker: React.FC<AttendanceTakerProps> = ({ students, isOnline, allAttendanceRecords, onUpdateRecord, onBulkUpdateRecords }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    const attendance = useMemo(() => {
        const recordsForDate = allAttendanceRecords.filter(rec => rec.date === selectedDate);
        const attendanceMap = new Map<number, AttendanceStatus>();
        recordsForDate.forEach(rec => {
            attendanceMap.set(rec.studentId, rec.status);
        });
        return attendanceMap;
    }, [allAttendanceRecords, selectedDate]);

    const handleStatusChange = async (studentId: number, status: AttendanceStatus) => {
        const newRecord: AttendanceRecord = {
            id: `${studentId}-${selectedDate}`,
            studentId,
            date: selectedDate,
            status,
            synced: isOnline,
        };
        await onUpdateRecord(newRecord);
    };

    const markAllAs = async (status: AttendanceStatus) => {
        const recordsToUpdate: AttendanceRecord[] = students.map(student => ({
            id: `${student.id}-${selectedDate}`,
            studentId: student.id,
            date: selectedDate,
            status,
            synced: isOnline,
        }));
        await onBulkUpdateRecords(recordsToUpdate);
    };

    const summary = useMemo(() => {
        const counts = {
            [AttendanceStatus.PRESENT]: 0,
            [AttendanceStatus.ABSENT]: 0,
            [AttendanceStatus.TARDY]: 0,
            [AttendanceStatus.EXCUSED]: 0,
            [AttendanceStatus.SPECIAL_PERMIT]: 0,
        };
        
        students.forEach(student => {
            const status = attendance.get(student.id) || AttendanceStatus.PRESENT;
            counts[status]++;
        });

        return counts;
    }, [attendance, students]);


    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Control de Asistencia</h2>
                <div className="flex items-center gap-4 flex-wrap justify-center">
                     <button onClick={() => markAllAs(AttendanceStatus.PRESENT)} className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors">
                        Marcar todos como Presentes
                    </button>
                    <input 
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                </div>
            </div>

            <div className="flex justify-center gap-4 md:gap-6 mb-6 text-center flex-wrap">
                <div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary[AttendanceStatus.PRESENT]}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Presentes</p>
                </div>
                 <div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary[AttendanceStatus.ABSENT]}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ausentes</p>
                </div>
                 <div>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary[AttendanceStatus.TARDY]}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tardes</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary[AttendanceStatus.EXCUSED]}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Excusas</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary[AttendanceStatus.SPECIAL_PERMIT]}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Permisos</p>
                </div>
            </div>

            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2">
                {students.map(student => {
                    const currentStatus = attendance.get(student.id) || AttendanceStatus.PRESENT;
                    const statusClasses = getStatusClass(currentStatus);

                    return (
                        <div key={student.id} className={`p-3 rounded-lg flex items-center justify-between border-l-4 ${statusClasses.border} ${statusClasses.bg}`}>
                            <div className="flex items-center gap-4">
                                <img src={student.avatarUrl} alt={student.name} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-gray-100">{student.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{student.grade} - Grupo {student.group}</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {[AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.TARDY, AttendanceStatus.EXCUSED, AttendanceStatus.SPECIAL_PERMIT].map(status => {
                                    const isActive = currentStatus === status;
                                    const classes = getStatusClass(status);
                                    return (
                                        <button key={status} onClick={() => handleStatusChange(student.id, status)} className={`p-2 rounded-full transition-colors ${isActive ? `${classes.bg} ${classes.text} ring-2 ring-offset-2 dark:ring-offset-gray-800 ${classes.border}` : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`} title={status}>
                                            {status === AttendanceStatus.PRESENT && <CheckCircleIcon className={isActive ? classes.icon : ''} />}
                                            {status === AttendanceStatus.ABSENT && <XCircleIcon className={isActive ? classes.icon : ''} />}
                                            {status === AttendanceStatus.TARDY && <ClockIcon className={isActive ? classes.icon : ''} />}
                                            {status === AttendanceStatus.EXCUSED && <DocumentTextIcon className={isActive ? classes.icon : ''} />}
                                            {status === AttendanceStatus.SPECIAL_PERMIT && <ShieldCheckIcon className={isActive ? classes.icon : ''} />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
                 {students.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No hay estudiantes en el grado/grupo seleccionado.</p>
                )}
            </div>
        </div>
    );
};

export default AttendanceTaker;