/**
 * ============================================================================
 * UTILIDADES DE BACKEND: NORMALIZACIÓN Y AUTO-FORMATO
 * ============================================================================
 */

/**
 * 1. GENERADOR DE IDs AUTOMÁTICOS
 * Lee la hoja 'Configuracion', toma el contador, lo incrementa y devuelve el ID formateado.
 * @param {string} prefix - Ej: "EST", "DOC", "EVT"
 * @param {string} counterName - El nombre exacto en la columna A de Configuracion
 */
function generateUniqueId(prefix, counterName) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const configSheet = ss.getSheetByName(SHEETS.CONFIG);
    const data = configSheet.getDataRange().getValues();

    // Buscar la fila del contador
    let rowIndex = -1;
    let currentVal = 0;

    for (let i = 1; i < data.length; i++) { // Empezamos en 1 para saltar cabecera
        if (data[i][0] === counterName) {
            currentVal = parseInt(data[i][1]);
            rowIndex = i + 1; // Ajuste por índice base 1 de Sheets
            break;
        }
    }

    if (rowIndex === -1) throw new Error(`Contador '${counterName}' no encontrado en Configuración.`);

    // Incrementar y Guardar (Transacción atómica simulada)
    const newVal = currentVal + 1;
    configSheet.getRange(rowIndex, 2).setValue(newVal);
    configSheet.getRange(rowIndex, 4).setValue(new Date()); // Actualizar timestamp

    // Formatear: EST0001, DOC0045, etc.
    const padded = newVal.toString().padStart(4, '0');
    return `${prefix}${padded}`;
}

/**
 * 2. NORMALIZADOR DE TEXTO (Title Case)
 * Convierte "juan esteban" a "Juan Esteban"
 */
function toTitleCase(str) {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

/**
 * 3. LIMPIEZA MAESTRA DE DATOS
 * Pasa los datos crudos por un filtro según su tipo antes de guardar.
 */
function normalizeData(type, data) {
    // Limpieza Genérica (Trim strings)
    for (const key in data) {
        if (typeof data[key] === 'string') data[key] = data[key].trim();
    }

    // Limpiezas Específicas
    switch (type) {
        case 'estudiante':
        case 'docente':
        case 'externo':
            if (data.Nombre1) data.Nombre1 = toTitleCase(data.Nombre1);
            if (data.Nombre2) data.Nombre2 = toTitleCase(data.Nombre2);
            if (data.Apellido1) data.Apellido1 = toTitleCase(data.Apellido1);
            if (data.Apellido2) data.Apellido2 = toTitleCase(data.Apellido2);
            if (data.Email) data.Email = data.Email.toLowerCase();
            break;

        case 'evento':
            if (data.Nombre_Evento) data.Nombre_Evento = data.Nombre_Evento.toUpperCase(); // Eventos en Mayúscula sostenida se ven mejor
            break;

        case 'tesis':
            if (data.Titulo_Investigacion) {
                // Primera letra mayúscula, resto normal (Sentence case)
                let t = data.Titulo_Investigacion;
                data.Titulo_Investigacion = t.charAt(0).toUpperCase() + t.slice(1);
            }
            break;
    }

    return data;
}