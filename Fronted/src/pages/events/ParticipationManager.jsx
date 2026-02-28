import React, { useState, useEffect, useMemo } from 'react';
import { Search, UserPlus, Trash2, CheckCircle2, XCircle, User, Award, Users } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';

const ParticipationManager = ({ eventId, eventName, isView }) => {
    const [participations, setParticipations] = useState([]);
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pData, sData, tData] = await Promise.all([
                api.participations.list(),
                api.students.list(),
                api.teachers.list()
            ]);

            // Filtrar participaciones de este evento
            const eventParts = pData.filter(p => String(p.ID_Evento) === String(eventId));
            setParticipations(eventParts);
            setStudents(sData);
            setTeachers(tData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const searchResults = useMemo(() => {
        if (!searchTerm || searchTerm.length < 2) return [];
        const lower = searchTerm.toLowerCase();

        // Evitar duplicados (ya participando)
        const participatingIds = new Set(participations.map(p => p.ID_Persona));

        const matchedStudents = students
            .filter(s => !participatingIds.has(s.ID_Estudiante) &&
                (`${s.Nombre1} ${s.Apellido1}`.toLowerCase().includes(lower) || s.Cedula.includes(lower)))
            .map(s => ({ ...s, tipo: 'Estudiante', id: s.ID_Estudiante, nombre: `${s.Nombre1} ${s.Apellido1}` }));

        const matchedTeachers = teachers
            .filter(t => !participatingIds.has(t.ID_Docente) &&
                (`${t.Nombre1} ${t.Apellido1}`.toLowerCase().includes(lower) || t.Cedula.includes(lower)))
            .map(t => ({ ...t, tipo: 'Docente', id: t.ID_Docente, nombre: `${t.Nombre1} ${t.Apellido1}` }));

        return [...matchedStudents, ...matchedTeachers].slice(0, 10);
    }, [searchTerm, students, teachers, participations]);

    const handleAddParticipation = async (person) => {
        try {
            const newPart = {
                ID_Evento: eventId,
                Nombre_Evento: eventName,
                ID_Persona: person.id,
                Nombre_Persona: person.nombre,
                Cedula_Persona: person.Cedula,
                Tipo_Persona: person.tipo,
                Rol: 'Asistente',
                Asistio: 'Sí',
                Fecha_Registro: new Date().toISOString()
            };

            // Simular optimísticamente
            setParticipations(prev => [...prev, { ...newPart, ID_Participacion: `PART-${Date.now()}` }]);
            setSearchTerm('');
            setShowResults(false);

            await api.participations.create(newPart);
            toast.success('¡Agregado!', `${person.nombre} se vinculó al evento.`);
        } catch (error) {
            toast.error('Error', 'No se pudo vincular a la persona.');
            loadData();
        }
    };

    const handleUpdate = async (partId, field, value) => {
        if (isView) return;
        try {
            setParticipations(prev => prev.map(p => p.ID_Participacion === partId ? { ...p, [field]: value } : p));
            await api.participations.update(partId, { [field]: value });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (partId) => {
        if (isView) return;
        const result = await toast.confirm('¿Desvincular?', 'Esta persona será eliminada de la lista del evento.');
        if (result.isConfirmed) {
            try {
                setParticipations(prev => prev.filter(p => p.ID_Participacion !== partId));
                await api.participations.delete(partId);
            } catch (error) {
                console.error(error);
            }
        }
    };

    return (
        <div className="space-y-6">
            {!isView && (
                <div className="relative">
                    <div className="flex items-center gap-3 glass-panel p-2 rounded-2xl bg-white/20">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 transition-colors" size={18} />
                            <input
                                value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
                                onFocus={() => setShowResults(true)}
                                placeholder="Buscar persona por nombre o cédula..."
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 outline-none text-sm font-bold uppercase"
                            />
                        </div>
                        <div className="hidden sm:flex items-center gap-2 pr-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Users size={16} /> {participations.length} inscritos
                        </div>
                    </div>

                    {showResults && searchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 glass-panel rounded-2xl overflow-hidden shadow-2xl bg-white/95 dark:bg-slate-800/95 animate-in slide-in-from-top-2">
                            {searchResults.map(person => (
                                <div
                                    key={person.id} onClick={() => handleAddParticipation(person)}
                                    className="p-4 hover:bg-green-500/10 cursor-pointer flex justify-between items-center group transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${person.tipo === 'Estudiante' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                            <User size={16} />
                                        </div>
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
                    <thead>
                        <tr className="bg-black/5 dark:bg-white/5">
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
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase ${part.Tipo_Persona === 'Estudiante' ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600'}`}>
                                                {part.Nombre_Persona?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 uppercase text-xs">{part.Nombre_Persona}</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase">{part.Tipo_Persona} • {part.Cedula_Persona}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center gap-2">
                                            <select
                                                disabled={isView} value={part.Rol} onChange={(e) => handleUpdate(part.ID_Participacion, 'Rol', e.target.value)}
                                                className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-tight text-center text-slate-600 dark:text-slate-400 cursor-pointer hover:text-green-600"
                                            >
                                                <option>Asistente</option><option>Ponente</option><option>Organizador</option><option>Evaluador</option>
                                            </select>
                                            {part.Rol === 'Ponente' && (
                                                <input
                                                    disabled={isView} value={part.Titulo_Ponencia || ''}
                                                    onChange={(e) => handleUpdate(part.ID_Participacion, 'Titulo_Ponencia', e.target.value)}
                                                    placeholder="Título de la ponencia..."
                                                    className="w-full text-[10px] font-medium italic text-slate-500 bg-transparent text-center outline-none border-b border-dashed border-slate-300 focus:border-green-500"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            disabled={isView}
                                            onClick={() => handleUpdate(part.ID_Participacion, 'Asistio', part.Asistio === 'Sí' ? 'No' : 'Sí')}
                                            className={`transition-all ${part.Asistio === 'Sí' ? 'text-green-500' : 'text-slate-300'}`}
                                        >
                                            {part.Asistio === 'Sí' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                                        </button>
                                    </td>
                                    {!isView && (
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDelete(part.ID_Participacion)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
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
