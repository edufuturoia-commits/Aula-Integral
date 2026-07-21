



import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Student, Teacher, Resource, SubjectGrades, InstitutionProfileData, Citation, Incident, Announcement, Conversation, Guardian, Message, AcademicPeriod, User } from '../types';
import { CitationStatus, Role, Desempeno } from '../types';
import ReportCardModal from '../components/ReportCardModal';
import { ACADEMIC_PERIODS, MOCK_COORDINATOR_USER } from '../constants';
import NewParentConversationModal from '../components/NewParentConversationModal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Interfaces ---
interface ParentPortalProps {
    students: Student[];
    teachers: Teacher[];
    resources: Resource[];
    subjectGrades: SubjectGrades[];
    institutionProfile: InstitutionProfileData;
    citations: Citation[];
    onUpdateCitations: (action: 'add' | 'update' | 'delete', data: Citation | Citation[] | string) => Promise<void>;
    incidents: Incident[];
    announcements: Announcement[];
    conversations: Conversation[];
    onUpdateConversation: (conversation: Conversation) => void;
    onCreateConversation: (conversation: Conversation) => void;
    allUsersMap: Map<string | number, User>;
    currentUser: Guardian;
}

type ParentPortalTab = 'inicio' | 'calificaciones' | 'convivencia' | 'comunicados' | 'certificados';

// --- Helper Functions ---
// FIX: Updated studentId to accept string or number.
const calculateFinalScore = (studentId: string | number, gradebook: SubjectGrades | undefined): { finalScore: number | null } => {
    if (!gradebook) return { finalScore: null };
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
    if (totalWeight === 0) return { finalScore: null };
    return { finalScore: weightedSum / totalWeight };
};

const getDesempeno = (score: number | null): Desempeno => {
    if (score === null) return Desempeno.LOW;
    if (score >= 4.6) return Desempeno.SUPERIOR;
    if (score >= 4.0) return Desempeno.HIGH;
    if (score >= 3.0) return Desempeno.BASIC;
    return Desempeno.LOW;
};

const getDesempenoClass = (desempeno: Desempeno) => {
    switch (desempeno) {
        case Desempeno.SUPERIOR: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
        case Desempeno.HIGH: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
        case Desempeno.BASIC: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
        case Desempeno.LOW: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
        default: return 'bg-gray-100 text-gray-800';
    }
};

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

