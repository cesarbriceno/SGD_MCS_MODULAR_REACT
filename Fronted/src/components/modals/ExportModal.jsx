import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, FileText, Download, Check, Settings2, LayoutTemplate, Type, Square, CheckSquare } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

const ExportModal = ({ isOpen, onClose, data, sourceName = "Reporte" }) => {
    const [format, setFormat] = useState('excel');
    const [availableColumns, setAvailableColumns] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);

    // Configuración PDF
    const [pdfConfig, setPdfConfig] = useState({
        pageSize: 'letter',
        orientation: 'portrait',
        fontSize: 9
    });

    useEffect(() => {
        if (selectedColumns.length > 8 && format === 'pdf') {
            setPdfConfig(prev => ({ ...prev, orientation: 'landscape' }));
        }
    }, [selectedColumns.length, format]);

    // Generar columnas al abrir basado en la data
    useEffect(() => {
        if (isOpen && data && data.length > 0) {
            const firstItem = data[0];
            // Prioridad a 'raw' (datos originales BD), si no usa el objeto procesado
            const sourceObject = firstItem.raw ? firstItem.raw : firstItem;

            const blacklist = ['Fecha_Registro', 'Ultima_Actualizacion', 'fecha_registro', 'ultima_actualizacion'];
            const dynamicCols = Object.keys(sourceObject)
                .filter(key => !blacklist.includes(key))
                .map(key => ({
                    key: key,
                    // Formato bonito: "nombre_usuario" -> "NOMBRE USUARIO"
                    label: key.replace(/_/g, ' ').toUpperCase()
                }));

            setAvailableColumns(dynamicCols);
            // Por defecto seleccionamos todas
            setSelectedColumns(dynamicCols.map(c => c.key));
        }
    }, [isOpen, data]);

    if (!isOpen) return null;

    // --- MANEJO DE SELECCIÓN ---
    const toggleColumn = (key) => {
        if (selectedColumns.includes(key)) {
            setSelectedColumns(selectedColumns.filter(c => c !== key));
        } else {
            setSelectedColumns([...selectedColumns, key]);
        }
    };

    const toggleAll = () => {
        if (selectedColumns.length === availableColumns.length) {
            setSelectedColumns([]);
        } else {
            setSelectedColumns(availableColumns.map(c => c.key));
        }
    };

    const handleExport = () => {
        const colsToExport = availableColumns.filter(col => selectedColumns.includes(col.key));
        if (format === 'excel') {
            exportToExcel(data, colsToExport, sourceName);
        } else {
            exportToPDF(data, colsToExport, sourceName, pdfConfig);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/10 relative">

                {/* HEADER */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/80 dark:bg-white/5 backdrop-blur-xl">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Configurar Exportación</h3>
                        <p className="text-xs font-medium text-gray-500">NEXODO • {sourceName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-200 dark:bg-white/10 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

                    {/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
                    <div className="w-full md:w-5/12 bg-gray-50/50 dark:bg-black/20 border-r border-gray-100 dark:border-white/5 p-6 overflow-y-auto custom-scrollbar">

                        {/* 1. FORMATO */}
                        <div className="mb-8">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Formato de Archivo</label>
                            <div className="space-y-3">
                                {/* Botón Excel Sólido */}
                                <button
                                    onClick={() => setFormat('excel')}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${format === 'excel'
                                        ? 'bg-white dark:bg-white/5 border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                                        : 'bg-white dark:bg-white/5 border-transparent hover:bg-gray-50 dark:hover:bg-white/10'}`}
                                >
                                    <div className={`p-2 rounded-lg ${format === 'excel' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400 dark:bg-white/10'}`}><FileSpreadsheet size={20} /></div>
                                    <div className="text-left">
                                        <span className={`block text-sm font-bold ${format === 'excel' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>Excel</span>
                                        <span className="text-[10px] text-gray-400">Hoja de cálculo .xlsx</span>
                                    </div>
                                    {format === 'excel' && <Check size={18} className="ml-auto text-emerald-500" />}
                                </button>

                                {/* Botón PDF Sólido */}
                                <button
                                    onClick={() => setFormat('pdf')}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${format === 'pdf'
                                        ? 'bg-white dark:bg-white/5 border-red-500 shadow-md ring-1 ring-red-500/20'
                                        : 'bg-white dark:bg-white/5 border-transparent hover:bg-gray-50 dark:hover:bg-white/10'}`}
                                >
                                    <div className={`p-2 rounded-lg ${format === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400 dark:bg-white/10'}`}><FileText size={20} /></div>
                                    <div className="text-left">
                                        <span className={`block text-sm font-bold ${format === 'pdf' ? 'text-red-700 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>PDF</span>
                                        <span className="text-[10px] text-gray-400">Documento portátil .pdf</span>
                                    </div>
                                    {format === 'pdf' && <Check size={18} className="ml-auto text-red-500" />}
                                </button>
                            </div>
                        </div>

                        {/* 2. OPCIONES PDF (ANIMADO) */}
                        {format === 'pdf' && (
                            <div className="animate-in slide-in-from-left-4 fade-in duration-300 space-y-5">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1"><LayoutTemplate size={12} /> Tamaño de Hoja</label>
                                    <div className="flex gap-2 bg-gray-200/50 dark:bg-white/5 p-1 rounded-xl">
                                        {['letter', 'a4', 'legal'].map(s => (
                                            <button key={s} onClick={() => setPdfConfig({ ...pdfConfig, pageSize: s })} className={`flex-1 py-1.5 text-[11px] rounded-lg font-bold capitalize transition-all ${pdfConfig.pageSize === s ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1"><Settings2 size={12} /> Orientación</label>
                                    <div className="flex gap-2 bg-gray-200/50 dark:bg-white/5 p-1 rounded-xl">
                                        <button onClick={() => setPdfConfig({ ...pdfConfig, orientation: 'portrait' })} className={`flex-1 py-1.5 text-[11px] rounded-lg font-bold transition-all ${pdfConfig.orientation === 'portrait' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Vertical</button>
                                        <button onClick={() => setPdfConfig({ ...pdfConfig, orientation: 'landscape' })} className={`flex-1 py-1.5 text-[11px] rounded-lg font-bold transition-all ${pdfConfig.orientation === 'landscape' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Horizontal</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1"><Type size={12} /> Tamaño Fuente</label>
                                    <input
                                        type="range" min="6" max="14" step="1"
                                        value={pdfConfig.fontSize}
                                        onChange={(e) => setPdfConfig({ ...pdfConfig, fontSize: parseInt(e.target.value) })}
                                        className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                                        <span>6pt</span>
                                        <span className="text-blue-600 dark:text-blue-400">{pdfConfig.fontSize}pt</span>
                                        <span>14pt</span>
                                    </div>
                                </div>
                                {selectedColumns.length > 10 && (
                                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-tight">
                                            ⚠️ Muchas columnas seleccionadas. Se recomienda usar orientación horizontal y fuente pequeña (7pt).
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* COLUMNA DERECHA: SELECCIÓN DE CAMPOS */}
                    <div className="w-full md:w-7/12 p-6 flex flex-col bg-white dark:bg-[#1c1c1e]">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Campos ({selectedColumns.length}/{availableColumns.length})
                            </label>
                            <button onClick={toggleAll} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                {selectedColumns.length === availableColumns.length ? 'Desmarcar todo' : 'Marcar todo'}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar flex-1 content-start pr-2">
                            {availableColumns.map((col) => {
                                const isSelected = selectedColumns.includes(col.key);
                                return (
                                    <div
                                        key={col.key}
                                        onClick={() => toggleColumn(col.key)}
                                        className={`
                                            flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all duration-200 select-none group
                                            ${isSelected
                                                ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30'
                                                : 'bg-gray-50 dark:bg-white/5 border-transparent hover:bg-gray-100 dark:hover:bg-white/10'}
                                        `}
                                    >
                                        <span className={`text-[11px] font-bold truncate mr-2 ${isSelected ? 'text-blue-800 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {col.label}
                                        </span>
                                        {/* SWITCH ESTILO IOS */}
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shadow-sm ${isSelected ? 'bg-blue-500 scale-110' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                            {isSelected && <Check size={12} strokeWidth={4} className="text-white" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* FOOTER ACCIONES */}
                <div className="p-5 bg-gray-50/80 dark:bg-white/5 backdrop-blur-md border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-white/10 transition-all shadow-sm">
                        Cancelar
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={selectedColumns.length === 0}
                        className="px-8 py-3 rounded-2xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Download size={18} strokeWidth={2.5} />
                        Descargar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;