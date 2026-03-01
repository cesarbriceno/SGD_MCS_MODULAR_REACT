import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { api } from '../../services/api';

const FolderTree = ({ currentFolder, onFolderClick, refreshTrigger }) => {
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [folderStructure, setFolderStructure] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadFolderTree();
    }, [refreshTrigger]);

    const loadFolderTree = async () => {
        setLoading(true);
        try {
            // Obtener el ID de la carpeta raíz del sistema
            const rootInfo = await api.drive.getRootFolder();
            if (!rootInfo.success) {
                console.error('Error getting root folder:', rootInfo.message);
                return;
            }

            // Cargar estructura desde la raíz del sistema con profundidad 3
            const structure = await api.drive.getFolderTree(rootInfo.id, 3);
            setFolderStructure(structure);
        } catch (error) {
            console.error('Error loading folder tree:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFolder = (folderId) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    const renderFolder = (folder, level = 0) => {
        const isExpanded = expandedFolders.has(folder.id);
        const isCurrent = currentFolder?.id === folder.id;
        const hasChildren = folder.children && folder.children.length > 0;

        return (
            <div key={folder.id} className="select-none">
                <div
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all
                        ${isCurrent ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}
                    `}
                    style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
                    onClick={() => onFolderClick(folder)}
                >
                    {hasChildren && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFolder(folder.id);
                            }}
                            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                        >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                    )}
                    {!hasChildren && <div className="w-5" />}

                    {isExpanded || isCurrent ? (
                        <FolderOpen size={18} className="text-yellow-500" />
                    ) : (
                        <Folder size={18} className="text-slate-400" />
                    )}

                    <span className="text-sm truncate flex-1">{folder.name}</span>
                </div>

                {hasChildren && isExpanded && (
                    <div>
                        {folder.children.map(child => renderFolder(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!folderStructure) {
        return (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                No se pudo cargar la estructura
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {renderFolder(folderStructure)}
        </div>
    );
};

export default FolderTree;
