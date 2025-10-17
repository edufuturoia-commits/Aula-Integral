import type { Incident, Resource, AttendanceRecord, Announcement, Student, Teacher, Assessment, StudentAssessmentResult, SubjectGrades, Guardian } from './types';
import { MOCK_STUDENTS, MOCK_TEACHERS, MOCK_RESOURCES, MOCK_STUDENT_ASSESSMENT_RESULTS, MOCK_SUBJECT_GRADES, MOCK_ANNOUNCEMENTS, MOCK_GUARDIANS } from './constants';

// --- In-memory store to simulate database ---
let students: Student[] = MOCK_STUDENTS;
let teachers: Teacher[] = MOCK_TEACHERS;
let incidents: Incident[] = []; // No mock data, start with empty
let resources: Resource[] = [...MOCK_RESOURCES];
let attendanceRecords: AttendanceRecord[] = []; // No mock data
let announcements: Announcement[] = MOCK_ANNOUNCEMENTS;
let assessments: Assessment[] = []; // No mock data
let studentResults: StudentAssessmentResult[] = MOCK_STUDENT_ASSESSMENT_RESULTS;
let subjectGrades: SubjectGrades[] = MOCK_SUBJECT_GRADES;
let guardians: Guardian[] = MOCK_GUARDIANS;

const simulateApiCall = <T>(data: T): Promise<T> => 
    new Promise(resolve => setTimeout(() => {
        // This check prevents a JSON.parse(undefined) error for functions that have a void return.
        if (data === undefined) {
            return resolve(data);
        }
        resolve(JSON.parse(JSON.stringify(data)));
    }, 150));

export const initDB = (): Promise<boolean> => Promise.resolve(true);

// --- Guardian Functions ---
export const getGuardians = (): Promise<Guardian[]> => simulateApiCall(guardians);
export const addOrUpdateGuardians = (newGuardians: Guardian[]): Promise<void> => {
    const guardianMap = new Map(guardians.map(g => [g.id, g]));
    newGuardians.forEach(g => guardianMap.set(g.id, g));
    guardians = Array.from(guardianMap.values()).sort((a,b) => a.name.localeCompare(b.name));
    return simulateApiCall(undefined);
};
// FIX: Add missing getGuardianById function to support guardian login.
export const getGuardianById = (id: string): Promise<Guardian | undefined> =>
    simulateApiCall(guardians.find(g => g.id === id));

// FIX: Add missing updateGuardian function to support updating guardian profiles.
export const updateGuardian = (guardian: Guardian): Promise<void> => {
    const index = guardians.findIndex(g => g.id === guardian.id);
    if (index > -1) guardians[index] = guardian;
    return simulateApiCall(undefined);
};

// --- Incident Functions ---
export const addIncident = (incident: Incident): Promise<Incident> => {
    incidents.unshift(incident);
    return simulateApiCall(incident);
};
export const updateIncident = (incident: Incident): Promise<Incident> => {
    const index = incidents.findIndex(i => i.id === incident.id);
    if (index > -1) incidents[index] = incident;
    return simulateApiCall(incident);
};
export const deleteIncident = (id: string): Promise<void> => {
    incidents = incidents.filter(i => i.id !== id);
    return simulateApiCall(undefined);
};
export const getIncidents = (): Promise<Incident[]> => simulateApiCall(incidents);

// --- Resource Functions ---
export const addResource = (resource: Resource): Promise<void> => {
    const index = resources.findIndex(r => r.id === resource.id);
    if (index === -1) {
        resources.push(resource);
    } else {
        resources[index] = resource;
    }
    return simulateApiCall(undefined);
};
export const removeResource = (id: string): Promise<void> => {
    resources = resources.filter(r => r.id !== id);
    return simulateApiCall(undefined);
};
export const getDownloadedResources = (): Promise<Resource[]> => simulateApiCall(resources);

