import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus, Search, FileText, Eye, Edit, Trash2,
    X, CheckSquare, Square, SlidersHorizontal,
    MessageCircle, ChevronLeft, ChevronRight, FileSpreadsheet,
    Check, ChevronDown, Download, BookOpen, Calendar, Award, GraduationCap, FolderOpen
} from 'lucide-react';
import { api } from '../../services/api';
import Swal, { toast } from '../../utils/swalUtils';
import BulkEditModal from '../../components/modals/BulkEditModal';
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
    border-color: rgba(168, 85, 247, 0.5);
    box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.1);
  }

  .glass-dropdown-menu {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(0,0,0,0.05);
    box-shadow: 0 15px 40px -10px rgba(0, 0, 0, 0.2);
  }
  .dark .glass-dropdown-menu {
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const ThesisList = () => {
    const { addNotification } = useNotifications();
    const [rawThesis, setRawThesis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [searchTerm, setSearchTerm] = useState('');

    const [filterStatus, setFilterStatus] = useState('Todos');
    const [filterYear, setFilterYear] = useState('Todos');
    const [filterType, setFilterType] = useState('Todos');

    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    useEffect(() => { loadThesis(); }, []);

    const loadThesis = async () => {
        try {
            setLoading(true);
            const data = await api.thesis.list();
            setRawThesis(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setRawThesis([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await toast.confirm('¿Eliminar tesis?', 'Esta acción no se puede deshacer.');
        if (result.isConfirmed) {
            try {
                setRawThesis(prev => prev.filter(t => (t.ID_Tesis || t.id) !== id));
                await api.thesis.delete(id);
                toast.success('¡Eliminado!', 'La tesis ha sido eliminada.');
            } catch (e) {
                toast.error('Error', 'No se pudo eliminar el registro.');
                loadThesis();
            }
        }
    };

    const handleBulkDelete = async () => {
        const result = await toast.confirm('¿Eliminar seleccionados?', `Se eliminarán ${selectedIds.size} registros.`);
        if (result.isConfirmed) {
            try {
                const idsArray = Array.from(selectedIds);
                setRawThesis(prev => prev.filter(t => !selectedIds.has(t.ID_Tesis || t.id)));
                setSelectedIds(new Set());
                await api.thesis.bulkDelete(idsArray);
                toast.success('¡Completado!', `Se eliminaron ${idsArray.length} registros.`);
            } catch (error) {
                toast.error('Error', 'No se pudo completar la acción.');
                loadThesis();
            }
        }
    };

    const uniqueYears = useMemo(() => {
        const years = rawThesis.map(t => t.Año || t.año).filter(Boolean);
        return [...new Set(years)].sort().reverse();
    }, [rawThesis]);

    const processedThesis = useMemo(() => {
        return rawThesis.map(t => {
            const getVal = (key) => t[key] || t[key.toLowerCase()] || t[key.toUpperCase()] || '';
            return {
                id: getVal('ID_Tesis') || getVal('id') || String(Math.random()),
                titulo: getVal('Titulo_Investigacion') || 'Sin Título',
                estudiante: getVal('Nombre_Estudiante') || 'Sin Estudiante',
                asesor: getVal('Nombre_Asesor') || 'Sin Asesor',
                estado: getVal('Estado_Tesis') || 'Pendiente',
                año: getVal('Año'),
                modalidad: getVal('Modalidad'),
                folderUrl: getVal('URL_Carpeta_Drive'),
                raw: t
            };
        }).filter(thesis => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (thesis.titulo.toLowerCase().includes(searchLower) || thesis.estudiante.toLowerCase().includes(searchLower)) &&
                (filterStatus === 'Todos' || thesis.estado === filterStatus) &&
                (filterYear === 'Todos' || String(thesis.año) === String(filterYear)) &&
                (filterType === 'Todos' || thesis.modalidad === filterType)
            );
        });
    }, [rawThesis, searchTerm, filterStatus, filterYear, filterType]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = processedThesis.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(processedThesis.length / itemsPerPage);

    const toggleSelectAll = () => {
        if (selectedIds.size === processedThesis.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(processedThesis.map(t => t.id)));
    };

    const toggleSelectOne = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const getStatusBadge = (status) => {
        const styles = {
            'En Desarrollo': 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
            'Sustentada': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
            'Pendiente': 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800',
            'Reprobada': 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
        };
        const dotColors = { 'Sustentada': 'bg-emerald-500', 'En Desarrollo': 'bg-amber-500', 'Pendiente': 'bg-slate-500', 'Reprobada': 'bg-red-500' };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border inline-flex items-center gap-1.5 uppercase ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || 'bg-slate-400'}`}></span>
                {status}
            </span>
        );
    };

    return (
        <div className="animate-fade-in relative pb-32 pt-6 px-4 md:px-8">
            <style>{styles}</style>

            {/* DOCK */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-10 fade-in">
                    <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl flex items-center gap-6 shadow-2xl border border-slate-200">
                        <span className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">{selectedIds.size} seleccionados</span>
                        <div className="flex gap-2">
                            <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-black uppercase hover:bg-red-600 transition-all">Eliminar</button>
                            <button onClick={() => setSelectedIds(new Set())} className="px-4 py-2 text-slate-500 font-bold text-xs uppercase">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row justify-between items-end gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                        <div className='glass-panel p-2 rounded-xl text-purple-600 dark:text-purple-400'><FileText size={28} /></div>
                        Gestión de Tesis
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm tracking-wide">Control y seguimiento de trabajos de investigación.</p>
                </div>
                <div className="flex gap-3 w-full lg:w-auto">
                    <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-panel font-bold text-sm text-slate-700 transition-all hover:bg-white/80"><Download size={18} className="text-purple-500" /> Exportar</button>
                    <Link to="/thesis/import" className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-panel font-bold text-sm text-slate-700 transition-all hover:bg-white/80"><FileSpreadsheet size={18} className="text-emerald-500" /> Importar</Link>
                    <Link to="/thesis/new" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-600/20 transition-all font-black uppercase text-xs tracking-widest">
                        <Plus size={20} /> Nueva Tesis
                    </Link>
                </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="relative z-10 mb-4">
                <div className="glass-panel rounded-2xl p-2 flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                        <input
                            type="text" placeholder="Buscar por título, autor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 rounded-xl apple-search outline-none text-sm font-medium"
                        />
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${showFilters ? 'bg-purple-500/10 text-purple-600' : 'text-slate-600 hover:bg-black/5'}`}>
                        <SlidersHorizontal size={18} /> Filtros
                    </button>
                </div>
                {showFilters && (
                    <div className="p-4 mt-2 glass-panel rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                        <FilterSelect label="Estado" value={filterStatus} onChange={setFilterStatus} options={['Todos', 'En Desarrollo', 'Sustentada', 'Reprobada']} />
                        <FilterSelect label="Año" value={filterYear} onChange={setFilterYear} options={['Todos', ...uniqueYears]} />
                        <FilterSelect label="Modalidad" value={filterType} onChange={setFilterType} options={['Todos', 'Investigación', 'Práctica', 'Emprendimiento']} />
                        <div className="flex items-end"><button onClick={() => { setFilterStatus('Todos'); setFilterYear('Todos'); setFilterType('Todos'); setSearchTerm(''); }} className="w-full h-10 text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all">Limpiar</button></div>
                    </div>
                )}
            </div>

            {/* LIST */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-full p-20 text-center glass-panel rounded-3xl text-slate-400 font-bold uppercase tracking-widest animate-pulse">Cargando Investigaciones...</div>
                ) : processedThesis.length === 0 ? (
                    <div className="col-span-full p-20 text-center glass-panel rounded-3xl text-slate-400 font-bold uppercase tracking-widest">Sin resultados encontrados</div>
                ) : (
                    currentItems.map((thesis) => (
                        <div key={thesis.id} className="glass-row p-6 rounded-3xl flex flex-col sm:flex-row gap-6 items-start relative overflow-hidden group">
                            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-purple-500"></div>
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-purple-100 p-1.5 rounded-lg text-purple-600"><BookOpen size={16} /></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{thesis.año} • {thesis.modalidad}</span>
                                    </div>
                                    {getStatusBadge(thesis.estado)}
                                </div>
                                <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight uppercase line-clamp-2 tracking-tight">{thesis.titulo}</h3>
                                <div className="flex flex-wrap gap-4 text-xs font-bold pt-1">
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Award size={14} className="text-blue-500" /> {thesis.estudiante}</div>
                                    <div className="flex items-center gap-2 text-slate-500"><GraduationCap size={14} className="text-indigo-400" /> {thesis.asesor}</div>
                                </div>
                            </div>
                            <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                {thesis.folderUrl && (
                                    <a href={thesis.folderUrl} target="_blank" rel="noopener noreferrer" className="flex-1 p-2.5 bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-600 rounded-xl transition-all flex justify-center" title="Ver Carpeta de Drive">
                                        <FolderOpen size={20} />
                                    </a>
                                )}
                                <Link to={`/thesis/view/${thesis.id}`} className="flex-1 p-2.5 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded-xl transition-all flex justify-center"><Eye size={20} /></Link>
                                <Link to={`/thesis/edit/${thesis.id}`} className="flex-1 p-2.5 bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-600 rounded-xl transition-all flex justify-center"><Edit size={20} /></Link>
                                <button onClick={() => handleDelete(thesis.id)} className="flex-1 p-2.5 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-xl transition-all flex justify-center"><Trash2 size={20} /></button>
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

            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} data={processedThesis} sourceName="Tesis" />
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
                <div className="absolute z-50 mt-2 w-full rounded-xl glass-dropdown-menu overflow-hidden shadow-2xl">
                    <ul className="max-h-48 overflow-auto py-1">
                        {options.map((opt) => (
                            <li key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={`px-4 py-2 text-[11px] font-bold uppercase cursor-pointer transition-colors ${value === opt ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{opt}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ThesisList;
