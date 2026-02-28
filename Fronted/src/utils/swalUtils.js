import SweetAlert from 'sweetalert2';

/**
 * Configuración centralizada para SweetAlert2 con diseño "Apple Glass".
 * Se adapta automáticamente al modo oscuro de Nexodo.
 */
export const glassAlert = (options = {}) => {
    const isDark = document.documentElement.classList.contains('dark');

    return {
        ...options,
        customClass: {
            popup: `
                ${isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200'} 
                backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border p-0 font-sans relative
            `,
            title: `
                ${isDark ? 'text-white' : 'text-slate-800'} 
                font-black text-2xl pt-12 px-8 tracking-tight
            `,
            htmlContainer: `
                ${isDark ? 'text-slate-400' : 'text-slate-500'} 
                text-[13px] px-10 pb-2 leading-relaxed font-medium
            `,
            confirmButton: `
                bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-2xl 
                shadow-xl shadow-blue-500/30 transition-all active:scale-95 relative z-10
            `,
            cancelButton: `
                ${isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'} 
                font-bold py-4 px-10 rounded-2xl transition-all active:scale-95 relative z-10
            `,
            actions: `
                p-8 flex justify-center gap-4 border-t border-slate-100 dark:border-white/5 
                mt-8 w-full bg-slate-50/40 dark:bg-black/40 rounded-b-[2.5rem]
            `,
            icon: 'mt-12 scale-150 mb-0'
        },
        backdrop: 'rgba(0,0,0,0.4) saturate(180%) blur(10px)',
        buttonsStyling: false,
        width: '26em'
    };
};

/**
 * Instancia maestra de Swal pre-configurada
 */
// Inyectar estilos globales para corregir iconos de SweetAlert2
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        .swal2-icon {
            border: none !important;
            background: transparent !important;
        }
        /* Corregir óvalos y máscaras blancas en iconos de éxito */
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
            background-color: #a5dc86 !important;
        }
        .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
            background-color: #f27474 !important;
        }
        .swal2-icon.swal2-error {
            border: 0.25em solid rgba(242, 116, 116, 0.2) !important;
        }
        .swal2-icon.swal2-warning {
            color: #f8bb86 !important;
            border: 0.25em solid rgba(248, 187, 134, 0.2) !important;
        }
        /* Eliminar sombras y bordes extra */
        .swal2-popup .swal2-icon {
            box-shadow: none !important;
            margin-top: 2em !important;
        }
    `;
    document.head.appendChild(style);
}

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
