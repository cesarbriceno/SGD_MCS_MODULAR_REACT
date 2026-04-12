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

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === counterName) {
            currentVal = parseInt(data[i][1]) || 0;
            rowIndex = i + 1;
            break;
        }
    }

    // Si no existe, lo creamos
    if (rowIndex === -1) {
        currentVal = 0;
        configSheet.appendRow([counterName, 0, 'Sistema', new Date()]);
        rowIndex = configSheet.getLastRow();
    }

    // Incrementar y Guardar
    const newVal = currentVal + 1;
    configSheet.getRange(rowIndex, 2).setValue(newVal);
    configSheet.getRange(rowIndex, 4).setValue(new Date());

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

/**
 * 4. LOG DE AUDITORÍA DOCUMENTAL
 * Registra una acción en la hoja Historial_Documentos
 * @param {Object} params - {action, type, id, name, details}
 */
function logDocumentAction(params) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = ss.getSheetByName(SHEETS.HISTORIAL);
        if (!sheet) return;

        const userEmail = Session.getActiveUser().getEmail() || 'Sistema/Anónimo';
        const uuid = Utilities.getUuid();
        const timestamp = new Date();

        // Estructura de la hoja (Reportada por el usuario): 
        // UUID | Tipo_Documento | ID_Beneficiario | Nombre_Beneficiario | Detalle_Origen | Detalles_JSON | Fecha_Emision | Usuario_Emisor
        sheet.appendRow([
            uuid,
            params.action,                        // UPLOAD_FILE, ENTITY_CREATE, etc. -> 'Tipo_Documento'
            params.entityId || params.id,         // ID_Beneficiario
            params.entityName || params.name,     // Nombre_Beneficiario
            params.type || 'N/A',                 // Detalle_Origen
            JSON.stringify({
                itemId: params.id,
                itemName: params.name,
                entityType: params.entityType,
                ...params.details
            }),
            timestamp,                             // Fecha_Emision
            userEmail                              // Usuario_Emisor
        ]);

        Logger.log(`Audit Log: ${params.action} por ${userEmail} sobre ${params.name}`);
    } catch (e) {
        Logger.log('Error en logDocumentAction: ' + e.toString());
    }
}