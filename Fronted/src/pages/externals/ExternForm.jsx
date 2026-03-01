import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    User, Mail, Hash, Save, ArrowLeft,
    Briefcase, AlertCircle, ChevronDown, CheckCircle,
    Phone, MapPin, Building, Globe, Check
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';
import { useNotifications } from '../../context/NotificationContext';
import { generateId, findNextSequence } from '../../utils/idGenerator';
import CustomSelect from '../../components/common/CustomSelect';
import { RefreshCw, ExternalLink, FolderOpen } from 'lucide-react';

const styles = `
  @keyframes float { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(20px, 30px); } }
  
  .app-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -2; background-color: #f8fafc; }
  .dark .app-bg { background-color: #0f172a; }
  
  .orb { position: fixed; border-radius: 50%; filter: blur(80px); z-index: -1; opacity: 0.6; animation: float 10s ease-in-out infinite; }
  .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(34,197,94,0.3) 0%, rgba(0,0,0,0) 70%); }
  .orb-2 { bottom: -10%; right: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(0,0,0,0) 70%); }
  
  .glass-card-premium {
    position: relative; border-radius: 24px;
    background: rgba(255, 255, 255, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    transition: all 0.3s ease;
  }
  .dark .glass-card-premium {
    background: rgba(15, 23, 42, 0.4); 
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .premium-input {
    background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(0, 0, 0, 0.05); border-radius: 1rem; 
    padding-top: 0.8rem; padding-bottom: 0.8rem;
    font-size: 0.875rem; font-weight: 500; transition: all 0.2s;
  }
  .dark .premium-input { background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.05); color: white; }
  .premium-input:focus { border-color: #22c55e; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1); background: white; }
`;

