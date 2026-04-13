import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, Filter, Users, Calendar, Award, MapPin, FileSpreadsheet } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';
import * as XLSX from 'xlsx';

const ParticipationList = () => {
    const [participations, setParticipations] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEvent, setFilterEvent] = useState('Todos');
    const [filterRole, setFilterRole] = useState('Todos');
    const [filterAttendance, setFilterAttendance] = useState('Todos');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [partData, eventData] = await Promise.all([
                api.participations.list(),
                api.events.list()
            ]);
            setParticipations(Array.isArray(partData) ? partData : []);
            setEvents(Array.isArray(eventData) ? eventData : []);
        } catch (error) {
            console.error(error);
            toast.error('Error', 'No se pudieron cargar las participaciones');
        } finally {
            setLoading(false);
        }
    };

    const filteredParticipations = useMemo(() => {
        return participations.filter(p => {
            const matchesSearch = searchTerm === '' || 
                (p.Nombre_Persona || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.Cedula_Persona || '').includes(searchTerm);
            
            const matchesEvent = filterEvent === 'Todos' || 
                String(p.ID_Evento) === String(filterEvent);
            
            const matchesRole = filterRole === 'Todos' || 
                p.Rol === filterRole;
            
            const matchesAttendance = filterAttendance === 'Todos' || 
                p.Asistio === filterAttendance;

            return matchesSearch && matchesEvent && matchesRole && matchesAttendance;
        });
    }, [participations, searchTerm, filterEvent, filterRole, filterAttendance]);

    const getEventName = (eventId) => {
        const event = events.find(e => String(e.ID_Evento || e.id) === String(eventId));
        return event ? event.Nombre_Evento || event.nombre : 'Evento desconocido';
    };

    const handleExportToExcel = () => {
        if (filteredParticipations.length === 0) {
            toast.warning('Sin datos', 'No hay participaciones para exportar');
            return;
        }

        const dataToExport = filteredParticipations.map(p => ({
            'ID Participación': p.ID_Participacion || '',
            'ID Evento': p.ID_Evento || '',
            'Nombre del Evento': getEventName(p.ID_Evento),
            'Nombre del Participante': p.Nombre_Persona || '',
            'Cédula': p.Cedula_Persona || '',
            'Email': p.Email_Persona || '',
            'Tipo': p.Tipo_Persona || '',
            'Rol': p.Rol || '',
            'Asistió': p.Asistio || '',
            'Título Ponencia': p.Titulo_Ponencia || '',
            'Fecha Registro': p.Fecha_Registro ? new Date(p.Fecha_Registro).toLocaleDateString('es-CO') : ''
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Participaciones');

        const fileName = `Participaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        toast.success('Exportado', `${filteredParticipations.length} participaciones exportadas exitosamente`);
    };

    const uniqueEvents = [...new Set(participations.map(p => p.ID_Evento))];
    const uniqueRoles = [...new Set(participations.map(p => p.Rol).filter(Boolean))];

    return (
        <div className="animate-fade-in relative pb-32 pt-6 px-4 md:px-8">
            {/* HEADER */}
            <div className="flex flex-col lg:flex-row justify-between items-end gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                        <div className='glass-panel p-2 rounded-xl text-green-600 dark:text-green-400'>
                            <Users size={28} />
                        </div>
                        Gestión de Participaciones
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm tracking-wide">
                        Registro completo de participantes en eventos académicos.
                    </p>
                </div>
                <button 
                    onClick={handleExportToExcel} 
                    className="btn-primary flex items-center gap-2"
                    disabled={filteredParticipations.length === 0}
                >
                    <FileSpreadsheet size={18} /> 
                    Exportar a Excel
                </button>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="glass-panel rounded-2xl p-4 mb-6 space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text" 
                        placeholder="Buscar por nombre o cédula..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/40 dark:bg-black/20 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:border-green-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Evento</label>
                        <select 
                            value={filterEvent} 
                            onChange={(e) => setFilterEvent(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-white/40 dark:bg-black/20 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:border-green-500"
                        >
                            <option value="Todos">Todos los eventos</option>
                            {uniqueEvents.map(eventId => (
                                <option key={eventId} value={eventId}>{getEventName(eventId)}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Rol</label>
                        <select 
                            value={filterRole} 
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-white/40 dark:bg-black/20 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:border-green-500"
                        >
                            <option value="Todos">Todos los roles</option>
                            {uniqueRoles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Asistencia</label>
                        <select 
                            value={filterAttendance} 
                            onChange={(e) => setFilterAttendance(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-white/40 dark:bg-black/20 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:border-green-500"
                        >
                            <option value="Todos">Todos</option>
                            <option value="Sí">Asistieron</option>
                            <option value="No">No asistieron</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* RESULTS */}
            {loading ? (
                <div className="p-20 text-center glass-panel rounded-3xl text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                    Cargando Participaciones...
                </div>
            ) : filteredParticipations.length === 0 ? (
                <div className="p-20 text-center glass-panel rounded-3xl text-slate-400 font-bold uppercase tracking-widest">
                    No se encontraron participaciones
                </div>
            ) : (
                <>
                    <div className="mb-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                        Mostrando {filteredParticipations.length} de {participations.length} participaciones
                    </div>
                    <div className="space-y-3">
                        {filteredParticipations.map((part) => (
                            <div key={part.ID_Participacion || part.id} className="glass-row p-5 rounded-2xl flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                                <div className="flex-1 space-y-2 w-full">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="bg-green-100 p-2 rounded-lg text-green-600">
                                            <Award size={18} />
                                        </div>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            {part.Rol || 'Participante'}
                                        </span>
                                        {part.Asistio === 'Sí' && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-green-500/10 text-green-700 border border-green-200">
                                                ✓ Asistió
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                        {part.Nombre_Persona || 'Participante'}
                                    </h3>
                                    <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400">CC:</span> {part.Cedula_Persona || 'N/A'}
                                        </div>
                                        {part.Email_Persona && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400">✉</span> {part.Email_Persona}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="w-full lg:w-auto space-y-2 lg:space-y-0">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Calendar size={14} className="text-blue-400" />
                                        <span className="font-bold">{getEventName(part.ID_Evento)}</span>
                                    </div>
                                    {part.Titulo_Ponencia && (
                                        <div className="text-[10px] text-slate-400 italic">
                                            "{part.Titulo_Ponencia}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ParticipationList;
