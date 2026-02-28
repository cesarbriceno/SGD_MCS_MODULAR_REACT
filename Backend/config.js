/**
 * ============================================================================
 * ⚙️ CONFIGURACIÓN GLOBAL DEL SISTEMA (SGD-MCS v3.0)
 * ============================================================================
 * Este archivo centraliza todas las constantes, colores y accesos a la BD.
 * Al estar aquí, están disponibles automáticamente en TODOS los demás scripts .gs
 */

// 1. ID DE LA BASE DE DATOS (Google Sheets)
// ----------------------------------------------------------------------------
const SPREADSHEET_ID = '13DnE1bamQgWQ2G5cuGq9vdlP-tHu6QgdBtZptqKkLuc';

// 1.1 ID DE LA CARPETA RAÍZ DE DRIVE (Opcional, si está vacío se usa el Root de Drive)
const ROOT_FOLDER_ID = '1vlf1dwjSDa6pirU80HhCexpYvCOetWeb'; // Carpeta raíz del sistema en Drive

// 2. MAPEO DE TABLAS (Nombres de las pestañas)
// ----------------------------------------------------------------------------
// Usamos constantes para evitar errores de escritura en el código.
const SHEETS = {
    ESTUDIANTES: 'Estudiantes',
    DOCENTES: 'Docentes',
    EXTERNOS: 'ParticipantesExternos',
    INSTITUCIONES: 'Instituciones',
    TESIS: 'Tesis',
    EVENTOS: 'Eventos',

    // Tablas Nuevas (v3.0)
    PARTICIPACIONES: 'Participaciones', // Relación M:N para eventos
    HISTORIAL: 'Historial_Documentos',  // Trazabilidad de certificados

    // Sistema
    CONFIG: 'Configuracion'
};

// 3. PALETA DE COLORES (Para el Auto-formato de Setup.gs)
// ----------------------------------------------------------------------------
// Estos colores se usarán cuando regeneres la estructura de la BD.
const COLORS = {
    ESTUDIANTES: '#4285F4', // Azul Google
    DOCENTES: '#FF9800', // Naranja
    TESIS: '#9C27B0', // Morado
    EVENTOS: '#E91E63', // Rosa Fuerte
    INSTITUCIONES: '#009688', // Verde Azulado
    EXTERNOS: '#8BC34A', // Verde Claro

    PARTICIPACIONES: '#607D8B', // Gris Azulado (Nuevo)
    HISTORIAL: '#3F51B5', // Indigo (Nuevo)

    CONFIG: '#263238'  // Gris Oscuro
};

// 4. FUNCIONES DE UTILIDAD GLOBAL
// ----------------------------------------------------------------------------

/**
 * Obtiene la instancia de la Base de Datos.
 * Úsala en lugar de SpreadsheetApp.openById() en otros archivos.
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getDB() {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Devuelve la configuración completa (por si el Frontend la necesita).
 */
function getAppConfig() {
    return {
        appVersion: '3.0.0',
        environment: 'Production',
        sheets: SHEETS,
        colors: COLORS
    };
}