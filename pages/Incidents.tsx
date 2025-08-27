import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getIncidents, updateIncident } from '../db';
import type { Incident, Student } from '../types';
import { IncidentType } from '../types';
import { MOCK_STUDENTS } from '../constants';

// --- Helper Functions for Downloading ---

const generateCSV = (incidentsToExport: Incident[]): string => {
    const headers = ['ID', 'Estudiante', 'Docente que Reporta', 'Lugar', 'Tipo', 'Descripción', 'Fecha', 'Estado Sincronización'];
    const rows = incidentsToExport.map(inc => [
        inc.id,
        `"${inc.studentName.replace(/"/g, '""')}"`,
        `"${inc.teacherName.replace(/"/g, '""')}"`,
        `"${inc.location.replace(/"/g, '""')}"`,
        `"${inc.type}"`,
        `"${inc.notes.replace(/"/g, '""')}"`,
        `"${new Date(inc.timestamp).toLocaleString()}"`,
        inc.synced ? 'Sincronizado' : 'Pendiente'
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const generatePDFHTML = (title: string, incidentsToExport: Incident[]): string => {
    const rows = incidentsToExport.map(inc => `
        <tr>
            <td>${inc.studentName}</td>
            <td>${inc.teacherName}</td>
            <td>${inc.location}</td>
            <td>${inc.type}</td>
            <td>${new Date(inc.timestamp).toLocaleString('es-CO')}</td>
            <td class="notes">${inc.notes}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #333; margin: 20px; }
                h1 { color: #005A9C; border-bottom: 2px solid #005A9C; padding-bottom: 10px; font-size: 24px; }
                p { font-size: 12px; color: #555; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; color: #333; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .notes { white-space: pre-wrap; word-break: break-word; }
                 @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <p class="no-print" style="background-color: #fffae6; border: 1px solid #ffecb3; padding: 15px; border-radius: 5px;">
                <strong>Instrucción:</strong> Para guardar como PDF, use la función de Imprimir de su navegador (Ctrl+P o Cmd+P) y seleccione "Guardar como PDF" como destino.
            </p>
            <h1>${title}</h1>
            <p>Generado el: ${new Date().toLocaleString('es-CO')}</p>
            <table>
                <thead>
                    <tr>
                        <th>Estudiante</th>
                        <th>Reportado por</th>
                        <th>Lugar</th>
                        <th>Tipo</th>
                        <th>Fecha</th>
                        <th style="width: 40%;">Descripción</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </body>
        </html>
    `;
};


// --- Component ---

const Incidents: React.FC = () => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [view, setView] = useState<'active' | 'archived'>('active');

    // Download Modal State
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [downloadType, setDownloadType] = useState<'filtered' | 'student' | 'grade' | 'group' | 'all'>('filtered');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    
    const studentGrades = useMemo(() => Array.from(new Set(MOCK_STUDENTS.map(s => s.grade))).sort(), []);
    const studentGroups = useMemo(() => Array.from(new Set(MOCK_STUDENTS.map(s => s.group))).sort(), []);

    const loadData = async () => {
        setLoading(true);
        const data = await getIncidents();
        setIncidents(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const displayedIncidents = useMemo(() => {
        return incidents.filter(inc => {
            const matchesView = view === 'active' ? !inc.archived : inc.archived;
            if (!matchesView) return false;

            const matchesSearch =
                inc.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inc.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inc.notes.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = typeFilter === 'all' || inc.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [incidents, searchQuery, typeFilter, view]);

    const handleDownload = (format: 'csv' | 'pdf') => {
        let incidentsToExport: Incident[] = [];
        let reportTitle = "Reporte de Incidencias";
        let filename = "reporte_incidencias";

        switch (downloadType) {
            case 'student':
                if (!selectedStudentId) {
                    alert("Por favor, seleccione un estudiante.");
                    return;
                }
                const student = MOCK_STUDENTS.find(s => s.id === parseInt(selectedStudentId));
                incidentsToExport = incidents.filter(inc => inc.studentId === parseInt(selectedStudentId));
                reportTitle = `Reporte de Incidencias - ${student?.name}`;
                filename = `reporte_${student?.name.replace(/\s/g, '_')}`;
                break;
            case 'grade':
                 if (!selectedGrade) {
                    alert("Por favor, seleccione un grado.");
                    return;
                }
                const studentIdsInGrade = MOCK_STUDENTS.filter(s => s.grade === selectedGrade).map(s => s.id);
                incidentsToExport = incidents.filter(inc => studentIdsInGrade.includes(inc.studentId));
                reportTitle = `Reporte de Incidencias - Grado ${selectedGrade}`;
                filename = `reporte_grado_${selectedGrade.replace(/\s/g, '_')}`;
                break;
            case 'group':
                if (!selectedGroup) {
                    alert("Por favor, seleccione un grupo.");
                    return;
                }
                const studentIdsInGroup = MOCK_STUDENTS.filter(s => s.group === selectedGroup).map(s => s.id);
                incidentsToExport = incidents.filter(inc => studentIdsInGroup.includes(inc.studentId));
                reportTitle = `Reporte de Incidencias - Grupo ${selectedGroup}`;
                filename = `reporte_grupo_${selectedGroup}`;
                break;
            case 'all':
                incidentsToExport = incidents.filter(inc => !inc.archived);
                reportTitle = "Reporte Completo de Incidencias Activas";
                filename = "reporte_completo_activas";
                break;
            case 'filtered':
            default:
                incidentsToExport = displayedIncidents;
                reportTitle = "Reporte Filtrado de Incidencias";
                filename = "reporte_filtrado";
        }
        
        if (incidentsToExport.length === 0) {
            alert("No hay incidencias para exportar con los criterios seleccionados.");
            return;
        }

        if (format === 'csv') {
            const csvContent = generateCSV(incidentsToExport);
            downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
        } else {
            const htmlContent = generatePDFHTML(reportTitle, incidentsToExport);
            const pdfWindow = window.open("", "_blank");
            pdfWindow?.document.write(htmlContent);
            pdfWindow?.document.close();
        }
        setIsDownloadModalOpen(false);
    };

    const handleToggleArchive = async (id: string, archive: boolean) => {
        const incidentToUpdate = incidents.find(inc => inc.id === id);
        if (incidentToUpdate) {
            await updateIncident({ ...incidentToUpdate, archived: archive });
            await loadData();
        }
    };

    const handleCleanIncidents = async () => {
        const activeIncidents = displayedIncidents.filter(inc => !inc.archived);
        if (activeIncidents.length === 0) {
             alert("No hay incidencias activas para limpiar en la vista actual.");
            return;
        }
        if (confirm(`¿Estás seguro de que quieres archivar las ${activeIncidents.length} incidencia(s) activas mostradas?`)) {
            setLoading(true);
            const promises = activeIncidents.map(inc => updateIncident({ ...inc, archived: true }));
            await Promise.all(promises);
            await loadData();
        }
    };

    const renderDownloadModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg mx-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Descargar Reportes</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Reporte</label>
                        <select
                            value={downloadType}
                            onChange={(e) => setDownloadType(e.target.value as any)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
                        >
                            <option value="filtered">Reporte Filtrado Actual</option>
                            <option value="student">Por Estudiante</option>
                            <option value="grade">Por Grado</option>
                            <option value="group">Por Grupo</option>
                            <option value="all">Reporte Completo (solo activas)</option>
                        </select>
                    </div>

                    {downloadType === 'student' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Estudiante</label>
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
                            >
                                <option value="">-- Elija un estudiante --</option>
                                {MOCK_STUDENTS.sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}

                    {downloadType === 'grade' && (
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Grado</label>
                            <select
                                value={selectedGrade}
                                onChange={(e) => setSelectedGrade(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
                            >
                                <option value="">-- Elija un grado --</option>
                                {studentGrades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    )}
                     {downloadType === 'group' && (
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Grupo</label>
                            <select
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
                            >
                                <option value="">-- Elija un grupo --</option>
                                {studentGroups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                    <button onClick={() => setIsDownloadModalOpen(false)} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Cancelar</button>
                    <button onClick={() => handleDownload('csv')} className="px-6 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors">Descargar CSV</button>
                    <button onClick={() => handleDownload('pdf')} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-focus transition-colors">Descargar PDF</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-md space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-800">Gestión de Incidencias</h1>
                    <div className="flex items-center space-x-2">
                        {view === 'active' && (
                             <button
                                onClick={handleCleanIncidents}
                                className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                                title="Archivar todas las incidencias actualmente visibles"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm10 12H5V5h10v10z" /><path d="M7 7h6v2H7z" /></svg>
                                <span>Limpiar</span>
                            </button>
                        )}
                        <button
                            onClick={() => setIsDownloadModalOpen(true)}
                            className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            <span>Descargar Reportes</span>
                        </button>
                    </div>
                </div>
                <hr/>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Buscar por estudiante, docente, o descripción..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent md:col-span-2 bg-white text-gray-900 placeholder-gray-500"
                    />
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                        <option value="all">Todos los Tipos</option>
                        {Object.values(IncidentType).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                 <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
                        <button
                            onClick={() => setView('active')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${view === 'active' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Activas
                        </button>
                        <button
                            onClick={() => setView('archived')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${view === 'archived' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Historial (Archivadas)
                        </button>
                    </nav>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Estudiante</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Lugar</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Docente</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-8 text-gray-500">Cargando incidencias...</td></tr>
                            ) : displayedIncidents.length > 0 ? (
                                displayedIncidents.map(incident => (
                                    <tr key={incident.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap"><span className="font-medium text-gray-900">{incident.studentName}</span></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{incident.location}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{incident.teacherName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{incident.type}</span></td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-900 max-w-xs truncate" title={incident.notes}>{incident.notes}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(incident.timestamp).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {incident.synced ? (
                                                <span className="text-green-600 flex items-center"><svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Sincronizado</span>
                                            ) : (
                                                <span className="text-amber-600 flex items-center"><svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Pendiente</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {view === 'active' ? (
                                                <button onClick={() => handleToggleArchive(incident.id, true)} className="text-sm font-semibold text-amber-600 hover:text-amber-800">Archivar</button>
                                            ) : (
                                                <button onClick={() => handleToggleArchive(incident.id, false)} className="text-sm font-semibold text-green-600 hover:text-green-800">Restaurar</button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={8} className="text-center py-8 text-gray-500">
                                    {view === 'active'
                                        ? 'No se encontraron incidencias activas con los filtros actuales.'
                                        : 'No hay incidencias en el historial.'
                                    }
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {isDownloadModalOpen && renderDownloadModal()}
        </div>
    );
};

export default Incidents;