// --- Main Component ---
const ParentPortal: React.FC<ParentPortalProps> = (props) => {
    const { students, teachers, subjectGrades, institutionProfile, citations, onUpdateCitations, incidents, announcements, conversations, onUpdateConversation, onCreateConversation, allUsersMap, currentUser } = props;

    // FIX: Changed state type from number to string | number to handle mixed ID types.
    const [selectedStudentId, setSelectedStudentId] = useState<string | number | null>(null);
    const [activeTab, setActiveTab] = useState<ParentPortalTab>('inicio');

    const guardianStudents = useMemo(() => {
        return students.filter(s => currentUser.studentIds.includes(s.id));
    }, [students, currentUser]);

    useEffect(() => {
        if (guardianStudents.length > 0 && !selectedStudentId) {
            setSelectedStudentId(guardianStudents[0].id);
        }
    }, [guardianStudents, selectedStudentId]);

    const selectedStudent = useMemo(() => {
        return guardianStudents.find(s => s.id === selectedStudentId) || null;
    }, [guardianStudents, selectedStudentId]);

    // Data for the selected student
    const studentData = useMemo(() => {
        if (!selectedStudent) return null;
        return {
            incidents: incidents.filter(i => i.studentId === selectedStudent.id),
            citations: citations.filter(c => c.studentId === selectedStudent.id),
            subjectGrades: subjectGrades.filter(sg => sg.grade === selectedStudent.grade && sg.group === selectedStudent.group),
        };
    }, [selectedStudent, incidents, citations, subjectGrades]);

    const handleUpdateCitationStatus = (citationId: string, newStatus: CitationStatus) => {
        const citation = citations.find(c => c.id === citationId);
        if (citation) {
            onUpdateCitations('update', { ...citation, status: newStatus });
        }
    };
    
    // --- Render logic ---
    if (guardianStudents.length === 0) {
        return <div className="text-center p-8 bg-white rounded-lg shadow-md">No tienes estudiantes asociados a tu cuenta.</div>;
    }

    if (!selectedStudent || !studentData) {
        return <div className="text-center p-8">Cargando datos del estudiante...</div>;
    }

    const TABS: { id: ParentPortalTab; label: string; }[] = [
        { id: 'inicio', label: 'Inicio' },
        { id: 'calificaciones', label: 'Calificaciones' },
        { id: 'convivencia', label: 'Convivencia' },
        { id: 'comunicados', label: 'Comunicados' },
        { id: 'certificados', label: 'Certificados' },
    ];
    
    const renderContent = () => {
        switch (activeTab) {
            case 'inicio':
                const pendingCitations = studentData.citations.filter(c => c.status === CitationStatus.PENDING || c.status === CitationStatus.CONFIRMED);
                const certificateAnnouncements = announcements.filter(ann => {
                    const isRecipient = ann.recipients === 'all' || ann.recipients === 'parents';
                    const content = (ann.title + ' ' + ann.content).toLowerCase();
                    const keywords = ['boletín', 'boletin', 'notas', 'calificaciones', 'calificacion', 'certificado', 'reporte', 'informe', 'constancia', 'estudio', 'matricula', 'paz y salvo'];
                    return isRecipient && keywords.some(k => content.includes(k));
                });

                return (
                    <div className="space-y-6">
                        {certificateAnnouncements.length > 0 && (
                            <div className="bg-secondary/10 border-2 border-secondary p-6 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-center">
                                <div className="mb-4 md:mb-0">
                                    <h2 className="text-xl font-bold text-primary">¡Certificados Disponibles!</h2>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">Se ha generado un nuevo reporte de notas o certificado para {selectedStudent.name}.</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => setActiveTab('certificados')}
                                        className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
                                    >
                                        <span>Ver Todos</span>
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('certificados')}
                                        className="bg-secondary text-primary font-bold py-2 px-6 rounded-lg hover:bg-secondary/80 transition-colors flex items-center space-x-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        <span>Descargar</span>
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Resumen del Estudiante</h2>
                            <div className={`mt-4 grid grid-cols-1 md:grid-cols-${certificateAnnouncements.length > 0 ? '4' : '3'} gap-4`}>
                               <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                   <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Promedio General (P1)</p>
                                   <p className="text-3xl font-bold text-primary dark:text-secondary">4.2</p>
                               </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                   <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inasistencias (Año)</p>
                                   <p className="text-3xl font-bold text-primary dark:text-secondary">3</p>
                               </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                   <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Incidencias Activas</p>
                                   <p className="text-3xl font-bold text-red-500">{studentData.incidents.length}</p>
                               </div>
                               {certificateAnnouncements.length > 0 && (
                                   <button 
                                       onClick={() => setActiveTab('certificados')}
                                       className="p-4 bg-secondary/20 hover:bg-secondary/30 transition-colors rounded-lg text-left border border-secondary/50"
                                   >
                                       <p className="text-sm font-medium text-primary">Certificados</p>
                                       <p className="text-2xl font-bold text-primary flex items-center">
                                           {certificateAnnouncements.length} Disponibles
                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                               <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                           </svg>
                                       </p>
                                   </button>
                               )}
                            </div>
                        </div>
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                             <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Citaciones Próximas</h3>
                             {pendingCitations.length > 0 ? pendingCitations.map(cit => (
                                 <div key={cit.id} className={`p-3 border-l-4 rounded-r-lg mb-2 ${getCitationStatusClass(cit.status).replace('text-', 'border-')}`}>
                                     <p className="font-semibold">{cit.reason}</p>
                                     <p className="text-sm text-gray-600 dark:text-gray-300">Fecha: {new Date(cit.date + 'T00:00:00').toLocaleDateString()} a las {cit.time}</p>
                                     <p className="text-xs font-bold mt-1">Estado: <span className={getCitationStatusClass(cit.status)}>{cit.status}</span></p>
                                 </div>
                             )) : <p className="text-gray-500 dark:text-gray-400">No hay citaciones pendientes.</p>}
                         </div>
                    </div>
                );
            case 'calificaciones':
                return <CalificacionesView student={selectedStudent} subjectGrades={studentData.subjectGrades} teachers={teachers} institutionProfile={institutionProfile} />;
            case 'convivencia':
                return <ConvivenciaView incidents={studentData.incidents} citations={studentData.citations} onUpdateCitationStatus={handleUpdateCitationStatus} />;
            case 'comunicados':
                 return <ComunicadosView announcements={announcements} teachers={teachers} currentUser={currentUser} conversations={conversations} onUpdateConversation={onUpdateConversation} onCreateConversation={onCreateConversation} student={selectedStudent} allUsersMap={allUsersMap} subjectGrades={subjectGrades} institutionProfile={institutionProfile} citations={studentData.citations}/>;
            case 'certificados':
                return <CertificadosView announcements={announcements} student={selectedStudent} subjectGrades={subjectGrades} institutionProfile={institutionProfile} citations={studentData.citations} />;
            default:
                return null;
        }
    };


    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center space-x-4">
                    <img src={selectedStudent.avatarUrl} alt={selectedStudent.name} className="w-16 h-16 rounded-full border-4 border-secondary" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{selectedStudent.name}</h1>
                        <p className="text-gray-600 dark:text-gray-400">{selectedStudent.grade} - Grupo {selectedStudent.group}</p>
                    </div>
                </div>
                {guardianStudents.length > 1 && (
                    <div className="mt-4 md:mt-0">
                        <label htmlFor="student-selector" className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Viendo a:</label>
                        <select
                            id="student-selector"
                            value={String(selectedStudentId || '')}
                            // FIX: Correctly handle string | number ID by finding the student from the value string.
                            onChange={e => {
                                const student = guardianStudents.find(s => String(s.id) === e.target.value);
                                if (student) {
                                    setSelectedStudentId(student.id);
                                }
                            }}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                            {guardianStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            {renderContent()}
        </div>
    );
};


// --- Sub-components for Tabs ---

const CertificadosView: React.FC<{ announcements: Announcement[], student: Student, subjectGrades: SubjectGrades[], institutionProfile: InstitutionProfileData, citations: Citation[] }> = ({ announcements, student, subjectGrades, institutionProfile, citations }) => {
    const certificateAnnouncements = useMemo(() => {
        return announcements.filter(ann => {
            const isRecipient = ann.recipients === 'all' || ann.recipients === 'parents';
            const content = (ann.title + ' ' + ann.content).toLowerCase();
            const keywords = ['boletín', 'boletin', 'notas', 'calificaciones', 'calificacion', 'certificado', 'reporte', 'informe', 'constancia', 'estudio', 'matricula', 'paz y salvo'];
            return isRecipient && keywords.some(k => content.includes(k));
        });
    }, [announcements]);

    const hasPendingCitations = citations?.some(c => c.status === CitationStatus.PENDING || c.status === CitationStatus.CONFIRMED);
    const isStudentInactive = student.isActive === false;
    const canDownload = !hasPendingCitations && !isStudentInactive;

    const generatePDF = (title: string) => {
        const doc = new jsPDF();
        const addPdfHeaderAndFooter = (doc: jsPDF, title: string) => {
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();

            if (institutionProfile.logoUrl && institutionProfile.logoUrl.startsWith('data:image')) {
                try { doc.addImage(institutionProfile.logoUrl, 'PNG', 15, 12, 30, 30); } catch (e) {}
            }

            doc.setFillColor(parseInt(institutionProfile.primaryColor.substring(1, 3), 16), parseInt(institutionProfile.primaryColor.substring(3, 5), 16), parseInt(institutionProfile.primaryColor.substring(5, 7), 16));
            doc.rect(0, 0, pageWidth, 8, 'F');
            doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(institutionProfile.primaryColor);
            doc.text(institutionProfile.name, pageWidth / 2, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(`NIT: ${institutionProfile.nit} | DANE: ${institutionProfile.daneCode}`, pageWidth / 2, 26, { align: 'center' });
            doc.text(institutionProfile.address, pageWidth / 2, 32, { align: 'center' });
            
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40);
            doc.text(title, pageWidth / 2, 50, { align: 'center' });

            const pageCount = doc.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(40);
                const footerY = pageHeight - 40;
                const signatureHeight = 20;
                const signatureWidth = 40;
                const rectorX = institutionProfile.secretary ? pageWidth / 3 : pageWidth / 2;
                if (institutionProfile.rectorSignatureUrl) {
                    try { doc.addImage(institutionProfile.rectorSignatureUrl, 'PNG', rectorX - (signatureWidth / 2), footerY - signatureHeight + 2, signatureWidth, signatureHeight); } catch (e) {}
                }
                doc.text('_________________________', rectorX, footerY, { align: 'center' });
                doc.text(institutionProfile.rector, rectorX, footerY + 5, { align: 'center' });
                doc.text('Rector(a)', rectorX, footerY + 10, { align: 'center' });

                if (institutionProfile.secretary) {
                    const secretaryX = (pageWidth / 3) * 2;
                    if (institutionProfile.secretarySignatureUrl) {
                        try { doc.addImage(institutionProfile.secretarySignatureUrl, 'PNG', secretaryX - (signatureWidth / 2), footerY - signatureHeight + 2, signatureWidth, signatureHeight); } catch (e) {}
                    }
                    doc.text('_________________________', secretaryX, footerY, { align: 'center' });
                    doc.text(institutionProfile.secretary, secretaryX, footerY + 5, { align: 'center' });
                    doc.text('Secretario(a) Académico(a)', secretaryX, footerY + 10, { align: 'center' });
                }
                doc.text(`Generado el: ${new Date().toLocaleDateString('es-CO')}`, 15, pageHeight - 15);
            }
        };

        doc.setFontSize(12);
        doc.text(`Estudiante: ${student.name}`, 15, 70);
        doc.text(`Grado: ${student.grade} - ${student.group}`, 15, 77);
        
        const period = ACADEMIC_PERIODS[0];
        const grades = subjectGrades.filter(sg => sg.period === period && sg.grade === student.grade && sg.group === student.group)
            .map(sg => {
                const { finalScore } = calculateFinalScore(student.id, sg);
                return [sg.subject, finalScore?.toFixed(2) || 'N/A', getDesempeno(finalScore)];
            });

        (doc as any).autoTable({
            startY: 85,
            head: [['ASIGNATURA', 'NOTA FINAL', 'DESEMPEÑO']],
            body: grades,
            theme: 'grid',
            headStyles: { fillColor: institutionProfile.primaryColor }
        });

        addPdfHeaderAndFooter(doc, `INFORME DE CALIFICACIONES - ${period}`);
        doc.save(`Certificado_${student.name.replace(/ /g, '_')}.pdf`);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold mb-6">Certificados y Reportes</h3>
            
            {!canDownload && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <p className="font-bold text-red-800 dark:text-red-200">Descarga Bloqueada</p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                            {isStudentInactive ? 'El estudiante ya no hace parte de la institución.' : 'Para descargar certificados, no debe tener citaciones pendientes por atender.'}
                        </p>
                    </div>
                </div>
            )}

            {certificateAnnouncements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificateAnnouncements.map(ann => (
                        <div key={ann.id} className="p-4 border dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-700/30">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-800 dark:text-gray-100">{ann.title}</h4>
                                <span className="text-xs text-gray-500">{new Date(ann.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{ann.content}</p>
                            
                            <button 
                                disabled={!canDownload}
                                onClick={() => generatePDF(ann.title)}
                                className={`w-full flex items-center justify-center space-x-2 font-bold py-2 px-4 rounded-lg transition-colors ${canDownload ? 'bg-secondary text-primary hover:bg-secondary/80' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <span>Descargar</span>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500">No se han encontrado certificados o reportes generados.</p>
                </div>
            )}
        </div>
    );
};

const CalificacionesView: React.FC<{ student: Student; subjectGrades: SubjectGrades[], teachers: Teacher[], institutionProfile: InstitutionProfileData }> = ({ student, subjectGrades, teachers, institutionProfile }) => {
    const [period, setPeriod] = useState<AcademicPeriod>(ACADEMIC_PERIODS[0]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const periodGrades = useMemo(() => {
        return subjectGrades
            .filter(sg => sg.period === period)
            .map(sg => {
                const { finalScore } = calculateFinalScore(student.id, sg);
                return {
                    subject: sg.subject,
                    teacher: teachers.find(t => t.id === sg.teacherId)?.name || 'N/A',
                    finalScore,
                    desempeno: getDesempeno(finalScore),
                };
            });
    }, [period, student.id, subjectGrades, teachers]);
    
    const handleGenerateReportCard = (selectedPeriod: AcademicPeriod) => {
        const sg = subjectGrades.find(sg => sg.period === selectedPeriod && sg.grade === student.grade && sg.group === student.group);
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Header & Footer Helper (local to this component or passed down)
        const addPdfHeaderAndFooter = (doc: jsPDF, title: string) => {
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();

            if (institutionProfile.logoUrl && institutionProfile.logoUrl.startsWith('data:image')) {
                try {
                    doc.addImage(institutionProfile.logoUrl, 'PNG', 15, 12, 30, 30);
                } catch (e) { console.error("Error adding logo:", e); }
            }

            doc.setFillColor(parseInt(institutionProfile.primaryColor.substring(1, 3), 16), parseInt(institutionProfile.primaryColor.substring(3, 5), 16), parseInt(institutionProfile.primaryColor.substring(5, 7), 16));
            doc.rect(0, 0, pageWidth, 8, 'F');
            doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(institutionProfile.primaryColor);
            doc.text(institutionProfile.name, pageWidth / 2, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(`NIT: ${institutionProfile.nit} | DANE: ${institutionProfile.daneCode}`, pageWidth / 2, 26, { align: 'center' });
            doc.text(institutionProfile.address, pageWidth / 2, 32, { align: 'center' });
            
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40);
            doc.text(title, pageWidth / 2, 50, { align: 'center' });

            const pageCount = doc.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(40);

                const footerY = pageHeight - 40;
                const signatureHeight = 20;
                const signatureWidth = 40;

                const rectorX = institutionProfile.secretary ? pageWidth / 3 : pageWidth / 2;
                if (institutionProfile.rectorSignatureUrl) {
                    try {
                        doc.addImage(institutionProfile.rectorSignatureUrl, 'PNG', rectorX - (signatureWidth / 2), footerY - signatureHeight + 2, signatureWidth, signatureHeight);
                    } catch (e) { console.error("Error adding rector signature:", e); }
                }
                doc.text('_________________________', rectorX, footerY, { align: 'center' });
                doc.text(institutionProfile.rector, rectorX, footerY + 5, { align: 'center' });
                doc.text('Rector(a)', rectorX, footerY + 10, { align: 'center' });

                if (institutionProfile.secretary) {
                    const secretaryX = (pageWidth / 3) * 2;
                    if (institutionProfile.secretarySignatureUrl) {
                        try {
                            doc.addImage(institutionProfile.secretarySignatureUrl, 'PNG', secretaryX - (signatureWidth / 2), footerY - signatureHeight + 2, signatureWidth, signatureHeight);
                        } catch (e) { console.error("Error adding secretary signature:", e); }
                    }
                    doc.text('_________________________', secretaryX, footerY, { align: 'center' });
                    doc.text(institutionProfile.secretary, secretaryX, footerY + 5, { align: 'center' });
                    doc.text('Secretario(a) Académico(a)', secretaryX, footerY + 10, { align: 'center' });
                }

                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(`Generado el: ${new Date().toLocaleDateString('es-CO')}`, 15, pageHeight - 15);
            }
        };

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40);
        doc.text(`Estudiante: ${student.name}`, 15, 70);
        doc.text(`Grado: ${student.grade} - ${student.group}`, 15, 77);
        
        const studentGrades = subjectGrades
            .filter(sg => sg.period === selectedPeriod && sg.grade === student.grade && sg.group === student.group)
            .map(gradebook => {
                const { finalScore } = calculateFinalScore(student.id, gradebook);
                const desempeno = getDesempeno(finalScore);
                return [gradebook.subject, finalScore !== null ? finalScore.toFixed(2) : 'N/A', desempeno];
            });

        (doc as any).autoTable({
            startY: 85,
            head: [['ASIGNATURA', 'NOTA FINAL', 'DESEMPEÑO']],
            body: studentGrades,
            theme: 'grid',
            headStyles: { fillColor: institutionProfile.primaryColor },
            styles: { font: 'helvetica', fontSize: 10 },
        });

        addPdfHeaderAndFooter(doc, `INFORME DE CALIFICACIONES - ${selectedPeriod}`);
        doc.save(`Boletin_${selectedPeriod}_${student.name.replace(/ /g, '_')}.pdf`);
        setIsModalOpen(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <select value={period} onChange={e => setPeriod(e.target.value as AcademicPeriod)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    {ACADEMIC_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button onClick={() => setIsModalOpen(true)} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus">Descargar Boletín</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3">Asignatura</th>
                            <th className="px-6 py-3">Docente</th>
                            <th className="px-6 py-3 text-center">Nota Final</th>
                            <th className="px-6 py-3 text-center">Desempeño</th>
                        </tr>
                    </thead>
                    <tbody>
                        {periodGrades.map(grade => (
                            <tr key={grade.subject} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium">{grade.subject}</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{grade.teacher}</td>
                                <td className="px-6 py-4 text-center font-bold">{grade.finalScore?.toFixed(2) ?? 'N/A'}</td>
                                <td className="px-6 py-4 text-center"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDesempenoClass(grade.desempeno)}`}>{grade.desempeno}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <ReportCardModal onClose={() => setIsModalOpen(false)} onGenerate={handleGenerateReportCard} />}
        </div>
    );
};

const ConvivenciaView: React.FC<{ incidents: Incident[]; citations: Citation[]; onUpdateCitationStatus: (id: string, status: CitationStatus) => void }> = ({ incidents, citations, onUpdateCitationStatus }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold mb-4">Incidencias Reportadas</h3>
            {incidents.length > 0 ? incidents.map(inc => (
                <div key={inc.id} className="p-3 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/50 mb-3 rounded-r-lg">
                    <p className="font-semibold text-red-800 dark:text-red-200">{inc.type}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{inc.notes}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Reportado por {inc.teacherName} el {new Date(inc.timestamp).toLocaleDateString()}</p>
                </div>
            )) : <p className="text-gray-500 dark:text-gray-400">No hay incidencias reportadas.</p>}
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold mb-4">Citaciones</h3>
            {citations.length > 0 ? citations.map(cit => (
                <div key={cit.id} className={`p-4 rounded-lg mb-3 border ${getCitationStatusClass(cit.status).replace('text-', 'border-')}`}>
                    <div className="flex justify-between items-start">
                        <p className="font-semibold">{cit.reason}</p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCitationStatusClass(cit.status)}`}>{cit.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{new Date(cit.date + 'T00:00:00').toLocaleDateString()} a las {cit.time}</p>
                    {cit.status === CitationStatus.PENDING && (
                        <div className="mt-3 text-right space-x-2">
                            <button onClick={() => onUpdateCitationStatus(cit.id, CitationStatus.RESCHEDULE_REQUESTED)} className="text-xs font-semibold text-yellow-600 hover:underline">Solicitar Reprogramación</button>
                            <button onClick={() => onUpdateCitationStatus(cit.id, CitationStatus.CONFIRMED)} className="text-xs font-semibold bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700">Confirmar</button>
                        </div>
                    )}
                </div>
            )) : <p className="text-gray-500 dark:text-gray-400">No hay citaciones programadas.</p>}
        </div>
    </div>
);

const ComunicadosView: React.FC<{ announcements: Announcement[], teachers: Teacher[], currentUser: Guardian, conversations: Conversation[], onUpdateConversation: (c: Conversation) => void, onCreateConversation: (c: Conversation) => void, student: Student, allUsersMap: Map<string|number, User>, subjectGrades: SubjectGrades[], institutionProfile: InstitutionProfileData, citations: Citation[] }> = ({ announcements, teachers, currentUser, conversations, onUpdateConversation, onCreateConversation, student, allUsersMap, subjectGrades, institutionProfile, citations }) => {
    const [activeCommTab, setActiveCommTab] = useState<'anuncios' | 'mensajes'>('anuncios');
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    const studentTeachers = useMemo(() => {
        const teacherIds = new Set<string>();
        subjectGrades.filter(sg => sg.grade === student.grade && sg.group === student.group).forEach(sg => teacherIds.add(String(sg.teacherId)));
        return teachers.filter(t => teacherIds.has(String(t.id)));
    }, [teachers, student, subjectGrades]);
    
    const myConversations = useMemo(() => {
        return conversations.filter(c => c.participantIds.includes(currentUser.id));
    }, [conversations, currentUser]);
    
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        const message: Message = {
            senderId: currentUser.id,
            text: newMessage,
            timestamp: new Date().toISOString(),
        };

        const updatedConversation: Conversation = {
            ...selectedConversation,
            messages: [...selectedConversation.messages, message],
        };

        onUpdateConversation(updatedConversation);
        setSelectedConversation(updatedConversation);
        setNewMessage('');
    };
    
    const handleStartConversation = (contact: Teacher) => {
        const convoId = [currentUser.id, contact.id].sort().join('-');
        const existing = conversations.find(c => c.id === convoId);
        if (existing) {
            setSelectedConversation(existing);
        } else {
            const newConvo: Conversation = { id: convoId, participantIds: [currentUser.id, contact.id], messages: [] };
            onCreateConversation(newConvo);
            setSelectedConversation(newConvo);
        }
        setActiveCommTab('mensajes');
        setIsNewConvoModalOpen(false);
    };

    const filteredAnnouncements = useMemo(() => {
        return announcements.filter(ann => ann.recipients === 'all' || ann.recipients === 'parents');
    }, [announcements]);

    return (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                 <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setActiveCommTab('anuncios')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeCommTab === 'anuncios' ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Anuncios Generales</button>
                    <button onClick={() => setActiveCommTab('mensajes')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeCommTab === 'mensajes' ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Mensajes Directos</button>
                </nav>
            </div>
            {activeCommTab === 'anuncios' && (
                <div className="space-y-4">
                    {filteredAnnouncements.length > 0 ? (
                        filteredAnnouncements.map(ann => {
                            const hasPendingCitations = citations?.some(c => c.status === CitationStatus.PENDING || c.status === CitationStatus.CONFIRMED);
                            const isStudentInactive = student.isActive === false;
                            const canDownload = !hasPendingCitations && !isStudentInactive;
                            const isCertificateAnnouncement = 
                                ann.title.toLowerCase().includes('boletín') || 
                                ann.title.toLowerCase().includes('boletin') || 
                                ann.title.toLowerCase().includes('notas') || 
                                ann.title.toLowerCase().includes('calificaciones') ||
                                ann.title.toLowerCase().includes('calificacion') ||
                                ann.title.toLowerCase().includes('certificado') ||
                                ann.title.toLowerCase().includes('reporte') ||
                                ann.title.toLowerCase().includes('informe') ||
                                ann.title.toLowerCase().includes('constancia') ||
                                ann.title.toLowerCase().includes('estudio') ||
                                ann.title.toLowerCase().includes('matricula') ||
                                ann.title.toLowerCase().includes('paz y salvo') ||
                                ann.content.toLowerCase().includes('boletín') ||
                                ann.content.toLowerCase().includes('boletin') || 
                                ann.content.toLowerCase().includes('notas') ||
                                ann.content.toLowerCase().includes('certificado') ||
                                ann.content.toLowerCase().includes('calificaciones') ||
                                ann.content.toLowerCase().includes('calificacion') ||
                                ann.content.toLowerCase().includes('reporte') ||
                                ann.content.toLowerCase().includes('informe') ||
                                ann.content.toLowerCase().includes('constancia') ||
                                ann.content.toLowerCase().includes('estudio') ||
                                ann.content.toLowerCase().includes('matricula') ||
                                ann.content.toLowerCase().includes('paz y salvo');

                            return (
                                <div key={ann.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-700">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-100">{ann.title}</h4>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(ann.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap">{ann.content}</p>
                                    
                                    {isCertificateAnnouncement && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                            {canDownload ? (
                                                <button 
                                                    onClick={() => {
                                                        // Using the first period as default or we could show a selector
                                                        // For simplicity in the notification, we'll trigger the download of the current/last period
                                                        const doc = new jsPDF();
                                                        const addPdfHeaderAndFooter = (doc: jsPDF, title: string) => {
                                                            const pageHeight = doc.internal.pageSize.getHeight();
                                                            const pageWidth = doc.internal.pageSize.getWidth();

                                                            if (institutionProfile.logoUrl && institutionProfile.logoUrl.startsWith('data:image')) {
                                                                try { doc.addImage(institutionProfile.logoUrl, 'PNG', 15, 12, 30, 30); } catch (e) {}
                                                            }

                                                            doc.setFillColor(parseInt(institutionProfile.primaryColor.substring(1, 3), 16), parseInt(institutionProfile.primaryColor.substring(3, 5), 16), parseInt(institutionProfile.primaryColor.substring(5, 7), 16));
                                                            doc.rect(0, 0, pageWidth, 8, 'F');
                                                            doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

                                                            doc.setFont('helvetica', 'bold');
                                                            doc.setFontSize(16);
                                                            doc.setTextColor(institutionProfile.primaryColor);
                                                            doc.text(institutionProfile.name, pageWidth / 2, 20, { align: 'center' });
                                                            doc.setFontSize(10);
                                                            doc.setFont('helvetica', 'normal');
                                                            doc.setTextColor(100);
                                                            doc.text(`NIT: ${institutionProfile.nit} | DANE: ${institutionProfile.daneCode}`, pageWidth / 2, 26, { align: 'center' });
                                                            doc.text(institutionProfile.address, pageWidth / 2, 32, { align: 'center' });
                                                            
                                                            doc.setFontSize(18);
                                                            doc.setFont('helvetica', 'bold');
                                                            doc.setTextColor(40);
                                                            doc.text(title, pageWidth / 2, 50, { align: 'center' });

                                                            const pageCount = doc.getNumberOfPages();
                                                            for(let i = 1; i <= pageCount; i++) {
                                                                doc.setPage(i);
                                                                doc.setFontSize(10);
                                                                doc.setFont('helvetica', 'normal');
                                                                doc.setTextColor(40);
                                                                const footerY = pageHeight - 40;
                                                                const signatureHeight = 20;
                                                                const signatureWidth = 40;
                                                                const rectorX = institutionProfile.secretary ? pageWidth / 3 : pageWidth / 2;
                                                                if (institutionProfile.rectorSignatureUrl) {
                                                                    try { doc.addImage(institutionProfile.rectorSignatureUrl, 'PNG', rectorX - (signatureWidth / 2), footerY - signatureHeight + 2, signatureWidth, signatureHeight); } catch (e) {}
                                                                }
                                                                doc.text('_________________________', rectorX, footerY, { align: 'center' });
                                                                doc.text(institutionProfile.rector, rectorX, footerY + 5, { align: 'center' });
                                                                doc.text('Rector(a)', rectorX, footerY + 10, { align: 'center' });

                                                                if (institutionProfile.secretary) {
                                                                    const secretaryX = (pageWidth / 3) * 2;
                                                                    if (institutionProfile.secretarySignatureUrl) {
                                                                        try { doc.addImage(institutionProfile.secretarySignatureUrl, 'PNG', secretaryX - (signatureWidth / 2), footerY - signatureHeight + 2, signatureWidth, signatureHeight); } catch (e) {}
                                                                    }
                                                                    doc.text('_________________________', secretaryX, footerY, { align: 'center' });
                                                                    doc.text(institutionProfile.secretary, secretaryX, footerY + 5, { align: 'center' });
                                                                    doc.text('Secretario(a) Académico(a)', secretaryX, footerY + 10, { align: 'center' });
                                                                }
                                                                doc.text(`Generado el: ${new Date().toLocaleDateString('es-CO')}`, 15, pageHeight - 15);
                                                            }
                                                        };

                                                        doc.setFontSize(12);
                                                        doc.text(`Estudiante: ${student.name}`, 15, 70);
                                                        doc.text(`Grado: ${student.grade} - ${student.group}`, 15, 77);
                                                        
                                                        const period = ACADEMIC_PERIODS[0]; // Default to first period for this quick download
                                                        const grades = subjectGrades.filter(sg => sg.period === period && sg.grade === student.grade && sg.group === student.group)
                                                            .map(sg => {
                                                                const { finalScore } = calculateFinalScore(student.id, sg);
                                                                return [sg.subject, finalScore?.toFixed(2) || 'N/A', getDesempeno(finalScore)];
                                                            });

                                                        (doc as any).autoTable({
                                                            startY: 85,
                                                            head: [['ASIGNATURA', 'NOTA FINAL', 'DESEMPEÑO']],
                                                            body: grades,
                                                            theme: 'grid',
                                                            headStyles: { fillColor: institutionProfile.primaryColor }
                                                        });

                                                        addPdfHeaderAndFooter(doc, `INFORME DE CALIFICACIONES - ${period}`);
                                                        doc.save(`Certificado_${student.name.replace(/ /g, '_')}.pdf`);
                                                    }}
                                                    className="flex items-center space-x-2 bg-secondary text-primary font-bold py-2 px-4 rounded-lg hover:bg-secondary/80 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>Descargar Certificado</span>
                                                </button>
                                            ) : (
                                                <div className="flex items-center space-x-2 text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.366zM7.5 4.805a6 6 0 017.695 7.696L7.5 4.805zM10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-xs font-medium">
                                                        Descarga bloqueada: {isStudentInactive ? 'El estudiante ya no hace parte de la institución.' : 'Tienes citaciones pendientes por atender.'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No hay comunicados recientes.</p>
                    )}
                </div>
            )}
            {activeCommTab === 'mensajes' && (
                <div className="flex h-[60vh]">
                     <div className="w-1/3 border-r dark:border-gray-700 pr-4">
                        <button onClick={() => setIsNewConvoModalOpen(true)} className="w-full bg-primary/10 text-primary dark:bg-secondary/20 dark:text-secondary font-semibold py-2 px-4 rounded-lg hover:bg-primary/20 mb-3">Nuevo Mensaje</button>
                        {myConversations.map(c => {
                            const otherId = c.participantIds.find(id => id !== currentUser.id)!;
                            const otherUser = allUsersMap.get(otherId);
                            return (
                                <div key={c.id} onClick={() => setSelectedConversation(c)} className={`p-2 rounded-md cursor-pointer ${selectedConversation?.id === c.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    <p className="font-semibold">{otherUser?.name || 'Usuario'}</p>
                                    <p className="text-xs text-gray-500">{c.messages[c.messages.length - 1]?.text || '...'}</p>
                                </div>
                            )
                        })}
                     </div>
                     <div className="w-2/3 pl-4 flex flex-col">
                        {selectedConversation ? (
                             <>
                                <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto mb-4 p-2">
                                     {selectedConversation.messages.map((msg, i) => {
                                        const isSelf = msg.senderId === currentUser.id;
                                        return (
                                             <div key={i} className={`flex items-end gap-2 ${isSelf ? 'justify-end' : ''}`}>
                                                <div className={`max-w-xs p-3 rounded-xl ${isSelf ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                                    <p className="text-sm">{msg.text}</p>
                                                </div>
                                             </div>
                                        )
                                    })}
                                </div>
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="Escribe un mensaje..." />
                                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Enviar</button>
                                </form>
                             </>
                        ) : <p className="text-center text-gray-500 m-auto">Selecciona una conversación o inicia una nueva.</p>}
                     </div>
                </div>
            )}
             {isNewConvoModalOpen && <NewParentConversationModal contacts={[...studentTeachers, MOCK_COORDINATOR_USER]} onClose={() => setIsNewConvoModalOpen(false)} onStartConversation={handleStartConversation} />}
        </div>
    )
};


export default ParentPortal;