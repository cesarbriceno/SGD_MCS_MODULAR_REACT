import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Users, GraduationCap, FileText,
    Calendar, FileBadge, LogOut, X, Globe, FolderOpen, UserCheck
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Users, label: 'Estudiantes', path: '/students' },
        { icon: GraduationCap, label: 'Docentes', path: '/teachers' },
        { icon: FileText, label: 'Tesis', path: '/thesis' },
        { icon: Globe, label: 'Externos', path: '/externals' },
        { icon: Calendar, label: 'Eventos', path: '/events' },
        { icon: UserCheck, label: 'Participaciones', path: '/participations' },
        { icon: FileBadge, label: 'Documentos', path: '/documents' },
        { icon: FolderOpen, label: 'Repositorio', path: '/repository' },
    ];

    return (
        <>
            {/* OVERLAY GLOBAL (Cierra el sidebar al hacer clic fuera) */}
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30 transition-all duration-500 
                ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            <aside
                className={`
                    /* POSICIONAMIENTO FLOTANTE (ISLA) */
                    fixed left-4 top-24 bottom-6 w-72 z-40
                    
                    /* ESTILO VISUAL (GLASS + REDONDEADO) */
                    glass-panel rounded-[2.5rem] 
                    flex flex-col py-8 overflow-hidden border border-white/20
                    
                    /* ANIMACIÓN DE ENTRADA/SALIDA */
                    transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
                    
                    /* ESTADO ABIERTO/CERRADO (Control global por isOpen) */
                    ${isOpen
                        ? 'translate-x-0 opacity-100 scale-100 shadow-2xl'
                        : '-translate-x-[110%] opacity-0 scale-95 pointer-events-none'
                    }
                `}
            >
                {/* HEADER MÓVIL (Solo para cerrar en celular) */}
                <div className="flex justify-between items-center px-6 mb-2 md:hidden">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Menú</span>
                    <button onClick={onClose} className="btn-ghost p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><X size={18} /></button>
                </div>

                {/* TÍTULO DECORATIVO (Desktop) */}
                <div className="hidden md:block px-6 mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Menú Principal</span>
                </div>

                {/* NAVEGACIÓN (Fix del Error de Consola) */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => window.innerWidth < 768 && onClose()}
                            className={({ isActive }) => `
                                flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group relative
                                ${isActive
                                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200'}
                            `}
                        >
                            {/* USAMOS CHILDREN FUNCTION PARA ACCEDER A 'isActive' SIN ERRORES */}
                            {({ isActive }) => (
                                <>
                                    <item.icon
                                        size={20}
                                        className={`mr-3 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                                    />
                                    <span className="text-sm tracking-wide">{item.label}</span>

                                    {/* PUNTO BRILLANTE (Renderizado condicional limpio) */}
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* FOOTER */}
                <div className="px-3 mt-auto pt-4 border-t border-slate-200/20 dark:border-white/10">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 btn-danger rounded-2xl group">
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-bold">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;