const ExternForm = () => {
    const { addNotification } = useNotifications();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const isEdit = Boolean(id) && location.pathname.includes('/edit');
    const isView = Boolean(id) && location.pathname.includes('/view');
    const title = isView ? 'Detalle de Externo' : isEdit ? 'Editar Externo' : 'Nuevo Externo';

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        Nombre1: '', Nombre2: '', Apellido1: '', Apellido2: '',
        Tipo_Documento: 'CC', Numero_Documento: '', Lugar_Expedicion: '',
        Sexo: '', Email: '', Telefono: '',
        Pais: 'Colombia', Ciudad: '',
        Tipo_Origen: 'Nacional', Organizacion: '', Cargo_Perfil: '',
        URL_Carpeta_Drive: ''
    });
    const [createFolder, setCreateFolder] = useState(true);

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (id) {
            const loadData = async () => {
                setLoading(true);
                try {
                    const all = await api.externals.list();
                    const found = all.find(s => String(s.ID_Externo) === String(id) || String(s.id) === String(id));
                    if (found) {
                        const getVal = (key) => found[key] || found[key.toLowerCase()] || found[key.toUpperCase()] || '';
                        setFormData({
                            Nombre1: getVal('Nombre1'), Nombre2: getVal('Nombre2'),
                            Apellido1: getVal('Apellido1'), Apellido2: getVal('Apellido2'),
                            Tipo_Documento: getVal('Tipo_Documento') || 'CC',
                            Numero_Documento: getVal('Numero_Documento') || getVal('Cedula'),
                            Lugar_Expedicion: getVal('Lugar_Expedicion'),
                            Sexo: getVal('Sexo'), Email: getVal('Email'), Telefono: getVal('Telefono'),
                            Pais: getVal('Pais') || 'Colombia', Ciudad: getVal('Ciudad'),
                            Tipo_Origen: getVal('Tipo_Origen') || 'Nacional',
                            Organizacion: getVal('Organizacion'), Cargo_Perfil: getVal('Cargo_Perfil')
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
        if (!formData.Nombre1.trim()) newErrors.Nombre1 = 'Requerido';
        if (!formData.Apellido1.trim()) newErrors.Apellido1 = 'Requerido';
        if (!formData.Numero_Documento.toString().trim()) newErrors.Numero_Documento = 'Requerido';
        if (!formData.Email.trim()) newErrors.Email = 'Requerido';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isView) return;
        if (!validate()) return toast.warning('Datos incompletos', 'Faltan campos obligatorios');

        setLoading(true);
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const timestamp = now.toISOString();

            let finalId = id;
            if (!isEdit) {
                const existingExterns = await api.externals.list();
                const ids = existingExterns.map(e => e.ID_Externo || e.id);
                const nextSeq = findNextSequence('EXT', ids, year, month);
                finalId = generateId('EXT', { year, month, sequence: nextSeq });
            }

            const dataToSave = {
                ...formData,
                ID_Externo: finalId,
                Ultima_Actualizacion: timestamp
            };
            if (!isEdit) {
                dataToSave.Fecha_Registro = timestamp;
                dataToSave._createFolder = createFolder;
            } else if (!formData.URL_Carpeta_Drive && createFolder) {
                dataToSave._createFolder = true;
            }

            const response = isEdit
                ? await api.externals.update(id, dataToSave)
                : await api.externals.create(dataToSave);

            if (response.success || response.id) {
                addNotification(isEdit ? 'Registro actualizado' : 'Nuevo registro', 'El colaborador externo ha sido guardado.', 'success');
                toast.success('Guardado', 'Registro procesado exitosamente');
                navigate('/externals');
            } else { throw new Error(response.message); }
        } catch (error) { toast.error('Error', 'No se pudieron guardar los cambios'); } finally { setLoading(false); }
    };

    const isDisabled = isView || loading;

    return (
        <div className="relative pb-24 animate-fade-in font-sans">
            <style>{styles}</style>
            <div className="app-bg"></div>
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>

            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 relative z-10">
                <button onClick={() => navigate('/externals')} className="group flex items-center gap-2 px-5 py-2.5 rounded-full glass-card-premium hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Volver</span>
                </button>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{title}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10" autoComplete="off">
                <GlassSection title="Identificación" icon={User} color="green" zIndex={30}>
                    <InputGroup label="Primer Nombre" name="Nombre1" required value={formData.Nombre1} onChange={handleChange} disabled={isDisabled} error={errors.Nombre1} icon={User} />
                    <InputGroup label="Segundo Nombre" name="Nombre2" value={formData.Nombre2} onChange={handleChange} disabled={isDisabled} icon={User} />
                    <InputGroup label="Primer Apellido" name="Apellido1" required value={formData.Apellido1} onChange={handleChange} disabled={isDisabled} error={errors.Apellido1} icon={User} />
                    <InputGroup label="Segundo Apellido" name="Apellido2" value={formData.Apellido2} onChange={handleChange} disabled={isDisabled} icon={User} />
                    <InputGroup label="Tipo Doc." name="Tipo_Documento" options={['CC', 'CE', 'PAS', 'DNI']} value={formData.Tipo_Documento} onChange={handleChange} disabled={isDisabled} icon={Hash} />
                    <InputGroup label="Número Doc." name="Numero_Documento" required value={formData.Numero_Documento} onChange={handleChange} disabled={isDisabled} error={errors.Numero_Documento} icon={Hash} />
                    <InputGroup label="Lugar Expedición" name="Lugar_Expedicion" value={formData.Lugar_Expedicion} onChange={handleChange} disabled={isDisabled} icon={MapPin} />
                    <InputGroup label="Sexo" name="Sexo" options={['Masculino', 'Femenino', 'Otro']} value={formData.Sexo} onChange={handleChange} disabled={isDisabled} icon={User} />

                    {!formData.URL_Carpeta_Drive && (
                        <div className="col-span-full mt-4 p-4 rounded-2xl bg-green-50/50 dark:bg-white/5 border border-green-100 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500 text-white rounded-xl">
                                    <FolderOpen size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Carpeta de Drive</p>
                                    <p className="text-[10px] text-slate-500 font-medium">Generar espacio digital automáticamente</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={createFolder} onChange={(e) => setCreateFolder(e.target.checked)} className="sr-only peer" disabled={isDisabled} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    )}
                </GlassSection>

                <GlassSection title="Contacto y Ubicación" icon={Globe} color="blue" zIndex={20}>
                    <InputGroup label="Email" name="Email" type="email" required value={formData.Email} onChange={handleChange} disabled={isDisabled} error={errors.Email} icon={Mail} />
                    <InputGroup label="Teléfono" name="Telefono" value={formData.Telefono} onChange={handleChange} disabled={isDisabled} icon={Phone} />
                    <InputGroup label="País" name="Pais" value={formData.Pais} onChange={handleChange} disabled={isDisabled} icon={Globe} />
                    <InputGroup label="Ciudad" name="Ciudad" value={formData.Ciudad} onChange={handleChange} disabled={isDisabled} icon={MapPin} />
                    <InputGroup label="Origen" name="Tipo_Origen" options={['Nacional', 'Internacional']} value={formData.Tipo_Origen} onChange={handleChange} disabled={isDisabled} icon={Globe} />
                </GlassSection>

                <GlassSection title="Perfil Profesional" icon={Briefcase} color="emerald" zIndex={10}>
                    <InputGroup label="Organización" name="Organizacion" required value={formData.Organizacion} onChange={handleChange} disabled={isDisabled} icon={Building} />
                    <InputGroup label="Cargo / Perfil" name="Cargo_Perfil" required value={formData.Cargo_Perfil} onChange={handleChange} disabled={isDisabled} icon={Briefcase} />
                </GlassSection>

                {/* REPOSITORIO DRIVE */}
                {id && (
                    <GlassSection title="Repositorio Documental" icon={FolderOpen} color="blue" zIndex={5}>
                        <div className="col-span-full">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-white/5 border border-blue-100 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500 text-white rounded-xl">
                                        <FolderOpen size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Carpeta de Drive</h4>
                                        <p className="text-[10px] font-bold text-slate-400">Expediente digital del externo</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    {formData.URL_Carpeta_Drive || formData.url_carpeta_drive ? (
                                        <a href={formData.URL_Carpeta_Drive || formData.url_carpeta_drive} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg">
                                            <ExternalLink size={14} /> ABRIR
                                        </a>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setLoading(true);
                                                try {
                                                    const res = await api.externals.update(id, { _syncDrive: true });
                                                    if (res.success) {
                                                        toast.success('Sincronizado', 'Carpeta generada');
                                                        const all = await api.externals.list();
                                                        const fresh = all.find(e => String(e.ID_Externo) === String(id) || String(e.id) === String(id));
                                                        if (fresh) setFormData(p => ({ ...p, URL_Carpeta_Drive: fresh.URL_Carpeta_Drive || fresh.url_carpeta_drive, ID_Carpeta_Drive: fresh.ID_Carpeta_Drive || fresh.id_carpeta_drive }));
                                                    }
                                                } catch (e) {
                                                    toast.error('Error', 'No se pudo generar');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                                        >
                                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> GENERAR
                                        </button>
                                    )}
                                </div>
                            </div>

                            {(formData.ID_Carpeta_Drive || formData.URL_Carpeta_Drive) && (
                                <FolderExplorer
                                    folderId={formData.ID_Carpeta_Drive || formData.id_carpeta_drive}
                                    folderUrl={formData.URL_Carpeta_Drive || formData.url_carpeta_drive}
                                />
                            )}
                        </div>
                    </GlassSection>
                )}

                {!isView && (
                    <div className="flex justify-end pt-6">
                        <button type="submit" disabled={loading} className="px-10 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg transition-transform hover:scale-105 border border-white/20 flex items-center gap-2">
                            {loading ? 'Guardando...' : <><Save size={20} /> GUARDAR</>}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

// COMPONENTES AUXILIARES (Similares a los usados en otros módulos)
const GlassSection = ({ title, icon: Icon, color, children, zIndex = 1 }) => {
    const [isOpen, setIsOpen] = useState(true);
    const colorMap = { green: 'bg-green-500', blue: 'bg-blue-500', emerald: 'bg-emerald-500' };
    return (
        <div className="glass-card-premium mb-6 overflow-visible" style={{ zIndex }}>
            <div className={`absolute top-0 bottom-0 left-0 w-1 ${colorMap[color]}`}></div>
            <div className="flex justify-between items-center p-6 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center gap-3">
                    <Icon size={20} className="text-slate-500" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
                </div>
                <ChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in overflow-visible">{children}</div>}
        </div>
    );
};

const InputGroup = ({ label, name, value, onChange, options, type = "text", required, error, disabled, icon: Icon }) => (
    <div className="w-full">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {options ? (
                <CustomSelect name={name} value={value} onChange={onChange} options={options} disabled={disabled} error={error} icon={Icon} />
            ) : (
                <>
                    {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icon size={18} /></div>}
                    <input type={type} name={name} value={value} onChange={onChange} disabled={disabled} className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3 rounded-xl premium-input outline-none ${error ? 'border-red-500/50' : ''}`} />
                </>
            )}
            {error && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"><AlertCircle size={18} /></div>}
        </div>
    </div>
);

export default ExternForm;
