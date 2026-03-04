import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    User, Mail, Calendar, Hash, Save, ArrowLeft,
    BookOpen, Briefcase, MessageSquare, AlertCircle,
    ChevronDown, CheckCircle, XCircle, PauseCircle, GraduationCap, RefreshCw,
    FileText, MapPin, Phone, Building, DollarSign, Globe, Check, FolderOpen, ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';
import { useNotifications } from '../../context/NotificationContext';
import { generateId, findNextSequence } from '../../utils/idGenerator';
import DocumentArchive from '../documents/DocumentArchive';
import CustomSelect from '../../components/common/CustomSelect';
import FolderExplorer from '../../components/common/FolderExplorer';

// --- ESTILOS CSS (ORBES + GLASS + ANIMACIONES ICONOS) ---
const styles = `
  .glass-card-premium {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 2rem;
    box-shadow: 
      0 10px 25px -5px rgba(0, 0, 0, 0.05),
      0 8px 10px -6px rgba(0, 0, 0, 0.05),
      inset 0 0 20px rgba(255, 255, 255, 0.5);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: visible;
  }
  .dark .glass-card-premium {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  }
  .glass-card-premium:hover {
    transform: translateY(-4px);
    box-shadow: 
      0 20px 25px -5px rgba(0, 0, 0, 0.08),
      0 10px 10px -6px rgba(0, 0, 0, 0.08);
  }
  .premium-input {
    background: white !important;
    color: #1e293b !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    transition: all 0.3s ease !important;
    caret-color: #3b82f6 !important;
  }
  .dark .premium-input {
    background: rgba(15, 23, 42, 0.8) !important;
    color: #f8fafc !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
  .premium-input:focus {
    background: white !important;
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
  }
  .dark .premium-input:focus {
    background: rgba(30, 41, 59, 0.9) !important;
  }
`;

