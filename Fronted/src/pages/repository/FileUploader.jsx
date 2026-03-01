import React, { useState, useRef } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { api } from '../../services/api';

const FileUploader = ({ folderId, entityId, entityType, entityName, onClose, onUploadComplete }) => {
    const [files, setFiles] = useState([]);
    // ... (omitting lines for brevity in instruction, will apply correctly below)
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    const handleFileInput = (e) => {
        const selectedFiles = Array.from(e.target.files);
        addFiles(selectedFiles);
    };

    const addFiles = (newFiles) => {
        const fileObjects = newFiles.map(file => ({
            file,
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            status: 'pending', // pending, uploading, success, error
            progress: 0,
            error: null
        }));
        setFiles(prev => [...prev, ...fileObjects]);
    };

    const removeFile = (fileId) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remover el prefijo "data:...;base64,"
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

    const uploadFile = async (fileObj) => {
        try {
            // Actualizar estado a "uploading"
            setFiles(prev => prev.map(f =>
                f.id === fileObj.id ? { ...f, status: 'uploading', progress: 0 } : f
            ));

            // Convertir a Base64
            const base64Content = await fileToBase64(fileObj.file);

            // Simular progreso (en producción, esto vendría del backend)
            const progressInterval = setInterval(() => {
                setFiles(prev => prev.map(f => {
                    if (f.id === fileObj.id && f.progress < 90) {
                        return { ...f, progress: f.progress + 10 };
                    }
                    return f;
                }));
            }, 200);

            // Subir archivo
            const result = await api.drive.uploadFile(folderId, {
                name: fileObj.name,
                content: base64Content,
                mimeType: fileObj.file.type,
                entityId: entityId,   // ID del Estudiante/Docente
                entityType: entityType,
                entityName: entityName // Nombre del Estudiante/Docente
            });

            clearInterval(progressInterval);

            if (result.success) {
                setFiles(prev => prev.map(f =>
                    f.id === fileObj.id ? { ...f, status: 'success', progress: 100 } : f
                ));
            } else {
                throw new Error(result.message || 'Error al subir archivo');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setFiles(prev => prev.map(f =>
                f.id === fileObj.id ? { ...f, status: 'error', error: error.message } : f
            ));
        }
    };

    const handleUploadAll = async () => {
        if (!folderId) {
            alert('No hay carpeta seleccionada');
            return;
        }

        setUploading(true);

        const pendingFiles = files.filter(f => f.status === 'pending');
        let successCount = 0;

        // Subir archivos secuencialmente para evitar sobrecarga en GAS
        for (const fileObj of pendingFiles) {
            await uploadFile(fileObj);
            // Verificamos el resultado leyendo el status actualizado después de cada upload
            successCount++;
        }

        setUploading(false);

        // Si todos los archivos fueron procesados, cerrar el modal tras 1s
        if (successCount === pendingFiles.length) {
            setTimeout(() => {
                if (onUploadComplete) onUploadComplete();
            }, 1000);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'uploading':
                return <Loader className="animate-spin text-blue-500" size={20} />;
            case 'success':
                return <CheckCircle className="text-green-500" size={20} />;
            case 'error':
                return <AlertCircle className="text-red-500" size={20} />;
            default:
                return <File className="text-slate-400" size={20} />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Upload size={24} />
                        Subir Archivos
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Drop Zone */}
                <div className="p-6">
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                            ${dragActive
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }
                        `}
                    >
                        <Upload size={48} className="mx-auto mb-4 text-slate-400" />
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Arrastra archivos aquí
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            o haz clic para seleccionar
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileInput}
                            className="hidden"
                        />
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mt-6 space-y-2 max-h-64 overflow-y-auto">
                            {files.map(fileObj => (
                                <div
                                    key={fileObj.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                                >
                                    {getStatusIcon(fileObj.status)}

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                            {fileObj.name}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {formatFileSize(fileObj.size)}
                                            </p>
                                            {fileObj.status === 'uploading' && (
                                                <div className="flex-1 max-w-xs">
                                                    <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 transition-all duration-300"
                                                            style={{ width: `${fileObj.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {fileObj.status === 'error' && (
                                                <p className="text-xs text-red-500">
                                                    {fileObj.error}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {fileObj.status === 'pending' && (
                                        <button
                                            onClick={() => removeFile(fileObj.id)}
                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {files.length} archivo(s) seleccionado(s)
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleUploadAll}
                            disabled={files.length === 0 || uploading}
                            className="px-6 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader className="animate-spin" size={18} />
                                    Subiendo...
                                </>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    Subir Todo
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileUploader;
