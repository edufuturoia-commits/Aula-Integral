import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Student, Teacher, Resource, SubjectGrades, InstitutionProfileData, Citation, Incident, Announcement, InboxConversation, DesempenoDescriptor, Conversation, Guardian, Message } from '../types';
import { CitationStatus, Role, AcademicPeriod, Desempeno } from '../types';
import ReportCardModal from '../components/ReportCardModal';
import { ACADEMIC_PERIODS, MOCK_DESEMPENOS_BANK } from '../constants';
import NewParentConversationModal from '../components/NewParentConversationModal';
import CancelCitationModal from '../components/CancelCitationModal';
import EventPostersViewer from '../components/EventPostersViewer';


// Duplicating this helper function here for simplicity
const getCitationStatusClass = (status: CitationStatus) => {
    switch (status) {
        case CitationStatus.CONFIRMED: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
        case CitationStatus.PENDING: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
        case CitationStatus.COMPLETED: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
        case CitationStatus.CANCELLED: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
        case CitationStatus.RESCHEDULE_REQUESTED: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
};

// --- Grade Calculation Helpers (copied from Calificaciones.tsx) ---
const calculateFinalScore = (studentId: number, gradebook: SubjectGrades | null): { finalScore: number | null; totalWeight: number } => {
    if (!gradebook) return { finalScore: null, totalWeight: 0 };

    const { scores, gradeItems } = gradebook;
    let weightedSum = 0;
    let totalWeight = 0;

    gradeItems.forEach(item => {
        const score = scores.find(s => s.studentId === studentId && s.gradeItemId === item.id);
        if (score && score.score !== null) {
            weightedSum += score.score * item.weight;
            totalWeight += item.weight;
        }
    });

    if (totalWeight === 0) return { finalScore: null, totalWeight: 0 };
    return { finalScore: weightedSum / totalWeight, totalWeight: totalWeight };
};

const getDesempeno = (score: number | null): Desempeno => {
    if (score === null) return Desempeno.BAJO;
    if (score >= 4.6) return Desempeno.SUPERIOR;
    if (score >= 4.0) return Desempeno.ALTO;
    if (score >= 3.0) return Desempeno.BASICO;
    return Desempeno.BAJO;
};

const getDesempenoClass = (desempeno: Desempeno) => {
    switch (desempeno) {
        case Desempeno.SUPERIOR: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
        case Desempeno.ALTO: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
        case Desempeno.BASICO: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
        case Desempeno.BAJO: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
        default: return 'bg-gray-100 text-gray-800';
    }
};

interface ParentPortalProps {
    students: Student[];
    teachers: Teacher[];
    resources: Resource[];
    subjectGrades: SubjectGrades[];
    institutionProfile: InstitutionProfileData;
    citations: Citation[];
    onUpdateCitations: React.Dispatch<React.SetStateAction<Citation[]>>;
    incidents: Incident[];
    announcements: Announcement[];
    conversations: Conversation[];
    onUpdateConversation: (conversation: Conversation) => void;
    onCreateConversation: (conversation: Conversation) => void;
    allUsersMap: Map<string | number, Student | Teacher | Guardian>;
    currentUser: Student | Teacher | Guardian;
}

type ParentPortalTab = 'resumen' | 'calificaciones' | 'convivencia' | 'citaciones' | 'comunicados' | 'bandeja' | 'eventos';

const ParentPortal: React.FC<ParentPortalProps> = ({ students, teachers, resources, subjectGrades, institutionProfile, citations, onUpdateCitations, incidents, announcements, conversations: rawConversations, onUpdateConversation, onCreateConversation, allUsersMap, currentUser }) => {
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(students.length > 0 ? students[0] : null);
    const [activeTab, setActiveTab] = useState<ParentPortalTab>('resumen');
    const [isReportCardModalOpen, setIsReportCardModalOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod>(ACADEMIC_PERIODS[0]);
    
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [citationToCancel, setCitationToCancel] = useState<Citation | null>(null);

    const [selectedConversation, setSelectedConversation] = useState<InboxConversation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);

    const desempenoMap = useMemo(() => new Map(MOCK_DESEMPENOS_BANK.map(d => [d.id, d.description])), []);

    const studentCitations = useMemo(() => {
        if (!selectedStudent) return [];
        return citations
            .filter(c => c.studentId === selectedStudent.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [citations, selectedStudent]);
    
    const pendingCitationsCount = useMemo(() => {
        return studentCitations.filter(c => c.status === CitationStatus.PENDING).length;
    }, [studentCitations]);

    const studentIncidents = useMemo(() => {
        if (!selectedStudent) return [];
        return incidents
            .filter(inc => inc.studentId === selectedStudent.id)
            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [incidents, selectedStudent]);

    const studentAnnouncements = useMemo(() => {
        if (!selectedStudent) return [];
        return announcements
            .filter(ann => {
                if (ann.recipients === 'all' || ann.recipients === 'all_parents' || ann.recipients === 'all_students') {
                    return true;
                }
                if (typeof ann.recipients === 'object' && 'grade' in ann.recipients) {
                    return ann.recipients.grade === selectedStudent.grade && ann.recipients.group === selectedStudent.group;
                }
                return false;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [announcements, selectedStudent]);
    
     const contactsForParent = useMemo(() => {
        if (!selectedStudent) return [];
        const studentTeacherIds = new Set(
            subjectGrades
                .filter(sg => sg.grade === selectedStudent.grade && sg.group === selectedStudent.group)
                .map(sg => sg.teacherId)
        );
        const studentTeachers = teachers.filter(t => studentTeacherIds.has(t.id));
        const adminStaff = teachers.filter(t => t.role === Role.COORDINATOR || t.role === Role.RECTOR);
        
        const allContacts = [...studentTeachers, ...adminStaff];
        return Array.from(new Map(allContacts.map(item => [item.id, item])).values());
    }, [selectedStudent, teachers, subjectGrades]);

    const inboxConversations = useMemo(() => {
        const myId = currentUser.id;
        return rawConversations
            .filter(c => c.participantIds.includes(myId))
            .map(c => {
                const otherParticipantId = c.participantIds.find(id => id !== myId)!;
                const participant = allUsersMap.get(otherParticipantId);
                const lastMessage = c.messages[c.messages.length - 1];

                let participantRole: Role | 'Acudiente' = Role.STUDENT;
                if (participant) {
                    participantRole = 'role' in participant ? participant.role : 'Acudiente';
                }

                return {
                    id: c.id,
                    participantId: otherParticipantId,
                    participantName: participant ? participant.name : 'Usuario Desconocido',
                    participantAvatar: participant && 'avatarUrl' in participant ? participant.avatarUrl : `https://picsum.photos/seed/${otherParticipantId}/100/100`,
                    participantRole: participantRole,
                    lastMessage: lastMessage?.text || 'Inicia la conversación...',
                    timestamp: lastMessage?.timestamp || new Date(0).toISOString(),
                    unread: false, 
                    conversation: c.messages.map(msg => ({
                        sender: msg.senderId === myId ? 'self' : 'participant',
                        text: msg.text,
                        timestamp: new Date(msg.timestamp).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }),
                    })),
                } as InboxConversation;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [rawConversations, currentUser.id, allUsersMap]);

    useEffect(() => {
        if (!selectedConversation && inboxConversations.length > 0) {
            setSelectedConversation(inboxConversations[0]);
        } else if (selectedConversation) {
            const updatedConvo = inboxConversations.find(c => c.id === selectedConversation.id);
            setSelectedConversation(updatedConvo || null);
        }
    }, [inboxConversations, selectedConversation]);
    
    const studentGradesForPeriod = useMemo(() => {
        if (!selectedStudent) return [];

        return subjectGrades
            .filter(sg =>
                sg.grade === selectedStudent.grade &&
                sg.group === selectedStudent.group &&
                sg.period === selectedPeriod
            )
            .map(gradebook => {
                const teacher = teachers.find(t => t.id === gradebook.teacherId);
                const { finalScore } = calculateFinalScore(selectedStudent.id, gradebook);
                const desempeno = getDesempeno(finalScore);
                const observation = gradebook.observations[selectedStudent.id] || null;
                const scoresByItem = new Map(gradebook.scores.filter(s => s.studentId === selectedStudent.id).map(s => [s.gradeItemId, s.score]));

                return {
                    subject: gradebook.subject,
                    teacherName: teacher?.name || 'No asignado',
                    generalDesempenoIds: gradebook.generalDesempenoIds || [],
                    gradeItems: gradebook.gradeItems.map(item => ({
                        ...item,
                        desempenos: (item.desempenoIds || []).map(id => desempenoMap.get(id)).filter(Boolean) as string[]
                    })),
                    scoresByItem,
                    finalScore,
                    desempeno,
                    observation,
                };
            })
            .sort((a, b) => a.subject.localeCompare(b.subject));
    }, [selectedStudent, subjectGrades, teachers, selectedPeriod, desempenoMap]);

    const handleSelectConversation = (conversation: InboxConversation) => {
        setSelectedConversation(conversation);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        const originalConversation = rawConversations.find(c => c.id === selectedConversation.id);
        if (!originalConversation) return;

        const message: Message = {
            senderId: currentUser.id,
            text: newMessage,
            timestamp: new Date().toISOString(),
        };

        const updatedConversation: Conversation = {
            ...originalConversation,
            messages: [...originalConversation.messages, message],
        };

        onUpdateConversation(updatedConversation);
        setNewMessage('');
    };

    const handleStartConversation = (contact: Teacher) => {
        const myId = currentUser.id;
        const otherId = contact.id;
        
        const convoId = [myId, otherId].sort().join('-');
        
        const existingConvo = rawConversations.find(c => c.id === convoId);

        if (existingConvo) {
            const inboxConvo = inboxConversations.find(ic => ic.id === existingConvo.id);
            if (inboxConvo) handleSelectConversation(inboxConvo);
        } else {
            const newConvo: Conversation = {
                id: convoId,
                participantIds: [myId, otherId],
                messages: []
            };
            onCreateConversation(newConvo);
        }
        setIsNewConvoModalOpen(false);
    };
    
    const handleGenerateReport = (period: AcademicPeriod) => {
        setIsReportCardModalOpen(false);
        if (!selectedStudent) {
            alert("No hay un estudiante seleccionado.");
            return;
        }

        const gradesForReport = subjectGrades
            .filter(sg => sg.grade === selectedStudent.grade && sg.group === selectedStudent.group && sg.period === period)
            .map(gradebook => {
                const teacher = teachers.find(t => t.id === gradebook.teacherId);
                const { finalScore } = calculateFinalScore(selectedStudent.id, gradebook);
                const desempeno = getDesempeno(finalScore);
                const observation = gradebook.observations[selectedStudent.id] || "Sin observaciones.";
                const scoresByItem = new Map(gradebook.scores.filter(s => s.studentId === selectedStudent.id).map(s => [s.gradeItemId, s.score]));

                return { subject: gradebook.subject, teacherName: teacher?.name || 'N/A', finalScore, desempeno, observation, gradeItems: gradebook.gradeItems, scoresByItem, generalDesempenoIds: gradebook.generalDesempenoIds || [] };
            })
            .sort((a, b) => a.subject.localeCompare(b.subject));
        
        const getDesempenoBadgeStyle = (desempeno: Desempeno) => {
            switch (desempeno) {
                case Desempeno.SUPERIOR: return 'background-color: #DBEAFE; color: #1E40AF;';
                case Desempeno.ALTO: return 'background-color: #D1FAE5; color: #065F46;';
                case Desempeno.BASICO: return 'background-color: #FEF3C7; color: #92400E;';
                case Desempeno.BAJO: return 'background-color: #FEE2E2; color: #991B1B;';
                default: return 'background-color: #F3F4F6; color: #374151;';
            }
        };

        const subjectCardsHtml = gradesForReport.map(data => `
            <div class="subject-card">
                <div class="subject-header">
                    <div>
                        <h3>${data.subject}</h3>
                        <p>Docente: ${data.teacherName}</p>
                    </div>
                    <div class="final-score">
                        <div>Nota Final: <strong>${data.finalScore !== null ? data.finalScore.toFixed(2) : 'N/A'}</strong></div>
                        <div class="desempeno-badge" style="${getDesempenoBadgeStyle(data.desempeno)}">${data.desempeno}</div>
                    </div>
                </div>
                ${data.gradeItems.length > 0 ? `
                <table class="grades-table">
                    <thead>
                        <tr>
                            ${data.gradeItems.map(item => `<th>${item.name} (${(item.weight * 100).toFixed(0)}%)</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            ${data.gradeItems.map(item => `<td>${data.scoresByItem.get(item.id)?.toFixed(1) || '-'}</td>`).join('')}
                        </tr>
                    </tbody>
                </table>` : ''}
                ${data.generalDesempenoIds.length > 0 ? `
                <div class="desempenos-generales">
                    <strong>Desempeños del Período:</strong>
                    <ul>
                        ${data.generalDesempenoIds.map(id => `<li>${desempenoMap.get(id) || ''}</li>`).join('')}
                    </ul>
                </div>` : ''}
                <div class="observaciones">
                    <strong>Observaciones del Docente:</strong>
                    <p>${data.observation}</p>
                </div>
            </div>
        `).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Boletín de Calificaciones - ${selectedStudent.name}</title>
                <style>
                    @media print {
                        @page { size: letter; margin: 1cm; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                    body { font-family: Arial, sans-serif; font-size: 10pt; color: #333; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${institutionProfile.primaryColor}; padding-bottom: 10px; }
                    .header img { max-height: 70px; max-width: 150px; object-fit: contain; }
                    .header-info { text-align: right; font-size: 9pt; }
                    .report-title { text-align: center; margin: 20px 0; }
                    .report-title h1 { margin: 0; font-size: 16pt; color: ${institutionProfile.primaryColor}; }
                    .report-title h2 { margin: 0; font-size: 12pt; font-weight: normal; }
                    .student-info { border: 1px solid #ccc; padding: 10px; margin-bottom: 20px; border-radius: 8px; font-size: 10pt; display: grid; grid-template-columns: 1fr 1fr; gap: 5px 15px; }
                    .subject-card { border: 1px solid #ccc; border-radius: 8px; margin-bottom: 15px; page-break-inside: avoid; overflow: hidden; }
                    .subject-header { display: flex; justify-content: space-between; align-items: center; background-color: #f3f4f6; padding: 10px; border-bottom: 1px solid #ccc; }
                    .subject-header h3 { margin: 0; font-size: 12pt; }
                    .subject-header p { margin: 0; font-size: 9pt; color: #555; }
                    .final-score { text-align: right; }
                    .desempeno-badge { padding: 3px 8px; border-radius: 12px; font-weight: bold; font-size: 9pt; margin-top: 4px; display: inline-block; }
                    .grades-table { width: 100%; border-collapse: collapse; margin: 0; }
                    .grades-table th, .grades-table td { border: 1px solid #ddd; padding: 6px; text-align: center; font-size: 9pt; }
                    .grades-table th { background-color: #fafafa; font-weight: bold; }
                    .desempenos-generales { padding: 10px; font-size: 9pt; }
                    .desempenos-generales ul { margin: 5px 0 0 0; padding-left: 20px; }
                    .observaciones { padding: 10px; font-size: 9pt; background-color: #f_f_f; }
                    .observaciones p { margin: 5px 0 0 0; font-style: italic; }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="${institutionProfile.logoUrl}" alt="Logo Institucional">
                    <div class="header-info">
                        <strong>${institutionProfile.name}</strong><br>
                        NIT: ${institutionProfile.nit} | Código DANE: ${institutionProfile.daneCode}<br>
                        ${institutionProfile.address}<br>
                        Tel: ${institutionProfile.phone} | Email: ${institutionProfile.email}
                    </div>
                </div>
                <div class="report-title">
                    <h1>BOLETÍN DE CALIFICACIONES</h1>
                    <h2>${period}</h2>
                </div>
                <div class="student-info">
                    <div><strong>ESTUDIANTE:</strong> ${selectedStudent.name}</div>
                    <div><strong>GRADO:</strong> ${selectedStudent.grade} - ${selectedStudent.group}</div>
                    <div><strong>DOCUMENTO:</strong> ${selectedStudent.documentNumber || 'No registrado'}</div>
                    <div><strong>FECHA DE EXPEDICIÓN:</strong> ${new Date().toLocaleDateString('es-CO')}</div>
                </div>
                ${subjectCardsHtml}
            </body>
            </html>
        `;

        const pdfWindow = window.open("", "_blank");
        if (pdfWindow) {
            pdfWindow.document.write(htmlContent);
            pdfWindow.document.close();
            setTimeout(() => {
                pdfWindow.print();
            }, 500); // Small delay to ensure content is rendered
        } else {
            alert("Por favor, habilite las ventanas emergentes para generar el boletín.");
        }
    };

    const handleConfirmCitation = (citationId: string) => {
        onUpdateCitations(prev => prev.map(c => 
            c.id === citationId 
            ? { ...c, status: CitationStatus.CONFIRMED } 
            : c
        ));
    };
    
    const handleRequestReschedule = (citationId: string) => {
        onUpdateCitations(prev => prev.map(c => 
            c.id === citationId 
            ? { ...c, status: CitationStatus.RESCHEDULE_REQUESTED } 
            : c
        ));
    };
    
    const handleOpenCancelModal = (citation: Citation) => {
        setCitationToCancel(citation);
        setIsCancelModalOpen(true);
    };
    
    const handleConfirmCancelCitation = (reason: string) => {
        if (!citationToCancel) return;
        onUpdateCitations(prev => prev.map(c => 
            c.id === citationToCancel.id 
            ? { ...c, status: CitationStatus.CANCELLED, cancellationReason: reason } 
            : c
        ));
        setIsCancelModalOpen(false);
        setCitationToCancel(null);
    };


    if (!selectedStudent) {
        return (
            <div className="flex justify-center items-center h-full">
                <p className="text-xl text-gray-500">
                    No hay estudiantes asociados a este portal.
                </p>
            </div>
        );
    }

    const TABS: {id: ParentPortalTab, label: string, badge?: number}[] = [
        { id: 'resumen', label: 'Resumen' },
        { id: 'calificaciones', label: 'Calificaciones' },
        { id: 'convivencia', label: 'Incidencias' },
        { id: 'citaciones', label: 'Citaciones', badge: pendingCitationsCount },
        { id: 'comunicados', label: 'Comunicados' },
        { id: 'bandeja', label: 'Bandeja de Entrada' },
        { id: 'eventos', label: 'Eventos' },
    ];
    
    const renderContent = () => {
        switch (activeTab) {
            case 'resumen':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-4">
                            <h3 className="text-xl font-bold dark:text-gray-100">Últimas Incidencias</h3>
                            {studentIncidents.length > 0 ? (
                                studentIncidents.slice(0, 3).map(inc => (
                                    <div key={inc.id} className="p-3 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{inc.type}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{inc.notes}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(inc.timestamp).toLocaleDateString()}</p>
                                    </div>
                                ))
                            ) : <p className="text-gray-500 dark:text-gray-400">No hay incidencias reportadas.</p>}
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-4">
                            <h3 className="text-xl font-bold dark:text-gray-100">Próximas Citaciones</h3>
                             {studentCitations.length > 0 ? (
                                studentCitations.filter(c => new Date(c.date) >= new Date()).map(cit => (
                                    <div key={cit.id} className="p-3 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{cit.reason}</p>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCitationStatusClass(cit.status)}`}>{cit.status}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {new Date(cit.date + 'T00:00:00').toLocaleDateString('es-CO', { month: 'long', day: 'numeric', year: 'numeric' })} a las {cit.time}
                                        </p>
                                    </div>
                                ))
                             ) : <p className="text-gray-500 dark:text-gray-400">No hay citaciones programadas.</p>}
                        </div>
                    </div>
                );
             case 'calificaciones':
                return (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Calificaciones</h3>
                                <div className="flex items-center gap-4">
                                    <select
                                        value={selectedPeriod}
                                        onChange={e => setSelectedPeriod(e.target.value as AcademicPeriod)}
                                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                                    >
                                        {ACADEMIC_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <button onClick={() => setIsReportCardModalOpen(true)} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">
                                        Descargar Boletín
                                    </button>
                                </div>
                            </div>
                            {studentGradesForPeriod.length > 0 ? (
                                <div className="space-y-6">
                                    {studentGradesForPeriod.map(data => (
                                        <div key={data.subject} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b dark:border-gray-700">
                                                <h4 className="font-bold text-lg text-primary dark:text-secondary">{data.subject}</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Docente: {data.teacherName}</p>
                                            </div>
                                            {data.generalDesempenoIds.length > 0 && (
                                                <div className="p-4 border-b dark:border-gray-700">
                                                    <h5 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Desempeños Generales del Periodo:</h5>
                                                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1 pl-2">
                                                        {data.generalDesempenoIds.map(id => <li key={id}>{desempenoMap.get(id)}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            <div className="p-4 space-y-3">
                                                <ul className="space-y-2">
                                                    {data.gradeItems.map(item => (
                                                        <li key={item.id}>
                                                            <div className="flex justify-between items-center text-sm p-2 rounded-md even:bg-gray-50 dark:even:bg-gray-800/50">
                                                                <span>{item.name} <span className="text-gray-500 dark:text-gray-400">({(item.weight * 100).toFixed(0)}%)</span></span>
                                                                <span className="font-bold text-gray-800 dark:text-gray-100">{data.scoresByItem.has(item.id) && data.scoresByItem.get(item.id) !== null ? data.scoresByItem.get(item.id)!.toFixed(1) : 'S.N.'}</span>
                                                            </div>
                                                            {item.desempenos.length > 0 && (
                                                                <div className="pl-4 pt-1 pb-2">
                                                                    <ul className="list-disc list-inside text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                                                        {item.desempenos.map((desc, i) => <li key={i}>{desc}</li>)}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700 font-bold text-md p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                                                    <span className="text-gray-800 dark:text-gray-100">Nota Final</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getDesempenoClass(data.desempeno)}`}>
                                                            {data.desempeno}
                                                        </span>
                                                        <span className="text-gray-800 dark:text-gray-100">{data.finalScore !== null ? data.finalScore.toFixed(2) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                {data.observation && (
                                                    <div className="mt-3 pt-3 border-t dark:border-gray-700">
                                                        <h5 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Observaciones del Docente:</h5>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-1 p-3 bg-yellow-50 dark:bg-yellow-900/40 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-r-md">"{data.observation}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-10">No hay calificaciones registradas para {selectedStudent.name} en el {selectedPeriod}.</p>
                            )}
                        </div>
                    </div>
                );
             case 'convivencia':
                return (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-4">
                        <h3 className="text-xl font-bold dark:text-gray-100">Historial de Incidencias</h3>
                        {studentIncidents.length > 0 ? (
                            studentIncidents.map(inc => (
                                <div key={inc.id} className="p-3 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{inc.type}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{inc.notes}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(inc.timestamp).toLocaleString()}</p>
                                </div>
                            ))
                        ) : <p className="text-gray-500 dark:text-gray-400">No hay incidencias reportadas.</p>}
                    </div>
                );
             case 'citaciones':
                return (
                     <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-4">
                        <h3 className="text-xl font-bold dark:text-gray-100">Gestión de Citaciones</h3>
                        {studentCitations.length > 0 ? (
                            studentCitations.map(cit => (
                                <div key={cit.id} className={`p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-gray-200">{cit.reason}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                {new Date(cit.date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las {cit.time} en {cit.location}.
                                            </p>
                                        </div>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCitationStatusClass(cit.status)}`}>{cit.status}</span>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2 flex-wrap">
                                        {cit.status === CitationStatus.PENDING && (
                                            <>
                                                <button onClick={() => handleConfirmCitation(cit.id)} className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full hover:bg-green-200 transition-colors">Confirmar Asistencia</button>
                                                <button onClick={() => handleRequestReschedule(cit.id)} className="px-3 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors">Solicitar Reasignación</button>
                                                <button onClick={() => handleOpenCancelModal(cit)} className="px-3 py-1 text-xs font-semibold text-red-600 hover:underline">Cancelar</button>
                                            </>
                                        )}
                                        {cit.status === CitationStatus.CONFIRMED && (
                                            <>
                                                <p className="text-xs text-green-700 dark:text-green-300 italic flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                    Has confirmado tu asistencia.
                                                </p>
                                                 <button onClick={() => handleOpenCancelModal(cit)} className="px-3 py-1 text-xs font-semibold text-red-600 hover:underline">Cancelar</button>
                                            </>
                                        )}
                                        {cit.status === CitationStatus.RESCHEDULE_REQUESTED && (
                                            <p className="text-xs text-purple-700 dark:text-purple-300 italic">Tu solicitud de reasignación está siendo revisada por coordinación.</p>
                                        )}
                                        {cit.status === CitationStatus.CANCELLED && cit.cancellationReason && (
                                            <p className="text-xs text-red-600 dark:text-red-400"><strong>Motivo cancelación:</strong> {cit.cancellationReason}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay citaciones registradas para este estudiante.</p>}
                    </div>
                );
            case 'comunicados':
                 return (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-4">
                        <h3 className="text-xl font-bold dark:text-gray-100">Comunicados de la Institución</h3>
                        {studentAnnouncements.length > 0 ? (
                            studentAnnouncements.map(ann => (
                                <div key={ann.id} className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-primary">{ann.title}</h4>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(ann.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap">{ann.content}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t dark:border-gray-700"><strong>Enviado por:</strong> {ann.sentBy}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay comunicados para mostrar.</p>
                        )}
                    </div>
                );
             case 'bandeja':
                return (
                    <div className="flex h-[calc(100vh-320px)] bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden">
                        <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Mensajes</h2>
                                <button onClick={() => setIsNewConvoModalOpen(true)} className="p-2 rounded-full text-primary hover:bg-primary/10" title="Nuevo Mensaje">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                            </div>
                            <ul className="overflow-y-auto flex-1">
                                {inboxConversations.map(convo => (
                                    <li key={convo.id} onClick={() => handleSelectConversation(convo)} className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 ${selectedConversation?.id === convo.id ? 'border-primary bg-blue-50 dark:bg-blue-900/50' : 'border-transparent'}`}>
                                        <div className="flex items-start gap-3">
                                            <div className="relative flex-shrink-0">
                                                <img src={convo.participantAvatar} alt={convo.participantName} className="w-12 h-12 rounded-full" />
                                                {convo.unread && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-accent ring-2 ring-white"></span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{convo.participantName}</p>
                                                <p className={`text-sm text-gray-600 dark:text-gray-300 truncate mt-1 ${convo.unread ? 'font-bold text-gray-900 dark:text-gray-100' : ''}`}>{convo.lastMessage}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                {inboxConversations.length === 0 && <p className="text-center text-gray-500 p-4">No hay conversaciones.</p>}
                            </ul>
                        </div>
                        <div className="flex-1 flex-col hidden md:flex">
                             {selectedConversation ? (
                                <>
                                    <div className="p-4 border-b dark:border-gray-700 flex items-center space-x-4">
                                        <img src={selectedConversation.participantAvatar} alt={selectedConversation.participantName} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-gray-100">{selectedConversation.participantName}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedConversation.participantRole}</p>
                                        </div>
                                    </div>
                                    <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                                        {selectedConversation.conversation.map((msg, index) => (
                                            <div key={index} className={`flex items-end gap-2 ${msg.sender === 'self' ? 'justify-end' : ''}`}>
                                                {msg.sender === 'participant' && <img src={selectedConversation.participantAvatar} className="w-8 h-8 rounded-full" alt="participant" />}
                                                <div className={`max-w-lg p-3 rounded-xl ${msg.sender === 'self' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                                </div>
                                                {msg.sender === 'self' && <img src={('avatarUrl' in currentUser) ? currentUser.avatarUrl : ''} className="w-8 h-8 rounded-full" alt="self" />}
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center gap-4">
                                        <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe una respuesta..." className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary resize-none bg-gray-50 dark:bg-gray-700/50 dark:text-gray-200" rows={1} />
                                        <button type="submit" className="bg-primary text-white rounded-full p-3 hover:bg-primary-focus disabled:bg-gray-300" disabled={!newMessage.trim()}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-center"><p className="text-gray-500 dark:text-gray-400">Selecciona una conversación para ver los mensajes.</p></div>
                            )}
                        </div>
                    </div>
                );
            case 'eventos':
                return <EventPostersViewer />;
            default:
                return null;
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-6">
                    <img src={selectedStudent.avatarUrl} alt={selectedStudent.name} className="w-20 h-20 rounded-full object-cover border-4 border-secondary" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{selectedStudent.name}</h1>
                        <p className="text-gray-600 dark:text-gray-400">{selectedStudent.grade} - Grupo {selectedStudent.group}</p>
                    </div>
                </div>
                {students.length > 1 && (
                    <div>
                        <label htmlFor="student-selector" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cambiar de estudiante:</label>
                        <select
                            id="student-selector"
                            value={selectedStudent.id}
                            onChange={(e) => {
                                const student = students.find(s => s.id === Number(e.target.value));
                                if (student) setSelectedStudent(student);
                            }}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white dark:bg-gray-800 dark:text-gray-200"
                        >
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {pendingCitationsCount > 0 && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md flex justify-between items-center animate-fade-in" role="alert">
                    <div className="flex items-center">
                        <svg className="h-6 w-6 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="font-bold">
                            Atención: Tienes {pendingCitationsCount} citación{pendingCitationsCount > 1 ? 'es' : ''} pendiente{pendingCitationsCount > 1 ? 's' : ''} de revisión.
                        </p>
                    </div>
                    <button 
                        onClick={() => setActiveTab('citaciones')}
                        className="font-semibold underline hover:text-yellow-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded"
                    >
                        Ver ahora
                    </button>
                </div>
            )}

            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}
                        >
                           {tab.label}
                            {tab.badge && tab.badge > 0 && (
                                <span className="bg-yellow-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{tab.badge}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>
            
            {renderContent()}

            {isReportCardModalOpen && (
                <ReportCardModal
                    onClose={() => setIsReportCardModalOpen(false)}
                    onGenerate={handleGenerateReport}
                />
            )}
            
            {isNewConvoModalOpen && (
                <NewParentConversationModal 
                    contacts={contactsForParent}
                    onClose={() => setIsNewConvoModalOpen(false)}
                    onStartConversation={handleStartConversation}
                />
            )}

            {isCancelModalOpen && citationToCancel && (
                <CancelCitationModal 
                    onClose={() => setIsCancelModalOpen(false)} 
                    onConfirm={handleConfirmCancelCitation} 
                />
            )}
        </div>
    );
};

export default ParentPortal;