import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { AttentionReport, Student, Teacher, Conversation, Message, Guardian, Diagnosis, SessionLog, SessionProgress, InstitutionProfileData } from '../types';
import { Role, AttentionReportStatus } from '../types';
import jsPDF from 'jspdf';
// Switched to function-based usage of jspdf-autotable to resolve module augmentation issues.
import autoTable, { type UserOptions } from 'jspdf-autotable';

// Add autoTable to jsPDF declaration for TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
  }
}

interface PsychologyProps {
    reports: AttentionReport[];
    onUpdateReport: (report: AttentionReport) => Promise<void>;
    students: Student[];
    allUsersMap: Map<string | number, Student | Teacher | Guardian>;
    conversations: Conversation[];
    onUpdateConversation: (conversation: Conversation) => void;
    currentUser: Teacher;
    institutionProfile: InstitutionProfileData;
}

// --- Helper Components ---
const Accordion: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; action?: React.ReactNode }> = ({ title, children, isOpen, onToggle, action }) => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <button onClick={onToggle} className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg">
            <span className="font-bold text-gray-800 dark:text-gray-100">{title}</span>
            <div className="flex items-center gap-4">
                {action}
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform text-gray-600 dark:text-gray-300 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </div>
        </button>
        {isOpen && <div className="p-4 border-t border-gray-200 dark:border-gray-700">{children}</div>}
    </div>
);

