/**
 * ============================================================================
 * 📁 GESTOR DE DRIVE (DriveManager.js)
 * Automatización de la estructura de archivos del sistema.
 * ============================================================================
 */

/**
 * Obtiene o crea una carpeta por nombre dentro de un padre específico.
 */
function getOrCreateFolder(parentFolder, folderName) {
    const folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
        return folders.next();
    }
    return parentFolder.createFolder(folderName);
}

/**
 * Obtiene la Carpeta Raíz del Sistema. 
 * Si no está configurada en Config.js, la crea en el Root de Drive.
 */
function getSystemRootFolder() {
    if (ROOT_FOLDER_ID && ROOT_FOLDER_ID !== "") {
        try {
            return DriveApp.getFolderById(ROOT_FOLDER_ID);
        } catch (e) {
            Logger.log("Error cargando carpeta raíz por ID, usando fallback...");
        }
    }

    // Fallback: Crear una carpeta llamada "SGD_DATABASE_ROOT" en el root del usuario
    const root = DriveApp.getRootFolder();
    return getOrCreateFolder(root, "SGD_DATABASE_ROOT");
}

/**
 * Obtiene el ID de la carpeta raíz del sistema (para el frontend)
 */
function getSystemRootFolderId() {
    try {
        const folder = getSystemRootFolder();
        return {
            success: true,
            id: folder.getId(),
            name: folder.getName(),
            url: folder.getUrl()
        };
    } catch (e) {
        Logger.log('Error en getSystemRootFolderId: ' + e.toString());
        return { success: false, message: e.toString() };
    }
}

/**
 * Mapea el tipo de entidad con el nombre de su carpeta contenedora.
 */
function getSubfolderNameByType(type) {
    const map = {
        'estudiante': SHEETS.ESTUDIANTES,
        'docente': SHEETS.DOCENTES,
        'tesis': SHEETS.TESIS,
        'evento': SHEETS.EVENTOS,
        'externo': SHEETS.EXTERNOS
    };
    return map[type] || 'Otros';
}

/**
 * Crea la estructura de carpetas para una nueva entidad.
 * Ejemplo: Estudiantes / 2026 / EST0001 - Jose Perez
 */
function createEntityFolder(type, data) {
    try {
        const rootFolder = getSystemRootFolder();
        const typeFolderName = getSubfolderNameByType(type);
        const typeFolder = getOrCreateFolder(rootFolder, typeFolderName);

        // 1. Definir sub-organización (por cohorte o año)
        let folderName = new Date().getFullYear().toString();

        // Para estudiantes, usar la cohorte completa (ej: "2023-1")
        if (type === 'estudiante' && data.Cohorte_Ingreso) {
            const cohorteRaw = data.Cohorte_Ingreso;
            Logger.log('Cohorte_Ingreso recibida: ' + cohorteRaw + ' (tipo: ' + typeof cohorteRaw + ')');

            // Si es una fecha ISO, extraer solo año-semestre
            if (typeof cohorteRaw === 'string' && cohorteRaw.includes('T')) {
                // Es formato ISO: "2023-01-01T05:00:00.000Z"
                // Extraer solo el año
                const year = cohorteRaw.substring(0, 4);
                // Determinar semestre basado en el mes
                const month = parseInt(cohorteRaw.substring(5, 7));
                const semester = month <= 6 ? '1' : '2';
                folderName = `${year}-${semester}`;
                Logger.log('Cohorte extraída de fecha ISO: ' + folderName);
            } else {
                // Ya viene en formato correcto "2023-1"
                folderName = cohorteRaw.toString();
                Logger.log('Cohorte en formato correcto: ' + folderName);
            }
        }

        // Para tesis, usar el año
        if (type === 'tesis' && data.Año) {
            folderName = data.Año.toString();
        }

        Logger.log('Creando carpeta con nombre: ' + folderName);
        const yearFolder = getOrCreateFolder(typeFolder, folderName);

        // 2. Nombre de la carpeta de la entidad
        let entityName = "";
        const id = data.ID_Estudiante || data.ID_Docente || data.ID_Externo || data.ID_Tesis || data.ID_Evento || "ID_PENDIENTE";
        const mainLabel = data.Nombre1 ? `${data.Nombre1} ${data.Apellido1}` : (data.Titulo_Investigacion || data.Nombre_Evento || "Sin_Nombre");

        entityName = `${id} - ${mainLabel}`.substring(0, 100);

        const finalFolder = getOrCreateFolder(yearFolder, entityName);

        return {
            id: finalFolder.getId(),
            url: finalFolder.getUrl()
        };

    } catch (e) {
        Logger.log("Error en createEntityFolder: " + e.toString());
        return { id: "", url: "" };
    }
}

