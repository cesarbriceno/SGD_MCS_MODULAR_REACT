import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * FilterSelect - Componente de selector personalizado con diseño Glassmorphism.
 * @param {string} label - Etiqueta del filtro.
 * @param {string} value - Valor seleccionado actualmente.
 * @param {function} onChange - Función para manejar el cambio de valor.
 * @param {Array} options - Lista de opciones disponibles.
 */
const FilterSelect = ({ label, value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div className="w-full relative" ref={wrapperRef}>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block ml-1 tracking-wider">{label}</label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left bg-white/40 dark:bg-white/5 rounded-xl py-2 px-3 flex items-center justify-between text-sm text-slate-700 dark:text-white transition-all hover:bg-white/60 dark:hover:bg-white/10"
            >
                <span className="truncate">{value}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full rounded-xl glass-dropdown-menu overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <ul className="max-h-48 overflow-auto py-1 custom-scrollbar">
                        {options.map((opt) => (
                            <li
                                key={opt}
                                onClick={() => { onChange(opt); setIsOpen(false); }}
                                className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors ${value === opt ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                            >
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

export default FilterSelect;
