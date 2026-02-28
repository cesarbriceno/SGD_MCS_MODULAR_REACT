/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: { light: '#f8fafc', dark: '#0f172a' },
                surface: { light: '#ffffff', dark: '#1e293b' },
                primary: { DEFAULT: '#4f46e5', dark: '#6366f1', hover: '#4338ca' },
                secondary: { DEFAULT: '#64748b', dark: '#94a3b8' },
                accent: { DEFAULT: '#0ea5e9' },
                status: { success: '#10b981', warning: '#f59e0b', error: '#ef4444' }
            },
            boxShadow: {
                'premium': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'glow': '0 0 15px rgba(79, 70, 229, 0.3)',
            },
        },
    },
    plugins: [],
}