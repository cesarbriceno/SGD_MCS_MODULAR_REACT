import React, { useState, useEffect, useMemo } from 'react';
import { Folder, FileText, Download, Trash2, Search, Filter, ChevronRight, HardDrive, Calendar, User, Eye, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';
import DocumentUpload from '../../components/common/DocumentUpload';

const DocumentArchive = ({ beneficiaryId, beneficiaryName, onBack }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('folders'); // folders, list
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [showUpload, setShowUpload] = useState(false);

    useEffect(() => {
        loadDocuments();
    }, [beneficiaryId]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const data = await api.history.list();
            // Si hay beneficiaryId, filtramos por él. Si no, mostramos todo.
            const filtered = beneficiaryId
                ? data.filter(d => String(d.ID_Beneficiario) === String(beneficiaryId))
                : data;
            setDocuments(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const folders = useMemo(() => {
        const groups = {};
        documents.forEach(doc => {
            const type = doc.Tipo_Documento || 'Otros';
            if (!groups[type]) groups[type] = [];
            groups[type].push(doc);
        });
        return Object.entries(groups).map(([name, docs]) => ({ name, count: docs.length, docs }));
    }, [documents]);

    const handleDelete = async (id) => {
        const result = await toast.confirm('¿Eliminar documento?', 'Esta acción no se puede deshacer.');
        if (result.isConfirmed) {
            try {
                setDocuments(prev => prev.filter(d => d.ID_Documento !== id));
                await api.history.delete(id);
                toast.success('Eliminado', 'El documento se ha borrado con éxito.');
            } catch (error) {
                console.error(error);
                loadDocuments();
            }
        }
    };

    const displayDocs = selectedFolder
        ? documents.filter(d => d.Tipo_Documento === selectedFolder)
        : documents;

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header / Context */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={20} /></button>
                    )}
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                            <HardDrive className="text-blue-500" size={24} />
                            {selectedFolder ? `Carpeta: ${selectedFolder}` : 'Archivo Inteligente'}
                        </h2>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            {beneficiaryName ? `Repositorio de: ${beneficiaryName}` : 'Expediente General de Documentos'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowUpload(!showUpload)}
                        className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${showUpload ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}
                    >
                        {showUpload ? 'Cancelar' : 'Subir Archivo'}
                    </button>
                    {selectedFolder && (
                        <button onClick={() => setSelectedFolder(null)} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Cerrar Carpeta</button>
                    )}
                </div>
            </div>

            {showUpload && (
                <div className="glass-card p-6 rounded-[2rem] border-blue-500/20 bg-blue-50/10">
                    <DocumentUpload beneficiaryId={beneficiaryId} beneficiaryName={beneficiaryName} onSuccess={() => { setShowUpload(false); loadDocuments(); }} />
                </div>
            )}

            {loading ? (
                <div className="py-20 text-center glass-panel rounded-3xl text-slate-400 font-bold uppercase tracking-widest animate-pulse italic">Consultando expediente...</div>
            ) : !selectedFolder && viewMode === 'folders' ? (
                /* FOLDER VIEW */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {folders.length === 0 ? (
                        <div className="col-span-full py-20 text-center glass-panel rounded-3xl text-slate-400 font-bold uppercase tracking-widest">No hay documentos cargados</div>
                    ) : (
                        folders.map(folder => (
                            <button
                                key={folder.name} onClick={() => setSelectedFolder(folder.name)}
                                className="group relative glass-row p-6 rounded-[2rem] text-left hover:scale-[1.05] transition-all overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Folder size={80} />
                                </div>
                                <div className="bg-blue-500/10 text-blue-600 p-3 rounded-2xl w-fit mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                    <Folder size={28} fill="currentColor" fillOpacity={0.2} />
                                </div>
                                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase truncate mb-1">{folder.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{folder.count} Archivos registrados</p>
                            </button>
                        ))
                    )}
                </div>
            ) : (
                /* LIST VIEW (INSIDE FOLDER) */
                <div className="space-y-3">
                    {displayDocs.length === 0 ? (
                        <div className="py-20 text-center glass-panel rounded-3xl text-slate-400 font-bold uppercase tracking-widest italic">Esta carpeta está vacía</div>
                    ) : (
                        displayDocs.map(doc => {
                            const meta = JSON.parse(doc.Details_JSON || doc.Detalles_JSON || '{}');
                            return (
                                <div key={doc.ID_Documento} className="glass-row p-4 rounded-2xl flex items-center justify-between group">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 transform transition-all group-hover:rotate-12">
                                            <FileText size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black uppercase text-slate-800 dark:text-white truncate">{meta.nombre_original || 'Documento sin nombre'}</p>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                <span className="flex items-center gap-1"><Calendar size={12} /> {doc.Fecha_Registro?.split('T')[0]}</span>
                                                <span className="flex items-center gap-1 text-slate-300">•</span>
                                                <span>{meta.peso || '0 MB'}</span>
                                                <span className="flex items-center gap-1 text-slate-300">•</span>
                                                <span className="flex items-center gap-1"><User size={12} /> {doc.Usuario_Emisor}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a
                                            href={meta.url} target="_blank" rel="noreferrer"
                                            className="p-2 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Previsualizar"
                                        >
                                            <Eye size={18} />
                                        </a>
                                        <a
                                            href={meta.url} download={meta.nombre_original}
                                            className="p-2 hover:bg-green-100 text-slate-400 hover:text-green-600 rounded-lg transition-colors" title="Descargar"
                                        >
                                            <Download size={18} />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(doc.ID_Documento)}
                                            className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors" title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
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
