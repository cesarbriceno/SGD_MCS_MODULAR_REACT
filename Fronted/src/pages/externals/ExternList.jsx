import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus, Search, Users, Eye, Edit, Trash2,
    SlidersHorizontal, ChevronLeft, ChevronRight, FileSpreadsheet,
    Download, Globe, Building2, Mail, Phone, MapPin, User, FolderOpen
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

const ExternList = () => {
    const { addNotification } = useNotifications();
    const [rawExterns, setRawExterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [searchTerm, setSearchTerm] = useState('');

    const [filterOrigin, setFilterOrigin] = useState('Todos');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    useEffect(() => { loadExterns(); }, []);

    const loadExterns = async () => {
        try {
            setLoading(true);
            const data = await api.externals.list();
            setRawExterns(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setRawExterns([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await toast.confirm('¿Eliminar registro?', 'Esta acción no se puede deshacer.');
        if (result.isConfirmed) {
            try {
                setRawExterns(prev => prev.filter(t => (t.ID_Externo || t.id) !== id));
                await api.externals.delete(id);
                toast.success('¡Eliminado!', 'El registro ha sido eliminado.');
            } catch (e) {
                toast.error('Error', 'No se pudo eliminar el registro.');
                loadExterns();
            }
        }
    };

    const handleBulkDelete = async () => {
        const result = await toast.confirm('¿Eliminar seleccionados?', `Se eliminarán ${selectedIds.size} registros.`);
        if (result.isConfirmed) {
            try {
                const idsArray = Array.from(selectedIds);
                setRawExterns(prev => prev.filter(t => !selectedIds.has(t.ID_Externo || t.id)));
                setSelectedIds(new Set());
                await api.externals.bulkDelete(idsArray);
                toast.success('¡Completado!', `Se eliminaron ${idsArray.length} registros.`);
            } catch (error) {
                toast.error('Error', 'No se pudo completar la acción.');
                loadExterns();
            }
        }
    };

    // 1. Mapeo de todos los externos
    const allMappedExterns = useMemo(() => {
        return rawExterns.map(t => {
            const getVal = (key) => t[key] || t[key.toLowerCase()] || t[key.toUpperCase()] || '';
            const nombreCompleto = `${getVal('Nombre1')} ${getVal('Nombre2')} ${getVal('Apellido1')} ${getVal('Apellido2')}`.replace(/\s+/g, ' ').trim();
            return {
                id: getVal('ID_Externo') || getVal('id') || String(Math.random()),
                nombre: nombreCompleto || 'Sin Nombre',
                organizacion: getVal('Organizacion'),
                cargo: getVal('Cargo_Perfil'),
                email: getVal('Email'),
                telefono: getVal('Telefono'),
                pais: getVal('Pais'),
                ciudad: getVal('Ciudad'),
                origen: getVal('Tipo_Origen'),
                folderUrl: getVal('URL_Carpeta_Drive'),
                raw: t
            };
        });
    }, [rawExterns]);

    // 2. Filtrado para la vista
    const processedExterns = useMemo(() => {
        return allMappedExterns.filter(item => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (item.nombre.toLowerCase().includes(searchLower) || item.organizacion.toLowerCase().includes(searchLower) || item.email.toLowerCase().includes(searchLower)) &&
                (filterOrigin === 'Todos' || item.origen === filterOrigin)
            );
        });
    }, [allMappedExterns, searchTerm, filterOrigin]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = processedExterns.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(processedExterns.length / itemsPerPage);

    const toggleSelectAll = () => {
        const currentIds = currentItems.map(t => t.id);
        const allSelected = currentIds.length > 0 && currentIds.every(id => selectedIds.has(id));

        const newSet = new Set(selectedIds);
        if (allSelected) {
            currentIds.forEach(id => newSet.delete(id));
        } else {
            currentIds.forEach(id => newSet.add(id));
        }
        setSelectedIds(newSet);
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
                        <div className='glass-panel p-2 rounded-xl text-green-600 dark:text-green-400'><Users size={28} /></div>
                        Pares y Colaboradores Externos
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm tracking-wide">Gestión de investigadores y profesionales aliados.</p>
                </div>
                <div className="flex gap-3 w-full lg:w-auto">
                    <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-panel font-bold text-sm text-slate-700 transition-all hover:bg-white/80"><Download size={18} className="text-green-500" /> Exportar</button>
                    <Link to="/externals/import" className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-panel font-bold text-sm text-slate-700 transition-all hover:bg-white/80"><FileSpreadsheet size={18} className="text-emerald-500" /> Importar</Link>
                    <Link to="/externals/new" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white shadow-xl shadow-green-600/20 transition-all font-black uppercase text-xs tracking-widest">
                        <Plus size={20} /> Nuevo Externo
                    </Link>
                </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="relative z-10 mb-4">
                <div className="glass-panel rounded-2xl p-2 flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 transition-colors" size={18} />
                        <input
                            type="text" placeholder="Buscar por nombre, organización, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 rounded-xl apple-search outline-none text-sm font-medium"
                        />
                    </div>
                    <button onClick={toggleSelectAll} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5 transition-all">
                        {currentItems.length > 0 && currentItems.every(t => selectedIds.has(t.id)) ? <CheckSquare size={18} className="text-green-600" /> : <Square size={18} />} Seleccionar
                    </button>
                    <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${showFilters ? 'bg-green-500/10 text-green-600' : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                        <SlidersHorizontal size={18} /> Filtros
                    </button>
                </div>
                {showFilters && (
                    <div className="p-4 mt-2 glass-panel rounded-2xl animate-in slide-in-from-top-2">
                        <div className="flex gap-4">
                            <div className="flex-1 max-w-xs">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Tipo de Origen</label>
                                <select
                                    value={filterOrigin} onChange={(e) => setFilterOrigin(e.target.value)}
                                    className="w-full bg-white/50 dark:bg-black/20 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 dark:text-white border border-slate-200/50 outline-none"
                                >
                                    <option value="Todos">Todos</option>
                                    <option value="Nacional">Nacional</option>
                                    <option value="Internacional">Internacional</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button onClick={() => { setFilterOrigin('Todos'); setSearchTerm(''); }} className="h-10 px-4 text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all">Limpiar</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* LIST */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-full p-20 text-center glass-panel rounded-3xl text-slate-400 font-bold uppercase tracking-widest animate-pulse">Cargando Colaboradores...</div>
                ) : processedExterns.length === 0 ? (
                    <div className="col-span-full p-20 text-center glass-panel rounded-3xl text-slate-400 font-bold uppercase tracking-widest">Sin resultados encontrados</div>
                ) : (
                    currentItems.map((item) => (
                        <div key={item.id} className="glass-row p-6 rounded-3xl flex flex-col sm:flex-row gap-6 items-start relative overflow-hidden group">
                            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-green-500"></div>
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-green-100 p-1.5 rounded-lg text-green-600"><User size={16} /></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.origen}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => {
                                            const newSet = new Set(selectedIds);
                                            if (newSet.has(item.id)) newSet.delete(item.id);
                                            else newSet.add(item.id);
                                            setSelectedIds(newSet);
                                        }} className="transition-transform active:scale-95 z-20">
                                            {selectedIds.has(item.id) ? <CheckSquare size={20} className="text-green-600" /> : <Square size={20} className="text-slate-300 dark:text-slate-600" />}
                                        </button>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                                            {item.id}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight uppercase tracking-tight">{item.nombre}</h3>
                                    <div className="flex items-center gap-2 mt-1 text-xs font-bold text-slate-500">
                                        <Building2 size={14} className="text-slate-400" />
                                        <span>{item.organizacion} • <span className="text-green-600 dark:text-green-400">{item.cargo}</span></span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4 text-[11px] font-bold pt-1 border-t border-slate-100/50 dark:border-white/5 mt-2">
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><Mail size={13} className="text-blue-500" /> {item.email}</div>
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><Phone size={13} className="text-purple-400" /> {item.telefono}</div>
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><Globe size={13} className="text-emerald-500" /> {item.ciudad}, {item.pais}</div>
                                </div>
                            </div>
                            <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                {item.folderUrl && (
                                    <a href={item.folderUrl} target="_blank" rel="noopener noreferrer" className="flex-1 p-2.5 bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-600 rounded-xl transition-all flex justify-center" title="Ver Carpeta de Drive">
                                        <FolderOpen size={20} />
                                    </a>
                                )}
                                <Link to={`/externals/view/${item.id}`} className="flex-1 p-2.5 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded-xl transition-all flex justify-center"><Eye size={20} /></Link>
                                <Link to={`/externals/edit/${item.id}`} className="flex-1 p-2.5 bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-600 rounded-xl transition-all flex justify-center"><Edit size={20} /></Link>
                                <button onClick={() => handleDelete(item.id)} className="flex-1 p-2.5 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-xl transition-all flex justify-center"><Trash2 size={20} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* PAGINATION */}
            {!loading && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-2 border-t border-slate-200/50 dark:border-white/10 pt-4">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Mostrar</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="bg-white/50 dark:bg-black/20 text-slate-700 dark:text-white rounded-xl py-2 px-3 border border-slate-200/50 outline-none text-xs font-bold"
                        >
                            <option value={8}>8</option>
                            <option value={16}>16</option>
                            <option value={32}>32</option>
                            <option value={processedExterns.length > 0 ? processedExterns.length : 100}>Todos</option>
                        </select>
                    </div>
                    {totalPages > 0 && (
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-3 glass-panel rounded-2xl disabled:opacity-30"><ChevronLeft size={20} /></button>
                            <div className="px-6 py-3 glass-panel rounded-2xl font-black text-sm tracking-[0.2em]">{currentPage} / {totalPages}</div>
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-3 glass-panel rounded-2xl disabled:opacity-30"><ChevronRight size={20} /></button>
                        </div>
                    )}
                </div>
            )}

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                data={selectedIds.size > 0 ? allMappedExterns.filter(e => selectedIds.has(e.id)) : processedExterns}
                sourceName="Externos"
            />
        </div>
    );
};

export default ExternList;