// --- Attendance Functions ---
export const addOrUpdateAttendanceRecord = (record: AttendanceRecord): Promise<void> => {
    const index = attendanceRecords.findIndex(r => r.id === record.id);
    if (index > -1) attendanceRecords[index] = record;
    else attendanceRecords.push(record);
    return simulateApiCall(undefined);
};
export const addOrUpdateAttendanceRecords = (records: AttendanceRecord[]): Promise<void> => {
    const recordMap = new Map(attendanceRecords.map(r => [r.id, r]));
    records.forEach(r => recordMap.set(r.id, r));
    attendanceRecords = Array.from(recordMap.values());
    return simulateApiCall(undefined);
};
export const getAllAttendanceRecords = (): Promise<AttendanceRecord[]> => simulateApiCall(attendanceRecords);

// --- Teacher & Student Functions ---
export const getTeacherByEmail = (email: string): Promise<Teacher | undefined> => 
    simulateApiCall(teachers.find(t => t.email === email));

// FIX: Add missing getTeacherById function to support login by ID.
export const getTeacherById = (id: string): Promise<Teacher | undefined> =>
    simulateApiCall(teachers.find(t => t.id === id));

export const updateTeacher = (teacher: Teacher): Promise<void> => {
    const index = teachers.findIndex(t => t.id === teacher.id);
    if (index > -1) teachers[index] = teacher;
    return simulateApiCall(undefined);
};
export const getStudentByEmail = (email: string): Promise<Student | undefined> => 
    simulateApiCall(students.find(s => s.email === email));

// FIX: Add missing getStudentByDocumentId function to support student login.
export const getStudentByDocumentId = (documentId: string): Promise<Student | undefined> =>
    simulateApiCall(students.find(s => s.documentNumber === documentId));

export const updateStudent = (student: Student): Promise<void> => {
    const index = students.findIndex(s => s.id === student.id);
    if (index > -1) students[index] = student;
    return simulateApiCall(undefined);
};

// --- Announcement Functions ---
export const addAnnouncement = (announcement: Announcement): Promise<void> => {
    announcements.unshift(announcement);
    return simulateApiCall(undefined);
};
export const getAnnouncements = (): Promise<Announcement[]> => simulateApiCall(announcements);

// --- Bulk Getters/Setters ---
export const getStudents = (): Promise<Student[]> => simulateApiCall(students);
export const addOrUpdateStudents = (newStudents: Student[]): Promise<void> => {
    const studentMap = new Map(students.map(s => [s.id, s]));
    newStudents.forEach(s => studentMap.set(s.id, s));
    students = Array.from(studentMap.values()).sort((a,b) => a.name.localeCompare(b.name));
    return simulateApiCall(undefined);
};
export const getTeachers = (): Promise<Teacher[]> => simulateApiCall(teachers);
export const addOrUpdateTeachers = (newTeachers: Teacher[]): Promise<void> => {
    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    newTeachers.forEach(t => teacherMap.set(t.id, t));
    teachers = Array.from(teacherMap.values()).sort((a,b) => a.name.localeCompare(b.name));
    return simulateApiCall(undefined);
};

// --- Assessment and Result Functions ---
export const getAssessments = (): Promise<Assessment[]> => simulateApiCall(assessments);
export const addOrUpdateAssessments = (newAssessments: Assessment[]): Promise<void> => {
    const assessmentMap = new Map(assessments.map(a => [a.id, a]));
    newAssessments.forEach(a => assessmentMap.set(a.id, a));
    assessments = Array.from(assessmentMap.values());
    return simulateApiCall(undefined);
};
export const getStudentResults = (): Promise<StudentAssessmentResult[]> => simulateApiCall(studentResults);
export const addOrUpdateStudentResult = (result: StudentAssessmentResult): Promise<void> => {
    const index = studentResults.findIndex(r => r.id === result.id);
    if (index > -1) studentResults[index] = result;
    else studentResults.push(result);
    return simulateApiCall(undefined);
};

// --- Subject Grades Functions ---
export const getSubjectGrades = (): Promise<SubjectGrades[]> => simulateApiCall(subjectGrades);
export const addOrUpdateSubjectGrades = (grades: SubjectGrades[]): Promise<void> => {
    const gradeMap = new Map(subjectGrades.map(g => [g.id, g]));
    grades.forEach(g => gradeMap.set(g.id, g));
    subjectGrades = Array.from(gradeMap.values());
    return simulateApiCall(undefined);
};