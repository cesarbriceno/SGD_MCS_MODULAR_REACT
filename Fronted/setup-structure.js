import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración para obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const structure = [
    {
        path: 'src/assets/images',
        info: 'Guardar aquí imágenes estáticas (logos, fondos, banners).'
    },
    {
        path: 'src/assets/icons',
        info: 'Iconos SVG personalizados que no estén en la librería Lucide.'
    },
    {
        path: 'src/components/ui',
        info: '🧩 COMPONENTES PRIMITIVOS (Átomos).\nAquí van botones, inputs, badges, cards, modales genéricos.\nDeben ser tontos (sin lógica de negocio), solo reciben props.'
    },
    {
        path: 'src/components/layout',
        info: '📐 ESTRUCTURA VISUAL.\nAquí van el Sidebar, Header, Navbar, Footer y el MainLayout que envuelve la app.'
    },
    {
        path: 'src/components/modules/students',
        info: '🎓 COMPONENTES DE ESTUDIANTES.\nTablas específicas, formularios de estudiante, tarjetas de perfil.'
    },
    {
        path: 'src/components/modules/teachers',
        info: '👨‍🏫 COMPONENTES DE DOCENTES.\nListados de profesores, asignación de cargas.'
    },
    {
        path: 'src/components/modules/events',
        info: '📅 COMPONENTES DE EVENTOS.\nTarjetas de eventos, generadores de certificados visuales.'
    },
    {
        path: 'src/components/shared',
        info: '🔄 REUTILIZABLES COMPLEJOS.\nComponentes que se usan en varios módulos, como un "Uploader de Archivos" o un "Selector de Fechas".'
    },
    {
        path: 'src/context',
        info: '🌐 ESTADO GLOBAL.\nContextos de React para manejar:\n- Autenticación (AuthContext)\n- Tema Oscuro/Claro (ThemeContext)\n- Notificaciones Globales.'
    },
    {
        path: 'src/hooks',
        info: '🎣 CUSTOM HOOKS.\nLógica extraída para reutilizar.\nEj: useFetch (pedir datos), useForm (manejar formularios), useAuth.'
    },
    {
        path: 'src/pages/auth',
        info: '🔐 VISTAS DE ACCESO.\nLogin, Recuperar Contraseña, Registro.'
    },
    {
        path: 'src/pages/dashboard',
        info: '📊 VISTA PRINCIPAL.\nEl panel de control con gráficas y resúmenes.'
    },
    {
        path: 'src/pages/students',
        info: '🎓 VISTAS DE ESTUDIANTES.\nLa página que une la Tabla de Estudiantes con el Layout.'
    },
    {
        path: 'src/services',
        info: '🔌 CONEXIÓN BACKEND.\nAquí van las funciones que llaman a Google Apps Script.\nNADA de UI aquí, solo datos puros.'
    },
    {
        path: 'src/utils',
        info: '🛠️ UTILIDADES.\nFunciones puras de ayuda:\n- Formatear dinero ($)\n- Formatear fechas\n- Validar correos\n- Generar IDs.'
    }
];

console.log('🚀 Iniciando creación de arquitectura SGD-MCS v3...');

structure.forEach(item => {
    const fullPath = path.join(__dirname, item.path);

    // 1. Crear la carpeta si no existe
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Carpeta creada: ${item.path}`);
    } else {
        console.log(`ℹ️  Ya existe: ${item.path}`);
    }

    // 2. Crear un archivo LEEME.md dentro con la explicación
    const readmePath = path.join(fullPath, 'LEEME.md');
    if (!fs.existsSync(readmePath)) {
        fs.writeFileSync(readmePath, `# Información de Carpeta\n\n${item.info}`);
    }
});

console.log('\n✨ ¡Arquitectura completada con éxito! Ya puedes borrar este script.');