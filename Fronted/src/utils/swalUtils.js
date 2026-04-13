import SweetAlert from 'sweetalert2';

/**
 * Colores estándar para cada tipo de alerta (usados como estilos inline)
 */
const ALERT_COLORS = {
    success: {
        bgLight: '#f0fdf4',
        bgDark: '#022c22',
        btn: '#10b981',
        btnHover: '#059669',
        title: '#064e3b',
        titleDark: '#6ee7b7',
        text: '#065f46',
        textDark: '#a7f3d0',
        border: '#bbf7d0',
        borderDark: '#064e3b',
        actionsBg: '#f0fdf4',
        actionsBgDark: '#042f2e'
    },
    error: {
        bgLight: '#fef2f2',
        bgDark: '#1c0a0a',
        btn: '#ef4444',
        btnHover: '#dc2626',
        title: '#7f1d1d',
        titleDark: '#fca5a5',
        text: '#991b1b',
        textDark: '#fca5a5',
        border: '#fecaca',
        borderDark: '#7f1d1d',
        actionsBg: '#fef2f2',
        actionsBgDark: '#1c0a0a'
    },
    warning: {
        bgLight: '#fffbeb',
        bgDark: '#1c1202',
        btn: '#f59e0b',
        btnHover: '#d97706',
        title: '#78350f',
        titleDark: '#fcd34d',
        text: '#92400e',
        textDark: '#fde68a',
        border: '#fef3c7',
        borderDark: '#78350f',
        actionsBg: '#fffbeb',
        actionsBgDark: '#1c1202'
    },
    info: {
        bgLight: '#eff6ff',
        bgDark: '#0c1a3a',
        btn: '#3b82f6',
        btnHover: '#2563eb',
        title: '#1e3a5f',
        titleDark: '#93c5fd',
        text: '#1e40af',
        textDark: '#93c5fd',
        border: '#bfdbfe',
        borderDark: '#1e3a5f',
        actionsBg: '#eff6ff',
        actionsBgDark: '#0c1a3a'
    },
    question: {
        bgLight: '#f8fafc',
        bgDark: '#1e1b4b',
        btn: '#6366f1',
        btnHover: '#4f46e5',
        title: '#1e1b4b',
        titleDark: '#c7d2fe',
        text: '#334155',
        textDark: '#cbd5e1',
        border: '#e0e7ff',
        borderDark: '#312e81',
        actionsBg: '#f8fafc',
        actionsBgDark: '#1e1b4b'
    }
};

/**
 * Configuración centralizada para SweetAlert2 con diseño "Apple Glass".
 * Usa estilos INLINE (no clases Tailwind dinámicas que no funcionan).
 */
export const glassAlert = (options = {}) => {
    const isDark = document.documentElement.classList.contains('dark');
    const type = options.icon || 'info';
    const c = ALERT_COLORS[type] || ALERT_COLORS.info;

    const bgColor = isDark ? c.bgDark : c.bgLight;
    const titleColor = isDark ? c.titleDark : c.title;
    const textColor = isDark ? c.textDark : c.text;
    const borderColor = isDark ? c.borderDark : c.border;
    const actionsBg = isDark ? c.actionsBgDark : c.actionsBg;

    return {
        ...options,
        background: bgColor,
        color: textColor,
        confirmButtonColor: c.btn,
        cancelButtonColor: isDark ? '#334155' : '#94a3b8',
        denyButtonColor: isDark ? '#334155' : '#94a3b8',
        customClass: {
            popup: `rounded-[2rem] shadow-2xl border-2 overflow-hidden`,
            title: 'font-black text-xl pt-8 px-6 tracking-tight',
            htmlContainer: 'text-[13px] px-8 pb-2 leading-relaxed font-medium',
            confirmButton: 'font-bold py-3.5 px-8 rounded-2xl shadow-lg transition-all text-white',
            cancelButton: 'font-bold py-3.5 px-8 rounded-2xl transition-all text-white',
            denyButton: 'font-bold py-3.5 px-8 rounded-2xl transition-all text-white',
            actions: `p-6 flex justify-center gap-4 border-t mt-4 w-full rounded-b-[2rem]`,
            icon: 'mt-8 mb-0'
        },
        // Estilos inline que SÍ funcionan en Swal2
        didOpen: (popup) => {
            if (!popup) return;
            // Popup principal
            popup.style.border = `2px solid ${borderColor}`;
            // Título
            const titleEl = popup.querySelector('.swal2-title');
            if (titleEl) {
                titleEl.style.color = titleColor;
                titleEl.style.fontWeight = '900';
                titleEl.style.fontSize = '1.25rem';
            }
            // Contenedor HTML
            const htmlEl = popup.querySelector('.swal2-html-container');
            if (htmlEl) {
                htmlEl.style.color = textColor;
                htmlEl.style.fontSize = '13px';
                htmlEl.style.fontWeight = '500';
            }
            // Botón confirmar
            const confirmBtn = popup.querySelector('.swal2-confirm');
            if (confirmBtn) {
                confirmBtn.style.backgroundColor = c.btn;
                confirmBtn.style.color = '#ffffff';
                confirmBtn.style.fontWeight = '700';
                confirmBtn.style.padding = '14px 32px';
                confirmBtn.style.borderRadius = '16px';
                confirmBtn.style.boxShadow = `0 4px 14px ${c.btn}40`;
                confirmBtn.style.border = 'none';
                confirmBtn.style.fontSize = '14px';
            }
            // Botón cancelar
            const cancelBtn = popup.querySelector('.swal2-cancel');
            if (cancelBtn) {
                cancelBtn.style.backgroundColor = isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9';
                cancelBtn.style.color = isDark ? '#cbd5e1' : '#475569';
                cancelBtn.style.fontWeight = '700';
                cancelBtn.style.padding = '14px 32px';
                cancelBtn.style.borderRadius = '16px';
                cancelBtn.style.border = 'none';
                cancelBtn.style.fontSize = '14px';
            }
            // Botón deny
            const denyBtn = popup.querySelector('.swal2-deny');
            if (denyBtn) {
                denyBtn.style.backgroundColor = isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9';
                denyBtn.style.color = isDark ? '#cbd5e1' : '#475569';
                denyBtn.style.fontWeight = '700';
                denyBtn.style.padding = '14px 32px';
                denyBtn.style.borderRadius = '16px';
                denyBtn.style.border = 'none';
                denyBtn.style.fontSize = '14px';
            }
            // Actions container
            const actionsEl = popup.querySelector('.swal2-actions');
            if (actionsEl) {
                actionsEl.style.backgroundColor = actionsBg;
                actionsEl.style.borderTop = `1px solid ${borderColor}`;
                actionsEl.style.borderRadius = '0 0 2rem 2rem';
                actionsEl.style.padding = '20px 24px';
                actionsEl.style.width = '100%';
                actionsEl.style.justifyContent = 'center';
                actionsEl.style.gap = '16px';
            }
        },
        backdrop: 'rgba(0,0,0,0.45) saturate(180%) blur(10px)',
        width: '28em'
    };
};

