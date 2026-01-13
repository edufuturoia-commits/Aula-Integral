import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { AttentionReport, Student, Teacher, Conversation, Message, Guardian, Diagnosis, SessionLog, SessionProgress, InstitutionProfileData } from '../types';
import { Role, AttentionReportStatus, DiagnosisArea } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

// --- Translations ---
const attentionStatusTranslations: Record<AttentionReportStatus, string> = {
    [AttentionReportStatus.OPEN]: 'Abierto',
    [AttentionReportStatus.IN_PROGRESS]: 'En Progreso',
    [AttentionReportStatus.CLOSED]: 'Cerrado',
};

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
        case AttentionReportStatus.CLOSED: return { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-red-200', border: 'border-green-500' };
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
    const [area, setArea] = useState<DiagnosisArea>(initialDiagnosis?.area || DiagnosisArea.FAMILY_DEVELOPMENT);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        const diagnosisData: Diagnosis = {
            id: initialDiagnosis?.id || `diag_${Date.now()}`,
            authorId: initialDiagnosis?.authorId || currentUser.id,
            text,
            source,
            area,
            timestamp: initialDiagnosis?.timestamp || new Date().toISOString(),
        };
        onSave(diagnosisData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 mt-2 bg-gray-50 dark:bg-gray-900/80 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3 shadow-inner">
            <select
                value={area}
                onChange={e => setArea(e.target.value as DiagnosisArea)}
                className="w-full p-2 border rounded-md"
            >
                {Object.values(DiagnosisArea).map(areaValue => (
                    <option key={areaValue} value={areaValue}>{areaValue}</option>
                ))}
            </select>
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={4}
                className="w-full p-2 border rounded-md"
                placeholder="Descripción del diagnóstico o hipótesis..."
                required
            />
            <input
                type="text"
                value={source}
                onChange={e => setSource(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Fuente (Ej: Entrevista, Test WISC-V, Observación)"
            />
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md text-sm font-bold shadow-sm">Guardar</button>
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
        <form onSubmit={handleSubmit} className="p-4 mt-2 bg-gray-50 dark:bg-gray-900/80 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3 shadow-inner">
            <div className="grid grid-cols-3 gap-3">
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="p-2 border rounded-md" />
                <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="p-2 border rounded-md" />
                <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="p-2 border rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <select name="sessionType" value={formData.sessionType} onChange={handleChange} className="p-2 border rounded-md">
                    <option>Individual</option>
                    <option>Grupal</option>
                    <option>Familiar</option>
                </select>
                <select name="progressIndicator" value={formData.progressIndicator} onChange={handleChange} className="p-2 border rounded-md">
                    {SESSION_PROGRESS_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                </select>
            </div>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={6} className="w-full p-2 border rounded-md" placeholder="Notas detalladas de la sesión..." required />
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md text-sm font-bold shadow-sm">Guardar Sesión</button>
            </div>
        </form>
    );
};

const EditableField: React.FC<{
    label: string;
    value: string | undefined;
    onSave: () => void;
    isEditing: boolean;
    onStartEdit: () => void;
    onCancel: () => void;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    editingValue: string;
    disabled: boolean;
}> = ({ label, value, onSave, isEditing, onStartEdit, onCancel, onChange, editingValue, disabled }) => (
    <div>
        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
        {isEditing ? (
            <div>
                <textarea
                    value={editingValue}
                    onChange={onChange}
                    rows={6}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary shadow-inner"
                    autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={onCancel} className="text-sm px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancelar</button>
                    <button onClick={onSave} className="text-sm px-3 py-1 rounded-md bg-primary text-white hover:bg-primary-focus transition-colors font-bold shadow-sm">Guardar</button>
                </div>
            </div>
        ) : (
            <div onClick={!disabled ? onStartEdit : undefined} className={`text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words p-2 rounded-md min-h-[4rem] border border-transparent transition-all ${!disabled ? 'hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer' : 'opacity-70'}`}>
                {value || <span className="text-gray-400 italic">No hay información. Haz clic para añadir.</span>}
            </div>
        )}
    </div>
);


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
            autoTable(doc, {
                startY: y,
                head: [['Fecha', 'Tipo', 'Progreso', 'Notas']],
                body: selectedReport.sessions.map(s => [
                    new Date(s.date + 'T00:00:00').toLocaleDateString(),
                    s.sessionType,
                    s.progressIndicator,
                    s.notes
                ]),
                theme: 'grid',
                headStyles: { fillColor: [0, 90, 156] },
                styles: { fontSize: 9, cellWidth: 'wrap' },
                columnStyles: { 3: { cellWidth: 80 } },
            });
            y = (doc as any).lastAutoTable.finalY + 10;
        }

        // --- Closing Summary ---
        addSection('CIERRE DEL CASO', selectedReport.closingSummary);
        
        doc.save(`Informe_Psicologico_${student.name}.pdf`);
    };


    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full max-h-[calc(100vh-112px)]">
            {/* Reports List Panel */}
            <div className="w-full lg:w-1/3 xl:w-1/4 flex-shrink-0 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex-shrink-0">Casos de Atención</h2>
                <div className="flex flex-col md:flex-row gap-2 mb-4 flex-shrink-0">
                    <input
                        type="text"
                        placeholder="Buscar por estudiante..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                        className="w-full md:w-auto p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    >
                        <option value="all">Todos los Estados</option>
                        {Object.values(AttentionReportStatus).map(status => (
                            <option key={status} value={status}>{attentionStatusTranslations[status]}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2">
                    {filteredReports.map(r => {
                        const student = studentMap.get(r.studentId);
                        const statusClasses = getStatusClass(r.status);
                        return (
                            <div
                                key={r.id}
                                onClick={() => setSelectedReportId(r.id)}
                                className={`p-3 rounded-lg cursor-pointer border-l-4 ${selectedReportId === r.id ? `${statusClasses.bg} ${statusClasses.border}` : 'bg-gray-50 dark:bg-gray-900/50 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{student?.name}</p>
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusClasses.bg} ${statusClasses.text}`}>
                                        {attentionStatusTranslations[r.status]}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{r.reason}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(r.timestamp).toLocaleDateString()}</p>
                            </div>
                        );
                    })}
                     {filteredReports.length === 0 && <p className="text-center text-gray-500 py-10">No se encontraron casos.</p>}
                </div>
            </div>

            {/* Content Panel */}
            <div className="flex-1 bg-white dark:bg-gray-800 p-2 md:p-6 rounded-xl shadow-md overflow-y-auto">
                {selectedReport ? (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{studentMap.get(selectedReport.studentId)?.name}</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{studentMap.get(selectedReport.studentId)?.grade} - Grupo {studentMap.get(selectedReport.studentId)?.group}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2"><strong>Motivo:</strong> {selectedReport.reason}</p>
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-end gap-2">
                                {(() => {
                                    const statusClasses = getStatusClass(selectedReport.status);
                                    return (
                                        <select
                                            value={selectedReport.status}
                                            onChange={e => handleStatusChange(e.target.value as AttentionReportStatus)}
                                            className={`p-1 rounded-md text-sm font-semibold border-2 ${statusClasses.bg} ${statusClasses.text} ${statusClasses.border}`}
                                            disabled={!selectedReport}
                                        >
                                            {Object.values(AttentionReportStatus).map(status => (
                                                <option key={status} value={status}>{attentionStatusTranslations[status]}</option>
                                            ))}
                                        </select>
                                    );
                                })()}
                                <button onClick={handleGeneratePdf} className="text-sm bg-red-100 text-red-700 font-semibold py-2 px-3 rounded-lg hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200 transition-colors shadow-sm">Exportar a PDF</button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Accordion title="Historial Psicológico" isOpen={openAccordion === 'historial'} onToggle={() => setOpenAccordion(openAccordion === 'historial' ? null : 'historial')}>
                               <div className="space-y-4">
                                    <EditableField label="Antecedentes Familiares y Desarrollo" value={selectedReport.familyBackground} onSave={() => handleUpdateField('familyBackground')} isEditing={editingField?.field === 'familyBackground'} onStartEdit={() => setEditingField({ field: 'familyBackground', value: selectedReport.familyBackground || '' })} onCancel={() => setEditingField(null)} onChange={(e) => setEditingField(prev => prev ? { ...prev, value: e.target.value } : null)} editingValue={editingField?.value || ''} disabled={selectedReport.status === 'CLOSED'} />
                                    <EditableField label="Antecedentes Escolares" value={selectedReport.schoolBackground} onSave={() => handleUpdateField('schoolBackground')} isEditing={editingField?.field === 'schoolBackground'} onStartEdit={() => setEditingField({ field: 'schoolBackground', value: selectedReport.schoolBackground || '' })} onCancel={() => setEditingField(null)} onChange={(e) => setEditingField(prev => prev ? { ...prev, value: e.target.value } : null)} editingValue={editingField?.value || ''} disabled={selectedReport.status === 'CLOSED'}/>
                                    <EditableField label="Antecedentes Médicos" value={selectedReport.medicalBackground} onSave={() => handleUpdateField('medicalBackground')} isEditing={editingField?.field === 'medicalBackground'} onStartEdit={() => setEditingField({ field: 'medicalBackground', value: selectedReport.medicalBackground || '' })} onCancel={() => setEditingField(null)} onChange={(e) => setEditingField(prev => prev ? { ...prev, value: e.target.value } : null)} editingValue={editingField?.value || ''} disabled={selectedReport.status === 'CLOSED'}/>
                               </div>
                            </Accordion>
                            
                            <Accordion title="Diagnósticos e Hipótesis" isOpen={openAccordion === 'diagnosticos'} onToggle={() => setOpenAccordion(openAccordion === 'diagnosticos' ? null : 'diagnosticos')}>
                                {selectedReport.diagnoses.map(diag => (
                                    <div key={diag.id} className="p-3 mb-2 border-b dark:border-gray-700 last:border-b-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-primary dark:text-secondary">{diag.area}</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{diag.text}</p>
                                                <p className="text-xs text-gray-500 mt-1">Fuente: {diag.source} | Por: {allUsersMap.get(diag.authorId)?.name} el {new Date(diag.timestamp).toLocaleDateString()}</p>
                                            </div>
                                            {selectedReport.status !== 'CLOSED' && (
                                                <div className="flex gap-2 flex-shrink-0 ml-2">
                                                    <button onClick={() => setEditingDiagnosis(diag)} className="text-xs text-blue-600 hover:underline font-medium">Editar</button>
                                                    <button onClick={() => handleDeleteDiagnosis(diag.id)} className="text-xs text-red-600 hover:underline font-medium">Eliminar</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {(isAddingDiagnosis || editingDiagnosis) && <DiagnosisForm currentUser={currentUser} initialDiagnosis={editingDiagnosis} onSave={handleSaveDiagnosis} onCancel={() => { setIsAddingDiagnosis(false); setEditingDiagnosis(null); }} />}
                                {selectedReport.status !== 'CLOSED' && !isAddingDiagnosis && !editingDiagnosis && (
                                    <button onClick={() => setIsAddingDiagnosis(true)} className="mt-2 text-sm font-semibold text-primary dark:text-secondary hover:underline">+ Añadir Diagnóstico</button>
                                )}
                            </Accordion>

                             <Accordion title="Plan de Intervención" isOpen={openAccordion === 'intervencion'} onToggle={() => setOpenAccordion(openAccordion === 'intervencion' ? null : 'intervencion')}>
                               <EditableField label="Estrategias y Objetivos" value={selectedReport.interventionPlan} onSave={() => handleUpdateField('interventionPlan')} isEditing={editingField?.field === 'interventionPlan'} onStartEdit={() => setEditingField({ field: 'interventionPlan', value: selectedReport.interventionPlan || '' })} onCancel={() => setEditingField(null)} onChange={(e) => setEditingField(prev => prev ? { ...prev, value: e.target.value } : null)} editingValue={editingField?.value || ''} disabled={selectedReport.status === 'CLOSED'} />
                            </Accordion>

                             <Accordion title="Seguimiento de Sesiones" isOpen={openAccordion === 'sesiones'} onToggle={() => setOpenAccordion(openAccordion === 'sesiones' ? null : 'sesiones')}>
                                {selectedReport.sessions.map(sess => (
                                     <div key={sess.id} className="p-3 mb-2 border-b dark:border-gray-700 last:border-b-0">
                                         <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-primary dark:text-secondary">{new Date(sess.date + 'T00:00:00').toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })} - {sess.sessionType}</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 break-words mt-1">{sess.notes}</p>
                                                <p className="text-xs text-gray-500 mt-2"><strong>Progreso:</strong> {sess.progressIndicator} | <strong>Por:</strong> {allUsersMap.get(sess.authorId)?.name}</p>
                                            </div>
                                            {selectedReport.status !== 'CLOSED' && (
                                                <div className="flex gap-2 flex-shrink-0 ml-2">
                                                    <button onClick={() => setEditingSession(sess)} className="text-xs text-blue-600 hover:underline font-medium">Editar</button>
                                                    <button onClick={() => handleDeleteSession(sess.id)} className="text-xs text-red-600 hover:underline font-medium">Eliminar</button>
                                                </div>
                                            )}
                                         </div>
                                     </div>
                                ))}
                                {(isAddingSession || editingSession) && <SessionForm currentUser={currentUser} initialSession={editingSession} onSave={handleSaveSession} onCancel={() => { setIsAddingSession(false); setEditingSession(null); }} />}
                                {selectedReport.status !== 'CLOSED' && !isAddingSession && !editingSession && (
                                    <button onClick={() => setIsAddingSession(true)} className="mt-2 text-sm font-semibold text-primary dark:text-secondary hover:underline">+ Registrar Sesión</button>
                                )}
                            </Accordion>

                             <Accordion title="Cierre del Caso" isOpen={openAccordion === 'cierre'} onToggle={() => setOpenAccordion(openAccordion === 'cierre' ? null : 'cierre')}>
                                <EditableField label="Resumen de Cierre y Recomendaciones" value={selectedReport.closingSummary} onSave={() => handleUpdateField('closingSummary')} isEditing={editingField?.field === 'closingSummary'} onStartEdit={() => setEditingField({ field: 'closingSummary', value: selectedReport.closingSummary || '' })} onCancel={() => setEditingField(null)} onChange={(e) => setEditingField(prev => prev ? { ...prev, value: e.target.value } : null)} editingValue={editingField?.value || ''} disabled={selectedReport.status !== 'IN_PROGRESS'}/>
                            </Accordion>

                             <Accordion title="Canal de Comunicación Confidencial" isOpen={openAccordion === 'comunicacion'} onToggle={() => setOpenAccordion(openAccordion === 'comunicacion' ? null : 'comunicacion')}>
                                {selectedConversation ? (
                                    <div className="flex flex-col h-96">
                                        <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-t-lg shadow-inner">
                                            {selectedConversation.messages.map((msg, index) => {
                                                const sender = allUsersMap.get(msg.senderId);
                                                const isSelf = msg.senderId === currentUser.id;
                                                return (
                                                    <div key={index} className={`flex items-start gap-2 ${isSelf ? 'justify-end' : ''}`}>
                                                        {!isSelf && sender && 'avatarUrl' in sender && <img src={sender.avatarUrl} className="w-8 h-8 rounded-full shadow-sm" alt="sender" />}
                                                        <div className={`max-w-md p-3 rounded-lg shadow-sm ${isSelf ? 'bg-primary text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                                            <p className="text-sm break-words">{msg.text}</p>
                                                            <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                        {isSelf && <img src={currentUser.avatarUrl} className="w-8 h-8 rounded-full shadow-sm" alt="self" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg flex items-center gap-2">
                                            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Escribe un mensaje confidencial..." className="flex-1 p-2 border rounded-lg shadow-sm" />
                                            <button type="submit" className="bg-primary text-white rounded-full p-2 hover:bg-primary-focus transition-colors shadow-sm disabled:bg-gray-400" disabled={!newMessage.trim()}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
                                        </form>
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 p-4">No hay un canal de comunicación para este caso.</p>
                                )}
                            </Accordion>
                        </div>

                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        <h3 className="mt-4 text-lg font-semibold">Selecciona un caso</h3>
                        <p className="max-w-sm">Elige un caso de la lista de la izquierda para ver los detalles, registrar sesiones y comunicarte con los involucrados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Psychology;