/**
 * Sincroniza o crea la carpeta para una entidad existente buscando por ID.
 * @param {string} type - 'estudiante', 'docente', etc.
 * @param {string} id - El ID de la entidad (ej: EST0001)
 */
function syncEntityFolder(type, id) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let sheetName = getSubfolderNameByType(type);
        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) throw new Error("Hoja no encontrada para " + type);

        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        const idColIndex = 0; // Asumimos ID en la primera columna
        const folderIdCol = headers.indexOf('ID_Carpeta_Drive');
        const folderUrlCol = headers.indexOf('URL_Carpeta_Drive');

        let rowIndex = -1;
        let rowData = {};

        for (let i = 1; i < data.length; i++) {
            if (String(data[i][idColIndex]) === String(id)) {
                rowIndex = i + 1;
                headers.forEach((h, idx) => rowData[h] = data[i][idx]);
                break;
            }
        }

        if (rowIndex === -1) throw new Error("Registro no encontrado");

        // Si ya tiene carpeta, verificamos que exista, si no, creamos
        let folderId = rowData.ID_Carpeta_Drive;
        let folder;

        if (folderId) {
            try {
                folder = DriveApp.getFolderById(folderId);
                if (folder.isTrashed()) {
                    folder = null;
                }
            } catch (e) {
                folder = null;
            }
        }

        if (!folder) {
            const folderInfo = createEntityFolder(type, rowData);
            folderId = folderInfo.id;
            const folderUrl = folderInfo.url;

            // Actualizar en el Sheet
            if (folderIdCol > -1) sheet.getRange(rowIndex, folderIdCol + 1).setValue(folderId);
            if (folderUrlCol > -1) sheet.getRange(rowIndex, folderUrlCol + 1).setValue(folderUrl);

            // Registro de auditoría
            logDocumentAction({
                action: 'SYNC_FOLDER',
                type: 'folder',
                id: folderId,
                name: rowData.ID_Estudiante || rowData.ID_Docente || id,
                entityId: id,
                entityName: rowData.Nombre1 ? `${rowData.Nombre1} ${rowData.Apellido1}` : id,
                entityType: type,
                details: { message: "Carpeta creada/vinculada preventivamente" }
            });

            return { success: true, id: folderId, url: folderUrl, message: "Carpeta creada y vinculada" };
        }

        return { success: true, id: folder.getId(), url: folder.getUrl(), message: "La carpeta ya existe y está vinculada" };

    } catch (e) {
        Logger.log("Error en syncEntityFolder: " + e.toString());
        return { success: false, message: e.toString() };
    }
}

/**
 * Obtiene la lista de archivos dentro de una carpeta de Drive específica.
 * @param {string} folderId - ID de la carpeta en Drive.
 */
function getEntityFiles(folderId) {
    try {
        if (!folderId) return [];
        const folder = DriveApp.getFolderById(folderId);
        const files = folder.getFiles();
        const results = [];

        while (files.hasNext()) {
            const file = files.next();
            results.push({
                id: file.getId(),
                name: file.getName(),
                mimeType: file.getMimeType(),
                url: file.getUrl(),
                size: file.getSize(),
                lastUpdated: file.getLastUpdated().toISOString()
            });
        }
        return results;
    } catch (e) {
        Logger.log("Error en getEntityFiles: " + e.toString());
        return [];
    }
}

/**
 * Mueve una carpeta a la papelera de Drive.
 * @param {string} folderId - ID de la carpeta a eliminar.
 */
function deleteEntityFolder(folderId) {
    try {
        if (!folderId) return { success: false, message: "ID de carpeta no proporcionado" };
        const folder = DriveApp.getFolderById(folderId);
        const folderName = folder.getName();
        folder.setTrashed(true);

        // Registro de auditoría
        logDocumentAction({
            action: 'DELETE_ENTITY_FOLDER',
            type: 'folder',
            id: folderId,
            name: folderName,
            details: { trashed: true, context: "Eliminación de entidad" }
        });
        return { success: true, message: "Carpeta movida a la papelera" };
    } catch (e) {
        Logger.log("Error en deleteEntityFolder: " + e.toString());
        return { success: false, message: e.toString() };
    }
}
