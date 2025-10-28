import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Student, Guardian, SubjectGrades, InstitutionProfileData, Teacher, Conversation, Message } from '../types';
import { Role, DocumentType, Desempeno, AcademicPeriod } from '../types';
import { GRADES, GROUPS } from '../constants';

// Helper functions for grade calculation
const calculateFinalScoreForSubject = (studentId: number, gradebook: SubjectGrades | undefined): { finalScore: number | null } => {
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


interface SecretariaProps {
    students: Student[];
    setStudents: (updater: React.SetStateAction<Student[]>) => Promise<void>;
    guardians: Guardian[];
    onUpdateGuardians: (guardians: Guardian[]) => Promise<void>;
    subjectGradesData: SubjectGrades[];
    institutionProfile: InstitutionProfileData;
    onShowSystemMessage: (message: string, type?: 'success' | 'error') => void;
    currentUser: Teacher;
    conversations: Conversation[];
    onUpdateConversation: (conversation: Conversation) => void;
    onCreateConversation: (conversation: Conversation) => void;
}

const Secretaria: React.FC<SecretariaProps> = ({ students, setStudents, guardians, onUpdateGuardians, subjectGradesData, institutionProfile, onShowSystemMessage, currentUser, conversations, onUpdateConversation, onCreateConversation }) => {
    const [activeTab, setActiveTab] = useState<'certificates' | 'enrollment'>('certificates');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');

    const [studentForm, setStudentForm] = useState({ name: '', documentType: DocumentType.IDENTITY_CARD, documentNumber: '', dateOfBirth: '', grade: GRADES[0], group: GROUPS[0] });
    const [guardianForm, setGuardianForm] = useState({ name: '', id: '', email: '', phone: '' });

    const handleStudentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setStudentForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleGuardianFormChange = (e: React.ChangeEvent<HTMLInputElement>) => setGuardianForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleEnrollmentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentForm.name || !studentForm.documentNumber || !guardianForm.name || !guardianForm.id) {
            onShowSystemMessage('Por favor completa todos los campos obligatorios.', 'error');
            return;
        }

        const newStudentId = Date.now();
        const newStudent: Student = {
            id: newStudentId,
            name: studentForm.name,
            avatarUrl: `https://picsum.photos/seed/${newStudentId}/100/100`,
            grade: studentForm.grade,
            group: studentForm.group,
            role: Role.STUDENT,
            documentType: studentForm.documentType,
            documentNumber: studentForm.documentNumber,
            dateOfBirth: studentForm.dateOfBirth,
            password: studentForm.documentNumber,
            passwordChanged: false,
        };
        
        const newGuardian: Guardian = {
            id: guardianForm.id,
            name: guardianForm.name,
            email: guardianForm.email,
            phone: guardianForm.phone,
            studentIds: [newStudentId],
            password: guardianForm.id,
            passwordChanged: false,
        };
        
        await setStudents(prev => [...prev, newStudent]);
        await onUpdateGuardians([...guardians, newGuardian]);

        onShowSystemMessage(`Estudiante ${newStudent.name} matriculado exitosamente.`, 'success');
        
        setStudentForm({ name: '', documentType: DocumentType.IDENTITY_CARD, documentNumber: '', dateOfBirth: '', grade: GRADES[0], group: GROUPS[0] });
        setGuardianForm({ name: '', id: '', email: '', phone: '' });
    };
    
    const addPdfHeaderAndFooter = (doc: jsPDF, title: string) => {
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        if (institutionProfile.logoUrl && institutionProfile.logoUrl.startsWith('data:image')) {
            try {
                const img = new Image();
                img.src = institutionProfile.logoUrl;
                doc.addImage(img, 'PNG', 15, 12, 30, 30);
            } catch (e) { console.error("Error adding logo to PDF:", e); }
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

        // Footer
        const pageCount = doc.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('_________________________', pageWidth / 2, pageHeight - 40, { align: 'center' });
            doc.text(institutionProfile.rector, pageWidth / 2, pageHeight - 35, { align: 'center' });
            doc.text('Rector(a)', pageWidth / 2, pageHeight - 30, { align: 'center' });
            doc.setFontSize(8);
            doc.text(`Generado el: ${new Date().toLocaleDateString('es-CO')}`, 15, pageHeight - 15);
        }
    };

    const handleGenerateStudyCertificate = () => {
        if (!selectedStudentId) {
            onShowSystemMessage('Por favor, selecciona un estudiante.', 'error');
            return;
        }
        const student = students.find(s => s.id === parseInt(selectedStudentId));
        if (!student) return;

        const doc = new jsPDF();
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40);
        const bodyText = `Por medio de la presente, la ${institutionProfile.name.toUpperCase()}, con código DANE ${institutionProfile.daneCode}, certifica que:\n\nEl/la estudiante ${student.name.toUpperCase()}, identificado(a) con ${student.documentType || 'documento de identidad'} No. ${student.documentNumber || 'N/A'}, se encuentra debidamente matriculado(a) en esta institución para el presente año lectivo en el GRADO ${student.grade}.\n\nEste certificado se expide a solicitud del interesado en la ciudad de Medellín, a los ${new Date().getDate()} días del mes de ${new Date().toLocaleString('es-CO', { month: 'long' })} de ${new Date().getFullYear()}.`;
        
        const splitText = doc.splitTextToSize(bodyText, 170);
        doc.text(splitText, 20, 80);

        addPdfHeaderAndFooter(doc, 'CERTIFICADO DE ESTUDIOS');
        doc.save(`Certificado_Estudio_${student.name.replace(/ /g, '_')}.pdf`);
    };

    const handleGenerateGradesCertificate = () => {
         if (!selectedStudentId) {
            onShowSystemMessage('Por favor, selecciona un estudiante.', 'error');
            return;
        }
        const student = students.find(s => s.id === parseInt(selectedStudentId));
        if (!student) return;
        
        const doc = new jsPDF();
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40);
        doc.text(`Estudiante: ${student.name}`, 15, 70);
        doc.text(`Grado: ${student.grade} - ${student.group}`, 15, 77);
        
        const studentGrades = subjectGradesData
            .filter(sg => sg.period === AcademicPeriod.FIRST && sg.grade === student.grade && sg.group === student.group)
            .map(gradebook => {
                const { finalScore } = calculateFinalScoreForSubject(student.id, gradebook);
                const desempeno = getDesempeno(finalScore);
                return [gradebook.subject, finalScore !== null ? finalScore.toFixed(2) : 'N/A', desempeno];
            });

        autoTable(doc, {
            startY: 85,
            head: [['ASIGNATURA', 'NOTA FINAL', 'DESEMPEÑO']],
            body: studentGrades,
            theme: 'grid',
            headStyles: { fillColor: institutionProfile.primaryColor },
            styles: { font: 'helvetica', fontSize: 10 },
        });

        addPdfHeaderAndFooter(doc, `INFORME DE CALIFICACIONES - ${AcademicPeriod.FIRST}`);
        doc.save(`Certificado_Notas_${student.name.replace(/ /g, '_')}.pdf`);
    };

    const handleGenerateAndSendCertificate = (type: 'study' | 'grades') => {
        if (!selectedStudentId) {
            onShowSystemMessage('Por favor, selecciona un estudiante.', 'error');
            return;
        }
        const student = students.find(s => s.id === parseInt(selectedStudentId));
        if (!student) {
            onShowSystemMessage('Estudiante no encontrado.', 'error');
            return;
        }

        const guardian = guardians.find(g => g.studentIds.includes(student.id));

        if (!guardian) {
            onShowSystemMessage(`El estudiante ${student.name} no tiene un acudiente asignado.`, 'error');
            return;
        }
        
        if (type === 'grades') {
            const studentGrades = subjectGradesData.filter(sg => sg.period === AcademicPeriod.FIRST && sg.grade === student.grade && sg.group === student.group);
            if (studentGrades.length === 0) {
                onShowSystemMessage('No hay datos de calificaciones para generar este certificado.', 'error');
                return;
            }
        }

        const certificateName = type === 'study' ? 'Certificado de Estudios' : 'Certificado de Notas (P1)';
        const messageText = `Estimado(a) ${guardian.name},\n\nSe ha generado el '${certificateName}' para el/la estudiante ${student.name}.\n\nPuede solicitar el documento en la secretaría de la institución o responder a este mensaje para coordinar el envío digital.\n\nAtentamente,\nSecretaría Académica.`;

        const newMessage: Message = {
            senderId: currentUser.id,
            text: messageText,
            timestamp: new Date().toISOString(),
        };

        const convoId = [currentUser.id, guardian.id].sort().join('-');
        const existingConversation = conversations.find(c => c.id === convoId);

        if (existingConversation) {
            const updatedConversation: Conversation = {
                ...existingConversation,
                messages: [...existingConversation.messages, newMessage],
            };
            onUpdateConversation(updatedConversation);
        } else {
            const newConversation: Conversation = {
                id: convoId,
                participantIds: [currentUser.id, guardian.id],
                messages: [newMessage],
            };
            onCreateConversation(newConversation);
        }

        onShowSystemMessage(`Notificación enviada exitosamente al acudiente de ${student.name}.`, 'success');
    };

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    <button onClick={() => setActiveTab('certificates')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'certificates' ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        Generar Certificados
                    </button>
                    <button onClick={() => setActiveTab('enrollment')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'enrollment' ? 'border-primary text-primary dark:text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        Matrícula
                    </button>
                </nav>
            </div>

            {activeTab === 'certificates' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Generador de Certificados</h2>
                    <div className="mb-6">
                         <select 
                            value={selectedStudentId} 
                            onChange={e => setSelectedStudentId(e.target.value)} 
                            className="w-full md:w-1/2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        >
                            <option value="">-- Selecciona un estudiante --</option>
                            {students.sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade}-{s.group})</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Study Certificate */}
                        <div className="p-4 border rounded-lg dark:border-gray-700">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Certificado de Estudio</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Acredita la matrícula activa del estudiante.</p>
                            <div className="flex gap-4">
                                <button onClick={handleGenerateStudyCertificate} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-focus disabled:bg-gray-400" disabled={!selectedStudentId}>
                                    Descargar PDF
                                </button>
                                <button onClick={() => handleGenerateAndSendCertificate('study')} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400" disabled={!selectedStudentId}>
                                    Enviar Notificación
                                </button>
                            </div>
                        </div>

                        {/* Grades Certificate */}
                        <div className="p-4 border rounded-lg dark:border-gray-700">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Certificado de Notas</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Informe con las calificaciones finales del primer período.</p>
                            <div className="flex gap-4">
                                <button onClick={handleGenerateGradesCertificate} className="bg-secondary text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-yellow-400 disabled:bg-gray-400" disabled={!selectedStudentId}>
                                    Descargar PDF
                                </button>
                                <button onClick={() => handleGenerateAndSendCertificate('grades')} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400" disabled={!selectedStudentId}>
                                    Enviar Notificación
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'enrollment' && (
                <form onSubmit={handleEnrollmentSubmit} className="space-y-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                         <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Datos del Estudiante</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <input name="name" value={studentForm.name} onChange={handleStudentFormChange} placeholder="Nombres y Apellidos" required className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                             <select name="documentType" value={studentForm.documentType} onChange={handleStudentFormChange} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                {Object.values(DocumentType).map(dt => <option key={dt} value={dt}>{dt}</option>)}
                            </select>
                            <input name="documentNumber" value={studentForm.documentNumber} onChange={handleStudentFormChange} placeholder="Número de Documento" required className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            <input name="dateOfBirth" type="date" value={studentForm.dateOfBirth} onChange={handleStudentFormChange} placeholder="Fecha de Nacimiento" className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            <select name="grade" value={studentForm.grade} onChange={handleStudentFormChange} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            <select name="group" value={studentForm.group} onChange={handleStudentFormChange} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                         </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                         <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Datos del Acudiente</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <input name="name" value={guardianForm.name} onChange={handleGuardianFormChange} placeholder="Nombres y Apellidos del Acudiente" required className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            <input name="id" value={guardianForm.id} onChange={handleGuardianFormChange} placeholder="Cédula del Acudiente" required className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            <input name="email" type="email" value={guardianForm.email} onChange={handleGuardianFormChange} placeholder="Email del Acudiente" className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            <input name="phone" type="tel" value={guardianForm.phone} onChange={handleGuardianFormChange} placeholder="Teléfono del Acudiente" className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-focus transition-colors">
                            Matricular Estudiante
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default Secretaria;