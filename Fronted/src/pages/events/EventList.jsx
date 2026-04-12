import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus, Search, Calendar, Eye, Edit, Trash2,
    SlidersHorizontal, Download, ChevronLeft, ChevronRight,
    ChevronDown, MapPin, Clock, Globe, Award, FolderOpen
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../../utils/swalUtils';
import ExportModal from '../../components/modals/ExportModal';
import { useNotifications } from '../../context/NotificationContext';

const styles = `
  .glass-panel {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
  .dark .glass-panel {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .glass-row {
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(0,0,0,0.03);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .dark .glass-row {
    background: rgba(30, 41, 59, 0.4);
    border-bottom: 1px solid rgba(255,255,255,0.03);
  }
  .glass-row:hover {
    transform: scale-[1.005] translateY(-1px);
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    z-index: 10;
    border-radius: 12px;
  }
  .dark .glass-row:hover {
    background: rgba(30, 41, 59, 0.95);
  }

  .apple-search {
    background: rgba(0, 0, 0, 0.05); 
    border: 1px solid transparent;
    transition: all 0.3s ease;
  }
  .dark .apple-search {
    background: rgba(0, 0, 0, 0.4); 
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
  }
  .apple-search:focus-within {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(34, 197, 94, 0.5);
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
  }
`;