/**
 * Inyectar estilos globales para corregir iconos de SweetAlert2
 */
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        .swal2-icon {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            margin-top: 1.5em !important;
        }
        .swal2-icon.swal2-success [class^='swal2-success-circular-line'],
        .swal2-icon.swal2-success [class^='swal2-success-circular-line']::before,
        .swal2-icon.swal2-success [class^='swal2-success-circular-line']::after,
        .swal2-icon.swal2-success .swal2-success-fix {
            background: transparent !important;
            background-color: transparent !important;
        }
        .swal2-icon.swal2-success .swal2-success-ring {
            border: .25em solid rgba(165, 220, 134, .2) !important;
        }
        .swal2-icon.swal2-success [class^='swal2-success-line'] {
            background-color: #10b981 !important;
        }
        .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
            background-color: #ef4444 !important;
        }
        .swal2-icon.swal2-error {
            border: 0.25em solid rgba(239, 68, 68, 0.2) !important;
        }
        .swal2-icon.swal2-warning {
            color: #f59e0b !important;
            border: 0.25em solid rgba(245, 158, 11, 0.2) !important;
        }
        .swal2-icon.swal2-info {
            color: #3b82f6 !important;
            border: 0.25em solid rgba(59, 130, 246, 0.2) !important;
        }
        .swal2-icon.swal2-question {
            color: #6366f1 !important;
            border: 0.25em solid rgba(99, 102, 241, 0.2) !important;
        }
        /* Hover de botones */
        .swal2-confirm:hover {
            filter: brightness(1.1) !important;
            transform: scale(1.02);
        }
        .swal2-cancel:hover, .swal2-deny:hover {
            filter: brightness(1.05) !important;
        }
        .swal2-confirm:active, .swal2-cancel:active, .swal2-deny:active {
            transform: scale(0.97) !important;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Instancia maestra de Swal pre-configurada
 */
const Swal = {
    fire: (optionsOrTitle, text, icon) => {
        let options = {};
        if (typeof optionsOrTitle === 'string') {
            options = { title: optionsOrTitle, text, icon };
        } else {
            options = optionsOrTitle;
        }
        return SweetAlert.fire(glassAlert(options));
    }
};

export default Swal;

/**
 * Shorthand para alertas rápidas
 */
export const toast = {
    success: (title, text) => Swal.fire({ title, text, icon: 'success' }),
    error: (title, text) => Swal.fire({ title, text, icon: 'error' }),
    warning: (title, text) => Swal.fire({ title, text, icon: 'warning' }),
    info: (title, text) => Swal.fire({ title, text, icon: 'info' }),
    confirm: (title, text, confirmText = 'Confirmar') => Swal.fire({
        title, text, icon: 'warning',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancelar'
    }),
    prompt: async (title, text, inputValue = '') => {
        const { value: textValue } = await Swal.fire({
            title,
            text,
            input: 'text',
            inputValue,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) {
                    return 'Debes escribir algo';
                }
            }
        });
        return { value: textValue, isConfirmed: !!textValue };
    }
};
