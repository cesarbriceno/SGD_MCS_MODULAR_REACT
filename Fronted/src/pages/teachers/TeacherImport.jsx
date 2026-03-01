import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload, FileSpreadsheet, X, CheckCircle2,
    AlertCircle, ArrowLeft, Download, Plus, Save, GraduationCap, Check, Trash2, Filter, Eye, EyeOff
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

const TeacherImport = () => {
    const { addNotification } = useNotifications();
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [validationReport, setValidationReport] = useState(null);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0, status: 'idle' });
    const [showOnlyErrors, setShowOnlyErrors] = useState(false);

    const REQUIRED_FIELDS = ["Nombre1", "Apellido1", "Numero_Documento", "Email", "Nivel_Formacion", "Tipo_Vinculacion", "Fecha_Vinculacion"];
    const ALL_FIELDS = [
        "Numero_Documento", "Tipo_Documento", "Nombre1", "Nombre2", "Apellido1", "Apellido2",
        "Lugar_Expedicion", "Sexo", "Telefono", "Pais", "Ciudad", "Email",
        "Nivel_Formacion", "Escalafon", "Dedicacion", "Tipo_Vinculacion", "Fecha_Vinculacion", "Activo"
    ];
    const [existingTeachers, setExistingTeachers] = useState([]);

    React.useEffect(() => {
        const fetchExisting = async () => {
            try {
                const data = await api.teachers.list();
                setExistingTeachers(data || []);
            } catch (e) { console.error("Error fetching teachers", e); }
        };
        fetchExisting();
    }, []);

    const validateData = (data) => {
        const report = { total: data.length, valid: 0, invalid: 0, errors: [], recs: [] };
        const validated = data.map((row, idx) => {
            const rowErrors = [];

            // Required Fields Check
            REQUIRED_FIELDS.forEach(field => {
                const val = row[field] || row[field.toLowerCase()] || row[field.replace(/ /g, '_')];
                if (!val || String(val).trim() === "") rowErrors.push(`${field} es requerido`);
            });

            // Email format
            const email = String(row.Email || row.email || "").trim().toLowerCase();
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) rowErrors.push("Formato de Email inválido");

            // DUPLICATE CHECK
            const doc = String(row.Numero_Documento || row.Cedula || row.cedula || "").trim();
            if (doc && existingTeachers.some(t => String(t.Cedula || t.Numero_Documento) === doc)) {
                rowErrors.push(`Docente ya existe con Documento ${doc}`);
            }
            if (email && existingTeachers.some(t => String(t.Email || "").toLowerCase() === email)) {
                rowErrors.push(`Email ya registrado para docente (${email})`);
            }

            if (rowErrors.length > 0) {
                report.invalid++;
                report.errors.push({ row: idx + 1, messages: rowErrors });
                return { ...row, _isValid: false, _errors: rowErrors };
            } else {
                report.valid++;
                // Automatic Metadata Preparation
                const now = new Date().toLocaleString();
                return {
                    ...row,
                    _isValid: true,
                    ID_Docente: row.ID_Docente || generateId('DOC'),
                    Fecha_Registro: now,
                    Ultima_Actualizacion: now,
                    Activo: row.Activo || 'Sí'
                };
            }
        });

        if (report.invalid > 0) {
            report.recs.push("🚨 Registros con duplicados o faltantes detectados. Limpia la lista para importar.");
            report.recs.push("💡 Validación automática activada: Verificando contra el repositorio central.");
        } else {
            report.recs.push("✅ ¡Perfecto! No se encontraron duplicados y la data está íntegra.");
            report.recs.push("⚙️ Se han adjuntado IDs únicos y metadatos de sincronización.");
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
                        return s.includes('nombre') || s.includes('apellido') || s.includes('documento') || s.includes('formacion');
                    })
                );

                // Fallback: first row with more than 3 non-empty cells
                if (headerIdx < 0) {
                    headerIdx = raw.findIndex(row => row.filter(c => c && String(c).trim()).length > 3);
                }

                const data = XLSX.utils.sheet_to_json(ws, { range: headerIdx >= 0 ? headerIdx : 0 });
                if (data.length === 0) throw new Error("No se detectaron registros válidos en el archivo.");

                // Mapeo Inteligente (Smart Mapping)
                const aliases = {
                    Nombre1: ['nombre', 'nombres', 'primer nombre', 'nombre1', 'first name', 'name'],
                    Apellido1: ['apellido', 'apellidos', 'primer apellido', 'apellido1', 'last name', 'surname'],
                    Numero_Documento: ['documento', 'cedula', 'identificacion', 'cc', 'doc', 'id', 'numero_documento', 'numero documento'],
                    Email: ['correo', 'mail', 'email', 'contacto', 'e-mail'],
                    Nivel_Formacion: ['formacion', 'nivel', 'nivel_formacion', 'postgrado', 'titulo obtenido'],
                    Tipo_Vinculacion: ['vinculacion', 'contrato', 'tipo_vinculacion', 'dedicacion'],
                    Fecha_Vinculacion: ['fecha vinculacion', 'fecha contrato', 'vinculacion fecha', 'fecha_vinculacion']
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
        const confirm = window.confirm(`¿Seguro que deseas eliminar la columna "${colName}"?`);
        if (!confirm) return;

        const newData = previewData.map(row => {
            const { [colName]: _, ...rest } = row;
            return rest;
        });
        validateData(newData.map(({ _isValid, _errors, ...rest }) => rest));
    };

    const handleImport = async () => {
        const validRows = previewData.filter(r => r._isValid);
        if (validRows.length === 0) return toast.error("Error", "No hay registros válidos.");

        setLoading(true);
        setImportProgress({ current: 0, total: validRows.length, status: 'importing' });
        let success = 0;

        // Calculate initial sequence for the batch
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const existingIds = existingTeachers.map(t => t.ID_Docente || t.id);
        let nextSeq = findNextSequence('DOC', existingIds, year, month);

        for (let i = 0; i < validRows.length; i++) {
            const rawRecord = { ...validRows[i] };

            // Data Cleaning
            const record = {};
            ALL_FIELDS.forEach(f => { if (rawRecord[f] !== undefined) record[f] = rawRecord[f]; });

            // Include system-generated tags
            const timestamp = now.toLocaleString();
            record.ID_Docente = rawRecord.ID_Docente || generateId('DOC', { year, month, sequence: nextSeq++ });
            record.Fecha_Registro = rawRecord.Fecha_Registro || timestamp;
            record.Ultima_Actualizacion = rawRecord.Ultima_Actualizacion || timestamp;
            record.Fecha_Vinculacion = rawRecord.Fecha_Vinculacion || timestamp;

            try { await api.teachers.create(record); success++; } catch (e) { }
            setImportProgress(prev => ({ ...prev, current: i + 1 }));
        }
        toast.success("Éxito", `${success} docentes importados correctamente.`);
        navigate('/teachers');
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
        XLSX.utils.book_append_sheet(wb, ws, "Docentes");
        XLSX.writeFile(wb, "Plantilla_Docentes.xlsx");
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
                <button onClick={() => navigate('/teachers')} className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card font-bold text-sm hover:bg-white/60 transition-all shadow-sm">
                    <ArrowLeft size={18} /> Volver
                </button>
                <div className="text-center">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                            <GraduationCap size={28} />
                        </div>
                        Carga de Docentes
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión de Talento Humano • SGD MCS</p>
                </div>
                <div className="w-24"></div>
            </div>

            <div className={`glass-card p-10 text-center border-2 border-dashed transition-all duration-500 ${file ? 'border-emerald-500 bg-emerald-50/5' : 'border-slate-200 dark:border-white/10 hover:border-emerald-400'}`}>
                {!file ? (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                            <Upload size={36} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">Importar Catálogo Docente</h2>
                            <p className="text-slate-500 text-sm mt-1">Formatos permitidos: .xlsx, .xls</p>
                        </div>
                        <div className="flex justify-center gap-4">
                            <label className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black cursor-pointer shadow-xl shadow-emerald-500/20 flex items-center gap-3 hover:bg-emerald-500 transition-all transform hover:scale-105 active:scale-95">
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
                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                                <CheckCircle2 size={32} />
                            </div>
                            <div className="text-left">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{file.name}</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Documento listo para procesar</p>
                            </div>
                        </div>

                        <div className="flex justify-center gap-12 py-4">
                            <div className="text-center group">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Registros</p>
                                <p className="text-3xl font-black text-slate-700 dark:text-white">{validationReport?.total}</p>
                            </div>
                            <div className="text-center group">
                                <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Listos</p>
                                <p className="text-3xl font-black text-emerald-600">{validationReport?.valid}</p>
                            </div>
                            <div className="text-center group">
                                <p className="text-[10px] font-black text-red-100 bg-red-500 px-2 rounded-full mb-1">Alertas</p>
                                <p className="text-3xl font-black text-red-500">{validationReport?.invalid}</p>
                            </div>
                        </div>

                        {importProgress.status === 'importing' && (
                            <div className="max-w-md mx-auto space-y-2">
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300 shadow-lg"
                                        style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando con servidor</p>
                                    <p className="text-xs font-black text-emerald-600">{Math.round((importProgress.current / importProgress.total) * 100)}%</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-4">
                            <button onClick={handleImport} disabled={loading || validationReport?.valid === 0}
                                className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-3 hover:bg-emerald-500 transition-all transform hover:scale-105 active:scale-95 uppercase text-xs tracking-widest">
                                {loading ? 'Importando...' : <><Save size={20} strokeWidth={2.5} /> Confirmar Carga</>}
                            </button>
                            <button onClick={handleCancel} disabled={loading}
                                className="px-8 py-4 bg-white dark:bg-slate-800 text-red-500 rounded-2xl font-black border border-red-100 dark:border-red-900/30 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm uppercase text-xs tracking-widest">
                                <X size={20} strokeWidth={2.5} /> Descartar todo
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {validationReport && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="md:col-span-2 glass-card p-8 border-l-8 border-l-emerald-500 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                                <Check size={18} strokeWidth={3} />
                            </div>
                            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-widest">Informe de Validación</h3>
                        </div>
                        <ul className="space-y-3">
                            {validationReport.recs.map((r, i) => (
                                <li key={i} className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-start gap-4 italic">
                                    <div className="mt-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-sm"></div>
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
                                <h3 className="text-sm font-black uppercase text-red-500 tracking-widest">Errores Críticos</h3>
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
                            <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg">
                                <FileSpreadsheet size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Depuración de Datos</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-tighter">Elimina filas o columnas irrelevantes para limpiar la carga</p>
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
                            <thead className="bg-slate-800/5 dark:bg-black/40 text-slate-400 font-black uppercase sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-5 border-b border-white/10 w-16 text-center italic">#</th>
                                    <th className="px-6 py-5 border-b border-white/10 text-center w-24">Vínculo</th>
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
                                    <tr key={i} className={`group transition-all duration-200 ${row._isValid ? 'hover:bg-emerald-50/30' : 'bg-red-500/[0.03] hover:bg-red-500/[0.06]'}`}>
                                        <td className="px-6 py-4 font-black text-slate-300 text-center">{i + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                {row._isValid ? (
                                                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 shadow-sm">
                                                        <Check size={10} strokeWidth={3} /> Válido
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 shadow-sm">
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
                                                    title="Eliminar registro"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                        {tableHeaders.map((h, j) => (
                                            <td key={j} className={`px-6 py-4 font-semibold text-slate-500 dark:text-slate-300 ${!row[h] && row._errors?.some(e => e.includes(h)) ? 'bg-red-500/5 text-red-600' : ''}`}>
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
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                <Filter size={40} />
                            </div>
                            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Sin coincidencias para el filtro activo</p>
                        </div>
                    )}
                    <div className="px-8 py-5 bg-slate-50/50 dark:bg-black/20 border-t border-white/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <div className="flex gap-6">
                            <span>Registros en vista: {filteredData.length}</span>
                            <span>Total cargados: {previewData.length}</span>
                        </div>
                        <span className="flex items-center gap-2"><FileSpreadsheet size={12} /> {tableHeaders.length} Campos detectados</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherImport;

