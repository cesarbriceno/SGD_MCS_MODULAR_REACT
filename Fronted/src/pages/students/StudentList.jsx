import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus, Search, User, Eye, Edit, Trash2,
    X, CheckSquare, Square, SlidersHorizontal,
    MessageCircle, ChevronLeft, ChevronRight, FileSpreadsheet,
    Check, ChevronDown,
    CalendarPlus, GraduationCap, Ban, Download, FolderOpen
} from 'lucide-react';
import { api } from '../../services/api';
import Swal, { toast } from '../../utils/swalUtils';
import BulkEditModal from '../../components/modals/BulkEditModal';
import ExportModal from '../../components/modals/ExportModal';
import { useNotifications } from '../../context/NotificationContext';

// --- ESTILOS VISUALES (GLASS + APPLE) ---
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
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }
  .dark .apple-search:focus-within {
    background: rgba(15, 23, 42, 0.9); 
    border-color: rgba(59, 130, 246, 0.5);
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

  /* --- FIX SWEETALERT2: Eliminar fondo blanco del icono success --- */
  .swal2-icon.swal2-success .swal2-success-circular-line-left,
  .swal2-icon.swal2-success .swal2-success-circular-line-right,
  .swal2-icon.swal2-success .swal2-success-fix {
    background-color: transparent !important;
  }
`;

// La configuración de glassAlert ahora se importa desde swalUtils.js

const StudentList = () => {
    const { addNotification } = useNotifications();
    // --- ESTADOS ---
    const [rawStudents, setRawStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [searchTerm, setSearchTerm] = useState('');

    // Filtros
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [filterCohort, setFilterCohort] = useState('Todos');
    const [filterDocType, setFilterDocType] = useState('Todos');

    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Modales
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [commentModal, setCommentModal] = useState({ isOpen: false, text: '', studentName: '' });
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // --- CARGA ---
    useEffect(() => { loadStudents(); }, []);

    const loadStudents = async () => {
        try {
            setLoading(true);
            const data = await api.students.list();
            setRawStudents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setRawStudents([]);
        } finally {
            setLoading(false);
        }
    };

    // --- ACTUALIZACIÓN SIN DUPLICADOS ---
    const handleUpdateStudent = async (updatedData) => {
        try {
            // En lugar de hacer un spread [...prev, updatedData], buscamos y reemplazamos
            // Validamos por ID_Estudiante para no duplicar registros en el estado local
            setRawStudents(prev => prev.map(student =>
                (student.ID_Estudiante === updatedData.ID_Estudiante) ? updatedData : student
            ));

            Swal.fire({
                title: '¡Actualizado!',
                text: 'La información del estudiante se ha actualizado correctamente.',
                icon: 'success'
            });
        } catch (error) {
            console.error("Error al actualizar:", error);
        }
    };

    // HELPERS
    const formatCohortDate = (val) => {
        if (!val) return null;
        if (typeof val === 'string' && val.length < 10) return val;
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        return `${d.getFullYear()}-${d.getMonth() + 1 <= 6 ? '1' : '2'}`;
    };

    // --- ELIMINAR CON DISEÑO GLASS ---
    const handleDelete = async (id) => {
        const result = await toast.confirm('¿Estás seguro?', 'Esta acción eliminará al estudiante permanentemente.');

        if (result.isConfirmed) {
            try {
                // Actualización optimista
                setRawStudents(prev => prev.filter(s => s.ID_Estudiante !== id));
                await api.students.delete(id);
                addNotification('Estudiante eliminado', `Registro eliminado correctamente.`, 'success');
                toast.success('¡Eliminado!', 'El estudiante ha sido eliminado correctamente.');
            } catch (e) {
                toast.error('Error', 'No se pudo eliminar el registro.');
                loadStudents(); // Revertir si falla
            }
        }
    };

    // --- ELIMINACIÓN MASIVA ---
    const handleBulkDelete = async () => {
        const result = await toast.confirm('¿Eliminar seleccionados?', `Se eliminarán ${selectedIds.size} registros de forma permanente.`);

        if (result.isConfirmed) {
            try {
                const idsArray = Array.from(selectedIds);
                // Actualización optimista
                setRawStudents(prev => prev.filter(s => !selectedIds.has(s.ID_Estudiante)));
                setSelectedIds(new Set());

                await api.students.bulkDelete(idsArray);

                addNotification('Eliminación masiva', `Se han eliminado ${idsArray.length} registros.`, 'success');
                toast.success('¡Completado!', `Se eliminaron ${idsArray.length} registros correctamente.`);
            } catch (error) {
                toast.error('Error', 'No se pudo completar la eliminación masiva.');
                loadStudents();
            }
        }
    };

    const getAvatarStyle = (name) => {
        const initials = name.substring(0, 2).toUpperCase();
        const gradients = [
            'from-violet-500 to-fuchsia-500', 'from-cyan-500 to-blue-600',
            'from-emerald-400 to-teal-600', 'from-rose-400 to-orange-500', 'from-indigo-400 to-purple-600'
        ];
        const index = name.charCodeAt(0) % gradients.length;
        return { gradient: `bg-gradient-to-br ${gradients[index]}`, initials };
    };

    // --- PROCESAMIENTO Y FILTROS ---
    const uniqueCohorts = useMemo(() => {
        const cohorts = rawStudents.map(s => formatCohortDate(s.Cohorte_Ingreso || s.cohorte_ingreso)).filter(Boolean);
        return [...new Set(cohorts)].sort().reverse();
    }, [rawStudents]);

    const processedStudents = useMemo(() => {
        return rawStudents.map(s => {
            const getVal = (key) => s[key] || s[key.toLowerCase()] || s[key.toUpperCase()] || '';
            let rawState = getVal('Estado');
            if (['Matriculado', 'Cursando', 'Activo'].includes(rawState)) rawState = 'Cursando';
            if (['Graduado', 'Egresado', 'Titulado'].includes(rawState)) rawState = 'Egresado';

            return {
                id: getVal('ID_Estudiante') || String(Math.random()),
                nombre: `${getVal('Nombre1')} ${getVal('Nombre2')} ${getVal('Apellido1')} ${getVal('Apellido2')}`.trim(),
                email: getVal('Email'),
                tipoDoc: getVal('Tipo_Documento'),
                numDoc: getVal('Cedula'),
                cohorteIn: formatCohortDate(getVal('Cohorte_Ingreso')),
                cohorteOut: formatCohortDate(getVal('Cohorte_Egreso')),
                estado: rawState || 'Cursando',
                comentarios: getVal('Comentarios'),
                folderUrl: getVal('URL_Carpeta_Drive'),
                raw: s
            };
        }).filter(student => {
            const searchLower = searchTerm.toLowerCase();
            return (
                ((student.nombre || '').toLowerCase().includes(searchLower) || (student.numDoc || '').toString().includes(searchLower)) &&
                (filterStatus === 'Todos' || student.estado === filterStatus) &&
                (filterCohort === 'Todos' || String(student.cohorteIn).trim() === String(filterCohort).trim()) &&
                (filterDocType === 'Todos' || student.tipoDoc === filterDocType)
            );
        });
    }, [rawStudents, searchTerm, filterStatus, filterCohort, filterDocType]);

    // PAGINACIÓN
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = processedStudents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(processedStudents.length / itemsPerPage);

    // HELPERS SELECCIÓN
    const toggleSelectAll = () => {
        if (selectedIds.size === processedStudents.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(processedStudents.map(s => s.id)));
    };

    const toggleSelectOne = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Cursando': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
            'Egresado': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
            'En Pausa': 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
            'Retirado': 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
        };
        const dotColors = { 'Cursando': 'bg-emerald-500', 'Egresado': 'bg-indigo-500', 'En Pausa': 'bg-amber-500', 'Retirado': 'bg-red-500' };

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

            {/* DOCK FLOTANTE DE SELECCIÓN */}
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

            {/* MODAL COMENTARIOS (Reutilizando diseño Glass Manual) */}
            {commentModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="glass-panel bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl max-w-md w-full border-t border-white/20">
                        <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white flex items-center gap-2">
                            <MessageCircle size={20} className="text-blue-500" /> Nota de Observación
                        </h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">{commentModal.studentName}</p>
                        <div className="bg-slate-50/80 dark:bg-black/30 p-4 rounded-xl text-slate-700 dark:text-slate-200 text-sm leading-relaxed shadow-inner">
                            "{commentModal.text}"
                        </div>
                        <button onClick={() => setCommentModal({ ...commentModal, isOpen: false })} className="w-full mt-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity">
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL DE EXPORTACIÓN */}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                data={
                    selectedIds.size > 0
                        ? processedStudents.filter(student => selectedIds.has(student.id))
                        : processedStudents
                }
                sourceName="Estudiantes"
            />

            <BulkEditModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} selectedIds={selectedIds} type="estudiante" onSuccess={() => { loadStudents(); setSelectedIds(new Set()); }} />

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row justify-between items-end gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className='glass-panel p-2 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm'><User size={28} /></div>
                        Estudiantes
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 ml-1 text-sm font-medium">Gestión académica y control de cohortes.</p>
                </div>
                <div className="flex gap-3 w-full lg:w-auto">
                    {/* BOTÓN EXPORTAR */}
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-panel hover:bg-white/80 dark:hover:bg-white/10 transition-all font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-white/50"
                    >
                        <Download size={18} className="text-orange-500" /> Exportar
                    </button>

                    <Link to="/students/import" className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-panel hover:bg-white/80 dark:hover:bg-white/10 transition-all font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-white/50">
                        <FileSpreadsheet size={18} className="text-emerald-500" /> Importar
                    </Link>
                    <Link to="/students/new" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all font-bold">
                        <Plus size={20} strokeWidth={3} /> Nuevo
                    </Link>
                </div>
            </div>

            {/* FILTROS Y BUSCADOR */}
            <div className="relative z-10 mb-2">
                <div className="glass-panel rounded-2xl p-2 shadow-sm transition-all duration-300">
                    <div className="flex flex-col md:flex-row gap-2">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, documento..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl apple-search outline-none text-sm transition-all text-slate-700 dark:text-white placeholder-slate-400"
                            />
                        </div>
                        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${showFilters ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5'}`}>
                            <SlidersHorizontal size={18} /> Filtros
                        </button>
                    </div>
                    {showFilters && (
                        <div className="p-4 mt-2 border-t border-slate-200/50 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                            <FilterSelect label="Estado" value={filterStatus} onChange={setFilterStatus} options={['Todos', 'Cursando', 'Egresado', 'En Pausa', 'Retirado']} />
                            <FilterSelect label="Cohorte" value={filterCohort} onChange={setFilterCohort} options={['Todos', ...uniqueCohorts]} />
                            <FilterSelect label="Documento" value={filterDocType} onChange={setFilterDocType} options={['Todos', 'CC', 'TI', 'CE', 'PAS']} />
                            <div className="flex items-end">
                                <button onClick={() => { setFilterStatus('Todos'); setFilterCohort('Todos'); setFilterDocType('Todos'); setSearchTerm(''); }} className="w-full h-[42px] text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-colors flex items-center justify-center gap-2 font-bold"><X size={16} /> Limpiar</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* TABLA PRINCIPAL */}
            <div className="relative z-0 overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto pb-4 px-1">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-slate-600 dark:text-slate-300 text-[11px] font-extrabold uppercase tracking-widest pl-4">
                                <th className="px-4 pb-2 w-12 text-center"><button onClick={toggleSelectAll} className="hover:text-blue-500 transition-colors">{selectedIds.size > 0 && selectedIds.size === processedStudents.length ? <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" /> : <Square size={18} strokeWidth={2.5} />}</button></th>
                                <th className="px-4 pb-2">Estudiante</th>
                                <th className="px-4 pb-2">Documento</th>
                                <th className="px-4 pb-2">Trayectoria</th>
                                <th className="px-4 pb-2">Estado</th>
                                <th className="px-4 pb-2 text-center">Info</th>
                                <th className="px-4 pb-2 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="p-12 text-center text-slate-400 glass-panel rounded-xl italic">Cargando datos...</td></tr>
                            ) : processedStudents.length === 0 ? (
                                <tr><td colSpan="7" className="p-12 text-center text-slate-400 glass-panel rounded-xl">No hay coincidencias.</td></tr>
                            ) : (
                                currentItems.map((student) => {
                                    const avatar = getAvatarStyle(student.nombre);
                                    const isRetirado = student.estado === 'Retirado';

                                    return (
                                        <tr key={student.id} className={`group glass-row rounded-xl ${selectedIds.has(student.id) ? 'ring-2 ring-blue-500 bg-blue-50/60 dark:bg-blue-900/30' : ''}`}>
                                            <td className="p-4 text-center first:rounded-l-xl">
                                                <button onClick={() => toggleSelectOne(student.id)} className="text-slate-300 dark:text-slate-600 hover:text-blue-500 transition-colors">{selectedIds.has(student.id) ? <CheckSquare size={20} className="text-blue-600 dark:text-blue-400" /> : <Square size={20} className="group-hover:text-slate-400" />}</button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3.5">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md ${avatar.gradient} border-2 border-white dark:border-slate-800`}>
                                                        {avatar.initials}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{student.nombre}</div>
                                                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{student.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{student.tipoDoc}</span>
                                                    <span className="text-sm font-mono font-bold text-slate-600 dark:text-slate-300 tracking-tight">{student.numDoc}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex flex-col gap-1.5 items-start">
                                                    {/* INGRESO */}
                                                    {student.cohorteIn ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-[11px] font-bold">
                                                            <CalendarPlus size={10} strokeWidth={3} /> {student.cohorteIn}
                                                        </span>
                                                    ) : <span className="text-slate-300 text-xs">-</span>}

                                                    {/* EGRESO/RETIRO */}
                                                    {student.cohorteOut && (
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border 
                                                            ${isRetirado
                                                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                            }`}
                                                        >
                                                            {isRetirado ? <Ban size={10} strokeWidth={3} /> : <GraduationCap size={12} strokeWidth={2} />}
                                                            {student.cohorteOut}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">{getStatusBadge(student.estado)}</td>
                                            <td className="p-4 text-center align-middle">
                                                <button onClick={() => student.comentarios && setCommentModal({ isOpen: true, text: student.comentarios, studentName: student.nombre })} disabled={!student.comentarios} className={`p-2 rounded-full transition-all relative ${student.comentarios ? 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30' : 'text-slate-200 dark:text-slate-700'}`}>
                                                    {student.comentarios && <span className="absolute top-1 right-1 h-2 w-2 bg-sky-400 rounded-full border border-white dark:border-slate-800 shadow-sm"></span>}
                                                    <MessageCircle size={18} fill={student.comentarios ? "currentColor" : "none"} />
                                                </button>
                                            </td>
                                            <td className="p-4 text-right last:rounded-r-xl align-middle">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                    {student.folderUrl && (
                                                        <a href={student.folderUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Ver Carpeta de Drive">
                                                            <FolderOpen size={18} />
                                                        </a>
                                                    )}
                                                    <Link to={`/students/view/${student.id}`} className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Eye size={18} /></Link>
                                                    <Link to={`/students/edit/${student.id}`} className="p-2 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"><Edit size={18} /></Link>
                                                    <button onClick={() => handleDelete(student.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={18} /></button>
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
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block ml-1 tracking-wider">{label}</label>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left glass-select-trigger rounded-xl py-2 px-3 flex items-center justify-between text-sm text-slate-700 dark:text-white transition-all hover:bg-white/40 dark:hover:bg-white/5">
                <span className="truncate">{value}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full rounded-xl glass-dropdown-menu overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <ul className="max-h-48 overflow-auto py-1 custom-scrollbar">
                        {options.map((opt) => (
                            <li key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors ${value === opt ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
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

export default StudentList;