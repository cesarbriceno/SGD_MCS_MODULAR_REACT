import React, { useState, useEffect, useRef } from 'react';
import {
    Bell, Moon, Sun, Menu,
    X, Info, AlertCircle, CheckCircle, Calendar, Trash2
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const NexodoLogo = () => (
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 25V75" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className="text-white" />
        <path d="M75 25V75" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className="text-white" />
        <path d="M25 25L75 75" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className="text-white" />
        <circle cx="25" cy="25" r="8" fill="white" />
        <circle cx="75" cy="75" r="8" fill="white" />
        <circle cx="25" cy="75" r="8" fill="white" />
        <circle cx="75" cy="25" r="8" fill="white" />
    </svg>
);

const Navbar = ({ darkMode, setDarkMode, toggleSidebar }) => {
    const { notifications, markAsRead, deleteNotification, clearAll, unreadCount } = useNotifications();
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [notifRef]);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Ahora mismo';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
        return date.toLocaleDateString();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'alert': return <AlertCircle size={16} className="text-amber-500" />;
            case 'success': return <CheckCircle size={16} className="text-emerald-500" />;
            case 'error': return <XCircle size={16} className="text-red-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        /* STICKY CONFIGURADO: top-4 y z-50 para flotar sobre el contenido principal y sidebar */
        <header className="sticky top-4 z-50 mx-4 md:mx-8 mb-6 mt-4 rounded-2xl glass-panel px-5 py-3 flex items-center justify-between transition-all duration-300 shadow-lg border border-white/20 backdrop-blur-md">

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="btn-ghost p-2.5"
                >
                    <Menu size={24} strokeWidth={2.5} />
                </button>

                <div className="flex items-center gap-3 select-none">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#003366] to-[#0055AA] flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <NexodoLogo />
                    </div>
                    <div className="hidden sm:block leading-tight">
                        <h1 className="text-lg font-black tracking-tight text-slate-800 dark:text-white font-sans uppercase">Nexodo</h1>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Calidad Articulada</p>
                    </div>
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden md:block mx-2"></div>

                <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-white/5">
                    <Calendar size={14} className="text-[#003366] dark:text-blue-400" />
                    <span className="capitalize">{today}</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button onClick={() => setDarkMode(!darkMode)} className="btn-ghost p-2.5">
                    {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-500" />}
                </button>

                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={`btn-ghost p-2.5 relative ${isNotifOpen ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : ''}`}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0f172a] animate-pulse"></span>}
                    </button>

                    {isNotifOpen && (
                        <div className="absolute right-0 mt-4 w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50 ring-1 ring-black/5">
                            <div className="px-6 py-4 border-b border-slate-100/50 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-white font-black text-[10px] uppercase tracking-[0.2em]">
                                <span>Notificaciones</span>
                                {notifications.length > 0 && (
                                    <button onClick={clearAll} className="btn-ghost text-[10px] text-blue-500 hover:text-blue-600 font-bold px-3 py-1">Limpiar</button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto custom-scrollbar p-1">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center">
                                        <Bell size={24} className="mb-2 opacity-20" />
                                        Sin novedades
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => markAsRead(n.id)}
                                            className={`p-3 mb-1 rounded-xl transition-all cursor-pointer relative group ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-0.5">{getIcon(n.type)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <p className={`text-xs truncate ${!n.read ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{n.title}</p>
                                                        <span className="text-[9px] text-slate-400 whitespace-nowrap ml-2">{formatTime(n.time)}</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.desc}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                                    className="btn-ghost-danger p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            {!n.read && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-blue-500 rounded-full"></div>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden sm:flex items-center gap-3 pl-1 cursor-pointer group">
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-none group-hover:text-blue-500 transition-colors">Admin</p>
                        <p className="text-[10px] font-bold text-emerald-500 tracking-wider">ONLINE</p>
                    </div>
                    <img src="https://ui-avatars.com/api/?name=Admin+User&background=003366&color=fff&rounded=true&bold=true" alt="Profile" className="w-10 h-10 rounded-xl border-2 border-white dark:border-white/10 shadow-sm group-hover:scale-105 transition-transform" />
                </div>
            </div>
        </header>
    );
};

export default Navbar;