const StudentForm = () => {
    const { addNotification } = useNotifications();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Mejoramos la detección de modo usando location.pathname de react-router-dom
    const isEdit = Boolean(id) && location.pathname.includes('/edit');
    const isView = Boolean(id) && location.pathname.includes('/view');
    const title = isView ? 'Detalle del Estudiante' : isEdit ? 'Editar Estudiante' : 'Nuevo Estudiante';

    const [loading, setLoading] = useState(false);
    const [activeMainTab, setActiveMainTab] = useState('info'); // info, docs

    // ESTADO
    const [formData, setFormData] = useState({
        Nombre1: '', Nombre2: '', Apellido1: '', Apellido2: '',
        Tipo_Documento: 'CC', Cedula: '',
        Fecha_Expedicion: '', Lugar_Expedicion: '',
        Sexo: '', Estado_Civil: '',
        Fecha_Nacimiento: '', Lugar_Nacimiento: '',
        Email: '', Pais: '',
        Telefono: '', Celular: '',
        Direccion: '', Barrio: '',
        Ciudad: '', Depto_Residencia: '',
        Estrato: '',
        Cohorte_Ingreso: '', Fecha_Ingreso: '', Cohorte_Egreso: '', Estado: 'Cursando',
        Fecha_Egreso: '', Fecha_Retiro: '', Fecha_Reingreso: '', Fecha_Pausa: '',
        Motivo_Estado: '',
        Situacion_Laboral_Actual: 'Desempleado',
        Empresa_Institucion: '', Cargo_Actual: '',
        Sector_Desempeno: '', Rango_Salarial: '', Telefono_Empresa: '',
        Comentarios: '',
        URL_Carpeta_Drive: ''
    });

    const [createFolder, setCreateFolder] = useState(true);
    const [errors, setErrors] = useState({});

    // CARGA DE DATOS
    useEffect(() => {
        if (id) {
            const loadData = async () => {
                setLoading(true);
                try {
                    const allStudents = await api.students.list();
                    const found = allStudents.find(s => String(s.ID_Estudiante) === String(id) || String(s.id) === String(id));
                    if (found) {
                        const getVal = (key) => found[key] || found[key.toLowerCase()] || found[key.toUpperCase()] || '';
                        const getDateVal = (key) => {
                            const val = getVal(key);
                            if (!val) return '';
                            try { return new Date(val).toISOString().split('T')[0]; } catch (e) { return ''; }
                        };
                        setFormData({
                            Nombre1: getVal('Nombre1'), Nombre2: getVal('Nombre2'),
                            Apellido1: getVal('Apellido1'), Apellido2: getVal('Apellido2'),
                            Tipo_Documento: getVal('Tipo_Documento') || 'CC', Cedula: getVal('Cedula'),
                            Fecha_Expedicion: getDateVal('Fecha_Expedicion'), Lugar_Expedicion: getVal('Lugar_Expedicion'),
                            Sexo: getVal('Sexo'), Estado_Civil: getVal('Estado_Civil'),
                            Fecha_Nacimiento: getDateVal('Fecha_Nacimiento'), Lugar_Nacimiento: getVal('Lugar_Nacimiento'),
                            Email: getVal('Email'), Pais: getVal('Pais') || getVal('Email_Personal'),
                            Telefono: getVal('Telefono'), Celular: getVal('Celular'),
                            Direccion: getVal('Direccion'), Barrio: getVal('Barrio'),
                            Ciudad: getVal('Ciudad'), Depto_Residencia: getVal('Depto_Residencia'),
                            Estrato: getVal('Estrato'),
                            Cohorte_Ingreso: getVal('Cohorte_Ingreso'),
                            Fecha_Ingreso: getDateVal('Fecha_Ingreso'),
                            Cohorte_Egreso: getVal('Cohorte_Egreso'), Estado: getVal('Estado') || 'Cursando',
                            Fecha_Egreso: getDateVal('Fecha_Egreso'), Fecha_Retiro: getDateVal('Fecha_Retiro'),
                            Fecha_Reingreso: getDateVal('Fecha_Reingreso'), Fecha_Pausa: getDateVal('Fecha_Pausa'),
                            Motivo_Estado: getVal('Motivo_Estado'),
                            Situacion_Laboral_Actual: getVal('Situacion_Laboral_Actual'), Empresa_Institucion: getVal('Empresa_Institucion'),
                            Cargo_Actual: getVal('Cargo_Actual'), Sector_Desempeno: getVal('Sector_Desempeno'),
                            Rango_Salarial: getVal('Rango_Salarial'), Telefono_Empresa: getVal('Telefono_Empresa'),
                            Comentarios: getVal('Comentarios'),
                            URL_Carpeta_Drive: getVal('URL_Carpeta_Drive'),
                            ID_Carpeta_Drive: getVal('ID_Carpeta_Drive')
                        });
                    }
                } catch (error) { console.error(error); } finally { setLoading(false); }
            };
            loadData();
        }
    }, [id]);

    // HANDLERS
    const handleChange = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleNameInput = (e) => {
        const { name, value } = e.target;
        const onlyLetters = /^[a-zA-Z\u00C0-\u00FF\s]*$/;
        if (onlyLetters.test(value)) {
            setFormData(prev => ({ ...prev, [name]: value }));
            if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleDocumentInput = (e) => {
        const { name, value } = e.target;
        if (['CC', 'TI'].includes(formData.Tipo_Documento) && !/^\d*$/.test(value)) return;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        let newErrors = {};
        if (!formData.Nombre1.trim()) newErrors.Nombre1 = 'Requerido';
        if (!formData.Cedula.toString().trim()) newErrors.Cedula = 'Requerido';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isView) return;
        if (!validate()) return toast.warning('Datos incompletos', 'Faltan campos obligatorios');

        // Mantener el estado original para la validación de transición
        let originalStatus = 'Cursando';
        if (isEdit && id) {
            try {
                const students = await api.students.list();
                const found = students.find(s => String(s.ID_Estudiante) === String(id) || String(s.id) === String(id));
                if (found) originalStatus = found.Estado || found.estado || 'Cursando';
            } catch (e) { console.error("Error fetching original status:", e); }
        }

        const newStatus = formData.Estado;

        // --- VALIDACIÓN DE TRANSICIONES ---
        if (isEdit && originalStatus !== newStatus) {
            const allowedTransitions = {
                'Cursando': ['Egresado', 'Desertor', 'Pausa'],
                'Desertor': ['Reingresado'],
                'Pausa': ['Reingresado'],
                'Reingresado': ['Egresado', 'Desertor', 'Pausa'],
                'Egresado': [] // Estado final
            };

            const allowed = allowedTransitions[originalStatus] || [];
            if (!allowed.includes(newStatus)) {
                return toast.error('Transición no permitida', `No se puede cambiar de ${originalStatus} a ${newStatus} directamente.`);
            }
        }

        setLoading(true);
        try {
            const cleanData = Object.fromEntries(Object.entries(formData).filter(([_, v]) => v !== null));
            const now = new Date();
            const timestamp = now.toISOString();

            let finalId = id;
            if (!isEdit) {
                const existingStudents = await api.students.list();
                const ids = existingStudents.map(s => s.ID_Estudiante || s.id);
                const nextSeq = findNextSequence('EST', ids, now.getFullYear(), now.getMonth() + 1);
                finalId = generateId('EST', {
                    year: now.getFullYear(),
                    month: now.getMonth() + 1,
                    sequence: nextSeq
                });
            }

            const response = isEdit
                ? await api.students.update(id, { ...cleanData, Ultima_Actualizacion: timestamp, _createFolder: !formData.URL_Carpeta_Drive && createFolder })
                : await api.students.create({ ...cleanData, ID_Estudiante: finalId, Fecha_Registro: timestamp, Ultima_Actualizacion: timestamp, _createFolder: createFolder });

            // El backend puede devolver {success: true, ...} o simplemente el objeto creado/actualizado
            if (response && (response.success || response.id || response.ID_Estudiante || typeof response === 'object')) {
                addNotification(
                    isEdit ? 'Estudiante actualizado' : 'Nuevo estudiante',
                    `${formData.Nombre1} ${formData.Apellido1} ha sido ${isEdit ? 'actualizado' : 'registrado'} correctamente.`,
                    'success'
                );
                toast.success('Guardado', 'Registro procesado exitosamente');
                navigate('/students');
            } else {
                throw new Error('Respuesta del servidor no válida');
            }
        } catch (error) {
            toast.error('Error', 'No se pudieron guardar los cambios');
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = isView || loading;

    const stateConfig = {
        'Cursando': { color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle, label: 'Cursando' },
        'Egresado': { color: 'text-indigo-600 dark:text-indigo-400', icon: GraduationCap, label: 'Egresado' },
        'Pausa': { color: 'text-amber-600 dark:text-amber-400', icon: PauseCircle, label: 'En Pausa' },
        'Desertor': { color: 'text-red-600 dark:text-red-400', icon: XCircle, label: 'Desertor' },
        'Reingresado': { color: 'text-blue-600 dark:text-blue-400', icon: RefreshCw, label: 'Reingresado' }
    };
    const currentState = stateConfig[formData.Estado] || stateConfig['Cursando'];
    const StateIcon = currentState.icon;

    return (
        <div className="relative pb-24 animate-fade-in font-sans text-slate-800 dark:text-slate-100 z-10">
            <style>{styles}</style>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 relative z-10">
                <button onClick={() => navigate('/students')} className="group flex items-center gap-2 px-5 py-2.5 rounded-full glass-panel-premium hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium text-sm">Volver</span>
                </button>
                <h1 className="text-3xl font-bold drop-shadow-sm text-center">{title}</h1>
            </div>

            {/* Main Tabs (only if viewing/editing existing) */}
            {id && (
                <div className="flex justify-center mb-8 relative z-10">
                    <div className="bg-white/30 dark:bg-black/20 p-1.5 rounded-2xl flex gap-2 border border-white/20 backdrop-blur-md">
                        <button
                            type="button" onClick={() => setActiveMainTab('info')}
                            className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeMainTab === 'info' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Información
                        </button>
                        <button
                            type="button" onClick={() => setActiveMainTab('docs')}
                            className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeMainTab === 'docs' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Documentos
                        </button>
                    </div>
                </div>
            )}

            {activeMainTab === 'docs' && id ? (
                <div className="relative z-10 max-w-5xl mx-auto">
                    <div className="glass-card-premium p-8 rounded-[2.5rem]">
                        <DocumentArchive
                            beneficiaryId={id}
                            beneficiaryName={`${formData.Nombre1} ${formData.Apellido1}`}
                            folderId={formData.ID_Carpeta_Drive}
                            entityType="estudiante"
                        />
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8 relative z-10" autoComplete="off">

                    {/* 1. IDENTIFICACIÓN */}
                    <GlassSection title="Identificación" icon={User} color="blue" zIndex={50}>
                        <InputGroup label="Primer Nombre" name="Nombre1" required value={formData.Nombre1} onChange={handleNameInput} disabled={isDisabled} error={errors.Nombre1} placeholder="Ej: Juan" icon={User} />
                        <InputGroup label="Segundo Nombre" name="Nombre2" value={formData.Nombre2} onChange={handleNameInput} disabled={isDisabled} placeholder="Ej: Carlos" icon={User} />
                        <InputGroup label="Primer Apellido" name="Apellido1" required value={formData.Apellido1} onChange={handleNameInput} disabled={isDisabled} error={errors.Apellido1} placeholder="Ej: Pérez" icon={User} />
                        <InputGroup label="Segundo Apellido" name="Apellido2" value={formData.Apellido2} onChange={handleNameInput} disabled={isDisabled} placeholder="Ej: López" icon={User} />

                        <InputGroup label="Tipo Doc." name="Tipo_Documento" options={['CC', 'TI', 'CE', 'PAS', 'PEP']} value={formData.Tipo_Documento} onChange={handleChange} disabled={isDisabled} icon={Hash} />
                        <InputGroup label="Documento" name="Cedula" required value={formData.Cedula} onChange={handleDocumentInput} disabled={isDisabled} error={errors.Cedula} placeholder="Ej: 100..." helperText={formData.Tipo_Documento === 'CC' ? 'Solo números' : 'Alfanumérico'} icon={Hash} />

                        <InputGroup label="F. Expedición" name="Fecha_Expedicion" type="date" value={formData.Fecha_Expedicion} onChange={handleChange} disabled={isDisabled} icon={Calendar} />
                        <InputGroup label="Lugar Exp." name="Lugar_Expedicion" value={formData.Lugar_Expedicion} onChange={handleChange} disabled={isDisabled} placeholder="Ej: Bogotá" icon={MapPin} />
                        <InputGroup label="Sexo" name="Sexo" options={['Masculino', 'Femenino', 'Otro']} value={formData.Sexo} onChange={handleChange} disabled={isDisabled} icon={User} />
                        {!formData.URL_Carpeta_Drive && (
                            <div className="col-span-full mt-4 p-4 rounded-3xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500 text-white rounded-xl">
                                        <FolderOpen size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Carpeta de Drive</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Generar espacio digital automáticamente</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={createFolder} onChange={(e) => setCreateFolder(e.target.checked)} className="sr-only peer" disabled={isDisabled} />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        )}
                        <InputGroup label="Estado Civil" name="Estado_Civil" options={['Soltero/a', 'Casado/a', 'Unión Libre', 'Divorciado/a']} value={formData.Estado_Civil} onChange={handleChange} disabled={isDisabled} icon={User} />
                        <InputGroup label="Fecha Nacimiento" name="Fecha_Nacimiento" type="date" value={formData.Fecha_Nacimiento} onChange={handleChange} disabled={isDisabled} icon={Calendar} />
                        <InputGroup label="Lugar Nacimiento" name="Lugar_Nacimiento" value={formData.Lugar_Nacimiento} onChange={handleChange} disabled={isDisabled} placeholder="Ej: Medellín" icon={MapPin} />
                    </GlassSection>

                    {/* 2. CONTACTO */}
                    <GlassSection title="Contacto" icon={Phone} color="purple" zIndex={40}>
                        <InputGroup label="Celular" name="Celular" required value={formData.Celular} onChange={handleChange} disabled={isDisabled} placeholder="Ej: 300..." icon={Phone} />
                        <InputGroup label="Email" name="Email" type="email" required value={formData.Email} onChange={handleChange} disabled={isDisabled} placeholder="Ej: u@mail.com" icon={Mail} />
                        <InputGroup label="Teléfono Fijo" name="Telefono" value={formData.Telefono} onChange={handleChange} disabled={isDisabled} placeholder="Ej: 604..." icon={Phone} />
                        <InputGroup label="Pais / Nacionalidad" name="Pais" value={formData.Pais} onChange={handleChange} disabled={isDisabled} placeholder="Ej: Colombia" icon={Globe} />
                        <InputGroup label="Dirección" name="Direccion" value={formData.Direccion} onChange={handleChange} disabled={isDisabled} placeholder="Ej: Cra 123..." icon={MapPin} />
                        <InputGroup label="Barrio" name="Barrio" value={formData.Barrio} onChange={handleChange} disabled={isDisabled} placeholder="Ej: Centro" icon={MapPin} />
                        <InputGroup label="Ciudad" name="Ciudad" value={formData.Ciudad} onChange={handleChange} disabled={isDisabled} placeholder="Ej: Medellín" icon={MapPin} />
                        <InputGroup label="Departamento" name="Depto_Residencia" value={formData.Depto_Residencia} onChange={handleChange} disabled={isDisabled} placeholder="Ej: Antioquia" icon={MapPin} />
                        <InputGroup label="Estrato" name="Estrato" type="number" value={formData.Estrato} onChange={handleChange} disabled={isDisabled} placeholder="Ej: 2" icon={Hash} />
                    </GlassSection>

                    {/* 3. ACADÉMICO */}
                    <GlassSection title="Académico" icon={BookOpen} color="emerald" zIndex={30}
                        badge={<div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/10 ${currentState.color}`}><AnimatedIcon icon={StateIcon} size={14} /> <span className="text-xs font-bold uppercase">{currentState.label}</span></div>}
                    >
                        <InputGroup label="Cohorte Ingreso" name="Cohorte_Ingreso" required value={formData.Cohorte_Ingreso} onChange={handleChange} disabled={isDisabled} placeholder="Ej: 2024-1" icon={Calendar} />
                        <InputGroup label="Fecha Ingreso" name="Fecha_Ingreso" type="date" value={formData.Fecha_Ingreso} onChange={handleChange} disabled={isDisabled} icon={Calendar} />
                        <InputGroup label="Estado" name="Estado" options={['Cursando', 'Egresado', 'Pausa', 'Desertor', 'Reingresado']} value={formData.Estado} onChange={handleChange} disabled={isDisabled} icon={Briefcase} />

                        {formData.Estado === 'Egresado' && (
                            <>
                                <InputGroup label="Cohorte Egreso" name="Cohorte_Egreso" required value={formData.Cohorte_Egreso} onChange={handleChange} disabled={isDisabled} icon={Calendar} />
                                <InputGroup label="F. Grado" name="Fecha_Egreso" type="date" required value={formData.Fecha_Egreso} onChange={handleChange} disabled={isDisabled} icon={Calendar} />
                            </>
                        )}
                        {(formData.Estado === 'Desertor' || formData.Estado === 'Pausa') && (
                            <>
                                <div className="md:col-span-2">
                                    <InputGroup label="Motivo" name="Motivo_Estado" required value={formData.Motivo_Estado} onChange={handleChange} disabled={isDisabled} placeholder="Describa la razón..." icon={AlertCircle} />
                                </div>
                                <InputGroup
                                    label={formData.Estado === 'Desertor' ? "Fecha Retiro" : "Fecha Pausa"}
                                    name={formData.Estado === 'Desertor' ? "Fecha_Retiro" : "Fecha_Pausa"}
                                    type="date"
                                    required
                                    value={formData.Estado === 'Desertor' ? formData.Fecha_Retiro : formData.Fecha_Pausa}
                                    onChange={handleChange}
                                    disabled={isDisabled}
                                    icon={Calendar}
                                />
                            </>
                        )}
                        {formData.Estado === 'Reingresado' && (
                            <>
                                <InputGroup label="F. Reingreso" name="Fecha_Reingreso" type="date" value={formData.Fecha_Reingreso} onChange={handleChange} disabled={isDisabled} icon={Calendar} />
                                <InputGroup label="Resolución" name="Motivo_Estado" value={formData.Motivo_Estado} onChange={handleChange} disabled={isDisabled} placeholder="Nro acta..." icon={FileText} />
                            </>
                        )}

                        {/* DRIVE INTEGRATION IN FORM */}
                        <div className="col-span-full pt-4 border-t border-white/10 mt-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                        <FolderOpen size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-wider">Repositorio Documental</h4>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Carpeta personalizada en Google Drive</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    {formData.URL_Carpeta_Drive ? (
                                        <a
                                            href={formData.URL_Carpeta_Drive}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                                        >
                                            <ExternalLink size={14} /> ABRIR CARPETA
                                        </a>
                                    ) : id && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setLoading(true);
                                                try {
                                                    const res = await api.students.update(id, { _syncDrive: true });
                                                    if (res.success) {
                                                        toast.success('Sincronizado', 'Carpeta generada correctamente');
                                                        const all = await api.students.list();
                                                        const fresh = all.find(s => String(s.ID_Estudiante) === String(id) || String(s.id) === String(id));
                                                        if (fresh) setFormData(prev => ({ ...prev, URL_Carpeta_Drive: fresh.URL_Carpeta_Drive || fresh.url_carpeta_drive, ID_Carpeta_Drive: fresh.ID_Carpeta_Drive || fresh.id_carpeta_drive }));
                                                    }
                                                } catch (e) {
                                                    toast.error('Error', 'No se pudo sincronizar');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-white/20 transition-all font-black uppercase"
                                        >
                                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> GENERAR CARPETA
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* DRIVE FILE EXPLORER INTEGRATION */}
                            <FolderExplorer
                                folderId={formData.ID_Carpeta_Drive}
                                folderUrl={formData.URL_Carpeta_Drive}
                                entityType="estudiante"
                                entityId={formData.ID_Estudiante}
                                entityData={formData}
                            />
                        </div>
                    </GlassSection>

                    {/* 4. LABORAL */}
                    <GlassSection title="Seguimiento Laboral" icon={Briefcase} color="orange" zIndex={20}>
                        <InputGroup label="Situación" name="Situacion_Laboral_Actual" options={['Empleado', 'Independiente', 'Desempleado', 'Estudiante']} value={formData.Situacion_Laboral_Actual} onChange={handleChange} disabled={isDisabled} icon={Briefcase} />
                        {formData.Situacion_Laboral_Actual !== 'Desempleado' && formData.Situacion_Laboral_Actual !== 'Estudiante' && (
                            <>
                                <InputGroup label="Empresa" name="Empresa_Institucion" value={formData.Empresa_Institucion} onChange={handleChange} disabled={isDisabled} placeholder="Ej: Tech SAS" icon={Building} />
                                <InputGroup label="Cargo" name="Cargo_Actual" value={formData.Cargo_Actual} onChange={handleChange} disabled={isDisabled} placeholder="Ej: Desarrollador" icon={Briefcase} />
                                <InputGroup label="Sector" name="Sector_Desempeno" options={['Público', 'Privado', 'Mixto']} value={formData.Sector_Desempeno} onChange={handleChange} disabled={isDisabled} icon={Globe} />
                                <InputGroup label="Salario" name="Rango_Salarial" options={['< 1 SMMLV', '1-2 SMMLV', '> 2 SMMLV']} value={formData.Rango_Salarial} onChange={handleChange} disabled={isDisabled} icon={DollarSign} />
                                <InputGroup label="Tel. Empresa" name="Telefono_Empresa" type="tel" value={formData.Telefono_Empresa} onChange={handleChange} disabled={isDisabled} placeholder="Ej: 604..." icon={Phone} />
                            </>
                        )}
                    </GlassSection>

                    {/* 5. OBSERVACIONES */}
                    <GlassSection title="Observaciones" icon={MessageSquare} zIndex={10}>
                        <div className="col-span-full">
                            <textarea
                                name="Comentarios"
                                value={formData.Comentarios}
                                title={formData.Comentarios}
                                onChange={handleChange}
                                disabled={isDisabled}
                                rows="3"
                                className="w-full p-4 rounded-xl premium-input resize-none outline-none"
                                placeholder="Notas adicionales..."
                            ></textarea>
                        </div>
                    </GlassSection>

                    {!isView && (
                        <div className="flex justify-end pt-6">
                            <button type="submit" disabled={loading} className="px-10 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg transition-transform hover:scale-105 border border-white/20 flex items-center gap-2">
                                {loading ? 'Guardando...' : <><AnimatedIcon icon={Save} size={20} /> GUARDAR</>}
                            </button>
                        </div>
                    )}
                </form>
            )}
        </div>
    );
};

// --- COMPONENTES AUXILIARES ---

// Tarjeta con Acordeón
const GlassSection = ({ title, icon: Icon, color, children, badge, zIndex = 1 }) => {
    const [isOpen, setIsOpen] = useState(true);
    const colorMap = { blue: 'bg-blue-500', purple: 'bg-purple-500', emerald: 'bg-emerald-500', orange: 'bg-orange-500' };

    return (
        <div className="glass-card-premium mb-6" style={{ zIndex }}>
            <div className={`absolute top-6 bottom-6 left-0 w-1.5 ${colorMap[color] || 'bg-slate-500'} rounded-r-full`}></div>
            <div className="flex justify-between items-center p-6 cursor-pointer select-none group" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center gap-3 pl-4">
                    <AnimatedIcon icon={Icon} className="text-slate-500 dark:text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
                </div>
                <div className="flex items-center gap-3">
                    {badge}
                    <ChevronDown size={20} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>
            <div className={`transition-all duration-300 ${isOpen ? 'opacity-100 p-6 pt-0 overflow-visible' : 'max-h-0 opacity-0 p-0 overflow-hidden'}`}>
                {isOpen && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">{children}</div>}
            </div>
        </div>
    );
};

// Icono Animado
const AnimatedIcon = ({ icon: Icon, size, className, animation = 'bounce' }) => {
    const animClass = { bounce: 'icon-hover-bounce', shake: 'icon-hover-shake', pulse: 'icon-hover-pulse' }[animation];
    return <div className={`inline-flex ${animClass} ${className}`}><Icon size={size} /></div>;
};

// Input Group
const InputGroup = ({ label, name, value, onChange, options, type = "text", required, error, placeholder, helperText, disabled, icon: Icon }) => (
    <div className="w-full group">
        <div className="flex justify-between items-baseline mb-1.5 ml-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        </div>
        <div className="relative">
            {options ? (
                <CustomSelect name={name} value={value} onChange={onChange} options={options} disabled={disabled} error={error} icon={Icon} />
            ) : (
                <>
                    {Icon && (
                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${error ? 'text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            <AnimatedIcon icon={Icon} size={18} animation="pulse" />
                        </div>
                    )}
                    <input
                        type={type} name={name} value={value} title={value} onChange={onChange} disabled={disabled} placeholder={placeholder}
                        className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3 rounded-xl premium-input outline-none shadow-sm
                            ${error ? 'border-red-500/50 text-red-500 placeholder-red-300' : ''}
                            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                        `}
                    />
                    {error && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={18} />}
                </>
            )}
        </div>
        {error ? (
            <p className="mt-1 ml-1 text-xs text-red-500 font-medium animate-pulse">{error}</p>
        ) : helperText ? (
            <p className="mt-1 ml-1 text-[10px] text-slate-400 dark:text-slate-500">{helperText}</p>
        ) : null}
    </div>
);

export default StudentForm;