import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    User, Mail, Calendar, Hash, Save, ArrowLeft,
    BookOpen, Briefcase, MessageSquare, AlertCircle,
    ChevronDown, CheckCircle, XCircle, GraduationCap,
    Phone, MapPin, Building, Award, Linkedin, Users as UsersIcon, Link as LinkIcon, Globe, FolderOpen, RefreshCw, ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';
import { useNotifications } from '../../context/NotificationContext';
import { generateId, findNextSequence } from '../../utils/idGenerator';
import CustomSelect from '../../components/common/CustomSelect';
import FolderExplorer from '../../components/common/FolderExplorer';
import DocumentArchive from '../documents/DocumentArchive';

const styles = `
  @keyframes icon-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  @keyframes icon-pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
  
  .icon-hover-bounce:hover { animation: icon-bounce 0.5s ease-in-out; color: #6366f1; }
  .icon-hover-pulse:hover { animation: icon-pulse 0.4s ease-in-out; color: #34d399; }

  .app-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -2; background-color: #f8fafc; }
  .dark .app-bg { background-color: #0f172a; }
  
  .orb { position: fixed; border-radius: 50%; filter: blur(80px); z-index: -1; opacity: 0.6; animation: float 10s ease-in-out infinite; }
  .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(0,0,0,0) 70%); }
  .orb-2 { bottom: -10%; right: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(236,72,153,0.3) 0%, rgba(0,0,0,0) 70%); }
  
  .dark .orb-1 { background: radial-gradient(circle, rgba(79,70,229,0.2) 0%, rgba(0,0,0,0) 70%); }
  .dark .orb-2 { background: radial-gradient(circle, rgba(190,24,93,0.15) 0%, rgba(0,0,0,0) 70%); }

  @keyframes float { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(20px, 30px); } }

  .glass-card-premium {
    position: relative; border-radius: 24px;
    background: rgba(255, 255, 255, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .dark .glass-card-premium {
    background: rgba(30, 41, 59, 0.4); 
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  }
  .glass-card-premium:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.5);
    box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.1);
  }
  .dark .glass-card-premium:hover {
    background: rgba(30, 41, 59, 0.6);
  }

  .premium-input {
    background: rgba(255, 255, 255, 0.3); border: 1px solid rgba(0, 0, 0, 0.1); color: #1e293b; 
    transition: all 0.2s; padding-top: 0.8rem; padding-bottom: 0.8rem;
  }
  .dark .premium-input {
    background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); color: #f1f5f9;
  }
  .premium-input:focus {
    background: rgba(255, 255, 255, 0.9); border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
  }
  .dark .premium-input:focus {
    background: rgba(15, 23, 42, 0.8); border-color: #818cf8;
  }
  
  .glass-dropdown {
    background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.5); box-shadow: 0 15px 40px -10px rgba(0, 0, 0, 0.15);
  }
  .dark .glass-dropdown {
    background: rgba(15, 23, 42, 0.98); border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const TeacherForm = () => {
    const { addNotification } = useNotifications();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const isEdit = Boolean(id) && location.pathname.includes('/edit');
    const isView = Boolean(id) && location.pathname.includes('/view');
    const title = isView ? 'Perfil del Docente' : isEdit ? 'Editar Docente' : 'Nuevo Docente';

    const [loading, setLoading] = useState(false);
    const [activeMainTab, setActiveMainTab] = useState('info'); // info, docs
    const [formData, setFormData] = useState({
        ID_Docente: '', Tipo_Documento: 'CC', Cedula: '', Lugar_Expedicion: '',
        Nombre1: '', Nombre2: '', Apellido1: '', Apellido2: '',
        Sexo: '', Email: '', Telefono: '', Comentarios: '',
        Tipo_Vinculacion: 'Catedrático', Activo: 'Sí',
        Fecha_Vinculacion: '', Fecha_Desvinculacion: '',
        Nivel_Formacion: 'Profesional', Especialidad: '', Categoria: 'Asistente',
        Link_CvLAC: '', Grupo_Investigacion: '', Linea_Investigacion_Principal: '',
        URL_Carpeta_Drive: ''
    });

    const [createFolder, setCreateFolder] = useState(true);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (id) {
            const loadData = async () => {
                setLoading(true);
                try {
                    const allItems = await api.teachers.list();
                    const found = allItems.find(item => String(item.ID_Docente) === String(id) || String(item.id) === String(id));
                    if (found) {
                        const getVal = (key) => found[key] || found[key.toLowerCase()] || found[key.toUpperCase()] || '';
                        const getDateVal = (key) => {
                            const val = getVal(key);
                            if (!val) return '';
                            try { return new Date(val).toISOString().split('T')[0]; } catch (e) { return ''; }
                        };
                        setFormData({
                            ID_Docente: getVal('ID_Docente'),
                            Tipo_Documento: getVal('Tipo_Documento') || 'CC',
                            Cedula: getVal('Cedula'),
                            Lugar_Expedicion: getVal('Lugar_Expedicion'),
                            Nombre1: getVal('Nombre1'),
                            Nombre2: getVal('Nombre2'),
                            Apellido1: getVal('Apellido1'),
                            Apellido2: getVal('Apellido2'),
                            Sexo: getVal('Sexo'),
                            Email: getVal('Email'),
                            Telefono: getVal('Telefono'),
                            Comentarios: getVal('Comentarios'),
                            Tipo_Vinculacion: getVal('Tipo_Vinculacion') || 'Catedrático',
                            Activo: getVal('Activo') || 'Sí',
                            Fecha_Vinculacion: getDateVal('Fecha_Vinculacion'),
                            Fecha_Desvinculacion: getDateVal('Fecha_Desvinculacion'),
                            Nivel_Formacion: getVal('Nivel_Formacion') || 'Profesional',
                            Especialidad: getVal('Especialidad'),
                            Categoria: getVal('Categoria') || 'Asistente',
                            Link_CvLAC: getVal('Link_CvLAC'),
                            Grupo_Investigacion: getVal('Grupo_Investigacion'),
                            Linea_Investigacion_Principal: getVal('Linea_Investigacion_Principal'),
                            URL_Carpeta_Drive: getVal('URL_Carpeta_Drive')
                        });
                    }
                } catch (error) { console.error(error); } finally { setLoading(false); }
            };
            loadData();
        }
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        let newErrors = {};
        if (!formData.Nombre1.trim()) newErrors.Nombre1 = 'Obligatorio';
        if (!formData.Apellido1.trim()) newErrors.Apellido1 = 'Obligatorio';
        if (!formData.Cedula.toString().trim()) newErrors.Cedula = 'Obligatorio';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isView) return;
        if (!validate()) return toast.warning('Campos incompletos', 'Por favor revisa la información obligatoria.');

        setLoading(true);
        try {
            const now = new Date();
            const timestamp = now.toISOString();
            const payload = {
                ...formData,
                Ultima_Actualizacion: timestamp
            };
            if (!isEdit) {
                const existingTeachers = await api.teachers.list();
                const ids = existingTeachers.map(t => t.ID_Docente || t.id);
                const nextSeq = findNextSequence('DOC', ids, now.getFullYear(), now.getMonth() + 1);
                payload.ID_Docente = formData.ID_Docente || generateId('DOC', {
                    year: now.getFullYear(),
                    month: now.getMonth() + 1,
                    sequence: nextSeq
                });
                payload.Fecha_Registro = timestamp;
                payload._createFolder = createFolder;
            } else if (!formData.URL_Carpeta_Drive && createFolder) {
                payload._createFolder = true;
            }

            const response = isEdit
                ? await api.teachers.update(id, payload)
                : await api.teachers.create(payload);

            if (response.success || response.id) {
                addNotification(
                    isEdit ? 'Registro Actualizado' : 'Registro Exitoso',
                    `${formData.Nombre1} ${formData.Apellido1} ha sido guardado correctamente.`,
                    'success'
                );
                toast.success('¡Listo!', 'Información guardada con éxito.');
                navigate('/teachers');
            } else { throw new Error(response.message); }
        } catch (error) { toast.error('Error', 'No se pudo guardar la información.'); } finally { setLoading(false); }
    };

    const isDisabled = isView || loading;

    return (
        <div className="relative pb-24 animate-fade-in font-sans text-slate-800 dark:text-slate-100">
            <style>{styles}</style>
            <div className="app-bg"></div>
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>

            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 relative z-10">
                <button onClick={() => navigate('/teachers')} className="group flex items-center gap-2 px-5 py-2.5 rounded-full glass-card-premium hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold">Volver</span>
                </button>
                <h1 className="text-3xl font-black tracking-tight drop-shadow-sm text-center">{title}</h1>
            </div>

            {/* Selector de Pestañas (Solo si ya existe el docente) */}
            {id && (
                <div className="flex justify-center mb-10 relative z-10">
                    <div className="bg-white/30 dark:bg-black/20 p-1.5 rounded-3xl flex gap-2 border border-white/20 backdrop-blur-xl shadow-2xl">
                        <button
                            type="button" onClick={() => setActiveMainTab('info')}
                            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeMainTab === 'info' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600 hover:bg-white/50'}`}
                        >
                            Información Profesional
                        </button>
                        <button
                            type="button" onClick={() => setActiveMainTab('docs')}
                            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeMainTab === 'docs' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600 hover:bg-white/50'}`}
                        >
                            Archivo Documental
                        </button>
                    </div>
                </div>
            )}

            {activeMainTab === 'docs' && id ? (
                <div className="relative z-10 max-w-5xl mx-auto">
                    <div className="glass-card-premium p-10 rounded-[2.5rem] border-indigo-500/20">
                        <DocumentArchive beneficiaryId={id} beneficiaryName={`${formData.Nombre1} ${formData.Apellido1}`} />
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8 relative z-10" autoComplete="off">
                    <GlassSection title="Identificación" icon={User} color="indigo" zIndex={50}>
                        <InputGroup label="Primer Nombre" name="Nombre1" required value={formData.Nombre1} onChange={handleChange} disabled={isDisabled} error={errors.Nombre1} placeholder="Juan" icon={User} />
                        <InputGroup label="Segundo Nombre" name="Nombre2" value={formData.Nombre2} onChange={handleChange} disabled={isDisabled} placeholder="Opcional" icon={User} />
                        <InputGroup label="Primer Apellido" name="Apellido1" required value={formData.Apellido1} onChange={handleChange} disabled={isDisabled} error={errors.Apellido1} placeholder="Pérez" icon={User} />
                        <InputGroup label="Segundo Apellido" name="Apellido2" value={formData.Apellido2} onChange={handleChange} disabled={isDisabled} placeholder="Opcional" icon={User} />
                        <InputGroup label="Tipo Doc." name="Tipo_Documento" options={['CC', 'CE', 'PAS']} value={formData.Tipo_Documento} onChange={handleChange} disabled={isDisabled} icon={Hash} />
                        <InputGroup label="Documento" name="Cedula" required value={formData.Cedula} onChange={handleChange} disabled={isDisabled} error={errors.Cedula} placeholder="12345..." icon={Hash} />
                        <InputGroup label="Lugar de Expedición" name="Lugar_Expedicion" value={formData.Lugar_Expedicion} onChange={handleChange} disabled={isDisabled} placeholder="Ciudad" icon={MapPin} />
                        <InputGroup label="Sexo" name="Sexo" options={['Masculino', 'Femenino', 'Otro']} value={formData.Sexo} onChange={handleChange} disabled={isDisabled} icon={User} />

                        {!formData.URL_Carpeta_Drive && (
                            <div className="col-span-full mt-4 p-4 rounded-3xl bg-indigo-50/50 dark:bg-black/20 border border-indigo-100 dark:border-white/5 flex items-center justify-between">
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
                    </GlassSection>

                    <GlassSection title="Contacto y Cargo" icon={Phone} color="pink" zIndex={40}>
                        <InputGroup label="Email Institucional" name="Email" type="email" required value={formData.Email} onChange={handleChange} disabled={isDisabled} placeholder="docente@mail.com" icon={Mail} />
                        <InputGroup label="Teléfono / Celular" name="Telefono" value={formData.Telefono} onChange={handleChange} disabled={isDisabled} placeholder="300..." icon={Phone} />
                        <InputGroup label="Tipo de Vinculación" name="Tipo_Vinculacion" options={['Planta', 'Catedrático']} value={formData.Tipo_Vinculacion} onChange={handleChange} disabled={isDisabled} icon={Briefcase} />
                        <InputGroup label="Estado" name="Activo" options={['Sí', 'No']} value={formData.Activo} onChange={handleChange} disabled={isDisabled} icon={CheckCircle} />
                        <InputGroup label="Fecha Vinculación" name="Fecha_Vinculacion" type="date" value={formData.Fecha_Vinculacion} onChange={handleChange} disabled={isDisabled} icon={Calendar} />
                        <InputGroup label="Fecha Desvinculación" name="Fecha_Desvinculacion" type="date" value={formData.Fecha_Desvinculacion} onChange={handleChange} disabled={isDisabled} icon={Calendar} />
                    </GlassSection>

                    <GlassSection title="Perfil Académico" icon={GraduationCap} color="teal" zIndex={30}>
                        <InputGroup label="Nivel Formación" name="Nivel_Formacion" options={['Profesional', 'Especialización', 'Maestría', 'Doctorado']} value={formData.Nivel_Formacion} onChange={handleChange} disabled={isDisabled} icon={Award} />
                        <InputGroup label="Categoría" name="Categoria" options={['Instructor', 'Asistente', 'Asociado', 'Titular']} value={formData.Categoria} onChange={handleChange} disabled={isDisabled} icon={Award} />
                        <InputGroup label="Especialidad" name="Especialidad" value={formData.Especialidad} onChange={handleChange} disabled={isDisabled} placeholder="Ej: Algoritmos" icon={BookOpen} />
                        <InputGroup label="Link CvLAC" name="Link_CvLAC" value={formData.Link_CvLAC} onChange={handleChange} disabled={isDisabled} placeholder="URL" icon={Globe} />
                        <InputGroup label="Grupo Investigación" name="Grupo_Investigacion" value={formData.Grupo_Investigacion} onChange={handleChange} disabled={isDisabled} placeholder="Nombre del grupo" icon={UsersIcon} />
                        <InputGroup label="Línea Principal" name="Linea_Investigacion_Principal" value={formData.Linea_Investigacion_Principal} onChange={handleChange} disabled={isDisabled} placeholder="Su mayor fortaleza" icon={LinkIcon} />

                        {/* DRIVE INTEGRATION FOR TEACHERS */}
                        <div className="col-span-full pt-4 border-t border-slate-100 dark:border-white/5 mt-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-indigo-50/50 dark:bg-black/20 border border-indigo-100 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                                        <FolderOpen size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Repositorio del Docente</h4>
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider leading-none mb-1">Repositorio de Docente</h4>
                                        <p className="text-[10px] text-slate-500 font-medium">Gestión documental en Google Drive</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    {formData.URL_Carpeta_Drive ? (
                                        <a href={formData.URL_Carpeta_Drive} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-600/20">
                                            <ExternalLink size={16} /> Abrir Carpeta
                                        </a>
                                    ) : id && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setLoading(true);
                                                try {
                                                    const res = await api.teachers.update(id, { _syncDrive: true });
                                                    if (res.success) {
                                                        toast.success('Sincronizado', 'Carpeta generada correctamente');
                                                        const all = await api.teachers.list();
                                                        const fresh = all.find(t => String(t.ID_Docente) === String(id) || String(t.id) === String(id));
                                                        if (fresh) setFormData(prev => ({ ...prev, URL_Carpeta_Drive: fresh.URL_Carpeta_Drive || fresh.url_carpeta_drive, ID_Carpeta_Drive: fresh.ID_Carpeta_Drive || fresh.id_carpeta_drive }));
                                                    }
                                                } catch (e) {
                                                    toast.error('Error', 'No se pudo generar');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="px-6 py-2.5 rounded-xl bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 text-xs font-black hover:bg-slate-50 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/10 flex items-center gap-2"
                                        >
                                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Generar Carpeta
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </GlassSection>

                    <GlassSection title="Observaciones" icon={MessageSquare} zIndex={10}>
                        <div className="col-span-full">
                            <textarea name="Comentarios" value={formData.Comentarios} onChange={handleChange} disabled={isDisabled} rows="3" className="w-full p-4 rounded-xl premium-input resize-none outline-none font-medium" placeholder="Notas adicionales sobre el docente..."></textarea>
                        </div>
                    </GlassSection>

                    {!isView && (
                        <div className="flex justify-end pt-6">
                            <button type="submit" disabled={loading} className="px-10 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95 border border-white/20 flex items-center gap-3">
                                {loading ? 'Procesando...' : <><Save size={22} /> GUARDAR REGISTRO</>}
                            </button>
                        </div>
                    )}
                </form>
            )}
        </div>
    );
};

// COMPONENTES AUXILIARES
const GlassSection = ({ title, icon: Icon, color, children, badge, zIndex = 1 }) => {
    const [isOpen, setIsOpen] = useState(true);
    const colorMap = { indigo: 'bg-indigo-500', pink: 'bg-pink-500', teal: 'bg-teal-500', amber: 'bg-amber-500' };
    return (
        <div className="glass-card-premium mb-6 overflow-visible" style={{ zIndex }}>
            <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${colorMap[color] || 'bg-slate-500'}`}></div>
            <div className="flex justify-between items-center p-6 cursor-pointer select-none group" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center gap-3 pl-2">
                    <div className={`p-2 rounded-xl bg-slate-100 dark:bg-black/20 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all`}>
                        <Icon size={20} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{title}</h2>
                </div>
                <div className="flex items-center gap-3">
                    {badge}
                    <ChevronDown size={24} className={`text-slate-400 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>
            <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1500px] opacity-100 p-6 pt-0 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    {children}
                </div>
            </div>
        </div>
    );
};

const InputGroup = ({ label, name, value, onChange, options, type = "text", required, error, placeholder, disabled, icon: Icon }) => (
    <div className="w-full">
        <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1 block">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {options ? (
                <CustomSelect name={name} value={value} onChange={onChange} options={options} disabled={disabled} error={error} icon={Icon} />
            ) : (
                <>
                    {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors"><Icon size={18} /></div>}
                    <input type={type} name={name} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder}
                        className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 rounded-2xl premium-input outline-none shadow-sm font-medium ${error ? 'border-red-500 bg-red-50/50' : ''}`} />
                </>
            )}
        </div>
        {error && <p className="mt-1 text-[10px] font-bold text-red-500 animate-pulse">{error}</p>}
    </div>
);

export default TeacherForm;
