import React from 'react';
import {
    FileText, Image as ImageIcon, Video, Music, File,
    FileCode, FileSpreadsheet, FileArchive, Layout, Database
} from 'lucide-react';

const FileIcon = ({ mimeType = '', size = 24, className = '' }) => {

    const getIconConfig = (type) => {
        // Documentos
        if (type.includes('pdf')) return { Icon: FileText, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'PDF' };
        if (type.includes('word') || type.includes('document') || type.includes('msword')) return { Icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'DOC' };
        if (type.includes('sheet') || type.includes('excel') || type.includes('spreadsheet') || type.includes('csv')) return { Icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'XLS' };
        if (type.includes('presentation') || type.includes('powerpoint') || type.includes('slides')) return { Icon: Layout, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', label: 'PPT' };
        if (type.includes('text') || type.includes('plain')) return { Icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-800', label: 'TXT' };

        // Imágenes
        if (type.includes('image') || type.includes('png') || type.includes('jpeg') || type.includes('jpg')) return { Icon: ImageIcon, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', label: 'IMG' };
        if (type.includes('svg')) return { Icon: FileCode, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', label: 'SVG' };

        // Multimedia
        if (type.includes('video') || type.includes('mp4') || type.includes('mkv')) return { Icon: Video, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20', label: 'VID' };
        if (type.includes('audio') || type.includes('mp3') || type.includes('wav')) return { Icon: Music, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'AUD' };

        // Archivos
        if (type.includes('zip') || type.includes('rar') || type.includes('compressed') || type.includes('tar') || type.includes('7z')) return { Icon: FileArchive, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'ZIP' };

        // Código / Datos
        if (type.includes('json') || type.includes('javascript') || type.includes('html') || type.includes('css') || type.includes('xml')) return { Icon: FileCode, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20', label: 'CODE' };
        if (type.includes('sql') || type.includes('database')) return { Icon: Database, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', label: 'SQL' };

        // Sistema
        if (type.includes('folder')) return { Icon: File, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800', label: 'DIR' };

        // Default
        return { Icon: File, color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800', label: 'FILE' };
    };

    const { Icon, color, bg, label } = getIconConfig(mimeType.toLowerCase());

    return (
        <div className={`relative flex items-center justify-center rounded-lg ${bg} ${className}`} style={{ width: size + 16, height: size + 16 }}>
            <Icon size={size} className={color} strokeWidth={1.5} />
            <span className={`absolute -bottom-1 -right-1 text-[8px] font-black uppercase px-1 rounded bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 ${color} z-10`}>
                {label}
            </span>
        </div>
    );
};

export default FileIcon;
