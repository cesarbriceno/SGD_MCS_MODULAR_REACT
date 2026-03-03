import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload, FileSpreadsheet, X, CheckCircle2,
    AlertCircle, ArrowLeft, Download, Plus, Save, Users, Check, Trash2, Filter, Eye, EyeOff
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';
import { useNotifications } from '../../context/NotificationContext';
import { generateId, findNextSequence } from '../../utils/idGenerator';

const styles = `
  .glass-card { background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); border-radius: 2rem; }
  .dark .glass-card { background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); }
  .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
  .table-container { box-shadow: inset 0 0 40px rgba(0,0,0,0.02); }
`;

const formatExcelDate = (val) => {
    if (!val) return "";
    try {
        if (typeof val === 'number') {
            const unixTime = Math.round((val - 25569) * 86400 * 1000);
            const date = new Date(unixTime);
            return date.toISOString().split('T')[0];
        }
        if (typeof val === 'string') {
            const parts = val.split(/[\/\-]/);
            if (parts.length === 3) {
                if (parts[0].length <= 2 && parts[2].length === 4) {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                } else if (parts[0].length === 4 && parts[2].length <= 2) {
                    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                }
            }
        }
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        return d.toISOString().split('T')[0];
    } catch (e) { return String(val); }
};

const StudentImport = () => {
    const { addNotification } = useNotifications();
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [validationReport, setValidationReport] = useState(null);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0, status: 'idle' });
    const [showOnlyErrors, setShowOnlyErrors] = useState(false);

    const REQUIRED_FIELDS = ["Nombre1", "Apellido1", "Numero_Documento", "Email", "Cohorte_Ingreso", "Fecha_Ingreso"];
    const ALL_FIELDS = [
        "Tipo_Documento", "Numero_Documento", "Nombre1", "Nombre2", "Apellido1", "Apellido2",
        "Lugar_Expedicion", "Fecha_Expedicion", "Fecha_Nacimiento", "Lugar_Nacimiento", "Sexo",
        "Estado_Civil", "Email", "Celular", "Telefono", "Pais", "Direccion", "Barrio", "Ciudad",
        "Depto_Residencia", "Estrato", "Cohorte_Ingreso", "Fecha_Ingreso", "Estado",
        "Cohorte_Egreso", "Fecha_Egreso", "Fecha_Retiro", "Fecha_Reingreso", "Fecha_Pausa", "Motivo_Estado",
        "Situacion_Laboral_Actual", "Empresa_Institucion", "Cargo_Actual", "Sector_Desempeno", "Rango_Salarial", "Telefono_Empresa",
        "Comentarios"
    ];
    // Fields that should NOT be in the "Template for Filling"
    const AUTO_FIELDS = ["ID_Estudiante", "Fecha_Registro", "Ultima_Actualizacion", "Estado"];
    const TEMPLATE_FIELDS = ALL_FIELDS.filter(f => !AUTO_FIELDS.includes(f));
    const [existingStudents, setExistingStudents] = useState([]);

    React.useEffect(() => {
        const fetchExisting = async () => {
            try {
                const data = await api.students.list();
                setExistingStudents(data || []);
            } catch (e) { console.error("Error fetching students for validation", e); }
        };
        fetchExisting();
    }, []);

    const validateData = (data) => {
        const report = { total: data.length, valid: 0, invalid: 0, errors: [], recs: [] };

        // Calculate starting sequences for IDs
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        let nextSeq = findNextSequence('EST', existingStudents.map(s => s.ID_Estudiante || s.Cedula), year, month);

        const validated = data.map((row, idx) => {
            const rowErrors = [];

            // Check required fields
            REQUIRED_FIELDS.forEach(field => {
                if (!row[field] || String(row[field]).trim() === "") rowErrors.push(`${field} es requerido`);
            });

            // Email format
            if (row.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.Email)) rowErrors.push("Formato de Email inválido");

            // DUPLICATE CHECK
            const doc = String(row.Numero_Documento || "").trim();
            const email = String(row.Email || "").trim().toLowerCase();

            if (doc && existingStudents.some(s => String(s.Cedula || s.Numero_Documento) === doc)) {
                rowErrors.push(`Documento duplicado(${doc})`);
            }
            if (email && existingStudents.some(s => String(s.Email || "").toLowerCase() === email)) {
                rowErrors.push(`Email ya registrado(${email})`);
            }

            if (rowErrors.length > 0) {
                report.invalid++;
                report.errors.push({ row: idx + 1, messages: rowErrors });
                return { ...row, _isValid: false, _errors: rowErrors };
            } else {
                report.valid++;
                // Automatic Metadata Preparation
                const timestamp = now.toLocaleString();
                return {
                    ...row,
                    _isValid: true,
                    ID_Estudiante: row.ID_Estudiante || generateId('EST', { year, month, sequence: nextSeq++ }),
                    Fecha_Registro: timestamp,
                    Ultima_Actualizacion: timestamp,
                    Estado: row.Estado || 'Cursando'
                };
            }
        });

        if (report.invalid > 0) {
            report.recs.push("🚨 Se detectaron registros duplicados o incompletos. Elimínalos para continuar.");
            report.recs.push("💡 El sistema valida automáticamente contra la base de datos actual.");
        } else {
            report.recs.push("✅ ¡Validación exitosa! No hay duplicados y todos los datos cumplen con el esquema.");
            report.recs.push("⚡ Se han generado identificadores y marcas de tiempo automáticamente.");
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

                // Smart Detection: Convert to raw arrays to find the real header row
                const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
                let headerIdx = raw.findIndex(row =>
                    row.length > 2 && row.some(c => {
                        const s = String(c).toLowerCase();
                        return s.includes('nombre') || s.includes('apellido') || s.includes('documento') || s.includes('email');
                    })
                );

                // Fallback: first row with more than 3 non-empty cells
                if (headerIdx < 0) {
                    headerIdx = raw.findIndex(row => row.filter(c => c && String(c).trim()).length > 3);
                }

                const data = XLSX.utils.sheet_to_json(ws, { range: headerIdx >= 0 ? headerIdx : 0 });
                if (data.length === 0) throw new Error("No se detectaron datos válidos en el archivo.");

                // Mapeo Inteligente de Columnas (Smart Mapping)
                const aliases = {
                    Nombre1: ['nombre', 'nombres', 'primer nombre', 'nombre1', 'first name', 'name'],
                    Apellido1: ['apellido', 'apellidos', 'primer apellido', 'apellido1', 'last name', 'surname'],
                    Numero_Documento: ['documento', 'cedula', 'identificacion', 'cc', 'doc', 'id', 'numero_documento', 'numero documento', 'numero de documento'],
                    Email: ['correo', 'mail', 'email', 'contacto', 'e-mail'],
                    Cohorte_Ingreso: ['cohorte', 'ingreso', 'ano ingreso', 'cohorte_ingreso', 'cohorte_ingr', 'cohorte ingreso'],
                    Fecha_Ingreso: ['fecha ingreso', 'ingreso fecha', 'fecha de ingreso', 'fecha_ingreso', 'ingreso'],
                    Fecha_Expedicion: ['fecha expedicion', 'expedicion', 'fecha_expedicion', 'fecha de expedicion', 'fecha_exped'],
                    Lugar_Expedicion: ['lugar expedicion', 'lugar de expedicion', 'lugar_expedicion', 'lugar_exped'],
                    Fecha_Nacimiento: ['fecha nacimiento', 'nacimiento', 'fecha_nacimiento', 'fecha de nacimiento', 'fecha_nacim'],
                    Lugar_Nacimiento: ['lugar nacimiento', 'lugar de nacimiento', 'lugar_nacimiento', 'ciudad', 'ciudad nacimiento'],
                    Celular: ['telefono', 'celular', 'tel', 'movil', 'cel', 'contacto'],
                    Pais: ['pais', 'nacionalidad', 'origen']
                };

                const normalizeStr = (s) => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');

                const mappedData = data.map(row => {
                    const newRow = { ...row };
                    Object.keys(row).forEach(key => {
                        const normKey = normalizeStr(key);
                        for (const [field, aliasList] of Object.entries(aliases)) {
                            const normField = normalizeStr(field);
                            if (normKey === normField || aliasList.some(a => normKey === normalizeStr(a))) {
                                if (!newRow[field]) {
                                    newRow[field] = row[key];
                                }
                            }
                        }
                    });

                    // Email consolidation
                    if (!newRow.Email) {
                        newRow.Email = row['Email'] || row['correo'] || row['email'] || '';
                    }

                    // SANITIZATION: Convert any remaining Date objects to formatted strings to avoid React Error #31
                    Object.keys(newRow).forEach(key => {
                        if (newRow[key] instanceof Date) {
                            newRow[key] = formatExcelDate(newRow[key]);
                        }
                    });

                    return newRow;
                });

                validateData(mappedData);
            } catch (err) {
                setError(err.message);
                setFile(null);
                toast.error("Error", "No se pudo procesar el Excel: " + err.message);
            }
        };
        reader.readAsBinaryString(f);
    };

    const deleteRow = (index) => {
        const newData = [...previewData];
        newData.splice(index, 1);
        validateData(newData.map(({ _isValid, _errors, ...rest }) => rest));
    };

    const deleteColumn = (colName) => {
        const confirm = window.confirm(`¿Seguro que deseas eliminar la columna "${colName}" ? `);
        if (!confirm) return;

        const newData = previewData.map(row => {
            const { [colName]: _, ...rest } = row;
            return rest;
        });
        validateData(newData.map(({ _isValid, _errors, ...rest }) => rest));
    };

    const handleImport = async () => {
        const validRows = previewData.filter(r => r._isValid);
        if (validRows.length === 0) return toast.error("Error", "No hay registros válidos para importar.");

        setLoading(true);
        setImportProgress({ current: 0, total: validRows.length, status: 'importing' });
        let success = 0;

        // Calculate initial sequence for the batch
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // Recalculate sequences before actual import to be safe
        let latestStudents = [];
        try { latestStudents = await api.students.list(); } catch (e) { }
        let nextSeq = findNextSequence('EST', latestStudents.map(s => s.ID_Estudiante || s.Cedula || s.id), year, month);

        for (let i = 0; i < validRows.length; i++) {
            const rawRecord = { ...validRows[i] };

            // Data Cleaning
            const record = {};
            ALL_FIELDS.forEach(f => {
                if (rawRecord[f] !== undefined) {
                    if (f.startsWith('Fecha_')) {
                        record[f] = formatExcelDate(rawRecord[f]);
                    } else {
                        record[f] = rawRecord[f];
                    }
                }
            });

            // Include system-generated tags
            const timestamp = now.toLocaleString();
            record.ID_Estudiante = rawRecord.ID_Estudiante || generateId('EST', { year, month, sequence: nextSeq++ });
            record.Fecha_Registro = rawRecord.Fecha_Registro || timestamp;
            record.Ultima_Actualizacion = rawRecord.Ultima_Actualizacion || timestamp;

            // Map Numero_Documento to Cedula (Backend legacy)
            record.Cedula = rawRecord.Numero_Documento;

            try { await api.students.create(record); success++; } catch (e) { console.error("Error creating student", e); }
            setImportProgress(prev => ({ ...prev, current: i + 1 }));
        }
        toast.success("Éxito", `Se han importado ${success} estudiantes correctamente.`);
        navigate('/students');
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
        const ws = XLSX.utils.aoa_to_sheet([ALL_FIELDS]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
        XLSX.writeFile(wb, "Plantilla_Estudiantes_Completa.xlsx");
    };

    const downloadSimpleTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_FIELDS]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
        XLSX.writeFile(wb, "Plantilla_Estudiantes.xlsx");
    };

    const filteredData = useMemo(() => {
        return showOnlyErrors ? previewData.filter(r => !r._isValid) : previewData;
    }, [previewData, showOnlyErrors]);

    const tableHeaders = useMemo(() => {
        if (previewData.length === 0) return [];
        const cols = new Set();
        previewData.forEach(row => {
            Object.keys(row).forEach(k => {
                if (!k.startsWith('_')) cols.add(k);
            });
        });
        return Array.from(cols);
    }, [previewData]);

    return (
        <div className="animate-fade-in pb-32 pt-6 px-4 md:px-8 max-w-[1600px] mx-auto relative z-10">
            <style>{styles}</style>
            <div className="flex items-center justify-between mb-8 relative z-10">
                <button onClick={() => navigate('/students')} className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card font-bold text-sm hover:bg-white/60 transition-all shadow-sm">
                    <ArrowLeft size={18} /> Volver
                </button>
                <div className="text-center">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-500/20">
                            <Users size={28} />
                        </div>
                        Importación Masiva
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Módulo de Estudiantes • SGD MCS</p>
                </div>
                <div className="w-24"></div>
            </div>

            <div className={`glass-card p-10 text-center border-2 border-dashed transition-all duration-500 ${file ? 'border-blue-500 bg-blue-50/5' : 'border-slate-200 dark:border-white/10 hover:border-blue-400'}`}>
                {!file ? (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mx-auto text-blue-600 shadow-inner">
                            <Upload size={36} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">Preparar Carga Masiva</h2>
                            <p className="text-slate-500 text-sm mt-1">Sube tu archivo Excel para validar los datos antes de ingresarlos</p>
                        </div>
                        <div className="flex justify-center gap-4">
                            <label className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black cursor-pointer shadow-xl shadow-blue-500/20 flex items-center gap-3 hover:bg-blue-500 transition-all transform hover:scale-105 active:scale-95">
                                <Plus size={20} strokeWidth={3} /> Seleccionar Archivo
                                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                            </label>
                            <button onClick={downloadSimpleTemplate} className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl font-black text-slate-700 dark:text-slate-200 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
                                <Download size={20} /> Descargar Plantilla
                            </button>
                            <button onClick={downloadTemplate} className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl font-black text-slate-700 dark:text-slate-200 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
                                <Download size={20} /> Plantilla Completa
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-center gap-6">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                                <CheckCircle2 size={32} />
                            </div>
                            <div className="text-left">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{file.name}</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Archivo cargado correctamente</p>
                            </div>
                        </div>

                        <div className="flex justify-center gap-12 py-4">
                            <div className="text-center group">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 group-hover:text-slate-600 transition-colors">Total Registros</p>
                                <p className="text-3xl font-black text-slate-700 dark:text-white">{validationReport?.total}</p>
                            </div>
                            <div className="text-center group">
                                <p className="text-[10px] font-black text-emerald-400 uppercase mb-1 group-hover:text-emerald-500 transition-colors">Válidos</p>
                                <p className="text-3xl font-black text-emerald-600">{validationReport?.valid}</p>
                            </div>
                            <div className="text-center group">
                                <p className="text-[10px] font-black text-red-400 uppercase mb-1 group-hover:text-red-500 transition-colors">Con Errores</p>
                                <p className="text-3xl font-black text-red-500">{validationReport?.invalid}</p>
                            </div>
                        </div>

                        {importProgress.status === 'importing' && (
                            <div className="max-w-md mx-auto space-y-2">
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 shadow-lg"
                                        style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progreso de importación</p>
                                    <p className="text-xs font-black text-blue-600">{Math.round((importProgress.current / importProgress.total) * 100)}%</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-4">
                            <button onClick={handleImport} disabled={loading || validationReport?.valid === 0}
                                className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center gap-3 hover:bg-blue-500 transition-all transform hover:scale-105 active:scale-95 uppercase text-xs tracking-widest">
                                {loading ? 'Procesando...' : <><Save size={20} strokeWidth={2.5} /> Confirmar e Importar</>}
                            </button>
                            <button onClick={handleCancel} disabled={loading}
                                className="px-8 py-4 bg-white dark:bg-slate-800 text-red-500 rounded-2xl font-black border border-red-100 dark:border-red-900/30 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm uppercase text-xs tracking-widest">
                                <X size={20} strokeWidth={2.5} /> Cancelar todo
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {validationReport && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className={`glass-card p-8 border-l-8 border-l-blue-500 shadow-xl ${validationReport.invalid > 0 ? 'md:col-span-2' : 'md:col-span-3'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                <Check size={18} strokeWidth={3} />
                            </div>
                            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-widest">Análisis de Integridad</h3>
                        </div>
                        <ul className="space-y-3">
                            {validationReport.recs.map((r, i) => (
                                <li key={i} className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-start gap-4 leading-relaxed italic">
                                    <div className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50 flex-shrink-0"></div>
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
                                <h3 className="text-sm font-black uppercase text-red-500 tracking-widest">Alertas Críticas</h3>
                            </div>
                            <div className="max-h-32 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                {validationReport.errors.map((e, i) => (
                                    <div key={i} className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Fila {e.row}</p>
                                        <p className="text-[10px] font-black text-red-600">{e.messages.join(" • ")}</p>
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
                            <div className="p-2 bg-blue-500 rounded-xl text-white shadow-lg">
                                <FileSpreadsheet size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Previsualización de Datos</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Puedes depurar la información antes de la carga final</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${showOnlyErrors ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {showOnlyErrors ? <><EyeOff size={14} /> Mostrando Errores</> : <><Filter size={14} /> Filtrar Errores</>}
                        </button>
                    </div>

                    <div className="overflow-x-auto max-h-[600px] custom-scrollbar table-container">
                        <table className="w-full text-left text-[11px] border-collapse">
                            <thead className="bg-slate-800/5 dark:bg-black/40 text-slate-400 font-black uppercase sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-5 border-b border-white/10 w-16">#</th>
                                    <th className="px-6 py-5 border-b border-white/10 text-center w-24">Estado</th>
                                    <th className="px-6 py-5 border-b border-white/10 text-center w-24">Acción</th>
                                    {tableHeaders.map((h, i) => (
                                        <th key={i} className="px-6 py-5 border-b border-white/10 min-w-[150px] group relative">
                                            <div className="flex items-center justify-between">
                                                <span>{h}</span>
                                                <button onClick={() => deleteColumn(h)} title="Eliminar columna"
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
                                    <tr key={i} className={`group transition-all duration-200 ${row._isValid ? 'hover:bg-blue-50/30' : 'bg-red-500/5 hover:bg-red-500/10'}`}>
                                        <td className="px-6 py-4 font-black text-slate-400 tabular-nums">{i + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                {row._isValid ? (
                                                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 shadow-sm">
                                                        <Check size={10} strokeWidth={3} /> Listo
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 shadow-sm animate-pulse">
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
                                                    title="Eliminar fila"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                        {tableHeaders.map((h, j) => (
                                            <td key={j} className={`px-6 py-4 font-medium tabular-nums ${!row[h] && row._errors?.some(e => e.includes(h)) ? 'bg-red-500/10 text-red-600 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                                                {row[h] || (row._errors?.some(e => e.includes(h)) ? 'Requerido' : '-')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredData.length === 0 && (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                <Filter size={32} />
                            </div>
                            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No hay datos que coincidan con el filtro</p>
                        </div>
                    )}
                    <div className="px-8 py-4 bg-slate-50/50 dark:bg-black/20 border-t border-white/20 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Mostrando {filteredData.length} de {previewData.length} registros</span>
                        <span>{tableHeaders.length} Columnas detectadas</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentImport;