const getStatusClass = (status: AttentionReportStatus) => {
    switch (status) {
        case AttentionReportStatus.OPEN: return { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-200', border: 'border-red-500' };
        case AttentionReportStatus.IN_PROGRESS: return { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-500' };
        case AttentionReportStatus.CLOSED: return { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-200', border: 'border-green-500' };
        default: return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', border: 'border-gray-500' };
    }
};

const SESSION_PROGRESS_OPTIONS: SessionProgress[] = ['Sin Evaluar', 'Estancamiento', 'Leve Mejora', 'Progreso Notable', 'Logro de Objetivo'];

const DiagnosisForm: React.FC<{
    initialDiagnosis?: Diagnosis | null;
    onSave: (diagnosis: Diagnosis) => void;
    onCancel: () => void;
    currentUser: Teacher;
}> = ({ initialDiagnosis, onSave, onCancel, currentUser }) => {
    const [text, setText] = useState(initialDiagnosis?.text || '');
    const [source, setSource] = useState(initialDiagnosis?.source || 'Entrevista');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        const diagnosisData: Diagnosis = {
            id: initialDiagnosis?.id || `diag_${Date.now()}`,
            authorId: initialDiagnosis?.authorId || currentUser.id,
            text,
            source,
            timestamp: initialDiagnosis?.timestamp || new Date().toISOString(),
        };
        onSave(diagnosisData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 mt-2 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-3">
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={4}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                placeholder="Descripción del diagnóstico o hipótesis..."
                required
            />
            <input
                type="text"
                value={source}
                onChange={e => setSource(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                placeholder="Fuente (Ej: Entrevista, Test WISC-V, Observación)"
            />
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md text-sm">Guardar</button>
            </div>
        </form>
    );
};

const SessionForm: React.FC<{
    initialSession?: SessionLog | null;
    onSave: (session: SessionLog) => void;
    onCancel: () => void;
    currentUser: Teacher;
}> = ({ initialSession, onSave, onCancel, currentUser }) => {
    const [formData, setFormData] = useState({
        date: initialSession?.date || new Date().toISOString().split('T')[0],
        startTime: initialSession?.startTime || '08:00',
        endTime: initialSession?.endTime || '09:00',
        sessionType: initialSession?.sessionType || 'Individual',
        progressIndicator: initialSession?.progressIndicator || 'Sin Evaluar',
        notes: initialSession?.notes || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.notes.trim()) return;
        const sessionData: SessionLog = {
            id: initialSession?.id || `sess_${Date.now()}`,
            authorId: initialSession?.authorId || currentUser.id,
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            sessionType: formData.sessionType as 'Individual' | 'Grupal' | 'Familiar',
            progressIndicator: formData.progressIndicator as SessionProgress,
            notes: formData.notes,
        };
        onSave(sessionData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 mt-2 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-3">
            <div className="grid grid-cols-3 gap-3">
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600" />
                <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600" />
                <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <select name="sessionType" value={formData.sessionType} onChange={handleChange} className="p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600">
                    <option>Individual</option>
                    <option>Grupal</option>
                    <option>Familiar</option>
                </select>
                <select name="progressIndicator" value={formData.progressIndicator} onChange={handleChange} className="p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600">
                    {SESSION_PROGRESS_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                </select>
            </div>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={6} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600" placeholder="Notas detalladas de la sesión..." required />
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md text-sm">Guardar Sesión</button>
            </div>
        </form>
    );
};


// --- Main Component ---
const Psychology: React.FC<PsychologyProps> = ({ reports, onUpdateReport, students, allUsersMap, conversations, onUpdateConversation, currentUser, institutionProfile }) => {
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<AttentionReportStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [openAccordion, setOpenAccordion] = useState<string | null>('historial');
    
    // Forms State
    const [isAddingDiagnosis, setIsAddingDiagnosis] = useState(false);
    const [editingDiagnosis, setEditingDiagnosis] = useState<Diagnosis | null>(null);
    const [isAddingSession, setIsAddingSession] = useState(false);
    const [editingSession, setEditingSession] = useState<SessionLog | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [editingField, setEditingField] = useState<{ field: keyof AttentionReport; value: string } | null>(null);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    const filteredReports = useMemo(() => {
        const searchLower = searchTerm.toLowerCase();
        return reports.filter(r => {
            const student = studentMap.get(r.studentId);
            const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
            const matchesSearch = !searchTerm || 
                student?.name.toLowerCase().includes(searchLower) ||
                student?.documentNumber?.includes(searchLower) ||
                r.diagnoses.some(d => d.text.toLowerCase().includes(searchLower));
            return matchesStatus && matchesSearch;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [reports, statusFilter, searchTerm, studentMap]);

    const selectedReport = useMemo(() => reports.find(r => r.id === selectedReportId) || null, [reports, selectedReportId]);
    const selectedConversation = useMemo(() => selectedReport ? conversations.find(c => c.id === selectedReport.conversationId) : null, [conversations, selectedReport]);
    
    useEffect(() => {
        if (!selectedReportId && filteredReports.length > 0) setSelectedReportId(filteredReports[0].id);
        else if (selectedReportId && !filteredReports.find(r => r.id === selectedReportId)) setSelectedReportId(filteredReports.length > 0 ? filteredReports[0].id : null);
    }, [filteredReports, selectedReportId]);
    
    useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [selectedConversation?.messages]);

    const handleUpdateField = async (field: keyof AttentionReport) => {
        if (!selectedReport || !editingField) return;
        const updatedReport = { ...selectedReport, [field]: editingField.value };
        await onUpdateReport(updatedReport);
        setEditingField(null);
    }
    
    const handleStatusChange = async (newStatus: AttentionReportStatus) => {
        if (!selectedReport) return;
        await onUpdateReport({ ...selectedReport, status: newStatus });
    };
    
    const handleSaveDiagnosis = async (diagnosis: Diagnosis) => {
        if (!selectedReport) return;
        const existingIndex = selectedReport.diagnoses.findIndex(d => d.id === diagnosis.id);
        const updatedDiagnoses = [...selectedReport.diagnoses];
        if (existingIndex > -1) {
            updatedDiagnoses[existingIndex] = diagnosis;
        } else {
            updatedDiagnoses.unshift(diagnosis);
        }
        await onUpdateReport({ ...selectedReport, diagnoses: updatedDiagnoses });
        setIsAddingDiagnosis(false);
        setEditingDiagnosis(null);
    };

    const handleDeleteDiagnosis = async (id: string) => {
        if (!selectedReport || !window.confirm("¿Estás seguro de que quieres eliminar este diagnóstico?")) return;
        await onUpdateReport({ ...selectedReport, diagnoses: selectedReport.diagnoses.filter(d => d.id !== id) });
    };
    
    const handleSaveSession = async (session: SessionLog) => {
        if (!selectedReport) return;
        const existingIndex = selectedReport.sessions.findIndex(s => s.id === session.id);
        const updatedSessions = [...selectedReport.sessions];
        if (existingIndex > -1) {
            updatedSessions[existingIndex] = session;
        } else {
            updatedSessions.push(session);
        }
        await onUpdateReport({ ...selectedReport, sessions: updatedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) });
        setIsAddingSession(false);
        setEditingSession(null);
    };

    const handleDeleteSession = async (id: string) => {
        if (!selectedReport || !window.confirm("¿Estás seguro de que quieres eliminar esta sesión?")) return;
        await onUpdateReport({ ...selectedReport, sessions: selectedReport.sessions.filter(s => s.id !== id) });
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConversation || !newMessage.trim()) return;
        const message: Message = { senderId: currentUser.id, text: newMessage, timestamp: new Date().toISOString() };
        onUpdateConversation({ ...selectedConversation, messages: [...selectedConversation.messages, message] });
        setNewMessage('');
    };
    
    const handleGeneratePdf = () => {
        if (!selectedReport) return alert("No hay un reporte seleccionado.");
        const student = studentMap.get(selectedReport.studentId);
        if (!student) return alert("Estudiante no encontrado.");

        const doc = new jsPDF();
        let y = 10; // Initial y position

        // --- PDF Header ---
        try {
            if (institutionProfile.logoUrl && institutionProfile.logoUrl.startsWith('data:image')) {
                doc.addImage(institutionProfile.logoUrl, 'PNG', 15, y, 25, 25);
            }
        } catch (e) {
            console.error("Error adding logo to PDF:", e);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(institutionProfile.name, 200, y + 5, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`NIT: ${institutionProfile.nit} | DANE: ${institutionProfile.daneCode}`, 200, y + 10, { align: 'right' });
        doc.text(institutionProfile.address, 200, y + 14, { align: 'right' });
        doc.text(`Tel: ${institutionProfile.phone} | Email: ${institutionProfile.email}`, 200, y + 18, { align: 'right' });
        
        doc.setDrawColor(200);
        doc.line(15, y + 28, 200, y + 28);
        y = 48;

        // --- Title and Student Info ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORME PSICOLÓGICO CONFIDENCIAL', 105, y, { align: 'center' });
        y += 12;

        doc.setFontSize(11);
        doc.text('INFORMACIÓN DEL ESTUDIANTE', 15, y);
        y += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nombre: ${student.name}`, 15, y);
        doc.text(`Grado: ${student.grade} - ${student.group}`, 110, y);
        y += 6;
        doc.text(`Documento: ${student.documentNumber || 'No registrado'}`, 15, y);
        doc.text(`Fecha del Reporte: ${new Date(selectedReport.timestamp).toLocaleDateString()}`, 110, y);
        y += 6;
        doc.text(`Profesional a Cargo: ${currentUser.name}`, 15, y);
        y += 12;

        // --- Helper for Sections ---
        const addSection = (title: string, content?: string) => {
            if (!content) return; // Skip empty sections
             if (y > 250) { doc.addPage(); y = 20; }
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(title, 15, y);
            y += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const splitText = doc.splitTextToSize(content, 180);
            doc.text(splitText, 15, y);
            y += (splitText.length * 5) + 8;
        };

        // --- Report Content ---
        addSection('MOTIVO DE CONSULTA', selectedReport.reason);
        addSection('ANTECEDENTES FAMILIARES', selectedReport.familyBackground);
        addSection('ANTECEDENTES ESCOLARES', selectedReport.schoolBackground);
        addSection('ANTECEDENTES MÉDICOS', selectedReport.medicalBackground);
        addSection('PLAN DE INTERVENCIÓN', selectedReport.interventionPlan);

        // --- Diagnoses Table ---
        if (selectedReport.diagnoses.length > 0) {
            if (y > 240) { doc.addPage(); y = 20; }
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('DIAGNÓSTICOS / HIPÓTESIS', 15, y);
            y += 8;
            // FIX: Changed doc.autoTable to autoTable(doc, ...)
            autoTable(doc, {
                startY: y,
                head: [['Fecha', 'Diagnóstico/Hipótesis', 'Fuente', 'Autor']],
                body: selectedReport.diagnoses.map(d => [
                    new Date(d.timestamp).toLocaleDateString(),
                    d.text,
                    d.source || 'N/A',
                    allUsersMap.get(d.authorId)?.name || 'Desconocido'
                ]),
                theme: 'grid',
                headStyles: { fillColor: [0, 90, 156] },
                styles: { fontSize: 9 },
            });
            y = (doc as any).lastAutoTable.finalY + 10;
        }
        
        // --- Sessions Table ---
        if (selectedReport.sessions.length > 0) {
            if (y > 240) { doc.addPage(); y = 20; }
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('SEGUIMIENTO DE SESIONES', 15, y);
            y += 8;
            // FIX: Changed doc.autoTable to autoTable(doc, ...)
            autoTable(doc, {
                startY: y,
                head: [['Fecha', 'Tipo', 'Progreso', 'Notas de la Sesión']],
                body: selectedReport.sessions.map(s => [
                    new Date(s.date + 'T00:00:00').toLocaleDateString(),
                    s.sessionType,
                    s.progressIndicator,
                    s.notes
                ]),
                theme: 'grid',
                headStyles: { fillColor: [0, 90, 156] },
                styles: { fontSize: 9 },
                columnStyles: { 3: { cellWidth: 80 } }
            });
            y = (doc as any).lastAutoTable.finalY + 10;
        }

        addSection('RESUMEN DE CIERRE', selectedReport.closingSummary);

        // --- Footer with Page Numbers ---
        const pageCount = (doc as any).internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Página ${i} de ${pageCount}`, 200, 285, { align: 'right' });
        }

        doc.save(`Informe_Psicologico_${student.name.replace(/\s/g, '_')}.pdf`);
    };


    if (!reports) {
        return <div className="p-8 text-center">Cargando reportes...</div>;
    }

    return (
        <div className="flex h-[calc(100vh-112px)] gap-6">
            {/* Report List */}
            <div className="w-1/3 bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col p-4">
                <h2 className="text-xl font-bold mb-4 flex-shrink-0">Casos de Atención</h2>
                <div className="flex gap-2 mb-4 flex-shrink-0">
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por estudiante..."
                        className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <select 
                        value={statusFilter} 
                        onChange={e => setStatusFilter(e.target.value as any)}
                        className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    >
                        <option value="all">Todos</option>
                        {Object.values(AttentionReportStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2">
                    {filteredReports.map(report => {
                        const student = studentMap.get(report.studentId);
                        const { bg, border } = getStatusClass(report.status);
                        return (
                            <div
                                key={report.id}
                                onClick={() => setSelectedReportId(report.id)}
                                className={`p-3 rounded-lg cursor-pointer border-l-4 transition-colors ${selectedReportId === report.id ? `${bg} ${border}`: `bg-gray-50 dark:bg-gray-900/50 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700`}`}
                            >
                                <p className="font-bold text-gray-800 dark:text-gray-100">{student?.name || 'Estudiante Desconocido'}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{report.reason}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(report.timestamp).toLocaleDateString()}</p>
                            </div>
                        )
                    })}
                     {filteredReports.length === 0 && <p className="text-center text-gray-500 py-8">No se encontraron reportes.</p>}
                </div>
            </div>

            {/* Report Details */}
            <div className="w-2/3 bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col p-6">
                {selectedReport && studentMap.get(selectedReport.studentId) ? (
                    (() => {
                        const student = studentMap.get(selectedReport.studentId)!;
                        const { bg, text } = getStatusClass(selectedReport.status);
                        return (
                            <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="flex justify-between items-start pb-4 border-b dark:border-gray-700 flex-shrink-0">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{student.name}</h2>
                                        <p className="text-gray-500 dark:text-gray-400">{student.grade} - {student.group}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <select value={selectedReport.status} onChange={e => handleStatusChange(e.target.value as AttentionReportStatus)} className={`p-2 border rounded-md font-semibold text-sm ${bg} ${text} ${getStatusClass(selectedReport.status).border}`}>
                                            {Object.values(AttentionReportStatus).map(s => <option key={s}>{s}</option>)}
                                        </select>
                                        <button onClick={handleGeneratePdf} className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200" title="Generar Reporte PDF">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 overflow-y-auto pt-4 space-y-4 pr-2 -mr-6 pl-2 -ml-2">
                                    {/* Accordions */}
                                    <Accordion title="Historial Psicológico" isOpen={openAccordion === 'historial'} onToggle={() => setOpenAccordion(openAccordion === 'historial' ? null : 'historial')}>
                                        {/* ... content for history ... */}
                                    </Accordion>
                                     <Accordion title={`Diagnósticos (${selectedReport.diagnoses.length})`} isOpen={openAccordion === 'diagnosticos'} onToggle={() => setOpenAccordion(openAccordion === 'diagnosticos' ? null : 'diagnosticos')} action={!isAddingDiagnosis && <button onClick={() => { setIsAddingDiagnosis(true); setEditingDiagnosis(null); }} className="text-xs font-semibold text-primary dark:text-secondary hover:underline">Añadir</button>}>
                                        {(isAddingDiagnosis || editingDiagnosis) && (
                                            <DiagnosisForm initialDiagnosis={editingDiagnosis} onSave={handleSaveDiagnosis} onCancel={() => { setIsAddingDiagnosis(false); setEditingDiagnosis(null); }} currentUser={currentUser} />
                                        )}
                                        <div className="space-y-3 mt-4">
                                            {selectedReport.diagnoses.map(diagnosis => {
                                                const author = allUsersMap.get(diagnosis.authorId);
                                                const canEdit = currentUser.id === diagnosis.authorId;
                                                return (
                                                    <div key={diagnosis.id} className="p-3 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900/50">
                                                        <p className="text-sm text-gray-800 dark:text-gray-200">{diagnosis.text}</p>
                                                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                            <span>Fuente: {diagnosis.source} | Por: {author?.name || 'Desconocido'}</span>
                                                            {canEdit && (
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => { setEditingDiagnosis(diagnosis); setIsAddingDiagnosis(true); }} className="hover:underline">Editar</button>
                                                                    <button onClick={() => handleDeleteDiagnosis(diagnosis.id)} className="hover:underline text-red-500">Eliminar</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {selectedReport.diagnoses.length === 0 && <p className="text-sm text-gray-500">No hay diagnósticos registrados.</p>}
                                        </div>
                                    </Accordion>
                                     <Accordion title={`Seguimiento de Sesiones (${selectedReport.sessions.length})`} isOpen={openAccordion === 'sesiones'} onToggle={() => setOpenAccordion(openAccordion === 'sesiones' ? null : 'sesiones')} action={!isAddingSession && <button onClick={() => { setIsAddingSession(true); setEditingSession(null); }} className="text-xs font-semibold text-primary dark:text-secondary hover:underline">Registrar Sesión</button>}>
                                        {(isAddingSession || editingSession) && (
                                            <SessionForm initialSession={editingSession} onSave={handleSaveSession} onCancel={() => { setIsAddingSession(false); setEditingSession(null); }} currentUser={currentUser} />
                                        )}
                                        <div className="space-y-3 mt-4">
                                            {selectedReport.sessions.map(session => {
                                                const author = allUsersMap.get(session.authorId);
                                                const canEdit = currentUser.id === session.authorId;
                                                return (
                                                    <div key={session.id} className="p-3 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900/50">
                                                        <div className="flex justify-between items-start text-sm">
                                                            <div>
                                                                <p className="font-bold">{new Date(session.date + 'T00:00:00').toLocaleDateString()} ({session.startTime} - {session.endTime})</p>
                                                                <p className="text-xs text-gray-500">Tipo: {session.sessionType} | Autor: {author?.name}</p>
                                                            </div>
                                                            <span className="font-semibold text-primary dark:text-secondary">{session.progressIndicator}</span>
                                                        </div>
                                                        <p className="text-sm mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{session.notes}</p>
                                                        {canEdit && (
                                                            <div className="text-right mt-2 flex gap-2 justify-end text-xs">
                                                                <button onClick={() => { setEditingSession(session); setIsAddingSession(true); }} className="font-semibold hover:underline text-blue-600">Editar</button>
                                                                <button onClick={() => handleDeleteSession(session.id)} className="font-semibold hover:underline text-red-500">Eliminar</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                             {selectedReport.sessions.length === 0 && <p className="text-sm text-gray-500">No hay sesiones registradas.</p>}
                                        </div>
                                    </Accordion>
                                    <Accordion title="Plan de Intervención y Cierre" isOpen={openAccordion === 'cierre'} onToggle={() => setOpenAccordion(openAccordion === 'cierre' ? null : 'cierre')}>
                                       {/* ... content for closing plan ... */}
                                    </Accordion>
                                </div>
                                
                                 {/* Chat */}
                                <div className="mt-4 pt-4 border-t dark:border-gray-700 flex flex-col h-1/2 flex-shrink-0">
                                   {/* ... chat implementation ... */}
                                </div>
                            </div>
                        )
                    })()
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-gray-500">
                        <p>Selecciona un reporte de la lista para ver los detalles.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Psychology;
