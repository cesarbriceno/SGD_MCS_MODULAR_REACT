import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Calendar, MapPin, Clock, Globe, Award,
    DollarSign, Briefcase, MessageSquare, AlertCircle,
    Save, ArrowLeft, ChevronDown, Check, LayoutGrid,
    Link as LinkIcon, Info, Users
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';
import { useNotifications } from '../../context/NotificationContext';
import ParticipationManager from './ParticipationManager';
import CustomSelect from '../../components/common/CustomSelect';
import { RefreshCw, ExternalLink, FolderOpen } from 'lucide-react';

const styles = `
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  .orb { position: fixed; border-radius: 50%; filter: blur(80px); z-index: -1; opacity: 0.4; animation: float 10s ease-in-out infinite; }
  .orb-green { top: -10%; right: -10%; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(34,197,94,0.4) 0%, rgba(0,0,0,0) 70%); }
  
  .glass-card {
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  }
  .dark .glass-card {
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

  .tab-btn {
    position: relative; padding: 1rem 1.5rem; font-size: 0.75rem; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.1em; color: #64748b; transition: all 0.3s;
  }
  .tab-btn.active { color: #22c55e; }
  .tab-btn.active::after {
    content: ''; position: absolute; bottom: 0; left: 20%; right: 20%; height: 3px;
    background: #22c55e; border-radius: 99px;
  }
`;

