import React, { useState } from 'react';
import {
    Folder, Download, Trash2, Edit2,
    Move, Eye, MoreVertical, Check, Grid, List as ListIcon,
    ArrowUpRight, Copy
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';
import FileIcon from '../../components/common/FileIcon';

const FileManager = ({
    files,
    folders,
    viewMode,
    loading,
    selectedItems,
    onItemSelect,
    onFolderClick,
    onRefresh
}) => {
    const [contextMenu, setContextMenu] = useState(null);

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleItemClick = (item, isFolder) => {
        if (isFolder) {
            onFolderClick(item);
        } else {
            const isSelected = selectedItems.includes(item.id);
            if (isSelected) {
                onItemSelect(selectedItems.filter(id => id !== item.id));
            } else {
                onItemSelect([...selectedItems, item.id]);
            }
        }
    };

    const handleContextMenu = (e, item, isFolder) => {
        e.preventDefault();
        e.stopPropagation(); // Detener propagación para no activar click del item
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            item,
            isFolder
        });
    };

    const handleDelete = async (item, isFolder) => {
        if (!await toast.confirm(
            `Eliminar ${isFolder ? 'carpeta' : 'archivo'}`,
            `¿Estás seguro de eliminar "${item.name}"? Esta acción no se puede deshacer.`
        )) return;

        try {
            const result = isFolder
                ? await api.drive.deleteFolder(item.id)
                : await api.drive.deleteFile(item.id);

            if (result.success) {
                toast.success('Eliminado', 'Elemento movido a la papelera');
                onRefresh();
            }
        } catch (error) {
            toast.error('Error', 'No se pudo eliminar');
        }
        setContextMenu(null);
    };

    const handleDownload = async (item) => {
        try {
            toast.info('Preparando descarga', 'Espera un momento...');
            const res = await api.drive.downloadFile(item.id);
            if (res.success && res.content) {
                const byteCharacters = atob(res.content);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: res.mimeType || 'application/octet-stream' });

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = res.name || item.name;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success('Listo', 'Archivo descargado');
            } else {
                toast.error('Error', res.message || 'No se pudo descargar el archivo');
            }
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Error', 'Fallo técnico en la descarga');
        }
        setContextMenu(null);
    };

    const handleRename = async (item, isFolder) => {
        const { value: newName, isConfirmed } = await toast.prompt(
            'Renombrar',
            'Ingresa el nuevo nombre:',
            item.name
        );

        if (!isConfirmed || !newName || newName === item.name) return;

        try {
            const result = isFolder
                ? await api.drive.renameFolder(item.id, newName)
                : await api.drive.renameFile(item.id, newName);

            if (result.success) {
                toast.success('Renombrado', 'Nombre actualizado correctamente');
                onRefresh();
            }
        } catch (error) {
            toast.error('Error', 'No se pudo renombrar');
        }
        setContextMenu(null);
    };

    // Cerrar menú al hacer click fuera
    React.useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                ))}
            </div>
        );
    }

    const allItems = [
        ...folders.map(f => ({ ...f, isFolder: true })),
        ...files.map(f => ({ ...f, isFolder: f.type === 'folder' }))
    ];

    if (allItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center opacity-50">
                <Folder size={64} className="mb-4 text-slate-300" />
                <p className="text-xl font-medium text-slate-400">Carpeta vacía</p>
                <p className="text-sm text-slate-400">No hay archivos ni carpetas aquí</p>
            </div>
        );
    }

    const GridItem = ({ item }) => {
        const isSelected = selectedItems.includes(item.id);

        return (
            <div
                onClick={() => handleItemClick(item, item.isFolder)}
                onContextMenu={(e) => handleContextMenu(e, item, item.isFolder)}
                className={`
                    group relative flex flex-col items-center p-4 rounded-2xl cursor-pointer transition-all duration-200
                    ${isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500 shadow-md'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-lg hover:-translate-y-1'
                    }
                `}
            >
                {/* Icon Container */}
                <div className="mb-3 transition-transform group-hover:scale-110 duration-200">
                    {item.isFolder ? (
                        <div className="relative">
                            <Folder size={48} className="text-yellow-400 fill-yellow-400 drop-shadow-sm" />
                            <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ) : (
                        <FileIcon mimeType={item.mimeType} size={42} />
                    )}
                </div>

                {/* Info */}
                <div className="w-full text-center z-10">
                    <p className={`text-sm font-semibold truncate px-2 mb-1 ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
                        {item.name}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {item.isFolder ? 'Carpeta' : formatFileSize(item.size)}
                    </p>
                </div>

                {/* Selection Check */}
                {isSelected && (
                    <div className="absolute top-2 right-2 p-1 bg-indigo-500 rounded-full text-white shadow-sm animate-in zoom-in">
                        <Check size={12} strokeWidth={3} />
                    </div>
                )}
            </div>
        );
    };

    const ListItem = ({ item }) => {
        const isSelected = selectedItems.includes(item.id);

        return (
            <div
                onClick={() => handleItemClick(item, item.isFolder)}
                onContextMenu={(e) => handleContextMenu(e, item, item.isFolder)}
                className={`
                    group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border-b border-transparent
                    ${isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800'
                        : 'hover:bg-white dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800/50'
                    }
                `}
            >
                <div className="shrink-0 transition-transform group-hover:scale-110">
                    {item.isFolder ? (
                        <Folder size={24} className="text-yellow-400 fill-yellow-400" />
                    ) : (
                        <FileIcon mimeType={item.mimeType} size={24} />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
                        {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {item.isFolder ? 'Carpeta' : formatFileSize(item.size)}
                        </span>
                        {!item.isFolder && (
                            <>
                                <span className="text-[10px] text-slate-300">•</span>
                                <span className="text-[10px] text-slate-400">
                                    Modificado: {formatDate(item.lastUpdated)}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!item.isFolder && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-green-500 transition-colors"
                            title="Descargar"
                        >
                            <Download size={16} />
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-500 transition-colors"
                        title="Abrir en Drive"
                    >
                        <ArrowUpRight size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleContextMenu(e, item, item.isFolder); }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <MoreVertical size={16} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="pb-20">
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {allItems.map(item => <GridItem key={item.id} item={item} />)}
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    {allItems.map(item => <ListItem key={item.id} item={item} />)}
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 min-w-[180px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 p-1.5 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {!contextMenu.isFolder && (
                        <>
                            <button
                                onClick={() => window.open(contextMenu.item.url, '_blank')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 rounded-lg transition-colors"
                            >
                                <ArrowUpRight size={16} />
                                Ver en Drive
                            </button>
                            <button
                                onClick={() => handleDownload(contextMenu.item)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 rounded-lg transition-colors"
                            >
                                <Download size={16} />
                                Descargar
                            </button>
                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                        </>
                    )}

                    <button
                        onClick={() => handleRename(contextMenu.item, contextMenu.isFolder)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <Edit2 size={16} />
                        Renombrar
                    </button>

                    <button
                        onClick={() => handleDelete(contextMenu.item, contextMenu.isFolder)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <Trash2 size={16} />
                        Eliminar
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileManager;
