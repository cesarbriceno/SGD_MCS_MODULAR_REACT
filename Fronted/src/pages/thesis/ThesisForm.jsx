import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    FileText, Search, User, GraduationCap, Calendar, Save, ArrowLeft,
    Check, AlertCircle, ChevronDown, Award, BookOpen, Globe, Link as LinkIcon,
    Hash, MessageSquare, Clock, Filter, FolderOpen, ExternalLink, RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';
import { useNotifications } from '../../context/NotificationContext';
import { generateId, findNextSequence } from '../../utils/idGenerator';
import CustomSelect from '../../components/common/CustomSelect';
import FolderExplorer from '../../components/common/FolderExplorer';

const styles = `
  .glass-card { background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); border-radius: 2rem; }
  .dark .glass-card { background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); }
  
  .premium-input {
    background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(0, 0, 0, 0.05); border-radius: 1rem; 
    padding-top: 0.8rem; padding-bottom: 0.8rem;
    font-size: 0.875rem; font-weight: 500; transition: all 0.2s;
  }
  .dark .premium-input { background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.05); color: white; }
  .premium-input:focus { border-color: #9333ea; box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.1); background: white; }
  .dark .premium-input:focus { background: rgba(0,0,0,0.4); }

  .search-dropdown {
    position: absolute; top: 100%; left: 0; right: 0; z-index: 100; margin-top: 0.5rem;
    background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(20px); border-radius: 1.25rem;
    box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.2); border: 1px solid rgba(0, 0, 0, 0.05);
    max-height: 300px; overflow-y: auto;
  }
  .dark .search-dropdown { background: rgba(30, 41, 59, 0.98); border: 1px solid rgba(255, 255, 255, 0.1); }
`;

const ThesisForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = Boolean(id) && location.pathname.includes('/edit');
    const isView = Boolean(id) && location.pathname.includes('/view');
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        Titulo_Investigacion: '', Año: new Date().getFullYear().toString(),
        Estado_Tesis: 'En Desarrollo', Calificacion: '',
        Modalidad: 'Investigación', Linea_Investigacion_Tesis: '',
        Palabras_Clave: '', Resumen: '',
        ID_Estudiante: '', Nombre_Estudiante: '',
        ID_Asesor: '', Nombre_Asesor: '',
        Codirector: '', Nombre_Codirector: '',
        Jurado_1: '', Nombre_Jurado_1: '', Jurado_2: '', Nombre_Jurado_2: '',
        Fecha_Inicio: '', Fecha_Defensa: '', Numero_Acta_Sustentacion: '',
        URL_Documento: '',
        URL_Carpeta_Drive: ''
    });
    const [createFolder, setCreateFolder] = useState(true);
    const [searchCodirector, setSearchCodirector] = useState('');
    const [showCodirectorResults, setShowCodirectorResults] = useState(false);

    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [searchStudent, setSearchStudent] = useState('');
    const [searchAsesor, setSearchAsesor] = useState('');
    const [searchJurado1, setSearchJurado1] = useState('');
    const [searchJurado2, setSearchJurado2] = useState('');

    const [showStudentResults, setShowStudentResults] = useState(false);
    const [showAsesorResults, setShowAsesorResults] = useState(false);
    const [showJurado1Results, setShowJurado1Results] = useState(false);
    const [showJurado2Results, setShowJurado2Results] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [sList, tList] = await Promise.all([api.students.list(), api.teachers.list()]);
                setStudents(sList); setTeachers(tList);

                if (id) {
                    const thesisList = await api.thesis.list();
                    const found = thesisList.find(t => String(t.ID_Tesis) === String(id) || String(t.id) === String(id));
                    if (found) {
                        const getVal = (k) => found[k] || found[k.toLowerCase()] || found[k.toUpperCase()] || '';
                        setFormData({
                            Titulo_Investigacion: getVal('Titulo_Investigacion'),
                            Año: getVal('Año'),
                            Estado_Tesis: getVal('Estado_Tesis'),
                            Calificacion: getVal('Calificacion'),
                            Modalidad: getVal('Modalidad'),
                            Linea_Investigacion_Tesis: getVal('Linea_Investigacion_Tesis'),
                            Palabras_Clave: getVal('Palabras_Clave'),
                            Resumen: getVal('Resumen'),
                            ID_Estudiante: getVal('ID_Estudiante'),
                            Nombre_Estudiante: getVal('Nombre_Estudiante'),
                            ID_Asesor: getVal('ID_Asesor'),
                            Nombre_Asesor: getVal('Nombre_Asesor'),
                            Codirector: getVal('Codirector'),
                            Nombre_Codirector: getVal('Nombre_Codirector'),
                            Jurado_1: getVal('Jurado_1'),
                            Nombre_Jurado_1: getVal('Nombre_Jurado_1'),
                            Jurado_2: getVal('Jurado_2'),
                            Nombre_Jurado_2: getVal('Nombre_Jurado_2'),
                            Fecha_Inicio: getVal('Fecha_Inicio') ? new Date(getVal('Fecha_Inicio')).toISOString().split('T')[0] : '',
                            Fecha_Defensa: getVal('Fecha_Defensa') ? new Date(getVal('Fecha_Defensa')).toISOString().split('T')[0] : '',
                            Numero_Acta_Sustentacion: getVal('Numero_Acta_Sustentacion'),
                            URL_Documento: getVal('URL_Documento'),
                            URL_Carpeta_Drive: getVal('URL_Carpeta_Drive')
                        });
                        setSearchStudent(getVal('Nombre_Estudiante'));
                        setSearchAsesor(getVal('Nombre_Asesor'));
                        setSearchCodirector(getVal('Nombre_Codirector'));
                        setSearchJurado1(getVal('Nombre_Jurado_1'));
                        setSearchJurado2(getVal('Nombre_Jurado_2'));
                    }
                }
            } catch (err) { console.error(err); }
        };
        loadInitialData();
    }, [id]);

    const handleSelectStudent = (s) => {
        const nombre = `${s.Nombre1} ${s.Apellido1}`.trim();
        setFormData(p => ({ ...p, ID_Estudiante: s.ID_Estudiante || s.id, Nombre_Estudiante: nombre }));
        setSearchStudent(nombre); setShowStudentResults(false);
    };

    const handleSelectTeacher = (t, fieldPrefix) => {
        const nombre = `${t.Nombre1} ${t.Apellido1}`.trim();
        const idVal = t.ID_Docente || t.id;

        // Mapeo especial para campos de jurados/codirector que no llevan "ID_" en la BD del usuario
        const idField = (fieldPrefix === 'Asesor') ? `ID_${fieldPrefix}` : fieldPrefix;

        setFormData(p => ({ ...p, [idField]: idVal, [`Nombre_${fieldPrefix}`]: nombre }));

        if (fieldPrefix === 'Asesor') { setSearchAsesor(nombre); setShowAsesorResults(false); }
        if (fieldPrefix === 'Codirector') { setSearchCodirector(nombre); setShowCodirectorResults(false); }
        if (fieldPrefix === 'Jurado_1') { setSearchJurado1(nombre); setShowJurado1Results(false); }
        if (fieldPrefix === 'Jurado_2') { setSearchJurado2(nombre); setShowJurado2Results(false); }
    };

    const handleManualTeacherChange = (val, fieldPrefix) => {
        const idField = (fieldPrefix === 'Asesor') ? `ID_${fieldPrefix}` : fieldPrefix;
        setFormData(p => ({ ...p, [idField]: '', [`Nombre_${fieldPrefix}`]: val }));

        if (fieldPrefix === 'Asesor') { setSearchAsesor(val); setShowAsesorResults(true); }
        if (fieldPrefix === 'Codirector') { setSearchCodirector(val); setShowCodirectorResults(true); }
        if (fieldPrefix === 'Jurado_1') { setSearchJurado1(val); setShowJurado1Results(true); }
        if (fieldPrefix === 'Jurado_2') { setSearchJurado2(val); setShowJurado2Results(true); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isView) return;
        if (!formData.Titulo_Investigacion || !formData.ID_Estudiante || !formData.Nombre_Asesor) {
            return toast.warning('Faltan Datos', 'El título, el estudiante y el asesor son obligatorios.');
        }

        setLoading(true);
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const timestamp = now.toISOString();

            let finalId = id;
            if (!isEdit) {
                const existingThesis = await api.thesis.list();
                const ids = existingThesis.map(t => t.ID_Tesis || t.id);
                const nextSeq = findNextSequence('TES', ids, year, month);
                finalId = generateId('TES', { year, month, sequence: nextSeq });
            }

            const dataToSave = {
                ...formData,
                ID_Tesis: finalId,
                Ultima_Actualizacion: timestamp
            };
            if (!isEdit) {
                dataToSave.Fecha_Registro = timestamp;
                dataToSave._createFolder = createFolder;
            } else if (!formData.URL_Carpeta_Drive && createFolder) {
                dataToSave._createFolder = true;
            }

            const res = isEdit ? await api.thesis.update(id, dataToSave) : await api.thesis.create(dataToSave);
            if (res.success || res.id) {
                toast.success('Guardado', 'Investigación registrada correctamente.');
                navigate('/thesis');
            }
        } catch (e) { toast.error('Error', 'No se pudo guardar la tesis.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="pb-24 animate-fade-in p-4 md:p-8">
            <style>{styles}</style>

            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <button onClick={() => navigate('/thesis')} className="p-3 glass-card hover:bg-white/60 transition-all text-slate-500"><ArrowLeft size={20} /></button>
                    <h1 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white uppercase">{isView ? 'Detalles' : isEdit ? 'Editar' : 'Nueva'} Tesis</h1>
                    <div className="w-10"></div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* COLUMNA IZQUIERDA: DATOS BÁSICOS */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="glass-card p-8 space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-black/5">
                                <FileText className="text-purple-600" size={24} />
                                <h2 className="font-black text-xs uppercase tracking-widest text-slate-400">Información General</h2>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                    Título de la Investigación <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.Titulo_Investigacion} onChange={(e) => setFormData(p => ({ ...p, Titulo_Investigacion: e.target.value }))}
                                    placeholder="Escribe el título completo aquí..." disabled={isView}
                                    className="w-full premium-input px-4 h-32 resize-none text-lg font-bold uppercase leading-tight"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estado de la Tesis</label>
                                    <CustomSelect
                                        name="Estado_Tesis" value={formData.Estado_Tesis}
                                        onChange={e => setFormData(p => ({ ...p, Estado_Tesis: e.target.value }))}
                                        disabled={isView} options={['En Curso', 'Sustentada', 'Aprobada', 'Reprobada', 'Pendiente']}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tipo de Tesis</label>
                                    <CustomSelect
                                        name="Tipo_Tesis" value={formData.Tipo_Tesis}
                                        onChange={e => setFormData(p => ({ ...p, Tipo_Tesis: e.target.value }))}
                                        disabled={isView} options={['Maestría Prof.', 'Maestría Invest.', 'Doctorado', 'Otro']}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Modalidad</label>
                                    <select value={formData.Modalidad} onChange={e => setFormData(p => ({ ...p, Modalidad: e.target.value }))} disabled={isView} className="w-full premium-input px-4">
                                        <option>Investigación</option><option>Práctica</option><option>Emprendimiento</option><option>Monografía</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Línea de Investigación</label>
                                    <input value={formData.Linea_Investigacion_Tesis} onChange={e => setFormData(p => ({ ...p, Linea_Investigacion_Tesis: e.target.value }))} disabled={isView} className="w-full premium-input px-4" placeholder="Ej: Inteligencia Artificial" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Palabras Clave</label>
                                    <input value={formData.Palabras_Clave} onChange={e => setFormData(p => ({ ...p, Palabras_Clave: e.target.value }))} disabled={isView} className="w-full premium-input px-4" placeholder="Ej: Educacion, IA, Robotica" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">URL del Documento</label>
                                    <div className="relative group">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input value={formData.URL_Documento} onChange={e => setFormData(p => ({ ...p, URL_Documento: e.target.value }))} disabled={isView} className="w-full premium-input pl-11" placeholder="https://..." />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Resumen (Abstract)</label>
                                <textarea value={formData.Resumen} onChange={e => setFormData(p => ({ ...p, Resumen: e.target.value }))} disabled={isView} className="w-full premium-input px-4 h-40 resize-none font-medium text-sm leading-relaxed" placeholder="Breve descripción del trabajo..." />
                            </div>

                            {!formData.URL_Carpeta_Drive && (
                                <div className="mt-6 p-5 rounded-[1.5rem] bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-600/20">
                                            <FolderOpen size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Repositorio en Drive</p>
                                            <p className="text-[10px] text-slate-500 font-medium tracking-tight">Vincular carpeta automáticamente al guardar</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={createFolder} onChange={(e) => setCreateFolder(e.target.checked)} className="sr-only peer" disabled={isView || loading} />
                                        <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>
                            )}
                        </section>

                        <section className="glass-card p-8 space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-black/5">
                                <GraduationCap className="text-blue-600" size={24} />
                                <h2 className="font-black text-xs uppercase tracking-widest text-slate-400">Participantes</h2>
                            </div>

                            {/* BUSCADOR DE ESTUDIANTE */}
                            <div className="relative space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                    Estudiante Autor <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                                    <input
                                        type="text" value={searchStudent} onChange={(e) => { setSearchStudent(e.target.value); setShowStudentResults(true); }}
                                        onFocus={() => setShowStudentResults(true)} disabled={isView}
                                        placeholder="Buscar por nombre o cédula..." className="w-full premium-input pl-12"
                                    />
                                    {showStudentResults && searchStudent.length > 0 && !isView && (
                                        <div className="search-dropdown">
                                            {students.filter(s => `${s.Nombre1} ${s.Apellido1}`.toLowerCase().includes(searchStudent.toLowerCase()) || (s.Cedula || '').toString().includes(searchStudent)).slice(0, 5).map(s => (
                                                <div key={s.id} onClick={() => handleSelectStudent(s)} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center justify-between group">
                                                    <div>
                                                        <p className="font-black text-sm uppercase text-slate-800 dark:text-white">{s.Nombre1} {s.Apellido1}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">ID: {s.ID_Estudiante || s.id} • {s.Cedula}</p>
                                                    </div>
                                                    <Check className="text-emerald-500 opacity-0 group-hover:opacity-100" size={16} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* ASESOR */}
                                <div className="relative space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                        Director / Asesor <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                                        <input
                                            value={searchAsesor} onChange={(e) => handleManualTeacherChange(e.target.value, 'Asesor')}
                                            onFocus={() => setShowAsesorResults(true)} disabled={isView}
                                            className="w-full premium-input pl-12" placeholder="Buscar o escribir nombre..."
                                        />
                                        {showAsesorResults && searchAsesor.length > 0 && !isView && (
                                            <div className="search-dropdown">
                                                {teachers.filter(t => `${t.Nombre1} ${t.Apellido1}`.toLowerCase().includes(searchAsesor.toLowerCase())).slice(0, 5).map(t => (
                                                    <div key={t.id} onClick={() => handleSelectTeacher(t, 'Asesor')} className="p-3 hover:bg-purple-50 cursor-pointer text-xs font-bold uppercase">{t.Nombre1} {t.Apellido1}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* CODIRECTOR */}
                                <div className="relative space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Codirector (Opcional)</label>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                                        <input
                                            value={searchCodirector} onChange={(e) => handleManualTeacherChange(e.target.value, 'Codirector')}
                                            onFocus={() => setShowCodirectorResults(true)} disabled={isView}
                                            className="w-full premium-input pl-12" placeholder="Buscar o escribir nombre..."
                                        />
                                        {showCodirectorResults && searchCodirector.length > 0 && !isView && (
                                            <div className="search-dropdown">
                                                {teachers.filter(t => `${t.Nombre1} ${t.Apellido1}`.toLowerCase().includes(searchCodirector.toLowerCase())).slice(0, 5).map(t => (
                                                    <div key={t.id} onClick={() => handleSelectTeacher(t, 'Codirector')} className="p-3 hover:bg-purple-50 cursor-pointer text-xs font-bold uppercase">{t.Nombre1} {t.Apellido1}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* JURADO 1 */}
                                <div className="relative space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Evaluador / Jurado 1</label>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                                        <input
                                            value={searchJurado1} onChange={(e) => handleManualTeacherChange(e.target.value, 'Jurado_1')}
                                            onFocus={() => setShowJurado1Results(true)} disabled={isView}
                                            className="w-full premium-input pl-12" placeholder="Buscar o escribir nombre..."
                                        />
                                        {showJurado1Results && searchJurado1.length > 0 && !isView && (
                                            <div className="search-dropdown">
                                                {teachers.filter(t => `${t.Nombre1} ${t.Apellido1}`.toLowerCase().includes(searchJurado1.toLowerCase())).slice(0, 5).map(t => (
                                                    <div key={t.id} onClick={() => handleSelectTeacher(t, 'Jurado_1')} className="p-3 hover:bg-purple-50 cursor-pointer text-xs font-bold uppercase">{t.Nombre1} {t.Apellido1}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* JURADO 2 */}
                                <div className="relative space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Evaluador / Jurado 2</label>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                                        <input
                                            value={searchJurado2} onChange={(e) => handleManualTeacherChange(e.target.value, 'Jurado_2')}
                                            onFocus={() => setShowJurado2Results(true)} disabled={isView}
                                            className="w-full premium-input pl-12" placeholder="Buscar o escribir nombre..."
                                        />
                                        {showJurado2Results && searchJurado2.length > 0 && !isView && (
                                            <div className="search-dropdown">
                                                {teachers.filter(t => `${t.Nombre1} ${t.Apellido1}`.toLowerCase().includes(searchJurado2.toLowerCase())).slice(0, 5).map(t => (
                                                    <div key={t.id} onClick={() => handleSelectTeacher(t, 'Jurado_2')} className="p-3 hover:bg-purple-50 cursor-pointer text-xs font-bold uppercase">{t.Nombre1} {t.Apellido1}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* COLUMNA DERECHA: ESTADO Y FECHAS */}
                    <div className="space-y-8">
                        <section className="glass-card p-6 space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-black/5">
                                <Clock className="text-amber-500" size={20} />
                                <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Progreso</h2>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estado de Tesis</label>
                                <select value={formData.Estado_Tesis} onChange={e => setFormData(p => ({ ...p, Estado_Tesis: e.target.value }))} disabled={isView} className="w-full premium-input px-4 font-bold uppercase">
                                    <option>En Desarrollo</option><option>Sustentada</option><option>Bajo Revisión</option><option>Reprobada</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Año Académico</label>
                                <input type="number" value={formData.Año} onChange={e => setFormData(p => ({ ...p, Año: e.target.value }))} disabled={isView} className="w-full premium-input px-4 text-center font-black" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Calificación Final</label>
                                <input type="number" step="0.1" value={formData.Calificacion} onChange={e => setFormData(p => ({ ...p, Calificacion: e.target.value }))} disabled={isView} className="w-full premium-input px-4 text-2xl text-center font-black text-purple-600" placeholder="0.0" />
                            </div>

                            {/* DRIVE INTEGRATION FOR THESIS */}
                            <div className="pt-4 border-t border-black/5 mt-2">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                            <FolderOpen size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Repositorio de Tesis</h4>
                                        </div>
                                    </div>

                                    {formData.URL_Carpeta_Drive ? (
                                        <a
                                            href={formData.URL_Carpeta_Drive}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                                        >
                                            <ExternalLink size={14} /> Abrir Carpeta
                                        </a>
                                    ) : id && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setLoading(true);
                                                try {
                                                    const res = await api.thesis.update(id, { _syncDrive: true });
                                                    if (res.success) {
                                                        toast.success('Sincronizado', 'Carpeta generada correctamente');
                                                        const all = await api.thesis.list();
                                                        const fresh = all.find(t => String(t.ID_Tesis) === String(id) || String(t.id) === String(id));
                                                        if (fresh) setFormData(p => ({ ...p, URL_Carpeta_Drive: fresh.URL_Carpeta_Drive || fresh.url_carpeta_drive, ID_Carpeta_Drive: fresh.ID_Carpeta_Drive || fresh.id_carpeta_drive }));
                                                    }
                                                } catch (e) {
                                                    toast.error('Error', 'No se pudo sincronizar');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                                        >
                                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Crear Carpeta
                                        </button>
                                    )}

                                    {/* DRIVE FILE EXPLORER */}
                                    {(formData.ID_Carpeta_Drive || formData.URL_Carpeta_Drive) && (
                                        <FolderExplorer
                                            folderId={formData.ID_Carpeta_Drive}
                                            folderUrl={formData.URL_Carpeta_Drive}
                                        />
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="glass-card p-6 space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-black/5">
                                <Calendar className="text-emerald-500" size={20} />
                                <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Cronograma</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fecha de Inicio</label>
                                    <input type="date" value={formData.Fecha_Inicio} onChange={e => setFormData(p => ({ ...p, Fecha_Inicio: e.target.value }))} disabled={isView} className="w-full premium-input px-4" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fecha de Defensa</label>
                                    <input type="date" value={formData.Fecha_Defensa} onChange={e => setFormData(p => ({ ...p, Fecha_Defensa: e.target.value }))} disabled={isView} className="w-full premium-input px-4" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">N° Acta Sustentación</label>
                                    <input value={formData.Numero_Acta_Sustentacion} onChange={e => setFormData(p => ({ ...p, Numero_Acta_Sustentacion: e.target.value }))} disabled={isView} className="w-full premium-input px-4" placeholder="ACT-XXX-202X" />
                                </div>
                            </div>
                        </section>

                        {!isView && (
                            <button type="submit" disabled={loading} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-purple-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-3">
                                {loading ? 'Procesando...' : <><Save size={20} /> Guardar Registro</>}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ThesisForm;