const EventForm = () => {
    const { addNotification } = useNotifications();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const isEdit = Boolean(id) && location.pathname.includes('/edit');
    const isView = Boolean(id) && location.pathname.includes('/view');
    const title = isView ? 'Detalle del Evento' : isEdit ? 'Editar Evento' : 'Nuevo Evento';

    const [activeTab, setActiveTab] = useState('BAS'); // BAS, LOG, FIN, ACA, PART
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        Nombre_Evento: '', Tipo_Evento: 'Seminario', Alcance: 'Nacional', Modalidad: 'Presencial',
        Lugar: '', Fecha_Inicio: '', Fecha_Fin: '', Intensidad_Horaria: '',
        Presupuesto: '', Fuente_Financiacion: '',
        Impacto_Academico: '', URL_Evidencias: ''
    });

    // --- CÁLCULO DE DURACIÓN ---
    const durationDays = useMemo(() => {
        if (!formData.Fecha_Inicio || !formData.Fecha_Fin) return 0;
        const start = new Date(formData.Fecha_Inicio);
        const end = new Date(formData.Fecha_Fin);
        const diff = end.getTime() - start.getTime();
        if (diff < 0) return 0;
        return Math.ceil(diff / (1000 * 3600 * 24)) + 1; // +1 para incluir el día de inicio
    }, [formData.Fecha_Inicio, formData.Fecha_Fin]);

    useEffect(() => {
        if (id) {
            const loadData = async () => {
                setLoading(true);
                try {
                    const data = await api.events.list();
                    const found = data.find(e => String(e.ID_Evento) === String(id) || String(e.id) === String(id));
                    if (found) {
                        const getVal = (key) => found[key] || found[key.toLowerCase()] || found[key.toUpperCase()] || '';
                        setFormData({
                            Nombre_Evento: getVal('Nombre_Evento'),
                            Tipo_Evento: getVal('Tipo_Evento') || 'Seminario',
                            Alcance: getVal('Alcance') || 'Nacional',
                            Modalidad: getVal('Modalidad') || 'Presencial',
                            Lugar: getVal('Lugar'),
                            Fecha_Inicio: getVal('Fecha_Inicio'),
                            Fecha_Fin: getVal('Fecha_Fin'),
                            Intensidad_Horaria: getVal('Intensidad_Horaria'),
                            Presupuesto: getVal('Presupuesto'),
                            Fuente_Financiacion: getVal('Fuente_Financiacion'),
                            Impacto_Academico: getVal('Impacto_Academico'),
                            URL_Evidencias: getVal('URL_Evidencias')
                        });
                    }
                } catch (error) { console.error(error); } finally { setLoading(false); }
            };
            loadData();
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isView) return;
        if (!formData.Nombre_Evento) return toast.warning('Faltan Datos', 'El nombre del evento es obligatorio.');

        setLoading(true);
        try {
            const timestamp = new Date().toISOString();
            const response = isEdit
                ? await api.events.update(id, { ...formData, Ultima_Actualizacion: timestamp })
                : await api.events.create({ ...formData, ID_Evento: `EV-${Date.now()}`, Fecha_Registro: timestamp });

            if (response.success || response.id) {
                addNotification(isEdit ? 'Evento actualizado' : 'Evento creado', `${formData.Nombre_Evento} guardado correctamente.`, 'success');
                toast.success('¡Listo!', 'El registro ha sido procesado.');
                navigate('/events');
            }
        } catch (error) { toast.error('Error', 'No se pudo guardar la información.'); } finally { setLoading(false); }
    };

    const tabs = [
        { id: 'BAS', label: 'Básicos', icon: LayoutGrid },
        { id: 'LOG', label: 'Logística', icon: MapPin },
        { id: 'FIN', label: 'Financiera', icon: DollarSign },
        { id: 'ACA', label: 'Académica', icon: Award },
        { id: 'PART', label: 'Participantes', icon: Users, disabled: !id && !isEdit }
    ];

    return (
        <div className="relative pb-24 animate-fade-in font-sans overflow-visible min-h-screen">
            <style>{styles}</style>
            <div className="orb orb-green"></div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 px-4 md:px-8 pt-8">
                <button onClick={() => navigate('/events')} className="group flex items-center gap-2 px-5 py-2.5 rounded-full glass-card hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold">Volver</span>
                </button>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h1>
            </div>

            <div className="max-w-5xl mx-auto px-4">
                <div className="glass-card rounded-[2.5rem] overflow-visible">
                    {/* Tabs Navigation */}
                    <div className="flex border-b border-black/5 dark:border-white/5 overflow-x-auto bg-white/30 dark:bg-black/10">
                        {tabs.map(tab => (
                            <button
                                key={tab.id} disabled={tab.disabled}
                                onClick={() => setActiveTab(tab.id)}
                                className={`tab-btn flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                            >
                                <tab.icon size={16} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
                        {activeTab === 'BAS' && (
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nombre del Evento <span className="text-red-500">*</span></label>
                                    <input
                                        value={formData.Nombre_Evento} onChange={e => setFormData(p => ({ ...p, Nombre_Evento: e.target.value }))}
                                        disabled={isView} className="w-full premium-input px-5 text-lg font-bold" placeholder="Ej: Congreso Internacional de IA..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tipo de Evento</label>
                                    <CustomSelect
                                        name="Tipo_Evento" value={formData.Tipo_Evento}
                                        onChange={e => setFormData(p => ({ ...p, Tipo_Evento: e.target.value }))}
                                        disabled={isView} options={['Seminario', 'Congreso', 'Simposio', 'Taller', 'Conferencia', 'Video-Foro']}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Alcance</label>
                                    <CustomSelect
                                        name="Alcance" value={formData.Alcance}
                                        onChange={e => setFormData(p => ({ ...p, Alcance: e.target.value }))}
                                        disabled={isView} options={['Local', 'Nacional', 'Internacional']}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Modalidad</label>
                                    <CustomSelect
                                        name="Modalidad" value={formData.Modalidad}
                                        onChange={e => setFormData(p => ({ ...p, Modalidad: e.target.value }))}
                                        disabled={isView} options={['Presencial', 'Virtual', 'Híbrida']}
                                    />
                                </div>
                            </section>
                        )}

                        {activeTab === 'LOG' && (
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Lugar / Plataforma</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input value={formData.Lugar} onChange={e => setFormData(p => ({ ...p, Lugar: e.target.value }))} disabled={isView} className="w-full premium-input pl-12 pr-5" placeholder="Ej: Auditorio Central / Zoom" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Intensidad Horaria</label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="number" value={formData.Intensidad_Horaria} onChange={e => setFormData(p => ({ ...p, Intensidad_Horaria: e.target.value }))} disabled={isView} className="w-full premium-input pl-12 pr-5" placeholder="Horas" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fecha Inicio</label>
                                    <input type="date" value={formData.Fecha_Inicio} onChange={e => setFormData(p => ({ ...p, Fecha_Inicio: e.target.value }))} disabled={isView} className="w-full premium-input px-5" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fecha Fin</label>
                                    <input type="date" value={formData.Fecha_Fin} onChange={e => setFormData(p => ({ ...p, Fecha_Fin: e.target.value }))} disabled={isView} className="w-full premium-input px-5" />
                                </div>

                                {durationDays > 0 && (
                                    <div className="md:col-span-2 animate-fade-in-up">
                                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400">
                                            <Calendar size={20} />
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Duración Calculada</p>
                                                <p className="text-sm font-bold">{durationDays} {durationDays === 1 ? 'Día' : 'Días'} de actividad académica</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {activeTab === 'FIN' && (
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Presupuesto Estimado</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="number" value={formData.Presupuesto} onChange={e => setFormData(p => ({ ...p, Presupuesto: e.target.value }))} disabled={isView} className="w-full premium-input pl-12 pr-5" placeholder="Monto en pesos" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fuente de Financiación</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input value={formData.Fuente_Financiacion} onChange={e => setFormData(p => ({ ...p, Fuente_Financiacion: e.target.value }))} disabled={isView} className="w-full premium-input pl-12 pr-5" placeholder="Ej: Recursos Propios / Beca" />
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === 'ACA' && (
                            <section className="space-y-8 animate-fade-in">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Impacto Académico / Gestión</label>
                                    <textarea
                                        value={formData.Impacto_Academico} onChange={e => setFormData(p => ({ ...p, Impacto_Academico: e.target.value }))}
                                        disabled={isView} className="w-full premium-input px-5 h-32 resize-none" placeholder="Describe los logros o impacto del evento..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">URL de Evidencias (Drive/Repo)</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input value={formData.URL_Evidencias} onChange={e => setFormData(p => ({ ...p, URL_Evidencias: e.target.value }))} disabled={isView} className="w-full premium-input pl-12 pr-5" placeholder="https://..." />
                                    </div>
                                </div>

                                {/* DRIVE REPOSITORY SECTION */}
                                <div className="pt-4 border-t border-black/5 dark:border-white/5 mt-4">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                                <FolderOpen size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Repositorio Documental</h4>
                                                <p className="text-[10px] text-slate-500 font-medium">Archivos y evidencias del evento en Drive</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            {formData.URL_Evidencias || formData.URL_Carpeta_Drive ? (
                                                <a href={formData.URL_Evidencias || formData.URL_Carpeta_Drive} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">
                                                    <ExternalLink size={14} /> ABRIR CARPETA
                                                </a>
                                            ) : id && (
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        setLoading(true);
                                                        try {
                                                            const res = await api.events.update(id, { _syncDrive: true });
                                                            if (res.success) {
                                                                toast.success('Sincronizado', 'Carpeta generada correctamente');
                                                                const all = await api.events.list();
                                                                const fresh = all.find(e => String(e.ID_Evento) === String(id) || String(e.id) === String(id));
                                                                if (fresh) setFormData(prev => ({ ...prev, URL_Evidencias: fresh.URL_Carpeta_Drive || fresh.url_carpeta_drive }));
                                                            }
                                                        } catch (e) {
                                                            toast.error('Error', 'No se pudo sincronizar');
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-white/20 transition-all"
                                                >
                                                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> GENERAR REPOSITORIO
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* DRIVE FILE EXPLORER */}
                                    {(formData.ID_Carpeta_Drive || formData.URL_Evidencias) && (
                                        <FolderExplorer
                                            folderId={formData.ID_Carpeta_Drive}
                                            folderUrl={formData.URL_Evidencias}
                                        />
                                    )}
                                </div>
                            </section>
                        )}

                        {activeTab === 'PART' && id && (
                            <div className="animate-fade-in">
                                <ParticipationManager eventId={id} isView={isView} eventName={formData.Nombre_Evento} />
                            </div>
                        )}

                        {!isView && activeTab !== 'PART' && (
                            <div className="flex justify-end pt-8">
                                <button
                                    type="submit" disabled={loading}
                                    className="px-10 py-3.5 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-black shadow-xl shadow-green-600/20 transition-all hover:scale-[1.02] flex items-center gap-2"
                                >
                                    {loading ? 'Guardando...' : <><Save size={20} /> GUARDAR EVENTO</>}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EventForm;
