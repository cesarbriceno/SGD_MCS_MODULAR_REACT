import React, { useState, useEffect, useCallback } from 'react';
import {
    Folder, FileText, Download, Trash2, Search, HardDrive,
    Calendar, User, Eye, Upload, RefreshCw, AlertCircle,
    File, Image, Film, Music, Archive, Code, Sheet
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';
import FileUploader from '../repository/FileUploader';

// ──────────────────────────────────────────────
// Icono según mimetype
const FileIcon = ({ mimeType }) => {
    const type = mimeType || '';
    if (type.includes('pdf')) return <FileText size={20} className="text-red-500" />;
    if (type.includes('image')) return <Image size={20} className="text-purple-500" />;
    if (type.includes('video')) return <Film size={20} className="text-blue-500" />;
    if (type.includes('audio')) return <Music size={20} className="text-green-500" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive size={20} className="text-yellow-600" />;
    if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return <Sheet size={20} className="text-green-600" />;
    if (type.includes('javascript') || type.includes('json') || type.includes('html')) return <Code size={20} className="text-slate-500" />;
    return <File size={20} className="text-slate-400" />;
};

const formatSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
};

// ──────────────────────────────────────────────
const DocumentArchive = ({ beneficiaryId, beneficiaryName, folderId, entityType }) => {
    const [driveFiles, setDriveFiles] = useState([]);
    const [historyDocs, setHistoryDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('drive'); // 'drive' | 'history'
    const [searchQuery, setSearchQuery] = useState('');
    const [showUploader, setShowUploader] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Archivos reales de Drive (si hay folderId)
            if (folderId) {
                const files = await api.drive.getFiles(folderId);
                setDriveFiles(Array.isArray(files) ? files : []);
            } else {
                setDriveFiles([]);
            }

            // 2. Historial de auditoría filtrado por beneficiario
            const history = await api.history.list();
            const parsed = typeof history === 'string' ? JSON.parse(history) : history;
            const filtered = beneficiaryId
                ? (Array.isArray(parsed) ? parsed : []).filter(
                    d => String(d.ID_Beneficiario) === String(beneficiaryId)
                )
                : (Array.isArray(parsed) ? parsed : []);
            setHistoryDocs(filtered);
        } catch (error) {
            console.error('DocumentArchive loadData error:', error);
        } finally {
            setLoading(false);
        }
    }, [folderId, beneficiaryId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDelete = async (fileId) => {
        const confirmed = await toast.confirm('¿Eliminar archivo?', 'Esta acción lo moverá a la papelera de Drive.');
        if (!confirmed) return;
        try {
            setDriveFiles(prev => prev.filter(f => f.id !== fileId));
            await api.drive.deleteFile(fileId);
            toast.success('Eliminado', 'Archivo movido a la papelera.');
        } catch (e) {
            console.error(e);
            loadData();
        }
    };

    const filteredDriveFiles = driveFiles.filter(f =>
        f.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredHistory = historyDocs.filter(d =>
        (d.Tipo_Documento || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.Usuario_Emisor || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                            <HardDrive className="text-blue-500" size={24} />
                            Archivo Inteligente
                        </h2>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            {beneficiaryName ? `Repositorio de: ${beneficiaryName}` : 'Expediente General'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadData}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        title="Recargar"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    {folderId && (
                        <button
                            onClick={() => setShowUploader(true)}
                            className="px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center gap-2"
                        >
                            <Upload size={14} /> Subir Archivo
                        </button>
                    )}
                </div>
            </div>

            {/* Sin carpeta */}
            {!folderId && (
                <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 flex items-center gap-4">
                    <AlertCircle size={24} className="text-amber-500 shrink-0" />
                    <div>
                        <p className="font-bold text-slate-800 dark:text-white text-sm">Sin carpeta vinculada</p>
                        <p className="text-[11px] text-slate-500">Este registro no tiene una carpeta de Drive asignada. Ve a la pestaña Información y genera una.</p>
                    </div>
                </div>
            )}

            {/* Uploader Modal */}
            {showUploader && folderId && (
                <FileUploader
                    folderId={folderId}
                    entityId={beneficiaryId}
                    entityType={entityType}
                    entityName={beneficiaryName}
                    onClose={() => setShowUploader(false)}
                    onUploadComplete={() => { setShowUploader(false); loadData(); }}
                />
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('drive')}
                    className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'drive' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Archivos en Drive {driveFiles.length > 0 && `(${driveFiles.length})`}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Historial de Cambios {historyDocs.length > 0 && `(${historyDocs.length})`}
                </button>
            </div>

            {/* Buscador */}
            <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/40 dark:bg-black/20 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:border-blue-500"
                />
            </div>

            {loading ? (
                <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                    Consultando expediente...
                </div>
            ) : activeTab === 'drive' ? (
                /* ── ARCHIVOS DE DRIVE ── */
                <div className="space-y-2">
                    {filteredDriveFiles.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                            {folderId ? 'La carpeta está vacía' : 'Sin carpeta asignada'}
                        </div>
                    ) : (
                        filteredDriveFiles.map(file => (
                            <div key={file.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/30 dark:bg-black/20 border border-slate-100 dark:border-slate-700/50 group hover:border-blue-200 dark:hover:border-blue-700/50 transition-all">
                                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
                                    <FileIcon mimeType={file.mimeType} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{file.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        {formatSize(file.size)}
                                        {file.lastUpdated && ` · ${new Date(file.lastUpdated).toLocaleDateString('es-CO')}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                        href={file.url} target="_blank" rel="noreferrer"
                                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                                        title="Abrir"
                                    >
                                        <Eye size={16} />
                                    </a>
                                    <a
                                        href={file.url} download={file.name}
                                        className="p-2 hover:bg-green-100 dark:hover:bg-green-900/20 text-slate-400 hover:text-green-600 rounded-lg transition-colors"
                                        title="Descargar"
                                    >
                                        <Download size={16} />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* ── HISTORIAL DE CAMBIOS ── */
                <div className="space-y-2">
                    {filteredHistory.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                            No hay eventos registrados
                        </div>
                    ) : (
                        filteredHistory.map((doc, i) => {
                            let meta = {};
                            try { meta = JSON.parse(doc.Detalles_JSON || doc.Details_JSON || '{}'); } catch { }
                            return (
                                <div key={doc.UUID || i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/30 dark:bg-black/20 border border-slate-100 dark:border-slate-700/50">
                                    <div className={`p-2 rounded-lg shrink-0 text-xs font-black uppercase tracking-wider ${(doc.Tipo_Documento || '').includes('CREATE') ? 'bg-green-100 text-green-700' :
                                            (doc.Tipo_Documento || '').includes('UPDATE') ? 'bg-blue-100 text-blue-700' :
                                                (doc.Tipo_Documento || '').includes('UPLOAD') ? 'bg-purple-100 text-purple-700' :
                                                    (doc.Tipo_Documento || '').includes('DELETE') ? 'bg-red-100 text-red-700' :
                                                        'bg-slate-100 text-slate-600'
                                        }`}>
                                        {(doc.Tipo_Documento || 'ACCIÓN').replace('ENTITY_', '')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                                            {meta.itemName || doc.Nombre_Beneficiario || 'Sin nombre'}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-3 mt-1">
                                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                                <Calendar size={10} />
                                                {doc.Fecha_Emision ? new Date(doc.Fecha_Emision).toLocaleString('es-CO') : '—'}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                                <User size={10} />
                                                {doc.Usuario_Emisor || '—'}
                                            </span>
                                            {meta.context && (
                                                <span className="text-[10px] text-slate-400 italic">{meta.context}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default DocumentArchive;
