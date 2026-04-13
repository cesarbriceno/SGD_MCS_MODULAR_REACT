import React, { useState, useEffect, useMemo } from 'react';
import { Search, UserPlus, Trash2, CheckCircle2, XCircle, User, Award, Users, Download, Mail, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';
import { toast, glassAlert } from '../../utils/swalUtils';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import CertificateTemplate from '../documents/CertificateTemplate';
import Swal from '../../utils/swalUtils';

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

const ParticipationManager = ({ eventId, eventName, isView }) => {
    const [participations, setParticipations] = useState([]);
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [eventDetails, setEventDetails] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingCertificates, setLoadingCertificates] = useState(false);
    const [emailProgress, setEmailProgress] = useState(null); // { current, total, currentName, status }
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pData, sData, tData, eventData] = await Promise.all([
                api.participations.list(),
                api.students.list(),
                api.teachers.list(),
                api.events.list()
            ]);

            const eventParts = pData.filter(p => String(p.ID_Evento) === String(eventId));
            setParticipations(eventParts);
            setStudents(sData);
            setTeachers(tData);

            // Find the current event details
            const currentEvent = eventData.find(e =>
                String(e.ID_Evento) === String(eventId) ||
                String(e.id) === String(eventId)
            );
            setEventDetails(currentEvent || null);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Resuelve el email de un participante buscando en students/teachers por ID_Persona.
     */
    const resolveEmail = (participation) => {
        // Primero usar el campo directo si existe
        if (participation.Email_Persona && participation.Email_Persona.includes('@')) {
            return participation.Email_Persona;
        }
        // Buscar en estudiantes
        const student = students.find(s => s.ID_Estudiante === participation.ID_Persona);
        if (student?.Email) return student.Email;
        // Buscar en docentes
        const teacher = teachers.find(t => t.ID_Docente === participation.ID_Persona);
        if (teacher?.Email) return teacher.Email;
        return '';
    };

    const searchResults = useMemo(() => {
        if (!searchTerm || searchTerm.length < 2) return [];
        const lower = searchTerm.toLowerCase();
        const participatingIds = new Set(participations.map(p => p.ID_Persona));

        const matchedStudents = students
            .filter(s => !participatingIds.has(s.ID_Estudiante) &&
                (`${s.Nombre1} ${s.Apellido1}`.toLowerCase().includes(lower) || s.Cedula.includes(lower)))
            .map(s => {
                const fullName = [s.Nombre1, s.Nombre2, s.Apellido1, s.Apellido2].filter(Boolean).join(' ');
                return { ...s, tipo: 'Estudiante', id: s.ID_Estudiante, nombre: fullName };
            });

        const matchedTeachers = teachers
            .filter(t => !participatingIds.has(t.ID_Docente) &&
                (`${t.Nombre1} ${t.Apellido1}`.toLowerCase().includes(lower) || t.Cedula.includes(lower)))
            .map(t => {
                const fullName = [t.Nombre1, t.Nombre2, t.Apellido1, t.Apellido2].filter(Boolean).join(' ');
                return { ...t, tipo: 'Docente', id: t.ID_Docente, nombre: fullName };
            });

        return [...matchedStudents, ...matchedTeachers].slice(0, 10);
    }, [searchTerm, students, teachers, participations]);

    const handleAddParticipation = async (person) => {
        const tempId = `PART-${Date.now()}`;
        try {
            const newPart = {
                ID_Evento: eventId,
                Nombre_Evento: eventName,
                ID_Persona: person.id,
                Nombre_Persona: person.nombre,
                Cedula_Persona: person.Cedula,
                Email_Persona: person.Email || '',
                Tipo_Persona: person.tipo,
                Rol: 'Asistente',
                Asistio: 'Sí',
                Fecha_Registro: new Date().toISOString()
            };
            setParticipations(prev => [...prev, { ...newPart, ID_Participacion: tempId }]);
            setSearchTerm('');
            setShowResults(false);
            const response = await api.participations.create(newPart);
            if (response.success && response.id) {
                setParticipations(prev => prev.map(p => p.ID_Participacion === tempId ? { ...p, ID_Participacion: response.id } : p));
                toast.success('¡Agregado!', `${person.nombre} se vinculó al evento.`);
            } else throw new Error(response.message || 'Error al crear la participación');
        } catch (error) {
            toast.error('Error', error.message || 'No se pudo vincular a la persona.');
            setParticipations(prev => prev.filter(p => p.ID_Participacion !== tempId));
        }
    };

    /**
     * Descarga de certificados: Muestra opciones al usuario (Individual vs Un solo PDF)
     */
    const handleDownloadOptions = async () => {
        const attendees = participations.filter(p => p.Asistio === 'Sí');
        if (attendees.length === 0) {
            toast.warning('Sin asistentes', 'No hay participantes con asistencia marcada.');
            return;
        }

        const result = await Swal.fire({
            title: '¿Cómo desea descargar?',
            text: 'Puede generar un solo archivo PDF con todas las páginas o descargar archivos PDF por separado para cada participante.',
            icon: 'question',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: 'Un solo PDF',
            denyButtonText: 'PDFs Individuales',
            cancelButtonText: 'Cancelar',
            ...glassAlert({ icon: 'question' })
        });

        if (result.isConfirmed) {
            // Un solo PDF
            setLoadingCertificates(true);
            try {
                // Agregar códigos únicos a cada participante
                const attendeesWithCodes = attendees.map((p, i) => {
                    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                    const cedula = p.Cedula_Persona || '';
                    const uniqueCode = cedula
                        ? `SGD-MCS-${new Date().getFullYear()}-${cedula.slice(-4)}-${randomSuffix}`
                        : `SGD-MCS-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}-${randomSuffix}`;
                    return { ...p, uniqueCode };
                });

                const pdfDoc = <CertificateTemplate data={attendeesWithCodes} templateTitle="CERTIFICADO DE EVENTO" />;
                const blob = await pdf(pdfDoc).toBlob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Certificados_${eventName.replace(/\s+/g, '_')}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error(err);
                toast.error('Error', 'No se pudo generar el PDF consolidado.');
            } finally {
                setLoadingCertificates(false);
            }
        } else if (result.isDenied) {
            // PDFs individuales
            setLoadingCertificates(true);
            try {
                for (let i = 0; i < attendees.length; i++) {
                    const p = attendees[i];
                    const participantName = p.Nombre_Persona || 'Participante';

                    // Generar código único
                    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                    const cedula = p.Cedula_Persona || '';
                    const uniqueCode = cedula
                        ? `SGD-MCS-${new Date().getFullYear()}-${cedula.slice(-4)}-${randomSuffix}`
                        : `SGD-MCS-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}-${randomSuffix}`;

                    const certData = {
                        nombre: participantName,
                        cedula: p.Cedula_Persona || '',
                        rol: p.Rol || 'Asistente',
                        nombreEvento: p.Nombre_Evento || eventName,
                        horas: p.Intensidad_Horaria || '20',
                        tituloPonencia: p.Titulo_Ponencia || '',
                        fecha: new Date().toISOString().split('T')[0],
                        lugar: 'Montería'
                    };
                    const pdfDoc = <CertificateTemplate
                        data={certData}
                        templateTitle="CERTIFICADO DE EVENTO"
                        uniqueCode={uniqueCode}
                    />;
                    const blob = await pdf(pdfDoc).toBlob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Certificado_${participantName.replace(/\s+/g, '_')}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);

                    // Esperar 300ms entre cada descarga para evitar bloqueos del navegador
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            } catch (err) {
                console.error(err);
                toast.error('Error', 'No se pudieron descargar todos los PDFs.');
            } finally {
                setLoadingCertificates(false);
            }
        }
    };

    const handleUpdate = async (partId, field, value) => {
        if (isView) return;
        try {
            setParticipations(prev => prev.map(p => p.ID_Participacion === partId ? { ...p, [field]: value } : p));
            await api.participations.update(partId, { [field]: value });
        } catch (error) { console.error(error); }
    };

    const handleDelete = async (partId) => {
        if (isView) return;
        const result = await toast.confirm('¿Desvincular?', 'Esta persona será eliminada de la lista del evento.');
        if (result.isConfirmed) {
            try {
                setParticipations(prev => prev.filter(p => p.ID_Participacion !== partId));
                await api.participations.delete(partId);
            } catch (error) { console.error(error); }
        }
    };

    /**
     * Envía certificados por correo electrónico.
     * Genera cada PDF con @react-pdf/renderer en el frontend, lo convierte a Base64,
     * y envía el lote al backend para envío por Gmail.
     */
    const handleSendCertificatesByEmail = async () => {
        const attendees = participations.filter(p => p.Asistio === 'Sí');

        if (attendees.length === 0) {
            toast.warning('Sin asistentes', 'No hay participantes con asistencia marcada.');
            return;
        }

        // Resolver email de cada participante desde la BD de students/teachers
        const attendeesWithEmail = attendees.map(p => ({
            ...p,
            _resolvedEmail: resolveEmail(p)
        }));

        const withEmail = attendeesWithEmail.filter(p => p._resolvedEmail.includes('@'));
        const withoutEmail = attendees.length - withEmail.length;

        // Confirmación con detalle
        const confirmHtml = `
            <div style="text-align:left;font-size:13px;line-height:1.8;">
                <p><strong>📧 Se enviarán ${withEmail.length} correos</strong> con certificados PDF adjuntos.</p>
                ${withoutEmail > 0 ? `<p style="color:#e11d48;">⚠️ ${withoutEmail} participante(s) no tienen email y serán omitidos.</p>` : ''}
                <hr style="border:0;border-top:1px solid #e2e8f0;margin:12px 0;">
                <p style="font-size:11px;">Los PDFs se generarán con el diseño premium y se guardarán en la carpeta del evento en Drive.</p>
            </div>
        `;

        const confirm = await Swal.fire({
            title: '¿Emitir Certificados?',
            html: confirmHtml,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: `Enviar ${withEmail.length} Certificados`,
            cancelButtonText: 'Cancelar',
            ...glassAlert({ icon: 'question' })
        });

        if (!confirm.isConfirmed) return;

        setLoadingCertificates(true);
        setEmailProgress({ current: 0, total: withEmail.length, currentName: 'Preparando...', status: 'generating' });

        try {
            // Generar PDFs en lotes de 20
            const BATCH_SIZE = 20;
            const allCertificates = [];

            for (let i = 0; i < withEmail.length; i++) {
                const p = withEmail[i];
                const participantName = p.Nombre_Persona || 'Participante';

                setEmailProgress(prev => ({
                    ...prev,
                    current: i + 1,
                    currentName: participantName,
                    status: 'generating'
                }));

                try {
                    // Generate unique certificate code
                    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                    const cedula = p.Cedula_Persona || '';
                    const uniqueCode = cedula
                        ? `SGD-MCS-${new Date().getFullYear()}-${cedula.slice(-4)}-${randomSuffix}`
                        : `SGD-MCS-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}-${randomSuffix}`;

                    const certData = {
                        nombre: participantName,
                        cedula: p.Cedula_Persona || '',
                        rol: p.Rol || 'Asistente',
                        nombreEvento: eventDetails?.Nombre_Evento || p.Nombre_Evento || eventName,
                        tipoEvento: eventDetails?.Tipo_Evento || 'Evento',
                        alcance: eventDetails?.Alcance || '',
                        modalidad: eventDetails?.Modalidad || 'Presencial',
                        lugarEvento: eventDetails?.Lugar || 'Montería',
                        fechaInicio: eventDetails?.Fecha_Inicio || '',
                        fechaFin: eventDetails?.Fecha_Fin || '',
                        horas: p.Intensidad_Horaria || eventDetails?.Intensidad_Horaria || '20',
                        tituloPonencia: p.Titulo_Ponencia || '',
                        fecha: new Date().toISOString().split('T')[0],
                        lugar: eventDetails?.Lugar || 'Montería'
                    };

                    const pdfDoc = <CertificateTemplate
                        data={certData}
                        templateTitle="CERTIFICADO DE EVENTO"
                        uniqueCode={uniqueCode}
                    />;
                    const blob = await pdf(pdfDoc).toBlob();
                    const base64 = await blobToBase64(blob);

                    allCertificates.push({
                        email: p._resolvedEmail,
                        name: participantName,
                        role: p.Rol || 'Asistente',
                        pdfBase64: base64,
                        fileName: `Certificado_${participantName.replace(/\s+/g, '_')}_${eventName.replace(/\s+/g, '_')}.pdf`,
                        eventName: eventDetails?.Nombre_Evento || p.Nombre_Evento || eventName,
                        certificateCode: uniqueCode
                    });
                } catch (pdfErr) {
                    console.error(`❌ Error generando PDF para ${participantName}:`, pdfErr);
                    // CONTINUAR con el siguiente en vez de fallar todo
                }
            }

            console.log(`📋 Certificados preparados: ${allCertificates.length} de ${withEmail.length}`);

            if (allCertificates.length === 0) {
                toast.error('Error', 'No se pudo generar ningún certificado PDF. Revisa la consola para detalles.');
                setLoadingCertificates(false);
                setEmailProgress(null);
                return;
            }

            // Enviar al backend en lotes
            setEmailProgress(prev => ({ ...prev, status: 'sending', currentName: 'Enviando por correo...' }));

            let totalSent = 0;
            let totalFailed = 0;
            let allErrors = [];

            for (let batch = 0; batch < allCertificates.length; batch += BATCH_SIZE) {
                const chunk = allCertificates.slice(batch, batch + BATCH_SIZE);

                setEmailProgress(prev => ({
                    ...prev,
                    currentName: `Enviando lote ${Math.floor(batch / BATCH_SIZE) + 1}...`,
                    current: Math.min(batch + BATCH_SIZE, allCertificates.length)
                }));

                console.log(`📤 Enviando lote ${Math.floor(batch / BATCH_SIZE) + 1}: ${chunk.length} certificados...`);

                const res = await api.certificates.sendBulk(eventId, chunk);
                console.log('📨 Respuesta del backend:', res);

                if (res && res.sent) totalSent += res.sent;
                if (res && res.failed) totalFailed += res.failed;
                if (res && res.errors) allErrors = [...allErrors, ...res.errors];
            }

            console.log(`✅ Total: ${totalSent} enviados, ${totalFailed} fallidos`);

            // Mostrar resultado
            const resultIcon = totalFailed > 0 ? 'warning' : 'success';
            const resultHtml = `
                <div style="text-align:center;font-size:14px;line-height:2;">
                    <p style="font-size:48px;margin:0;">📬</p>
                    <p><strong>${totalSent}</strong> certificados enviados correctamente</p>
                    ${totalFailed > 0 ? `<p style="color:#e11d48;">${totalFailed} fallidos</p>` : ''}
                    ${allErrors.length > 0 ? `<details style="text-align:left;margin-top:12px;"><summary style="cursor:pointer;font-size:11px;">Ver errores</summary><pre style="font-size:10px;padding:8px;border-radius:8px;max-height:120px;overflow:auto;">${allErrors.join('\n')}</pre></details>` : ''}
                </div>
            `;

            await Swal.fire({
                title: totalFailed > 0 ? 'Completado con Errores' : '¡Certificados Enviados!',
                html: resultHtml,
                icon: resultIcon,
                confirmButtonText: 'Entendido',
                ...glassAlert({ icon: resultIcon })
            });

        } catch (error) {
            console.error('Error global en emisión:', error);
            toast.error('Error', 'Ocurrió un problema durante el envío: ' + (error.message || error));
        } finally {
            setLoadingCertificates(false);
            setEmailProgress(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Progress Overlay */}
            {emailProgress && (
                <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-md w-full mx-4 shadow-2xl space-y-6 animate-in zoom-in-95">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                {emailProgress.status === 'generating' ? (
                                    <Loader2 className="text-purple-600 animate-spin" size={32} />
                                ) : (
                                    <Mail className="text-purple-600 animate-pulse" size={32} />
                                )}
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                {emailProgress.status === 'generating' ? 'Generando PDFs...' : 'Enviando Correos...'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">
                                {emailProgress.currentName}
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        width: `${Math.round((emailProgress.current / emailProgress.total) * 100)}%`,
                                        background: emailProgress.status === 'generating'
                                            ? 'linear-gradient(90deg, #a855f7, #7c3aed)'
                                            : 'linear-gradient(90deg, #22c55e, #16a34a)'
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>{emailProgress.current} / {emailProgress.total}</span>
                                <span>{Math.round((emailProgress.current / emailProgress.total) * 100)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isView && (
                <div className="relative">
                    <div className="flex flex-col xl:flex-row items-stretch justify-between gap-4 mb-4">
                        <div className="flex-1 flex items-center gap-3 glass-panel p-2 rounded-2xl bg-white/20">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 transition-colors" size={18} />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
                                    onFocus={() => setShowResults(true)}
                                    placeholder="Buscar persona por nombre o cédula..."
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 outline-none text-sm font-bold uppercase"
                                />
                            </div>
                            <div className="hidden sm:flex items-center gap-2 pr-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Users size={16} /> {participations.length} inscritos
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {participations.filter(p => p.Asistio === 'Sí').length > 0 ? (
                                <button
                                    onClick={handleDownloadOptions}
                                    disabled={loadingCertificates}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {loadingCertificates ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                                    {loadingCertificates ? 'Preparando...' : 'Descargar Certificados'}
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="btn-secondary flex items-center gap-2 cursor-not-allowed opacity-50"
                                    title="Marque al menos a un participante con asistencia para descargar"
                                >
                                    <Download size={18} /> Sin Asistentes
                                </button>
                            )}

                            <button
                                className={`btn-primary flex items-center gap-2 transition-all ${loadingCertificates ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-600/20 hover:from-purple-500 hover:to-indigo-500'}`}
                                onClick={handleSendCertificatesByEmail}
                                disabled={loadingCertificates}
                                title="Generar certificados premium y enviar por correo electrónico"
                            >
                                {loadingCertificates ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Mail size={18} />
                                )}
                                {loadingCertificates ? 'Procesando...' : 'Enviar por Correo'}
                            </button>
                        </div>
                    </div>

                    {showResults && searchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 glass-panel rounded-2xl overflow-hidden shadow-2xl bg-white/95 dark:bg-slate-800/95 animate-in slide-in-from-top-2">
                            {searchResults.map(person => (
                                <div key={person.id} onClick={() => handleAddParticipation(person)} className="p-4 hover:bg-green-500/10 cursor-pointer flex justify-between items-center group transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${person.tipo === 'Estudiante' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}><User size={16} /></div>
                                        <div>
                                            <p className="text-xs font-black uppercase text-slate-800 dark:text-white">{person.nombre}</p>
                                            <p className="text-[10px] text-slate-500 font-bold">{person.tipo} • CC: {person.Cedula}</p>
                                        </div>
                                    </div>
                                    <UserPlus className="text-slate-300 group-hover:text-green-500 transition-colors" size={20} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-black/5 dark:border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-black/5 dark:bg-white/5">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Participante</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-center">Rol / Función</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-center">Asistió</th>
                            {!isView && <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Acción</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                        {participations.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest">Aún no hay participantes registrados</td></tr>
                        ) : (
                            participations.map(part => (
                                <tr key={part.ID_Participacion} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase ${part.Tipo_Persona === 'Estudiante' ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600'}`}>{part.Nombre_Persona?.charAt(0)}</div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 uppercase text-xs">{part.Nombre_Persona}</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase">{part.Tipo_Persona} • {part.Cedula_Persona}
                                                    {resolveEmail(part) && (
                                                        <span className="ml-2 text-green-500">• ✉ {resolveEmail(part)}</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center gap-2">
                                            <select
                                                disabled={isView} value={part.Rol} onChange={(e) => handleUpdate(part.ID_Participacion, 'Rol', e.target.value)}
                                                className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-tight text-center text-slate-600 dark:text-slate-400 cursor-pointer hover:text-green-600"
                                            >
                                                <option>Asistente</option>
                                                <option>Ponente</option>
                                                <option>Tallerista</option>
                                                <option>Organizador</option>
                                                <option>Evaluador</option>
                                            </select>
                                            {(part.Rol === 'Ponente' || part.Rol === 'Tallerista') && (
                                                <input
                                                    disabled={isView} value={part.Titulo_Ponencia || ''}
                                                    onChange={(e) => handleUpdate(part.ID_Participacion, 'Titulo_Ponencia', e.target.value)}
                                                    placeholder={part.Rol === 'Ponente' ? "Título de la ponencia..." : "Título del taller..."}
                                                    className="w-full text-[10px] font-medium italic text-slate-500 bg-transparent text-center outline-none border-b border-dashed border-slate-300 focus:border-green-500"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button disabled={isView} onClick={() => handleUpdate(part.ID_Participacion, 'Asistio', part.Asistio === 'Sí' ? 'No' : 'Sí')} className={`transition-all ${part.Asistio === 'Sí' ? 'text-green-500' : 'text-slate-300'}`}>
                                            {part.Asistio === 'Sí' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                                        </button>
                                    </td>
                                    {!isView && (
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDelete(part.ID_Participacion)} className="btn-ghost-danger p-2"><Trash2 size={18} /></button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ParticipationManager;
