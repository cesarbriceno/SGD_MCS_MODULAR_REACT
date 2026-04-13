import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, Upload, User, Database, Play, Calendar, MapPin,
    Briefcase, Search, CheckCircle, ChevronDown, BookOpen, GraduationCap, Mic, Clock, RefreshCw, ExternalLink, Download, Info, Mail, Loader2, AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';
import Swal, { glassAlert } from '../../utils/swalUtils';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import CertificateTemplate from './CertificateTemplate';
import CertificatePreviewHTML from './CertificatePreviewHTML';
import QRCode from 'qrcode';

/**
 * Convierte un Blob a Base64.
 */
const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

// Removed HTML preview mechanism since it went out of sync and threw 403.

/**
 * Previsualización de PDF para descarga.
 * Usa iframe con blob URL para el documento final generado.
 */
const SafePDFPreview = ({ pdfDoc }) => {
    const [state, setState] = useState({ loading: true, error: null, blobUrl: null });

    useEffect(() => {
        let cancelled = false;
        setState({ loading: true, error: null, blobUrl: null });

        pdf(pdfDoc).toBlob()
            .then(blob => {
                if (cancelled) return;
                const url = URL.createObjectURL(blob);
                setState({ loading: false, error: null, blobUrl: url });
            })
            .catch(err => {
                if (!cancelled) {
                    console.error("Error generando PDF:", err);
                    setState({ loading: false, error: err.message || 'Error al generar PDF', blobUrl: null });
                }
            });

        return () => { cancelled = true; };
    }, [pdfDoc]);

    useEffect(() => {
        return () => {
            if (state.blobUrl) URL.revokeObjectURL(state.blobUrl);
        };
    }, [state.blobUrl]);

    if (state.loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-10 text-center space-y-4 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50">
                <Loader2 size={48} className="animate-spin opacity-50" />
                <p className="font-bold uppercase text-xs tracking-widest">Generando PDF...</p>
            </div>
        );
    }

    if (state.error || !state.blobUrl) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-red-400 p-10 text-center space-y-4 rounded-[2rem] bg-red-50 dark:bg-red-900/10">
                <AlertTriangle size={48} className="opacity-50" />
                <p className="font-bold text-sm">{state.error || 'No se pudo generar el PDF'}</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-2xl">
            <iframe
                src={`${state.blobUrl}#view=FitH&navpanes=0&scrollbar=0`}
                className="w-full h-full border-0"
                title="Vista previa del certificado"
                style={{ minHeight: '500px' }}
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
                <a
                    href={state.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 transition-all border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95"
                >
                    <ExternalLink size={14} />
                    Abrir en nueva pestaña
                </a>
            </div>
        </div>
    );
};

