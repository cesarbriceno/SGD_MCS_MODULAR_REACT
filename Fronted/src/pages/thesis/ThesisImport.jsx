import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload, FileSpreadsheet, X, CheckCircle2,
    AlertCircle, ArrowLeft, Download, Plus, Save, BookOpen, Check, Trash2, Filter, Eye, EyeOff
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';
import { useNotifications } from '../../context/NotificationContext';

const styles = `
  .glass-card { background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); border-radius: 2rem; }
  .dark .glass-card { background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); }
  .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
  .table-container { box-shadow: inset 0 0 40px rgba(0,0,0,0.02); }
`;

const ThesisImport = () => {
    const { addNotification } = useNotifications();
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [validationReport, setValidationReport] = useState(null);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0, status: 'idle' });
    const [showOnlyErrors, setShowOnlyErrors] = useState(false);

    const REQUIRED_FIELDS = ["Titulo_Investigacion", "Año", "Estado_Tesis", "ID_Estudiante", "ID_Asesor"];
    const THESIS_FIELDS = [
        "Titulo_Investigacion", "Año", "Estado_Tesis", "ID_Estudiante", "ID_Asesor",
        "Modalidad", "Linea_Investigacion_Tesis", "URL_Documento", "Fecha_Inicio", "Fecha_Defensa"
    ];
    const TEMPLATE_FIELDS = [
        "Titulo_Investigacion", "Año", "Estado_Tesis", "ID_Estudiante", "ID_Asesor",
        "Modalidad", "Linea_Investigacion_Tesis", "URL_Documento", "Fecha_Inicio", "Fecha_Defensa",
        "Cedula_Estudiante", "Nombre_Estudiante", "Apellido_Estudiante", "Email_Estudiante",
        "Cedula_Asesor", "Nombre_Asesor", "Apellido_Asesor", "Email_Asesor"
    ];
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [s, t] = await Promise.all([api.students.list(), api.teachers.list()]);
                setStudents(s || []);
                setTeachers(t || []);
            } catch (e) { console.error("Error fetching dependencies", e); }
        };
        fetchData();
    }, []);

    const validateData = (data) => {
        const report = { total: data.length, valid: 0, invalid: 0, errors: [], recs: [] };
        const validated = data.map((row, idx) => {
            const rowErrors = [];

            // 1. Validaciones de Esquema Base (REQUERIDOS)
            ["Titulo_Investigacion", "Año", "Estado_Tesis"].forEach(field => {
                if (!row[field] || String(row[field]).trim() === "") rowErrors.push(`${field} es requerido`);
            });

            // Año entre rangos lógicos
            if (row.Año && (isNaN(row.Año) || row.Año < 1900 || row.Año > 2100)) rowErrors.push("Formato de Año inválido");

            // 2. Identificación de Estudiante y Asesor
            const studentId = String(row.ID_Estudiante || "").trim();
            const studentDoc = String(row.Cedula_Estudiante || row.Documento_Estudiante || "").trim();
            const hasStudentInfo = studentId || (studentDoc && (row.Nombre_Estudiante || row.Nombre1_Estudiante));

            const advisorId = String(row.ID_Asesor || "").trim();
            const advisorDoc = String(row.Cedula_Asesor || row.Documento_Asesor || "").trim();
            const hasAdvisorInfo = advisorId || (advisorDoc && (row.Nombre_Asesor || row.Nombre1_Asesor));

            if (!hasStudentInfo) rowErrors.push("Faltan datos del Estudiante (ID o Cédula+Nombre)");
            if (!hasAdvisorInfo) rowErrors.push("Faltan datos del Asesor (ID o Cédula+Nombre)");

            // Búsqueda local (solo informativa para el reporte)
            let studentMatch = students.find(s =>
                (studentId && s.ID_Estudiante === studentId) ||
                (studentDoc && String(s.Cedula || s.Numero_Documento) === studentDoc)
            );
            let advisorMatch = teachers.find(t =>
                (advisorId && t.ID_Docente === advisorId) ||
                (advisorDoc && String(t.Cedula || t.Numero_Documento) === advisorDoc)
            );

            if (rowErrors.length > 0) {
                report.invalid++;
                report.errors.push({ row: idx + 1, messages: rowErrors });
                return { ...row, _isValid: false, _errors: rowErrors };
            } else {
                report.valid++;
                return {
                    ...row,
                    _isValid: true,
                    _studentMatch: studentMatch,
                    _advisorMatch: advisorMatch,
                    _needsStudent: !studentMatch && !studentId, // Solo crear si no hay ID y hay datos extras
                    _needsAdvisor: !advisorMatch && !advisorId   // Solo crear si no hay ID y hay datos extras
                };
            }
        });

        if (report.invalid > 0) {
            report.recs.push("🚨 Se detectaron celdas vacías en campos obligatorios.");
            report.recs.push("💡 Para registros nuevos, incluye Cédula y Nombre en el Excel.");
        } else {
            report.recs.push("✅ Validación exitosa. El sistema procesará los vínculos automáticamente.");
            report.recs.push("🔗 Los registros existentes se vincularán por ID; los nuevos se crearán si tienen documentación básica.");
        }
        setValidationReport(report);
        setPreviewData(validated);
    };

    const handleFileUpload = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setFile(f);
        setError(null);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
                let headerIdx = raw.findIndex(row =>
                    row.length > 2 && row.some(c => {
                        const s = String(c).toLowerCase();
                        return s.includes('titulo') || s.includes('tesis') || s.includes('investigacion') || s.includes('estudiante');
                    })
                );
                if (headerIdx < 0) headerIdx = raw.findIndex(row => row.filter(c => c && String(c).trim()).length > 3);
                const data = XLSX.utils.sheet_to_json(ws, { range: headerIdx >= 0 ? headerIdx : 0 });
                if (data.length === 0) throw new Error("No se detectaron registros de tesis.");

                // Mapeo Inteligente (Smart Mapping) para Tesis y Vínculos
                const aliases = {
                    Titulo_Investigacion: ['titulo', 'investigacion', 'proyecto', 'nombre proyecto', 'tesis'],
                    Año: ['año', 'periodo', 'year', 'fecha'],
                    Estado_Tesis: ['estado', 'status', 'situacion', 'condicion'],
                    ID_Estudiante: ['id estudiante', 'id_estudiante', 'id alumno', 'estudiante id', 'codigo'],
                    Cedula_Estudiante: ['cedula estudiante', 'documento estudiante', 'id_estudiante_num', 'cc estudiante'],
                    Nombre_Estudiante: ['nombre estudiante', 'alumno', 'estudiante', 'primer nombre estudiante'],
                    ID_Asesor: ['id asesor', 'id_asesor', 'asesor id', 'id tutor', 'tutor'],
                    Cedula_Asesor: ['cedula asesor', 'documento asesor', 'cedula tutor', 'id_asesor_num'],
                    Nombre_Asesor: ['nombre asesor', 'asesor', 'tutor', 'nombre tutor']
                };

                const mappedData = data.map(row => {
                    const newRow = { ...row };
                    Object.keys(row).forEach(key => {
                        const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                        for (const [field, aliasList] of Object.entries(aliases)) {
                            const normField = field.toLowerCase().replace(/[^a-z0-9]/g, '');
                            if (normKey === normField || aliasList.some(a => normKey === a.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
                                newRow[field] = row[key];
                            }
                        }
                    });
                    return newRow;
                });

                validateData(mappedData);
            } catch (err) {
                setError(err.message); setFile(null);
                toast.error("Error", "No se pudo procesar el Excel: " + err.message);
            }
        };
        reader.readAsBinaryString(f);
    };

    const deleteRow = (index) => {
        const newData = [...previewData];
        newData.splice(index, 1);
        validateData(newData.map(({ _isValid, _errors, _studentMatch, _advisorMatch, _needsStudent, _needsAdvisor, ...rest }) => rest));
    };

    const deleteColumn = (colName) => {
        const confirm = window.confirm(`¿Seguro que deseas eliminar la columna "${colName}"?`);
        if (!confirm) return;
        const newData = previewData.map(row => {
            const { [colName]: _, ...rest } = row;
            return rest;
        });
        validateData(newData.map(({ _isValid, _errors, _studentMatch, _advisorMatch, _needsStudent, _needsAdvisor, ...rest }) => rest));
    };

    const handleImport = async () => {
        const validRows = previewData.filter(r => r._isValid);
        if (validRows.length === 0) return toast.error("Error", "No hay tesis válidas.");

        setLoading(true);
        setImportProgress({ current: 0, total: validRows.length, status: 'importing' });
        let success = 0;

        for (let i = 0; i < validRows.length; i++) {
            const row = { ...validRows[i] };
            const now = new Date().toLocaleString();

            try {
                // 1. CASCADING CREATION: STUDENT
                let finalStudentId = row.ID_Estudiante;
                if (row._needsStudent) {
                    const studentData = {
                        ID_Estudiante: `EST-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                        Nombre1: row.Nombre_Estudiante || row.Nombre1_Estudiante,
                        Apellido1: row.Apellido_Estudiante || row.Apellido1_Estudiante || '-',
                        Cedula: row.Cedula_Estudiante || row.Documento_Estudiante,
                        Email: row.Email_Estudiante || `temp_${Date.now()}@example.com`,
                        Fecha_Registro: now,
                        Ultima_Actualizacion: now,
                        Estado: 'Cursando'
                    };
                    const res = await api.students.create(studentData);
                    finalStudentId = studentData.ID_Estudiante;
                } else if (row._studentMatch) {
                    finalStudentId = row._studentMatch.ID_Estudiante;
                }

                // 2. CASCADING CREATION: ADVISOR
                let finalAdvisorId = row.ID_Asesor;
                if (row._needsAdvisor) {
                    const advisorData = {
                        ID_Docente: `DOC-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                        Nombre1: row.Nombre_Asesor || row.Nombre1_Asesor,
                        Apellido1: row.Apellido_Asesor || row.Apellido1_Asesor || '-',
                        Cedula: row.Cedula_Asesor || row.Documento_Asesor,
                        Email: row.Email_Asesor || `temp_doc_${Date.now()}@example.com`,
                        Fecha_Registro: now,
                        Ultima_Actualizacion: now,
                        Activo: 'Sí'
                    };
                    const res = await api.teachers.create(advisorData);
                    finalAdvisorId = advisorData.ID_Docente;
                } else if (row._advisorMatch) {
                    finalAdvisorId = row._advisorMatch.ID_Docente;
                }

                // 3. THESIS CREATION
                const thesisData = {};
                THESIS_FIELDS.forEach(f => { if (row[f] !== undefined) thesisData[f] = row[f]; });

                thesisData.ID_Estudiante = finalStudentId;
                thesisData.ID_Asesor = finalAdvisorId;
                thesisData.ID_Tesis = row.ID_Tesis || `TES-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
                thesisData.Fecha_Registro = row.Fecha_Registro || now;
                thesisData.Ultima_Actualizacion = row.Ultima_Actualizacion || now;

                await api.thesis.create(thesisData);
                success++;
            } catch (e) { console.error("Error importing thesis row", i, e); }

            setImportProgress(prev => ({ ...prev, current: i + 1 }));
        }

        toast.success("Importación Finalizada", `Se registraron ${success} investigaciones con vinculación exitosa.`);
        navigate('/thesis');
    };

    const handleCancel = () => {
        setFile(null);
        setPreviewData([]);
        setValidationReport(null);
        setError(null);
        setImportProgress({ current: 0, total: 0, status: 'idle' });
        setShowOnlyErrors(false);
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_FIELDS]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Tesis");
        XLSX.writeFile(wb, "Plantilla_Tesis.xlsx");
    };

    const filteredData = useMemo(() => {
        return showOnlyErrors ? previewData.filter(r => !r._isValid) : previewData;
    }, [previewData, showOnlyErrors]);

    const tableHeaders = useMemo(() => {
        if (previewData.length === 0) return [];
        return Object.keys(previewData[0]).filter(k => !k.startsWith('_'));
    }, [previewData]);

    return (
        <div className="animate-fade-in pb-32 pt-6 px-4 md:px-8 max-w-7xl mx-auto">
            <style>{styles}</style>
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => navigate('/thesis')} className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card font-bold text-sm hover:bg-white/60 transition-all shadow-sm">
                    <ArrowLeft size={18} /> Volver
                </button>
                <div className="text-center">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-purple-600 rounded-xl text-white shadow-lg shadow-purple-600/20">
                            <BookOpen size={28} />
                        </div>
                        Carga de Investigaciones
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Repositorio Académico • SGD MCS</p>
                </div>
                <div className="w-24"></div>
            </div>

            <div className={`glass-card p-10 text-center border-2 border-dashed transition-all duration-500 ${file ? 'border-purple-500 bg-purple-50/5' : 'border-slate-200 dark:border-white/10 hover:border-purple-400'}`}>
                {!file ? (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-3xl flex items-center justify-center mx-auto text-purple-600 shadow-inner">
                            <Upload size={36} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">Subir Catálogo de Tesis</h2>
                            <p className="text-slate-500 text-sm mt-1">Soporta vinculación inteligente por ID de estudiante</p>
                        </div>
                        <div className="flex justify-center gap-4">
                            <label className="px-8 py-3 bg-purple-600 text-white rounded-2xl font-black cursor-pointer shadow-xl shadow-purple-500/20 flex items-center gap-3 hover:bg-purple-500 transition-all transform hover:scale-105 active:scale-95">
                                <Plus size={20} strokeWidth={3} /> Seleccionar Archivo
                                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                            </label>
                            <button onClick={downloadTemplate} className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl font-black text-slate-600 dark:text-slate-300 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
                                <Download size={20} /> Plantilla Oficial
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-center gap-6">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 shadow-inner">
                                <CheckCircle2 size={32} />
                            </div>
                            <div className="text-left">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{file.name}</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Metadatos listos para importación</p>
                            </div>
                        </div>

                        <div className="flex justify-center gap-12 py-4">
                            <div className="text-center group">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tesis Totales</p>
                                <p className="text-3xl font-black text-slate-700 dark:text-white">{validationReport?.total}</p>
                            </div>
                            <div className="text-center group">
                                <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Listas</p>
                                <p className="text-3xl font-black text-emerald-600">{validationReport?.valid}</p>
                            </div>
                            <div className="text-center group">
                                <p className="text-[10px] font-black text-red-100 bg-red-600 px-2 rounded-full mb-1">Incompletas</p>
                                <p className="text-3xl font-black text-red-500">{validationReport?.invalid}</p>
                            </div>
                        </div>

                        {importProgress.status === 'importing' && (
                            <div className="max-w-md mx-auto space-y-2">
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300 shadow-lg"
                                        style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando con el repositorio</p>
                                    <p className="text-xs font-black text-purple-600">{Math.round((importProgress.current / importProgress.total) * 100)}%</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-4">
                            <button onClick={handleImport} disabled={loading || validationReport?.valid === 0}
                                className="px-10 py-4 bg-purple-600 text-white rounded-2xl font-black shadow-xl shadow-purple-500/20 disabled:opacity-50 flex items-center gap-3 hover:bg-purple-500 transition-all transform hover:scale-105 active:scale-95 uppercase text-xs tracking-widest">
                                {loading ? 'Cargando...' : <><Save size={20} strokeWidth={2.5} /> Integrar Tesis</>}
                            </button>
                            <button onClick={handleCancel} disabled={loading}
                                className="px-8 py-4 bg-white dark:bg-slate-800 text-red-500 rounded-2xl font-black border border-red-100 dark:border-red-900/30 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm uppercase text-xs tracking-widest">
                                <X size={20} strokeWidth={2.5} /> Cancelar Carga
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {validationReport && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="md:col-span-2 glass-card p-8 border-l-8 border-l-purple-500 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                                <Check size={18} strokeWidth={3} />
                            </div>
                            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-widest">Estado de Validación</h3>
                        </div>
                        <ul className="space-y-3">
                            {validationReport.recs.map((r, i) => (
                                <li key={i} className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-start gap-4 italic">
                                    <div className="mt-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full shadow-sm"></div>
                                    {r}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {validationReport.invalid > 0 && (
                        <div className="glass-card p-8 border-l-8 border-l-red-500 shadow-xl bg-red-50/10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-500">
                                    <AlertCircle size={18} strokeWidth={3} />
                                </div>
                                <h3 className="text-sm font-black uppercase text-red-500 tracking-widest">Errores de Metadatos</h3>
                            </div>
                            <div className="max-h-32 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                {validationReport.errors.map((e, i) => (
                                    <div key={i} className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Fila {e.row}</p>
                                        <p className="text-[10px] font-black text-red-600 leading-tight">{e.messages.join(" • ")}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {previewData.length > 0 && (
                <div className="mt-12 glass-card overflow-hidden shadow-2xl border-white/40 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="px-8 py-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl flex justify-between items-center border-b border-white/20 sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-purple-500 rounded-xl text-white shadow-lg shadow-purple-500/20">
                                <FileSpreadsheet size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Depuración de Investigaciones</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Filtra y elimina registros que no cumplan con la norma</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${showOnlyErrors ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {showOnlyErrors ? <><EyeOff size={14} /> Viendo Errores</> : <><Filter size={14} /> Filtrar Errores</>}
                        </button>
                    </div>

                    <div className="overflow-x-auto max-h-[600px] custom-scrollbar table-container">
                        <table className="w-full text-left text-[11px] border-collapse tabular-nums">
                            <thead className="bg-slate-800/10 dark:bg-black/40 text-slate-400 font-black uppercase sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-5 border-b border-white/10 w-16 italic text-center">#</th>
                                    <th className="px-6 py-5 border-b border-white/10 text-center w-24">Estado</th>
                                    <th className="px-6 py-5 border-b border-white/10 text-center w-24">Acción</th>
                                    {tableHeaders.map((h, i) => (
                                        <th key={i} className="px-6 py-5 border-b border-white/10 min-w-[200px] group relative">
                                            <div className="flex items-center justify-between">
                                                <span>{h}</span>
                                                <button onClick={() => deleteColumn(h)} title="Remover columna"
                                                    className="p-1 hover:bg-red-500 hover:text-white rounded-md transition-all text-red-500/50 hover:text-red-600">
                                                    <X size={12} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                                {filteredData.map((row, i) => (
                                    <tr key={i} className={`group transition-all duration-200 ${row._isValid ? 'hover:bg-purple-50/30' : 'bg-red-500/[0.03] hover:bg-red-500/[0.06]'}`}>
                                        <td className="px-6 py-4 font-black text-slate-400 opacity-50 text-center">{i + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                {row._isValid ? (
                                                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-tighter flex items-center gap-1">
                                                        <Check size={10} strokeWidth={3} /> Válida
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full text-[9px] font-black uppercase tracking-tighter flex items-center gap-1">
                                                        <AlertCircle size={10} strokeWidth={3} /> Error
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => deleteRow(i)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all transform hover:scale-110"
                                                    title="Eliminar tesis"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                        {tableHeaders.map((h, j) => (
                                            <td key={j} className={`px-6 py-4 font-bold text-slate-600 dark:text-slate-300 ${!row[h] && row._errors?.some(e => e.includes(h)) ? 'bg-red-500/10 text-red-600' : ''}`}>
                                                {row[h] || (row._errors?.some(e => e.includes(h)) ? 'Obligatorio' : '-')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredData.length === 0 && (
                        <div className="py-24 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                <Filter size={40} />
                            </div>
                            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No hay investigaciones que coincidan</p>
                        </div>
                    )}
                    <div className="px-8 py-5 bg-slate-50/50 dark:bg-black/20 border-t border-white/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <div className="flex gap-10">
                            <span>Tesis en vista: {filteredData.length}</span>
                            <span>Total cargadas: {previewData.length}</span>
                        </div>
                        <span className="flex items-center gap-2"><BookOpen size={12} /> {tableHeaders.length} Campos de información</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThesisImport;

