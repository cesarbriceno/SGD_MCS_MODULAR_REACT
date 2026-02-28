import React, { useState } from 'react';
import {
    ArrowLeft, Upload, User, Database, Play, Calendar, MapPin,
    Briefcase, Search, CheckCircle, ChevronDown, BookOpen, GraduationCap, Mic, Clock
} from 'lucide-react';

// --- MOCK DB ---
const MOCK_DB = {
    estudiantes: [
        { id: 'E1', nombre: 'Cesar B', cedula: '1067890123', programa: 'Cohorte 2024', estado: 'Activo' },
        { id: 'E2', nombre: 'Maria Rodriguez', cedula: '1102345678', programa: 'Cohorte 2023', estado: 'Egresado' },
    ],
    tesis: [
        { id: 'T1', titulo: 'Conflictos en el Sinú', estudiante: 'Maria Rodriguez', cedula: '1102345678', nota: '4.8 (Meritoria)' },
    ]
};

const GeneratorWizard = ({ template, onBack }) => {
    const [step, setStep] = useState(1);
    const [source, setSource] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- DETECCIÓN DE TIPO DE DOCUMENTO ---
    const isEvent = template.category === 'Eventos';
    const isThesis = template.category === 'Tesis';
    const isAdmin = template.category === 'Administrativo';

    const isAdmission = template.title.includes('Admisión');
    const isConstancia = template.title.includes('Constancia');
    const isAcademic = template.category === 'Académico';

    // --- ESTADO UNIFICADO ---
    const [data, setData] = useState({
        nombre: '', cedula: '', email: '',
        programa: '', estado: 'Matriculado',
        tituloTesis: '', nota: '',
        nombreEvento: 'III Congreso Internacional de Ciencias Sociales', rol: 'Asistente', tituloPonencia: '', horas: '20', // <--- NUEVO CAMPO HORAS
        motivoCarta: 'Participación como conferencista principal', descCarta: 'Para nosotros es un honor invitarlo a...',
        lugar: 'Montería', fecha: new Date().toISOString().split('T')[0]
    });

    // --- 1. TÍTULOS DINÁMICOS ---
    const getDocHeader = () => {
        if (isAdmission) return "CARTA DE ADMISIÓN";
        if (isConstancia) return "CONSTANCIA DE ESTUDIOS";
        if (isThesis) return "ACTA DE SUSTENTACIÓN";
        if (isAdmin) return "CARTA DE INVITACIÓN";

        // Lógica Eventos
        if (data.rol === 'Ponente') return "CERTIFICADO DE PONENTE";
        if (data.rol === 'Organizador') return "CERTIFICADO DE ORGANIZADOR";
        return "CERTIFICADO DE ASISTENCIA";
    };

    // --- 2. CUERPO DEL TEXTO (CORREGIDO) ---
    const getDocBody = () => {
        const { nombre, cedula, programa, estado, tituloTesis, nota, nombreEvento, rol, tituloPonencia, motivoCarta, descCarta, lugar, fecha, horas } = data;

        const dateObj = new Date(fecha);
        const dateStr = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

        // CASO: ADMISIÓN
        if (isAdmission) {
            return (
                <>
                    <p className="mb-4">Estimado(a) <strong>{nombre}</strong>,</p>
                    <p className="mb-4">
                        Nos complace informarle que ha sido <strong>ADMITIDO</strong> al programa de Maestría en Ciencias Sociales
                        de la Universidad de Córdoba, correspondiente a la <strong>{programa || "[Cohorte]"}</strong>.
                    </p>
                    <p>
                        Le damos la bienvenida a nuestra institución y le deseamos éxitos en esta nueva etapa académica.
                    </p>
                </>
            );
        }

        // CASO: CONSTANCIA DE ESTUDIOS
        if (isConstancia) {
            return (
                <>
                    HACE CONSTAR QUE:
                    <br /><br />
                    <strong>{nombre || "NOMBRE ESTUDIANTE"}</strong>, identificado(a) con Cédula de Ciudadanía No. {cedula || "XXXX"},
                    se encuentra actualmente <strong>{estado.toUpperCase()}</strong> en el programa de Maestría en Ciencias Sociales,
                    perteneciente a la <strong>{programa || "[Cohorte]"}</strong>.
                    <br /><br />
                    Se expide la presente a solicitud del interesado(a) en {lugar}, el día {dateStr}.
                </>
            );
        }

        // CASO: TESIS
        if (isThesis) {
            return (
                <>
                    Certifica que el día <strong>{dateStr}</strong>, se llevó a cabo la sustentación del trabajo de grado titulado:
                    <br /><br />
                    <em className="text-lg font-serif">"{tituloTesis || "TÍTULO DE TESIS"}"</em>
                    <br /><br />
                    Presentado por el estudiante <strong>{nombre}</strong> (CC. {cedula}), obteniendo una calificación final de: <strong>{nota}</strong>.
                    <br /><br />
                    En constancia se firma en {lugar}.
                </>
            );
        }

        // CASO: CARTA INVITACIÓN
        if (isAdmin) {
            return (
                <>
                    <p className="mb-4 text-left"><strong>Asunto:</strong> {motivoCarta}</p>
                    <p className="mb-4">Respetado(a) <strong>{nombre}</strong>,</p>
                    <p className="mb-6">{descCarta}</p>
                    <p>
                        El evento tendrá lugar en <strong>{lugar}</strong>, el día <strong>{dateStr}</strong>.
                        Esperamos contar con su valiosa presencia.
                    </p>
                </>
            );
        }

        // CASO: EVENTOS (CORREGIDO: NOMBRE INCLUIDO Y HORAS DINÁMICAS)
        if (isEvent) {
            if (rol === 'Ponente') {
                return (
                    <>
                        Certifica que <strong>{nombre || "EL INTERESADO"}</strong> (CC. {cedula || "XXXX"}) participó en calidad de <strong className="text-primary tracking-wider">PONENTE</strong>,
                        con la ponencia titulada:
                        <br /><br />
                        <em className="text-xl font-bold text-slate-800 block mb-6">"{tituloPonencia || "TÍTULO DE LA PONENCIA"}"</em>
                        En el marco del evento <strong>{nombreEvento}</strong>, realizado en {lugar} el día {dateStr}.
                    </>
                );
            }
            // Asistente / Organizador / Otros
            return (
                <>
                    Certifica que <strong>{nombre || "EL INTERESADO"}</strong>, identificado con CC. {cedula || "XXXX"},
                    participó en calidad de <strong className="text-primary tracking-wider uppercase">{rol}</strong> en el evento:
                    <br /><br />
                    <strong className="text-xl text-slate-800 uppercase block mb-6">{nombreEvento}</strong>
                    Realizado en {lugar} el día {dateStr}, con una intensidad horaria de <strong>{horas} horas académicas</strong>.
                </>
            );
        }
    };

    // --- HELPERS BÚSQUEDA ---
    const handleSearchSelect = (item, type) => {
        if (type === 'estudiante') {
            setData(prev => ({ ...prev, nombre: item.nombre, cedula: item.cedula, programa: item.programa }));
        } else if (type === 'tesis') {
            setData(prev => ({ ...prev, nombre: item.estudiante, cedula: item.cedula, tituloTesis: item.titulo, nota: item.nota }));
        }
        setSearchTerm('');
    };

    const renderSearch = () => {
        let results = [];
        if (searchTerm) {
            if (isThesis) results = MOCK_DB.tesis.filter(t => t.titulo.toLowerCase().includes(searchTerm.toLowerCase()));
            else results = MOCK_DB.estudiantes.filter(e => e.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return (
            <div className="mb-6 relative z-20">
                <label className="text-xs font-bold text-slate-500 mb-1 block">Buscar en Base de Datos</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Escribe nombre o título..." className="input-premium pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                {searchTerm && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                        {results.length > 0 ? results.map((r, i) => (
                            <div key={i} onClick={() => handleSearchSelect(r, isThesis ? 'tesis' : 'estudiante')} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center border-b border-slate-100 dark:border-slate-700 last:border-0">
                                <div><p className="font-bold text-sm text-slate-800 dark:text-white">{isThesis ? r.titulo : r.nombre}</p></div>
                                <CheckCircle size={14} className="text-primary" />
                            </div>
                        )) : <div className="p-3 text-xs text-slate-400">Sin resultados.</div>}
                    </div>
                )}
            </div>
        );
    };

    // --- RENDERIZADO DE CAMPOS ESPECÍFICOS ---
    const renderSpecificFields = () => (
        <div className="space-y-4 animate-fade-in">

            {/* 1. ACADÉMICO */}
            {isAcademic && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2"><GraduationCap size={16} /> Datos Académicos</h4>
                    <div className="mb-3">
                        <label className="label-tiny">Cohorte / Programa</label>
                        <input type="text" className="input-premium" value={data.programa} onChange={e => setData({ ...data, programa: e.target.value })} />
                    </div>
                    {!isAdmission && (
                        <div>
                            <label className="label-tiny">Estado Actual</label>
                            <div className="relative">
                                <select className="input-premium appearance-none" value={data.estado} onChange={e => setData({ ...data, estado: e.target.value })}>
                                    <option value="Matriculado">Matriculado</option>
                                    <option value="Egresado">Egresado</option>
                                    <option value="Suspendido">Suspendido</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 2. TESIS */}
            {isThesis && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-2"><BookOpen size={16} /> Tesis</h4>
                    <div className="mb-3"><label className="label-tiny">Título Tesis</label><textarea className="input-premium h-16 resize-none" value={data.tituloTesis} onChange={e => setData({ ...data, tituloTesis: e.target.value })} /></div>
                    <div><label className="label-tiny">Nota / Veredicto</label><input type="text" className="input-premium" value={data.nota} onChange={e => setData({ ...data, nota: e.target.value })} /></div>
                </div>
            )}

            {/* 3. EVENTOS */}
            {isEvent && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                    <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300 mb-3">Evento y Rol</h4>
                    <div className="mb-3"><label className="label-tiny">Nombre del Evento</label><input type="text" className="input-premium" value={data.nombreEvento} onChange={e => setData({ ...data, nombreEvento: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                            <label className="label-tiny">Rol</label>
                            <div className="relative">
                                <select className="input-premium appearance-none" value={data.rol} onChange={e => setData({ ...data, rol: e.target.value })}>
                                    <option>Asistente</option>
                                    <option>Ponente</option>
                                    <option>Organizador</option>
                                    <option>Tallerista</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        {/* NUEVO CAMPO: HORAS */}
                        <div>
                            <label className="label-tiny flex gap-1"><Clock size={10} /> Horas</label>
                            <input type="text" className="input-premium" value={data.horas} onChange={e => setData({ ...data, horas: e.target.value })} />
                        </div>
                    </div>

                    {/* CAMPO CONDICIONAL PONENCIA */}
                    {data.rol === 'Ponente' && (
                        <div className="animate-fade-in mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                            <label className="label-tiny text-purple-700 dark:text-purple-300"><Mic size={10} className="inline mr-1" /> Título de la Ponencia</label>
                            <textarea className="input-premium h-16 resize-none bg-white dark:bg-slate-900" placeholder="Escribe el título..." value={data.tituloPonencia} onChange={e => setData({ ...data, tituloPonencia: e.target.value })} />
                        </div>
                    )}
                </div>
            )}

            {/* 4. CARTAS (ADMIN) */}
            {isAdmin && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                    <h4 className="text-sm font-bold text-amber-700 dark:text-amber-300 mb-3">Detalle Carta</h4>
                    <div className="mb-3"><label className="label-tiny">Motivo (Asunto)</label><input type="text" className="input-premium" value={data.motivoCarta} onChange={e => setData({ ...data, motivoCarta: e.target.value })} /></div>
                    <div><label className="label-tiny">Cuerpo / Descripción</label><textarea className="input-premium h-24 resize-none" value={data.descCarta} onChange={e => setData({ ...data, descCarta: e.target.value })} /></div>
                </div>
            )}
        </div>
    );

    // --- RENDER PRINCIPAL ---
    return (
        <div className="animate-fade-in pb-10">
            <div className="flex items-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"><ArrowLeft size={20} /></button>
                <div><h2 className="text-xl font-bold text-slate-800 dark:text-white">Generar: {template.title}</h2><p className="text-xs text-slate-500">Paso {step} de 2</p></div>
            </div>

            {step === 1 ? (
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="card-premium h-fit">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-xs">1</div>
                            Origen y Persona
                        </h3>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                            {['manual', 'db', 'excel'].map(mode => (
                                <button key={mode} onClick={() => setSource(mode)} className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${source === mode ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-500'}`}>{mode === 'db' ? 'Buscador' : mode}</button>
                            ))}
                        </div>
                        {source === 'db' && renderSearch()}
                        {(source === 'manual' || (source === 'db' && data.nombre)) && (
                            <div className="space-y-4 animate-fade-in">
                                <div><label className="label-tiny">Nombre Completo</label><input type="text" className="input-premium" value={data.nombre} onChange={e => setData({ ...data, nombre: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="label-tiny">Cédula</label><input type="text" className="input-premium" value={data.cedula} onChange={e => setData({ ...data, cedula: e.target.value })} /></div>
                                    <div><label className="label-tiny">Email</label><input type="email" className="input-premium" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} /></div>
                                </div>
                            </div>
                        )}
                        {source === 'excel' && <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center"><Upload className="mx-auto text-slate-400 mb-2" /><p className="text-xs text-slate-500">Subir .xlsx</p></div>}
                    </div>

                    <div className="card-premium h-fit">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-xs">2</div>
                            Detalles Específicos
                        </h3>
                        {renderSpecificFields()}
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label-tiny flex gap-1"><MapPin size={10} /> Lugar</label><input type="text" className="input-premium" value={data.lugar} onChange={e => setData({ ...data, lugar: e.target.value })} /></div>
                                <div><label className="label-tiny flex gap-1"><Calendar size={10} /> Fecha</label><input type="date" className="input-premium" value={data.fecha} onChange={e => setData({ ...data, fecha: e.target.value })} /></div>
                            </div>
                            <button onClick={() => setStep(2)} className="btn-primary w-full shadow-lg shadow-primary/20 mt-4">Generar Vista Previa</button>
                        </div>
                    </div>
                </div>
            ) : (
                /* VISTA PREVIA */
                <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
                    {/* PAPEL FÍSICO (Siempre Blanco) */}
                    <div className="w-full aspect-[1.414/1] bg-white text-slate-900 shadow-2xl relative p-12 flex flex-col border border-slate-200 overflow-hidden select-none">

                        {/* Marca de Agua */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] flex items-center justify-center pointer-events-none">
                            <img src="/placeholder-logo.png" className="w-96 grayscale" alt="Watermark" />
                        </div>

                        {/* Header Visual */}
                        <div className="w-full flex justify-between items-start mb-10 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-20 bg-green-800/10 border border-green-800/20 flex items-center justify-center text-[10px] text-green-900 font-bold text-center p-1 rounded">
                                    LOGO UNICOR
                                </div>
                                <div className="text-left">
                                    <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">Universidad de Córdoba</h3>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Facultad de Ciencias Humanas</p>
                                    <p className="text-[10px] text-slate-400 uppercase">Maestría en Ciencias Sociales</p>
                                </div>
                            </div>
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-400 border border-slate-200">
                                LOGO MAESTRÍA
                            </div>
                        </div>

                        {/* Título */}
                        <div className="text-center relative z-10 mt-4">
                            <h1 className="text-3xl font-serif font-bold text-slate-900 uppercase tracking-widest mb-2 border-b-2 border-primary/20 inline-block pb-2 px-8">
                                {getDocHeader()}
                            </h1>
                        </div>

                        {/* Cuerpo del Texto */}
                        <div className="flex-1 flex flex-col justify-center items-center text-center relative z-10 py-8">
                            <div className="text-base text-slate-700 leading-relaxed max-w-2xl font-serif">
                                {getDocBody()}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="w-full flex justify-between items-end mt-auto relative z-10">
                            <div className="text-center">
                                <div className="w-48 border-b border-slate-900 mb-2"></div>
                                <p className="text-xs font-bold text-slate-900 uppercase">Coordinador Académico</p>
                                <p className="text-[10px] text-slate-500">Maestría en Ciencias Sociales</p>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-20 h-20 bg-white border-2 border-slate-900 p-1">
                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-[10px]">QR CODE</div>
                                </div>
                                <p className="text-[9px] font-mono text-slate-400">HASH: MCS-2025-X7B9</p>
                            </div>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-4">
                        <button onClick={() => setStep(1)} className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            Editar Datos
                        </button>
                        <button onClick={() => { setIsGenerating(true); setTimeout(() => onBack(), 1500) }} className="btn-primary flex items-center gap-2">
                            {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Play size={18} fill="currentColor" /> Emitir Documento</>}
                        </button>
                    </div>
                </div>
            )}

            <style>{`.label-tiny { display: block; font-size: 0.7rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem; text-transform: uppercase; }`}</style>
        </div>
    );
};

export default GeneratorWizard;