const GeneratorWizard = ({ template, onBack }) => {
    const [step, setStep] = useState(1);
    const [source, setSource] = useState('manual');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [db, setDb] = useState({ estudiantes: [], docentes: [], externos: [] });
    const [loadingDB, setLoadingDB] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    // --- DETECCIÓN DE TIPO DE DOCUMENTO ---
    const isEvent = template.category === 'Eventos';
    const isThesis = template.category === 'Tesis';
    const isAdmin = template.category === 'Administrativo';
    const isAcademic = template.category === 'Académico';

    const isAdmission = template.title?.includes('Admisión');
    const isConstancia = template.title?.includes('Constancia');

    // --- ESTADO UNIFICADO ---
    const [data, setData] = useState({
        nombre: '', cedula: '', email: '',
        programa: '', estado: 'Matriculado',
        tituloTesis: '', nota: '',
        nombreEvento: template.title || 'Evento Académico MCS',
        tipoEvento: 'Congreso',
        alcance: 'Nacional',
        modalidad: 'presencial',
        lugarEvento: 'Montería',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: new Date().toISOString().split('T')[0],
        rol: 'Asistente',
        tituloPonencia: '',
        horas: '20',
        motivoCarta: 'Participación en calidad de experto', descCarta: 'Para nosotros es un honor...',
        lugar: 'Montería', fecha: new Date().toISOString().split('T')[0]
    });

    const [descriptionText, setDescriptionText] = useState('');

    // --- VARIABLES DE DEBOUNCE PARA ESTABILIZAR EL PDF ---
    const [debouncedData, setDebouncedData] = useState(data);
    const [debouncedDesc, setDebouncedDesc] = useState(descriptionText);
    const [uniqueCode, setUniqueCode] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedData(data);
            setDebouncedDesc(descriptionText);

            // Generar código único si hay cédula (Sufijo de 4 caracteres alfanuméricos para unicidad)
            if (data.cedula) {
                const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                const code = `SGD-MCS-${new Date().getFullYear()}-${data.cedula.slice(-4)}-${randomSuffix}`;
                setUniqueCode(code);

                // No generar QR, solo código de validación
                setQrCodeUrl('');
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [data, descriptionText]);

    // --- CARGAR DATOS REALES ---
    useEffect(() => {
        const r = (data.rol || '').toLowerCase();
        const tipoEv = (data.tipoEvento || 'evento').toLowerCase();
        const alcanceEv = data.alcance ? ` de carácter ${data.alcance.toLowerCase()}` : '';
        const modal = (data.modalidad || 'presencial').toLowerCase();
        const lugarEv = data.lugarEvento || data.lugar || 'Montería';
        const eventName = data.nombreEvento || 'Evento';

        let fechasStr = '';
        if (data.fechaInicio && data.fechaFin) {
            fechasStr = ` del ${data.fechaInicio} al ${data.fechaFin}`;
        } else if (data.fechaInicio) {
            fechasStr = ` el ${data.fechaInicio}`;
        }

        let text = '';
        if (r === 'ponente' || r === 'tallerista') {
            const action = r === 'ponente' ? 'dictando la ponencia' : 'impartiendo el taller';
            const titulo = data.rol === 'Ponente' ? data.tituloPonencia : (data.tituloPonencia || 'Sin título'); // Usa tituloPonencia para ambos en el estado
            text = `Por su destacada participación en el ${tipoEv}${alcanceEv} "${eventName}" realizado${fechasStr} bajo la modalidad ${modal} en la ciudad de ${lugarEv}, en calidad de ${data.rol.toUpperCase()} ${action}: "${titulo || 'Sin título'}" con una duración de ${data.horas} horas académicas.`;
        } else if (r === 'organizador') {
            text = `Por su destacada participación en el ${tipoEv}${alcanceEv} "${eventName}" realizado${fechasStr} bajo la modalidad ${modal}, en calidad de ORGANIZADOR colaborando activamente en la gestión, logística y ejecución exitosa del mismo.`;
        } else if (r === 'evaluador') {
            text = `Por su destacada participación en el ${tipoEv}${alcanceEv} "${eventName}" realizado${fechasStr} bajo la modalidad ${modal} en la ciudad de ${lugarEv}, en calidad de EVALUADOR contribuyendo al análisis y evaluación académica del evento.`;
        } else {
            text = `Por su destacada participación en el ${tipoEv}${alcanceEv} "${eventName}" realizado${fechasStr} bajo la modalidad ${modal} en la ciudad de ${lugarEv}, en calidad de ASISTENTE cumpliendo con la intensidad horaria de ${data.horas || '20'} horas y los requisitos académicos establecidos para este evento.`;
        }
        setDescriptionText(text);
    }, [data.rol, data.tituloPonencia, data.horas, data.nombreEvento, data.lugarEvento, data.tipoEvento, data.alcance, data.modalidad, data.fechaInicio, data.fechaFin]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoadingDB(true);
        try {
            const [estudiantes, docentes, externos] = await Promise.all([
                api.students.list(),
                api.teachers.list(),
                api.externals.list()
            ]);
            setDb({ estudiantes, docentes, externos });
        } catch (error) {
            console.error('Error loading DB for wizard:', error);
        } finally {
            setLoadingDB(false);
        }
    };

    // --- BÚSQUEDA ---
    useEffect(() => {
        if (!searchTerm) {
            setSearchResults([]);
            return;
        }

        const query = searchTerm.toLowerCase();
        let pool = [];

        if (isAcademic || isAdmission || isThesis) pool = db.estudiantes;
        else if (isAdmin) pool = [...db.docentes, ...db.externos];
        else pool = [...db.estudiantes, ...db.docentes, ...db.externos];

        const filtered = pool.filter(p =>
            (p.Nombre1 && p.Nombre1.toLowerCase().includes(query)) ||
            (p.Apellido1 && p.Apellido1.toLowerCase().includes(query)) ||
            (p.Cedula && String(p.Cedula).includes(query))
        ).slice(0, 5);

        setSearchResults(filtered);
    }, [searchTerm, db]);

    const selectPerson = (p) => {
        const nombre = `${p.Nombre1 || ''} ${p.Nombre2 || ''} ${p.Apellido1 || ''} ${p.Apellido2 || ''}`.trim().replace(/\s+/g, ' ');
        setData({
            ...data,
            nombre,
            cedula: p.Cedula || '',
            email: p.Email || '',
            programa: p.Cohorte || p.Cohorte_Ingreso || '',
            estado: p.Estado_Academico || 'Matriculado'
        });
        setSearchTerm('');
        setSearchResults([]);
    };

    /**
     * Envía el certificado actual por correo electrónico.
     * Genera el PDF en el frontend, lo convierte a Base64 y lo envía al backend.
     */
    const handleSendEmail = async () => {
        // Validar que haya email
        if (!data.email || !data.email.includes('@')) {
            const emailResult = await Swal.fire({
                title: 'Email del Destinatario',
                html: `<p style="font-size:13px;margin-bottom:8px;">Ingresa el correo electrónico para enviar el certificado:</p>`,
                input: 'email',
                inputPlaceholder: 'correo@ejemplo.com',
                showCancelButton: true,
                confirmButtonText: 'Continuar',
                cancelButtonText: 'Cancelar',
                inputValidator: (value) => {
                    if (!value || !value.includes('@')) return 'Ingresa un email válido';
                },
                ...glassAlert({ icon: 'question' })
            });

            if (!emailResult.isConfirmed) return;
            setData(prev => ({ ...prev, email: emailResult.value }));
            // Use the provided email for this send
            data.email = emailResult.value;
        }

        // Confirmación
        const confirm = await Swal.fire({
            title: '📧 Enviar Certificado',
            html: `
                <div style="text-align:left;font-size:13px;line-height:1.8;">
                    <p><strong>Destinatario:</strong> ${data.nombre}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Documento:</strong> ${template.title}</p>
                    <hr style="border:0;border-top:1px solid #e2e8f0;margin:12px 0;">
                    <p style="font-size:11px;">Se generará el PDF premium y se enviará adjunto por correo electrónico. También se guardará una copia en Google Drive.</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Enviar Certificado',
            cancelButtonText: 'Cancelar',
            ...glassAlert({ icon: 'question' })
        });

        if (!confirm.isConfirmed) return;

        setIsSendingEmail(true);

        try {
            // 1. Generar PDF en frontend
            const pdfDoc = <CertificateTemplate
                data={data}
                templateTitle={template.title}
                description={descriptionText}
                uniqueCode={uniqueCode}
            />;
            const blob = await pdf(pdfDoc).toBlob();
            const base64 = await blobToBase64(blob);

            const fileName = `${template.title.replace(/\s+/g, '_')}_${data.nombre.replace(/\s+/g, '_')}.pdf`;

            // 2. Enviar al backend
            const res = await api.certificates.sendIndividual({
                email: data.email,
                name: data.nombre,
                eventName: data.nombreEvento || template.title,
                role: data.rol || 'Participante',
                pdfBase64: base64,
                fileName: fileName
            });

            if (res.success) {
                await Swal.fire({
                    icon: 'success',
                    title: '¡Certificado Enviado!',
                    html: `
                        <div style="text-align:center;font-size:14px;line-height:1.8;">
                            <p style="font-size:48px;">📬</p>
                            <p>El certificado fue enviado exitosamente a:</p>
                            <p style="font-weight:800;">${data.email}</p>
                            ${res.fileId ? '<p style="font-size:11px;">También fue guardado en Google Drive.</p>' : ''}
                        </div>
                    `,
                    confirmButtonText: 'Perfecto',
                    ...glassAlert({ icon: 'success' })
                });
            } else {
                throw new Error(res.message || 'Error al enviar');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al Enviar',
                text: error.message || 'No se pudo enviar el certificado por correo.',
                ...glassAlert({ icon: 'error' })
            });
        } finally {
            setIsSendingEmail(false);
        }
    };

    const renderSpecificFields = () => {
        if (isAdmission || isConstancia) return (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 space-y-3">
                <div><label className="label-tiny">Cohorte / Programa</label><input type="text" className="input-premium" value={data.programa} onChange={e => setData({ ...data, programa: e.target.value })} /></div>
                <div>
                    <label className="label-tiny">Estado</label>
                    <select className="input-premium" value={data.estado} onChange={e => setData({ ...data, estado: e.target.value })}>
                        <option value="Matriculado">Matriculado</option>
                        <option value="Egresado">Egresado</option>
                        <option value="Suspendido">Suspendido</option>
                    </select>
                </div>
            </div>
        );
        if (isThesis) return (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 space-y-3">
                <div><label className="label-tiny">Título Tesis</label><textarea className="input-premium h-16" value={data.tituloTesis} onChange={e => setData({ ...data, tituloTesis: e.target.value })} /></div>
                <div><label className="label-tiny">Nota / Veredicto</label><input type="text" className="input-premium" value={data.nota} onChange={e => setData({ ...data, nota: e.target.value })} /></div>
            </div>
        );
        if (isEvent) return (
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800 space-y-3">
                <div><label className="label-tiny">Nombre del Evento</label><input type="text" className="input-premium" value={data.nombreEvento} onChange={e => setData({ ...data, nombreEvento: e.target.value })} /></div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label-tiny">Tipo de Evento</label>
                        <select className="input-premium" value={data.tipoEvento || 'Congreso'} onChange={e => setData({ ...data, tipoEvento: e.target.value })}>
                            <option value="Congreso">Congreso</option>
                            <option value="Seminario">Seminario</option>
                            <option value="Simposio">Simposio</option>
                            <option value="Taller">Taller</option>
                            <option value="Diplomado">Diplomado</option>
                            <option value="Curso">Curso</option>
                            <option value="Foro">Foro</option>
                            <option value="Evento">Evento Académico</option>
                        </select>
                    </div>
                    <div>
                        <label className="label-tiny">Alcance</label>
                        <select className="input-premium" value={data.alcance || 'Nacional'} onChange={e => setData({ ...data, alcance: e.target.value })}>
                            <option value="Internacional">Internacional</option>
                            <option value="Nacional">Nacional</option>
                            <option value="Regional">Regional</option>
                            <option value="Institucional">Institucional</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div><label className="label-tiny">Lugar del Evento</label><input type="text" className="input-premium" value={data.lugarEvento} onChange={e => setData({ ...data, lugarEvento: e.target.value })} /></div>
                    <div><label className="label-tiny">Fecha Inicio</label><input type="date" className="input-premium" value={data.fechaInicio} onChange={e => setData({ ...data, fechaInicio: e.target.value })} /></div>
                    <div><label className="label-tiny">Fecha Fin</label><input type="date" className="input-premium" value={data.fechaFin} onChange={e => setData({ ...data, fechaFin: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="label-tiny">Rol</label>
                        <select className="input-premium" value={data.rol} onChange={e => setData({ ...data, rol: e.target.value })}>
                            <option>Asistente</option>
                            <option>Ponente</option>
                            <option>Tallerista</option>
                            <option>Organizador</option>
                            <option>Evaluador</option>
                        </select>
                    </div>
                    <div><label className="label-tiny">Horas</label><input type="text" className="input-premium" value={data.horas} onChange={e => setData({ ...data, horas: e.target.value })} /></div>
                    <div>
                        <label className="label-tiny">Modalidad</label>
                        <select className="input-premium" value={data.modalidad || 'presencial'} onChange={e => setData({ ...data, modalidad: e.target.value })}>
                            <option value="presencial">Presencial</option>
                            <option value="virtual">Virtual</option>
                            <option value="mixta">Mixta</option>
                        </select>
                    </div>
                </div>
                {(data.rol === 'Ponente' || data.rol === 'Tallerista') && (
                    <div className="animate-in slide-in-from-top duration-300">
                        <label className="label-tiny">{data.rol === 'Ponente' ? 'Título de la Ponencia' : 'Título del Taller'}</label>
                        <textarea
                            className="input-premium h-16"
                            placeholder={`Ingrese el título d${data.rol === 'Ponente' ? 'e la Ponencia' : 'el Taller'}...`}
                            value={data.tituloPonencia}
                            onChange={e => setData({ ...data, tituloPonencia: e.target.value })}
                        />
                    </div>
                )}
            </div>
        );
        return null;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Nav */}
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="btn-ghost flex items-center gap-2">
                    <ArrowLeft size={18} /> Volver al Hub
                </button>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${step === 1 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    <div className={`w-3 h-3 rounded-full ${step === 2 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                </div>
            </div>

            {step === 1 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="card-premium h-fit">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-xs">1</div>
                            Datos del Destinatario
                        </h3>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
                            {['manual', 'db'].map(mode => (
                                <button key={mode} onClick={() => setSource(mode)} className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${source === mode ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-500'}`}>{mode === 'db' ? 'Buscador' : 'Manual'}</button>
                            ))}
                        </div>

                        {source === 'db' && (
                            <div className="relative mb-4">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    className="input-premium pl-10"
                                    placeholder="Buscar por nombre o cédula..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {loadingDB && <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}

                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 shadow-2xl rounded-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                                        {searchResults.map(p => (
                                            <button
                                                key={p.Cedula}
                                                onClick={() => selectPerson(p)}
                                                className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 border-b border-slate-100 last:border-0"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{p.Nombre1?.[0]}</div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800 dark:text-white">{p.Nombre1} {p.Apellido1}</div>
                                                    <div className="text-[10px] text-slate-500 italic">{p.Cedula}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div><label className="label-tiny">Nombre Completo</label><input type="text" className="input-premium" value={data.nombre} onChange={e => setData({ ...data, nombre: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label-tiny">Cédula</label><input type="text" className="input-premium" value={data.cedula} onChange={e => setData({ ...data, cedula: e.target.value })} /></div>
                                <div><label className="label-tiny">Email</label><input type="email" className="input-premium" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} /></div>
                            </div>
                        </div>
                    </div>

                    <div className="card-premium h-fit">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-xs">2</div>
                            Detalles del Documento
                        </h3>
                        {renderSpecificFields()}
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                            <div><label className="label-tiny">Lugar de Expedición</label><input type="text" className="input-premium" value={data.lugar} onChange={e => setData({ ...data, lugar: e.target.value })} /></div>
                            <div><label className="label-tiny">Fecha</label><input type="date" className="input-premium" value={data.fecha} onChange={e => setData({ ...data, fecha: e.target.value })} /></div>
                        </div>
                        <button onClick={() => setStep(2)} className="btn-primary w-full mt-6 py-3">Revisar y Emitir</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in pb-20">
                    <div className="flex flex-col xl:flex-row gap-8 min-h-[550px]">
                        {/* Editor de Texto (Izquierda) */}
                        <div className="flex-1 space-y-6">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Personalizar Contenido</h3>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cuerpo del Certificado</label>
                                <textarea
                                    value={descriptionText}
                                    onChange={(e) => setDescriptionText(e.target.value)}
                                    className="w-full h-56 premium-input px-5 py-4 resize-none leading-relaxed text-sm bg-white border-2 border-slate-100 focus:border-primary/30 outline-none rounded-3xl"
                                    placeholder="Personaliza aquí el texto que aparecerá en el cuerpo del certificado..."
                                />
                                <div className="flex items-start gap-2 text-[10px] text-slate-400 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <Info size={14} className="mt-0.5 text-blue-500" />
                                    <p>Este texto se insertará automáticamente en el diseño premium. Los cambios realizados aquí se reflejarán instantáneamente en la previsualización de la derecha.</p>
                                </div>
                            </div>

                            <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Metadatos del Documento</h4>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div><p className="text-slate-400 font-bold uppercase text-[9px]">Nombre:</p><p className="font-black text-slate-700">{data.nombre || '...'}</p></div>
                                    <div><p className="text-slate-400 font-bold uppercase text-[9px]">Identificación:</p><p className="font-black text-slate-700">{data.cedula || '...'}</p></div>
                                    <div><p className="text-slate-400 font-bold uppercase text-[9px]">Evento / Proceso:</p><p className="font-black text-slate-700">{data.nombreEvento || '...'}</p></div>
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase text-[9px]">Fecha Recibo:</p>
                                        <p className="font-black text-slate-700">
                                            {(() => {
                                                try {
                                                    const d = new Date(data.fecha);
                                                    return !isNaN(d.getTime()) ? d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pendiente';
                                                } catch (e) { return 'Fecha inválida'; }
                                            })()}
                                        </p>
                                    </div>
                                    {data.email && (
                                        <div className="col-span-2">
                                            <p className="text-slate-400 font-bold uppercase text-[9px]">Email:</p>
                                            <p className="font-black text-purple-600">{data.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Previsualización WYSIWYG (Derecha) */}
                        <div className="flex-[1.5] flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Vista Previa en Vivo</h3>
                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded text-[9px] font-black uppercase tracking-widest border border-green-500/20">EN TIEMPO REAL</span>
                                </div>
                            </div>
                            <div className="flex-1 min-h-[450px]">
                                <CertificatePreviewHTML
                                    data={data}
                                    description={descriptionText}
                                    uniqueCode={uniqueCode}
                                    qrCodeUrl={qrCodeUrl}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-6 pt-10 border-t border-slate-100 mt-8">
                        <div className="flex flex-wrap gap-4 w-full justify-center">
                            <button onClick={() => setStep(1)} className="btn-secondary px-8 font-bold flex items-center gap-2">
                                <ArrowLeft size={18} /> Corregir Datos
                            </button>

                            <PDFDownloadLink
                                document={
                                    <CertificateTemplate
                                        data={debouncedData}
                                        templateTitle={template.title}
                                        description={debouncedDesc}
                                        uniqueCode={uniqueCode}
                                        qrCodeUrl={qrCodeUrl}
                                    />
                                }
                                fileName={`${template.title.replace(/\s+/g, '_')}_${debouncedData.nombre.replace(/\s+/g, '_')}.pdf`}
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20"
                            >
                                {({ loading }) =>
                                    loading ? <><RefreshCw className="animate-spin" size={18} /> Preparando...</> : <><Download size={18} /> Descargar PDF</>
                                }
                            </PDFDownloadLink>

                            {/* NUEVO: Botón Enviar por Correo */}
                            <button
                                disabled={isSendingEmail || !data.nombre || !data.cedula}
                                onClick={handleSendEmail}
                                className={`flex items-center gap-2 px-8 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl ${isSendingEmail
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/20'
                                    }`}
                            >
                                {isSendingEmail ? (
                                    <><Loader2 className="animate-spin" size={18} /> Enviando...</>
                                ) : (
                                    <><Mail size={18} /> Enviar por Correo</>
                                )}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 max-w-lg text-center font-medium italic">
                            * El motor de descarga instantánea asegura que el archivo descargado sea idéntico a la previsualización mostrada arriba.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneratorWizard;