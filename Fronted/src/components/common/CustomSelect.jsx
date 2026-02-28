import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';

const CustomSelect = ({ name, value, onChange, options, disabled, error, icon: Icon, placeholder = "Seleccione..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (opt) => {
        onChange({ target: { name, value: opt } });
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl premium-input outline-none transition-all
                    ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500/50 bg-white dark:bg-slate-800' : 'bg-white/50 dark:bg-slate-900/40 border-black/5 dark:border-white/5'}
                    ${error ? 'border-red-500/50 text-red-600 dark:text-red-400' : ''}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {Icon && <Icon size={18} className={`${error ? 'text-red-500' : 'text-slate-400'}`} />}
                    <span className={`block truncate ${!value ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
                        {value || placeholder}
                    </span>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[100] mt-2 w-full rounded-xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/10 shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200">
                    <ul className="max-h-60 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                        <li
                            onClick={() => handleSelect("")}
                            className="px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                        >
                            -- Limpiar Selección --
                        </li>
                        {options.map((opt) => (
                            <li
                                key={opt}
                                onClick={() => handleSelect(opt)}
                                className={`px-4 py-3 text-sm cursor-pointer flex items-center justify-between transition-colors
                                    ${value === opt ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                                `}
                            >
                                {opt}
                                {value === opt && <Check size={16} />}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
