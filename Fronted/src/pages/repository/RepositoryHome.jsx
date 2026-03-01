import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Home, RefreshCw, Upload, Search,
    Grid, List as ListIcon, Plus, ChevronRight,
    FolderOpen, Filter, X, Trash2
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';
import FolderTree from './FolderTree';
import FileManager from './FileManager';
import FileUploader from './FileUploader';

const RepositoryHome = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState(localStorage.getItem('repoViewMode') || 'grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUploader, setShowUploader] = useState(false);

    // Navegación
    const [currentFolder, setCurrentFolder] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: 'root', name: 'Repositorio' }]);

    // Datos
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);

    // Actualizar preferencia de vista
    useEffect(() => {
        localStorage.setItem('repoViewMode', viewMode);
    }, [viewMode]);

    // Cargar carpeta raíz al montar
    useEffect(() => {
        loadRootFolder();
    }, []);

    const loadRootFolder = async () => {
        setLoading(true);
        try {
            const rootInfo = await api.drive.getRootFolder();
            // Si el servidor devuelve solo el ID como string, manejarlo
            const rootId = typeof rootInfo === 'string' ? rootInfo : rootInfo.id;

            if (!rootId) {
                throw new Error('No se pudo obtener el ID de carpeta raíz');
            }

            // Obtener estructura inicial
            const structure = await api.drive.getFolderTree(rootId, 1);
            if (structure) {
                setCurrentFolder(structure);
                setBreadcrumbs([{ id: structure.id, name: 'Google Drive' }]);
                loadFolderContents(structure.id);
            }
        } catch (error) {
            console.error('Error loading root:', error);
            // toast.error('Error', 'No se pudo conectar con Drive');
        } finally {
            setLoading(false);
        }
    };

    const loadFolderContents = async (folderId) => {
        setLoading(true);
        setFiles([]);
        setFolders([]);
        try {
            // Carga paralela para velocidad
            const [fileList, structure] = await Promise.all([
                api.drive.getFiles(folderId),
                api.drive.getFolderTree(folderId, 1)
            ]);

            setFiles(Array.isArray(fileList) ? fileList : []);
            setFolders(structure?.children || []);
        } catch (error) {
            console.error('Error loading folder:', error);
            toast.error('Error', 'No se pudo cargar el contenido');
        } finally {
            setLoading(false);
        }
    };

    const handleFolderClick = (folder) => {
        if (!folder || !folder.id) return;

        // Evitar recargar si ya estamos ahí
        if (currentFolder && currentFolder.id === folder.id) return;

        setCurrentFolder(folder);
        setBreadcrumbs(prev => {
            // Evitar duplicados en breadcrumbs
            const exists = prev.find(b => b.id === folder.id);
            if (exists) {
                const index = prev.findIndex(b => b.id === folder.id);
                return prev.slice(0, index + 1);
            }
            return [...prev, { id: folder.id, name: folder.name }];
        });

        loadFolderContents(folder.id);
        setSelectedItems([]);
        setSearchQuery('');
    };

    const handleBreadcrumbClick = (index) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        const targetFolder = newBreadcrumbs[newBreadcrumbs.length - 1];
        if (targetFolder.id !== 'root') {
            setCurrentFolder(targetFolder);
            loadFolderContents(targetFolder.id);
        } else {
            loadRootFolder();
        }
        setSelectedItems([]);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim() || !currentFolder) return;

        setLoading(true);
        try {
            const results = await api.drive.searchFiles(currentFolder.id, searchQuery);
            setFiles(results || []);
            setFolders([]); // En búsqueda no mostramos subcarpetas por ahora
        } catch (error) {
            console.error('Error searching:', error);
            toast.error('Error', 'Falló la búsqueda');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        const { value: folderName, isConfirmed } = await toast.prompt('Nueva Carpeta', 'Nombre de la carpeta:');
        if (!isConfirmed || !folderName || !folderName.trim() || !currentFolder) return;

        setLoading(true);
        try {
            const result = await api.drive.createFolder(currentFolder.id, folderName.trim());
            if (result.success) {
                toast.success('Éxito', 'Carpeta creada correctamente');
                loadFolderContents(currentFolder.id);
            } else {
                toast.error('Error', result.message || 'Error al crear carpeta');
            }
        } catch (error) {
            console.error('Error creating folder:', error);
            toast.error('Error', 'No se pudo crear la carpeta');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedItems.length) return;

        if (!await toast.confirm(
            'Eliminar selección',
            `¿Estás seguro de eliminar los ${selectedItems.length} elementos seleccionados? Esta acción los moverá a la papelera.`
        )) return;

        setLoading(true);
        try {
            let successCount = 0;
            for (const id of selectedItems) {
                const isFolder = folders.find(f => f.id === id);
                const res = isFolder
                    ? await api.drive.deleteFolder(id)
                    : await api.drive.deleteFile(id);

                if (res.success) successCount++;
            }

            toast.success('Completado', `Se eliminaron ${successCount} elementos correctamente`);
            loadFolderContents(currentFolder.id);
            setSelectedItems([]);
        } catch (error) {
            console.error('Bulk delete error:', error);
            toast.error('Error', 'Ocurrió un error al procesar la eliminación masiva');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        if (currentFolder) {
            loadFolderContents(currentFolder.id);
        } else {
            loadRootFolder();
        }
    };

    return (
        <div className="min-h-screen p-4 lg:p-8 space-y-6">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                            <FolderOpen size={24} />
                        </span>
                        Repositorio Digital
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium ml-1">
                        Gestión centralizada de documentos
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-sm transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        Volver
                    </button>
                    <button
                        onClick={() => setShowUploader(true)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all font-bold text-sm flex items-center gap-2"
                    >
                        <Upload size={18} />
                        Subir Archivos
                    </button>
                </div>
            </div>

            {/* Navigation & Toolbar */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm sticky top-4 z-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">

                    {/* Breadcrumbs Scrollable */}
                    <div className="flex-1 overflow-x-auto pb-2 md:pb-0 px-2 mask-linear-fade">
                        <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb.id}>
                                    <button
                                        onClick={() => handleBreadcrumbClick(index)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors font-medium
                                            ${index === breadcrumbs.length - 1
                                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }
                                        `}
                                    >
                                        {index === 0 && <Home size={14} />}
                                        {crumb.name}
                                    </button>
                                    {index < breadcrumbs.length - 1 && (
                                        <ChevronRight size={14} className="text-slate-400 shrink-0" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />

                    {/* Actions */}
                    <div className="flex items-center gap-2 px-2 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-initial">
                            <input
                                type="text"
                                placeholder="Buscar en esta carpeta..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full md:w-64 lg:w-80 bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                            />
                            <button
                                onClick={handleSearch}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                <Search size={16} />
                            </button>
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        handleRefresh();
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <button onClick={handleCreateFolder} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors" title="Nueva Carpeta">
                            <Plus size={18} />
                        </button>

                        <button onClick={handleRefresh} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors" title="Actualizar">
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>

                        {selectedItems.length > 0 && (
                            <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                                <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg uppercase tracking-wider">
                                    {selectedItems.length} seleccionados
                                </span>
                                <button
                                    onClick={handleBulkDelete}
                                    className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                    title="Eliminar Selección"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        )}

                        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1 flex">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <ListIcon size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                {/* Sidebar Tree */}
                <div className="hidden lg:block lg:col-span-1">
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                        <FolderTree
                            currentFolder={currentFolder}
                            onFolderClick={handleFolderClick}
                        />
                    </div>
                </div>

                {/* File Manager */}
                <div className="lg:col-span-3 min-h-[400px]">
                    <FileManager
                        files={files}
                        folders={folders}
                        viewMode={viewMode}
                        loading={loading}
                        selectedItems={selectedItems}
                        onItemSelect={setSelectedItems}
                        onFolderClick={handleFolderClick}
                        onRefresh={handleRefresh}
                        currentFolderId={currentFolder?.id}
                    />
                </div>
            </div>

            {/* Modals */}
            {showUploader && (
                <FileUploader
                    folderId={currentFolder?.id}
                    onClose={() => setShowUploader(false)}
                    onUploadComplete={() => {
                        setShowUploader(false);
                        handleRefresh();
                        toast.success('Completado', 'Archivos subidos exitosamente');
                    }}
                />
            )}
        </div>
    );
};

export default RepositoryHome;
