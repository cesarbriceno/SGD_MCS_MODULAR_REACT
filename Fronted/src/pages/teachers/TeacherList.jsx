import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus, Search, GraduationCap, Eye, Edit, Trash2,
    X, CheckSquare, Square, SlidersHorizontal,
    MessageCircle, ChevronLeft, ChevronRight, FileSpreadsheet,
    Check, ChevronDown,
    Briefcase, Download, User, FolderOpen
} from 'lucide-react';
import { api } from '../../services/api';
import Swal, { toast } from '../../utils/swalUtils';
import BulkEditModal from '../../components/modals/BulkEditModal';
import ExportModal from '../../components/modals/ExportModal';
import { useNotifications } from '../../context/NotificationContext';

// --- ESTILOS VISUALES (GLASS + APPLE + FIX ALERT) ---
const styles = `
  /* Panel Glass General */
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
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  }

  /* Filas Tabla */
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
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  }

  /* Buscador Apple Style */
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
    border-color: rgba(99, 102, 241, 0.5);
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }
  .dark .apple-search:focus-within {
    background: rgba(15, 23, 42, 0.9); 
    border-color: rgba(99, 102, 241, 0.5);
  }

  /* Select Dropdown */
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

const TeacherList = () => {
    const { addNotification } = useNotifications();
    const [rawTeachers, setRawTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [searchTerm, setSearchTerm] = useState('');

    const [filterStatus, setFilterStatus] = useState('Todos');
    const [filterType, setFilterType] = useState('Todos');

    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    useEffect(() => { loadTeachers(); }, []);

    const loadTeachers = async () => {
        try {
            setLoading(true);
            const data = await api.teachers.list();
            setRawTeachers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setRawTeachers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await toast.confirm('¿Estás seguro?', 'Esta acción eliminará al docente permanentemente.');
        if (result.isConfirmed) {
            try {
                setRawTeachers(prev => prev.filter(t => (t.ID_Docente || t.id) !== id));
                await api.teachers.delete(id);
                addNotification('Docente eliminado', `Registro eliminado correctamente.`, 'success');
                toast.success('¡Eliminado!', 'El docente ha sido eliminado correctamente.');
            } catch (e) {
                toast.error('Error', 'No se pudo eliminar el registro.');
                loadTeachers();
            }
        }
    };

    const handleBulkDelete = async () => {
        const result = await toast.confirm('¿Eliminar seleccionados?', `Se eliminarán ${selectedIds.size} registros de forma permanente.`);
        if (result.isConfirmed) {
            try {
                const idsArray = Array.from(selectedIds);
                setRawTeachers(prev => prev.filter(t => !selectedIds.has(t.ID_Docente || t.id)));
                setSelectedIds(new Set());
                await api.teachers.bulkDelete(idsArray);
                addNotification('Eliminación masiva', `Se han eliminado ${idsArray.length} registros.`, 'success');
                toast.success('¡Completado!', `Se eliminaron ${idsArray.length} registros correctamente.`);
            } catch (error) {
                toast.error('Error', 'No se pudo completar la eliminación masiva.');
                loadTeachers();
            }
        }
    };

    const getAvatarStyle = (name = 'Docente') => {
        const initials = name.substring(0, 2).toUpperCase();
        const gradients = [
            'from-indigo-500 to-purple-500', 'from-sky-500 to-blue-600',
            'from-teal-400 to-emerald-600', 'from-pink-400 to-rose-500', 'from-amber-400 to-orange-600'
        ];
        const index = name.charCodeAt(0) % gradients.length;
        return { gradient: `bg-gradient-to-br ${gradients[index]}`, initials };
    };

    const processedTeachers = useMemo(() => {
        return rawTeachers.map(t => {
            const getVal = (key) => t[key] || t[key.toLowerCase()] || t[key.toUpperCase()] || '';
            const status = getVal('Activo') === 'Sí' ? 'Activo' : 'Inactivo';
            return {
                id: getVal('ID_Docente') || getVal('id') || String(Math.random()),
                nombre: `${getVal('Nombre1')} ${getVal('Nombre2')} ${getVal('Apellido1')} ${getVal('Apellido2')}`.trim(),
                email: getVal('Email'),
                tipoDoc: getVal('Tipo_Documento'),
                numDoc: getVal('Cedula'),
                tipoVinculacion: getVal('Tipo_Vinculacion') || 'Catedrático',
                estado: status,
                folderUrl: getVal('URL_Carpeta_Drive'),
                raw: t
            };
        }).filter(teacher => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (teacher.nombre.toLowerCase().includes(searchLower) || (teacher.numDoc || '').toString().includes(searchLower)) &&
                (filterStatus === 'Todos' || teacher.estado === filterStatus) &&
                (filterType === 'Todos' || teacher.tipoVinculacion === filterType)
            );
        });
    }, [rawTeachers, searchTerm, filterStatus, filterType]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = processedTeachers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(processedTeachers.length / itemsPerPage);

    const toggleSelectAll = () => {
        if (selectedIds.size === processedTeachers.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(processedTeachers.map(t => t.id)));
    };

    const toggleSelectOne = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Activo': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
            'Inactivo': 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
            'Sabático': 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        };
        const dotColors = { 'Activo': 'bg-emerald-500', 'Inactivo': 'bg-red-500', 'Sabático': 'bg-amber-500' };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || 'bg-slate-400'}`}></span>
                {status}
            </span>
        );
    };

    return (
        <div className="animate-fade-in relative pb-32 pt-6 px-4 md:px-8">
            <style>{styles}</style>

            {/* DOCK FLOTANTE */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl flex items-center gap-6 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 text-slate-800 dark:text-white font-bold">
                            <div className="bg-blue-600 p-1.5 rounded-lg"><CheckSquare size={16} className="text-white" /></div>
                            <span>{selectedIds.size} seleccionados</span>
                        </div>
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsBulkModalOpen(true)} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-all flex items-center gap-2">
                                <Edit size={16} /> Editar
                            </button>
                            <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-md shadow-red-500/20 transition-all flex items-center gap-2">
                                <Trash2 size={16} /> Eliminar
                            </button>
                            <button onClick={() => setSelectedIds(new Set())} className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row justify-between items-end gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className='glass-panel p-2 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm'><GraduationCap size={28} /></div>
                        Docentes
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 ml-1 text-sm font-medium">Gestión del cuerpo docente y vinculación laboral.</p>
                </div>
                <div className="flex gap-3 w-full lg:w-auto">
                    <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-panel hover:bg-white/80 dark:hover:bg-white/10 transition-all font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-white/50">
                        <Download size={18} className="text-orange-500" /> Exportar
                    </button>
                    <Link to="/teachers/import" className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-panel hover:bg-white/80 dark:hover:bg-white/10 transition-all font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-white/50">
                        <FileSpreadsheet size={18} className="text-emerald-500" /> Importar
                    </Link>
                    <Link to="/teachers/new" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition-all font-bold">
                        <Plus size={20} strokeWidth={3} /> Nuevo Docente
                    </Link>
                </div>
            </div>

            {/* FILTROS */}
            <div className="relative z-10 mb-2">
                <div className="glass-panel rounded-2xl p-2 shadow-sm transition-all duration-300">
                    <div className="flex flex-col md:flex-row gap-2">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, documento..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl apple-search outline-none text-sm transition-all text-slate-700 dark:text-white placeholder-slate-400"
                            />
                        </div>
                        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${showFilters ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5'}`}>
                            <SlidersHorizontal size={18} /> Filtros
                        </button>
                    </div>
                    {showFilters && (
                        <div className="p-4 mt-2 border-t border-slate-200/50 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                            <FilterSelect label="Estado" value={filterStatus} onChange={setFilterStatus} options={['Todos', 'Activo', 'Inactivo']} />
                            <FilterSelect label="Vinculación" value={filterType} onChange={setFilterType} options={['Todos', 'Planta', 'Catedrático']} />
                            <div className="flex items-end">
                                <button onClick={() => { setFilterStatus('Todos'); setFilterType('Todos'); setSearchTerm(''); }} className="w-full h-[42px] text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-colors flex items-center justify-center gap-2 font-bold"><X size={16} /> Limpiar</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* TABLA */}
            <div className="relative z-0 overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto pb-4 px-1">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-slate-600 dark:text-slate-300 text-[11px] font-extrabold uppercase tracking-widest pl-4">
                                <th className="px-4 pb-2 w-12 text-center">
                                    <button onClick={toggleSelectAll}>{selectedIds.size > 0 && selectedIds.size === processedTeachers.length ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />}</button>
                                </th>
                                <th className="px-4 pb-2">Docente</th>
                                <th className="px-4 pb-2">Documento</th>
                                <th className="px-4 pb-2">Vinculación</th>
                                <th className="px-4 pb-2">Estado</th>
                                <th className="px-4 pb-2 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="p-12 text-center text-slate-400 glass-panel rounded-xl italic">Cargando docentes...</td></tr>
                            ) : processedTeachers.length === 0 ? (
                                <tr><td colSpan="6" className="p-12 text-center text-slate-400 glass-panel rounded-xl">No hay registros.</td></tr>
                            ) : (
                                currentItems.map((teacher) => {
                                    const avatar = getAvatarStyle(teacher.nombre);
                                    return (
                                        <tr key={teacher.id} className={`group glass-row rounded-xl ${selectedIds.has(teacher.id) ? 'ring-2 ring-indigo-500 bg-indigo-50/60 dark:bg-indigo-900/30' : ''}`}>
                                            <td className="p-4 text-center first:rounded-l-xl">
                                                <button onClick={() => toggleSelectOne(teacher.id)}>{selectedIds.has(teacher.id) ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} />}</button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3.5">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md ${avatar.gradient}`}>
                                                        {avatar.initials}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{teacher.nombre}</div>
                                                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{teacher.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{teacher.tipoDoc}</span>
                                                    <span className="text-sm font-mono font-bold text-slate-600 dark:text-slate-300">{teacher.numDoc}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                                                    <Briefcase size={10} /> {teacher.tipoVinculacion}
                                                </span>
                                            </td>
                                            <td className="p-4">{getStatusBadge(teacher.estado)}</td>
                                            <td className="p-4 text-right last:rounded-r-xl">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    {teacher.folderUrl && (
                                                        <a href={teacher.folderUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg" title="Ver Carpeta de Drive">
                                                            <FolderOpen size={18} />
                                                        </a>
                                                    )}
                                                    <Link to={`/teachers/view/${teacher.id}`} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Eye size={18} /></Link>
                                                    <Link to={`/teachers/edit/${teacher.id}`} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"><Edit size={18} /></Link>
                                                    <button onClick={() => handleDelete(teacher.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && (
                    <div className="flex justify-center gap-2 mt-6">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-xl glass-panel hover:bg-white/80 dark:hover:bg-white/10 disabled:opacity-50"><ChevronLeft size={20} /></button>
                        <span className="px-4 py-2 glass-panel rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center shadow-sm">{currentPage} / {totalPages}</span>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-xl glass-panel hover:bg-white/80 dark:hover:bg-white/10 disabled:opacity-50"><ChevronRight size={20} /></button>
                    </div>
                )}
            </div>

            <BulkEditModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} selectedIds={selectedIds} type="docente" onSuccess={() => { loadTeachers(); setSelectedIds(new Set()); }} />
            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} data={selectedIds.size > 0 ? processedTeachers.filter(t => selectedIds.has(t.id)) : processedTeachers} sourceName="Docentes" />
        </div>
    );
};

const FilterSelect = ({ label, value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    useEffect(() => {
        function handleClickOutside(event) { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false); }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    return (
        <div className="w-full relative" ref={wrapperRef}>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block ml-1">{label}</label>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left glass-panel rounded-xl py-2 px-3 flex items-center justify-between text-sm text-slate-700 dark:text-white transition-all hover:bg-white/40 dark:hover:bg-white/5">
                <span className="truncate">{value}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full rounded-xl glass-dropdown-menu overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <ul className="max-h-48 overflow-auto py-1 custom-scrollbar">
                        {options.map((opt) => (
                            <li key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors ${value === opt ? 'bg-indigo-500/10 text-indigo-600 font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
                                {opt}
                                {value === opt && <Check size={14} />}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default TeacherList;