const EventList = () => {
    const { addNotification } = useNotifications();
    const [rawEvents, setRawEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [searchTerm, setSearchTerm] = useState('');

    const [filterType, setFilterType] = useState('Todos');
    const [filterAlcance, setFilterAlcance] = useState('Todos');
    const [filterModalidad, setFilterModalidad] = useState('Todos');
    const [showFilters, setShowFilters] = useState(false);

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    useEffect(() => { loadEvents(); }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await api.events.list();
            setRawEvents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setRawEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await toast.confirm('¿Eliminar evento?', 'Esta acción eliminará el evento y sus participaciones.');
        if (result.isConfirmed) {
            try {
                setRawEvents(prev => prev.filter(e => (e.ID_Evento || e.id) !== id));
                await api.events.delete(id);
                toast.success('¡Eliminado!', 'El evento ha sido eliminado.');
            } catch (e) {
                toast.error('Error', 'No se pudo eliminar el registro.');
                loadEvents();
            }
        }
    };

    const handleBulkDelete = async () => {
        const result = await toast.confirm('¿Eliminar seleccionados?', `Se eliminarán ${selectedIds.size} eventos.`);
        if (result.isConfirmed) {
            try {
                const idsArray = Array.from(selectedIds);
                setRawEvents(prev => prev.filter(e => !selectedIds.has(e.ID_Evento || e.id)));
                setSelectedIds(new Set());
                await api.events.bulkDelete(idsArray);
                toast.success('¡Completado!', `Se eliminaron ${idsArray.length} registros.`);
            } catch (error) {
                toast.error('Error', 'No se pudo completar la acción.');
                loadEvents();
            }
        }
    };

    // 1. Mapeo de todos los eventos
    const allMappedEvents = useMemo(() => {
        return rawEvents.map(e => {
            const getVal = (key) => e[key] || e[key.toLowerCase()] || e[key.toUpperCase()] || '';
            return {
                id: getVal('ID_Evento') || getVal('id') || String(Math.random()),
                nombre: getVal('Nombre_Evento') || 'Sin Nombre',
                tipo: getVal('Tipo_Evento') || 'Otros',
                alcance: getVal('Alcance') || 'Nacional',
                modalidad: getVal('Modalidad') || 'Presencial',
                lugar: getVal('Lugar') || 'No definido',
                fechaInicio: getVal('Fecha_Inicio'),
                intensidad: getVal('Intensidad_Horaria'),
                folderUrl: getVal('URL_Carpeta_Drive'),
                raw: e
            };
        });
    }, [rawEvents]);

    // 2. Filtrado para la vista
    const processedEvents = useMemo(() => {
        return allMappedEvents.filter(ev => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (ev.nombre.toLowerCase().includes(searchLower) || ev.lugar.toLowerCase().includes(searchLower)) &&
                (filterType === 'Todos' || ev.tipo === filterType) &&
                (filterAlcance === 'Todos' || ev.alcance === filterAlcance) &&
                (filterModalidad === 'Todos' || ev.modalidad === filterModalidad)
            );
        });
    }, [allMappedEvents, searchTerm, filterType, filterAlcance, filterModalidad]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = processedEvents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(processedEvents.length / itemsPerPage);

    const toggleSelectAll = () => {
        const currentIds = currentItems.map(e => e.id);
        const allSelected = currentIds.length > 0 && currentIds.every(id => selectedIds.has(id));

        const newSet = new Set(selectedIds);
        if (allSelected) {
            currentIds.forEach(id => newSet.delete(id));
        } else {
            currentIds.forEach(id => newSet.add(id));
        }
        setSelectedIds(newSet);
    };

    const toggleSelectOne = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    return (
        <div className="animate-fade-in relative pb-32 pt-6 px-4 md:px-8">
            <style>{styles}</style>

            {/* DOCK FLOTANTE */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl flex items-center gap-6 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 text-slate-800 dark:text-white font-bold">
                            <span className="text-xs uppercase tracking-widest">{selectedIds.size} seleccionados</span>
                        </div>
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex gap-2">
                            <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase shadow-md shadow-red-500/20 transition-all">
                                Eliminar
                            </button>
                            <button onClick={() => setSelectedIds(new Set())} className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row justify-between items-end gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                        <div className='glass-panel p-2 rounded-xl text-green-600 dark:text-green-400'><Calendar size={28} /></div>
                        Gestión de Eventos
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm tracking-wide">Registro de actividades académicas y participaciones.</p>
                </div>
                <div className="flex gap-3 w-full lg:w-auto">
                    <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-panel font-bold text-sm text-slate-700 transition-all hover:bg-white/80"><Download size={18} className="text-green-500" /> Exportar</button>
                    <Link to="/events/new" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white shadow-xl shadow-green-600/20 transition-all font-black uppercase text-xs tracking-widest">
                        <Plus size={20} /> Nuevo Evento
                    </Link>
                </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="relative z-10 mb-4">
                <div className="glass-panel rounded-2xl p-2 flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 transition-colors" size={18} />
                        <input
                            type="text" placeholder="Buscar por nombre, lugar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 rounded-xl apple-search outline-none text-sm font-medium"
                        />
                    </div>
                    <button onClick={toggleSelectAll} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5 transition-all">
                        {currentItems.length > 0 && currentItems.every(e => selectedIds.has(e.id)) ? "Deseleccionar" : "Seleccionar Todo"}
                    </button>
                    <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${showFilters ? 'bg-green-500/10 text-green-600' : 'text-slate-600 hover:bg-black/5'}`}>
                        <SlidersHorizontal size={18} /> Filtros
                    </button>
                </div>
                {showFilters && (
                    <div className="p-4 mt-2 glass-panel rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                        <FilterSelect label="Tipo" value={filterType} onChange={setFilterType} options={['Todos', 'Seminario', 'Congreso', 'Simposio', 'Taller', 'Conferencia']} />
                        <FilterSelect label="Alcance" value={filterAlcance} onChange={setFilterAlcance} options={['Todos', 'Local', 'Nacional', 'Internacional']} />
                        <FilterSelect label="Modalidad" value={filterModalidad} onChange={setFilterModalidad} options={['Todos', 'Presencial', 'Virtual', 'Híbrida']} />
                        <div className="flex items-end"><button onClick={() => { setFilterType('Todos'); setFilterAlcance('Todos'); setFilterModalidad('Todos'); setSearchTerm(''); }} className="w-full h-10 text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all">Limpiar</button></div>
                    </div>
                )}
            </div>

            {/* LIST */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-full p-20 text-center glass-panel rounded-3xl text-slate-400 font-bold uppercase tracking-widest animate-pulse">Cargando Actividades...</div>
                ) : processedEvents.length === 0 ? (
                    <div className="col-span-full p-20 text-center glass-panel rounded-3xl text-slate-400 font-bold uppercase tracking-widest">Sin eventos encontrados</div>
                ) : (
                    currentItems.map((event) => (
                        <div key={event.id} onClick={() => toggleSelectOne(event.id)} className={`glass-row p-6 rounded-3xl flex flex-col sm:flex-row gap-6 items-start relative overflow-hidden group cursor-pointer ${selectedIds.has(event.id) ? 'ring-2 ring-green-500 !bg-green-50 dark:!bg-green-900/10' : ''}`}>
                            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-green-500"></div>
                            {selectedIds.has(event.id) && (
                                <div className="absolute top-4 right-4 bg-green-500 text-white p-1 rounded-full"><Plus size={14} className="rotate-45" /></div>
                            )}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-green-100 p-1.5 rounded-lg text-green-600"><Globe size={16} /></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{event.tipo} • {event.alcance}</span>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border inline-flex items-center gap-1.5 uppercase bg-blue-500/10 text-blue-700 border-blue-200`}>
                                        {event.modalidad}
                                    </span>
                                </div>
                                <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight uppercase line-clamp-2 tracking-tight">{event.nombre}</h3>
                                <div className="flex flex-wrap gap-4 text-xs font-bold pt-1 text-slate-500">
                                    <div className="flex items-center gap-2"><MapPin size={14} className="text-red-400" /> {event.lugar}</div>
                                    <div className="flex items-center gap-2"><Clock size={14} className="text-blue-400" /> {event.intensidad} Horas</div>
                                    <div className="flex items-center gap-2"><Calendar size={14} className="text-green-400" /> {event.fechaInicio}</div>
                                </div>
                            </div>
                            <div onClick={(e) => e.stopPropagation()} className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                <Link to={`/events/view/${event.id}`} className="flex-1 p-2.5 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded-xl transition-all flex justify-center" title="Ver Detalle"><Eye size={20} /></Link>
                                <Link to={`/events/edit/${event.id}`} className="flex-1 p-2.5 bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-600 rounded-xl transition-all flex justify-center" title="Editar"><Edit size={20} /></Link>
                                <button onClick={() => handleDelete(event.id)} className="flex-1 p-2.5 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-xl transition-all flex justify-center" title="Eliminar"><Trash2 size={20} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* PAGINATION */}
            {!loading && totalPages > 1 && (
                <div className="flex justify-center gap-3 mt-10">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-3 glass-panel rounded-2xl disabled:opacity-30"><ChevronLeft size={20} /></button>
                    <div className="px-6 py-3 glass-panel rounded-2xl font-black text-sm tracking-[0.2em]">{currentPage} / {totalPages}</div>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-3 glass-panel rounded-2xl disabled:opacity-30"><ChevronRight size={20} /></button>
                </div>
            )}

            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} data={selectedIds.size > 0 ? allMappedEvents.filter(e => selectedIds.has(e.id)) : processedEvents} sourceName="Eventos" />
        </div>
    );
};

const FilterSelect = ({ label, value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClick = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener("mousedown", handleClick); return () => document.removeEventListener("mousedown", handleClick);
    }, []);
    return (
        <div className="w-full relative" ref={wrapperRef}>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">{label}</label>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left bg-white/50 dark:bg-black/20 rounded-xl py-2.5 px-3 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-white border border-slate-200/50">
                <span className="truncate uppercase">{value}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full glass-panel rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-slate-800">
                    <ul className="max-h-48 overflow-auto py-1">
                        {options.map((opt) => (
                            <li key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={`px-4 py-2 text-[11px] font-bold uppercase cursor-pointer transition-colors ${value === opt ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{opt}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default EventList;
