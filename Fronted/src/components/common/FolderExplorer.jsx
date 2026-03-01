import React, { useState } from 'react';
import {
    Folder, ExternalLink, RefreshCw, Loader2,
    FolderPlus, CheckCircle2, AlertCircle, HardDrive, Upload
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';
import FileUploader from '../../pages/repository/FileUploader';

const FolderExplorer = ({ folderId, folderUrl, entityType, entityId, entityData, onFolderCreated }) => {
    const [loading, setLoading] = useState(false);
    const [showUploader, setShowUploader] = useState(false);

    const handleRegenerateFolder = async () => {
        if (!entityType || !entityId) {
            toast.error('Error', 'No se puede regenerar la carpeta sin tipo y ID de entidad');
            return;
        }

        const confirmed = await toast.confirm(
            'Sincronización de Carpeta',
            'Esto verificará si la carpeta existe en Drive y la vinculará nuevamente. Si no existe, se creará una nueva. ¿Continuar?'
        );

        if (!confirmed) return;

        setLoading(true);
        try {
            const result = await api.drive.sync(entityType, entityId);
            if (result.success) {
                toast.success('Sincronizado', 'Carpeta vinculada correctamente');
                if (onFolderCreated) {
                    onFolderCreated(result.id, result.url);
                }
                // Opcional: Recargar si es crítico, o confiar en el callback
                setTimeout(() => window.location.reload(), 1500);
            } else {
                toast.error('Error', result.message || 'No se pudo sincronizar la carpeta');
            }
        } catch (error) {
            console.error('Error regenerating folder:', error);
            toast.error('Error', 'Falló la conexión con Drive');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadComplete = () => {
        setShowUploader(false);
        toast.success('Éxito', 'Archivo(s) subido(s) a la carpeta de la entidad');
    };

    // Caso 1: Carpeta Existente y Vinculada
    if (folderId && folderUrl) {
        return (
            <>
                <div className="mt-6 p-1 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800/50 dark:to-slate-900/50 border border-indigo-100 dark:border-slate-700/50 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 px-5">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm ring-1 ring-indigo-100 dark:ring-slate-700">
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
                                    alt="Drive"
                                    className="w-8 h-8"
                                />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                        Carpeta en Google Drive
                                    </h4>
                                    <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-[10px] font-bold text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 flex items-center gap-1">
                                        <CheckCircle2 size={10} />
                                        SINCRONIZADO
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-[300px]">
                                    {folderUrl}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <button
                                onClick={() => setShowUploader(true)}
                                className="group relative flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
                            >
                                <Upload size={14} />
                                SUBIR ARCHIVO
                            </button>

                            <a
                                href={folderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                            >
                                <ExternalLink size={14} className="text-indigo-500" />
                                ABRIR
                            </a>

                            <button
                                onClick={handleRegenerateFolder}
                                disabled={loading}
                                title="Re-sincronizar carpeta"
                                className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-500 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-500' : ''} />
                            </button>
                        </div>
                    </div>
                </div>

                {showUploader && (
                    <FileUploader
                        folderId={folderId}
                        entityId={entityId}
                        entityType={entityType}
                        entityName={entityData ? `${entityData.Nombre1 || ''} ${entityData.Apellido1 || ''}`.trim() : ''}
                        onClose={() => setShowUploader(false)}
                        onUploadComplete={handleUploadComplete}
                    />
                )}
            </>
        );
    }

    // Caso 2: Carpeta No Vinculada o Eliminada
    return (
        <div className="mt-6 p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 border-dashed animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl shrink-0 text-amber-600 dark:text-amber-400">
                    <AlertCircle size={24} />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        Carpeta No Vinculada
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            PENDIENTE
                        </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                        Esta entidad no tiene una carpeta asignada en Drive o el enlace se ha roto.
                    </p>
                </div>
                <button
                    onClick={handleRegenerateFolder}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                    {loading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            VINCULANDO...
                        </>
                    ) : (
                        <>
                            <HardDrive size={16} />
                            CREAR CARPETA
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default FolderExplorer;
