/**
 * core/EntityManager.js
 * Lógica universal de CRUD para todas las entidades de la base de datos (Sheets + Drive)
 */

/**
 * Crea un nuevo registro y opcionalmente su carpeta en Drive
 */
function createItem(type, data) {
    try {
        const ss = getDB();
        let sheetName = '';

        switch (type) {
            case 'estudiante': sheetName = SHEETS.ESTUDIANTES; break;
            case 'docente': sheetName = SHEETS.DOCENTES; break;
            case 'externo': sheetName = SHEETS.EXTERNOS; break;
            case 'evento': sheetName = SHEETS.EVENTOS; break;
            case 'tesis': sheetName = SHEETS.TESIS; break;
            default: return { success: false, message: 'Tipo no válido' };
        }

        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) return { success: false, message: `Hoja ${sheetName} no encontrada` };

        // IDs Automáticos
        let prefix = type.substring(0, 3).toUpperCase();
        let counter = `Siguiente_ID_${type.charAt(0).toUpperCase()}${type.slice(1)}`;
        if (type === 'externo') counter = 'Siguiente_ID_Externo'; // Corrección manual por nombres en Config

        const idField = `ID_${type.charAt(0).toUpperCase()}${type.slice(1)}`;
        if (!data[idField] || data[idField] === "") {
            data[idField] = generateUniqueId(prefix, counter);
        }

        data = normalizeData(type, data);

        // Drive (Opcional)
        if (data._createFolder !== false) {
            const folderInfo = createEntityFolder(type, data);
            data.ID_Carpeta_Drive = folderInfo.id;
            data.URL_Carpeta_Drive = folderInfo.url;
        }

        const userEmail = Session.getActiveUser().getEmail() || 'Sistema';
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const newRow = headers.map(header => {
            if (data.hasOwnProperty(header)) return data[header];
            if (header === 'Fecha_Registro' || header === 'Ultima_Actualizacion') {
                return Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm:ss");
            }
            if (header === 'Usuario_Registro' || header === 'Ultimo_Usuario') {
                return userEmail;
            }
            return '';
        });

        sheet.appendRow(newRow);

        // Auditoría
        logDocumentAction({
            action: 'ENTITY_CREATE',
            type: 'entity',
            id: data[idField],
            name: data.Nombre1 ? `${data.Nombre1} ${data.Apellido1}` : (data.Titulo_Investigacion || data.Nombre_Evento || data[idField]),
            entityId: data[idField],
            entityName: data.Nombre1 ? `${data.Nombre1} ${data.Apellido1}` : null,
            entityType: type,
            details: { context: 'Creación manual desde formulario' }
        });

        return { success: true, message: 'Creado correctamente', id: data[idField] };
    } catch (e) {
        return { success: false, message: e.toString() };
    }
}

/**
 * Actualiza un registro existente
 */
function updateItem(type, id, data) {
    try {
        const ss = getDB();
        let sheetName = '';
        switch (type) {
            case 'estudiante': sheetName = SHEETS.ESTUDIANTES; break;
            case 'docente': sheetName = SHEETS.DOCENTES; break;
            case 'externo': sheetName = SHEETS.EXTERNOS; break;
            case 'evento': sheetName = SHEETS.EVENTOS; break;
            case 'tesis': sheetName = SHEETS.TESIS; break;
            default: return { success: false, message: 'Tipo no válido' };
        }

        const sheet = ss.getSheetByName(sheetName);
        const values = sheet.getDataRange().getValues();
        const headers = values[0];

        let rowIndex = -1;
        for (let i = 1; i < values.length; i++) {
            if (String(values[i][0]) === String(id)) {
                rowIndex = i + 1;
                break;
            }
        }

        if (rowIndex === -1) return { success: false, message: 'ID no encontrado' };

        headers.forEach((header, colIndex) => {
            if (data.hasOwnProperty(header)) {
                let val = data[header];
                if (header === 'Ultima_Actualizacion') {
                    val = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm:ss");
                }
                if (header === 'Ultimo_Usuario') {
                    val = Session.getActiveUser().getEmail() || 'Sistema';
                }
                sheet.getRange(rowIndex, colIndex + 1).setValue(val);
            }
        });

        if (folderCol > -1 && !values[rowIndex - 1][folderCol]) {
            syncEntityFolder(type, id);
        }

        // Auditoría
        logDocumentAction({
            action: 'ENTITY_UPDATE',
            type: 'entity',
            id: id,
            name: data.Nombre1 ? `${data.Nombre1} ${data.Apellido1}` : id,
            entityId: id,
            entityName: data.Nombre1 ? `${data.Nombre1} ${data.Apellido1}` : null,
            entityType: type,
            details: { context: 'Actualización de datos' }
        });

        return { success: true, message: 'Actualizado correctamente' };
    } catch (e) {
        return { success: false, message: e.toString() };
    }
}

/**
 * Elimina un registro y su carpeta de Drive
 */
function deleteItem(type, id) {
    try {
        const ss = getDB();
        let sheetName = '';
        switch (type) {
            case 'estudiante': sheetName = SHEETS.ESTUDIANTES; break;
            case 'docente': sheetName = SHEETS.DOCENTES; break;
            case 'externo': sheetName = SHEETS.EXTERNOS; break;
            case 'evento': sheetName = SHEETS.EVENTOS; break;
            case 'tesis': sheetName = SHEETS.TESIS; break;
            default: return { success: false, message: 'Tipo no válido' };
        }

        const sheet = ss.getSheetByName(sheetName);
        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        const folderIdCol = headers.indexOf('ID_Carpeta_Drive');

        for (let i = 1; i < data.length; i++) {
            if (String(data[i][0]) === String(id)) {
                if (folderIdCol > -1 && data[i][folderIdCol]) {
                    deleteEntityFolder(data[i][folderIdCol]);
                }
                sheet.deleteRow(i + 1);
                return { success: true, message: 'Eliminado correctamente' };
            }
        }
        return { success: false, message: 'ID no encontrado' };
    } catch (e) {
        return { success: false, message: e.toString() };
    }
}

function bulkUpdateItems(type, ids, updates) {
    // Implementación resumida compartida en el global
    let count = 0;
    ids.forEach(id => {
        const res = updateItem(type, id, updates);
        if (res.success) count++;
    });
    return { success: true, message: `Se actualizaron ${count} registros.` };
}

function bulkDeleteItems(type, ids) {
    let count = 0;
    ids.forEach(id => {
        const res = deleteItem(type, id);
        if (res.success) count++;
    });
    return { success: true, message: `Se eliminaron ${count} registros.` };
}
