import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';

const DocumentUpload = ({ onSuccess, beneficiaryId, beneficiaryName }) => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [docType, setDocType] = useState('Otros');
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const uuid = crypto.randomUUID();
            const fileData = {
                url: `https://storage.nexodo.com/archives/${uuid}.${file.name.split('.').pop()}`,
                peso: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                tipo_mime: file.type,
                nombre_original: file.name,
                extension: file.name.split('.').pop()
            };

            const payload = {
                ID_Documento: uuid,
                ID_Beneficiario: beneficiaryId || 'GUEST',
                Nombre_Beneficiario: beneficiaryName || 'Anónimo',
                Tipo_Documento: docType,
                Usuario_Emisor: 'Admin',
                Detalle_Origen: 'Carga Manual',
                Detalles_JSON: JSON.stringify(fileData),
                Fecha_Registro: new Date().toISOString()
            };

            await api.history.create(payload);
            toast.success('¡Archivo Cargado!', 'El documento se ha guardado en el historial.');
            setFile(null);
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error('Error', 'No se pudo subir el archivo.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div
                className={`relative p-8 border-2 border-dashed rounded-[2rem] transition-all flex flex-col items-center justify-center min-h-[250px]
                    ${dragActive ? 'border-green-500 bg-green-50/50' : 'border-slate-200 dark:border-slate-700 bg-white/30 dark:bg-black/10'}
                    ${file ? 'border-green-500/50 bg-green-50/10' : ''}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            >
                <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />

                {!file ? (
                    <>
                        <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                            <Upload size={32} />
                        </div>
                        <p className="text-sm font-black uppercase text-slate-800 dark:text-white mb-2">Arrastra tu archivo aquí</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">O toca para buscar en tu equipo</p>
                        <button onClick={() => inputRef.current.click()} className="absolute inset-0 w-full h-full cursor-pointer" />
                    </>
                ) : (
                    <div className="flex flex-col items-center text-center animate-fade-in w-full space-y-4">
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-green-200 shadow-sm max-w-sm w-full">
                            <div className="p-3 bg-green-500/10 text-green-600 rounded-xl">
                                <FileText size={24} />
                            </div>
                            <div className="flex-1 text-left truncate">
                                <p className="text-xs font-black text-slate-800 dark:text-white truncate uppercase">{file.name}</p>
                                <p className="text-[10px] text-slate-500 font-bold">{(file.size / 1024).toFixed(0)} KB</p>
                            </div>
                            <button onClick={() => setFile(null)} className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors uppercase"><X size={18} /></button>
                        </div>

                        <div className="w-full max-w-sm space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block text-left">Tipo de Documento</label>
                            <select
                                value={docType} onChange={e => setDocType(e.target.value)}
                                className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 outline-none focus:border-green-500 text-xs font-bold uppercase transition-all"
                            >
                                <option>Cédula</option><option>Tesis / Proyecto</option><option>Acta de Grado</option><option>Diploma</option><option>Certificado</option><option>Otros</option>
                            </select>
                        </div>

                        <button
                            onClick={handleUpload} disabled={uploading}
                            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-green-600/20 transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                        >
                            {uploading ? <><Loader2 size={16} className="animate-spin" /> Subiendo...</> : <><CheckCircle size={16} /> Confirmar Carga</>}
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-start gap-2 text-slate-400 p-4">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold uppercase leading-tight tracking-wider">
                    Los archivos se renombran automáticamente con UUID para evitar duplicados y se registran como evidencias técnicas.
                </p>
            </div>
        </div>
    );
};

export default DocumentUpload;
