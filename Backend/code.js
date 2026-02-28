// ==========================================
// NOTA: No declaramos SPREADSHEET_ID ni SHEETS aquí
// porque ya vienen del archivo Config.js
// ==========================================

// ==========================================
// 2. SERVIDOR WEB (Para que cargue tu React)
// ==========================================
function doGet() {
    return HtmlService.createHtmlOutputFromFile('index')
        .setTitle('SGD-MCS v3.0')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ==========================================
// 3. API DEL BUSCADOR (Lo que conecta con el Wizard)
// ==========================================

/**
 * Función que recibe la petición del Frontend y busca en Sheets
 * @param {string} query - Lo que escribiste en el input (ej: "Juan")
 * @param {string} context - Dónde buscar ('estudiante', 'tesis')
 */
function searchUniversal(query, context) {
    if (!query) return "[]";
    query = query.toString().toLowerCase();

    // Usamos la variable global SPREADSHEET_ID que viene de Config.js
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let results = [];

    // --- CASO 1: BUSCAR ESTUDIANTES ---
    if (context === 'estudiante') {
        // Usamos la variable global SHEETS que viene de Config.js
        const sheet = ss.getSheetByName(SHEETS.ESTUDIANTES);
        const data = getSimpleData(sheet);

        results = data.filter(r =>
            (r['Nombre1'] && r['Nombre1'].toLowerCase().includes(query)) ||
            (r['Apellido1'] && r['Apellido1'].toLowerCase().includes(query)) ||
            (r['Cedula'] && r['Cedula'].toString().includes(query))
        ).map(r => ({
            id: r['ID_Estudiante'],
            nombre: `${r['Nombre1']} ${r['Nombre2'] || ''} ${r['Apellido1']} ${r['Apellido2'] || ''}`.trim(),
            cedula: r['Cedula'],
            programa: r['Cohorte_Ingreso'] ? `Cohorte ${r['Cohorte_Ingreso']}` : 'Sin Cohorte',
            email: r['Email'],
            estado: r['Estado']
        }));
    }

    // --- CASO 2: BUSCAR TESIS ---
    else if (context === 'tesis') {
        const sheetTesis = ss.getSheetByName(SHEETS.TESIS);
        const dataTesis = getSimpleData(sheetTesis);

        results = dataTesis.filter(t =>
            (t['Titulo_Investigacion'] && t['Titulo_Investigacion'].toLowerCase().includes(query))
        ).map(t => ({
            id: t['ID_Tesis'],
            titulo: t['Titulo_Investigacion'],
            nota: t['Calificacion'],
            estudiante: t['Nombre_Estudiante'] || 'Estudiante no registrado',
            cedula: ''
        }));
    }

    return JSON.stringify(results);
}

// ==========================================
// 4. UTILIDAD DE LECTURA (Simple)
// ==========================================
function getSimpleData(sheet) {
    if (!sheet) return [];
    const data = sheet.getDataRange().getDisplayValues();
    if (data.length < 2) return [];

    const headers = data.shift();

    return data.map(row => {
        let obj = {};
        headers.forEach((h, i) => {
            // Quitamos espacios por si acaso (ej: "ID Estudiante" -> "ID_Estudiante")
            let cleanHeader = h.toString().trim().replace(/\s+/g, '_');
            obj[cleanHeader] = row[i];
        });
        return obj;
    });
}

function getStats() {
    // Llama a la lógica que acabamos de crear en Controller.js
    return getDashboardStats();
}
// --- Code.js (Agregar al final) ---

/**
 * Elimina un registro por ID de forma genérica.
 * @param {string} type - Tipo de entidad ('estudiante', 'docente', etc.)
 * @param {string} id - ID del registro a eliminar
 */
function deleteItem(type, id) {
    const ss = getDB();
    let sheetName = '';

    // Mapeo simple de tipo -> nombre de hoja
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

    // Buscar la fila por ID (Asumimos que el ID siempre está en la columna 0 o 1)
    // En nuestro esquema Setup.js, el ID suele ser la primera columna.
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(id)) {
            rowIndex = i + 1; // +1 porque los arrays son base 0 pero las filas base 1
            break;
        }
    }

    if (rowIndex > 0) {
        sheet.deleteRow(rowIndex);
        return { success: true, message: 'Eliminado correctamente' };
    } else {
        return { success: false, message: 'ID no encontrado' };
    }
}

// Assuming there's a doPost function or similar dispatcher that uses a switch(action)
// Adding a placeholder doPost if it doesn't exist, or modifying an existing one.
function doPost(e) {
    const action = e.parameter.action;
    const args = e.parameter.args ? JSON.parse(e.parameter.args) : [];

    switch (action) {
        // ... other cases ...
        case 'deleteItem':
            return deleteItem(args[0], args[1]);
        case 'createItem':
            return createItem(args[0], args[1]);
        case 'getStudents':
            return getStudents();
        case 'getTeachers':
            return getTeachers();
        case 'getExterns':
            return getExterns();
        // Drive folder sync (existing)
        case 'syncEntityFolder':
            return syncEntityFolder(args[0], args[1]);
        case 'getEntityFiles':
            return getEntityFiles(args[0]);

        // Drive File Management - CRUD Carpetas
        case 'createSubfolder':
            return createSubfolder(args[0], args[1]);
        case 'renameFolder':
            return renameFolder(args[0], args[1]);
        case 'deleteFolder':
            return deleteFolder(args[0]);
        case 'moveFolder':
            return moveFolder(args[0], args[1]);

        // Drive File Management - CRUD Archivos
        case 'uploadFile':
            return uploadFile(args[0], args[1]);
        case 'deleteFile':
            return deleteFile(args[0]);
        case 'renameFile':
            return renameFile(args[0], args[1]);
        case 'moveFile':
            return moveFile(args[0], args[1]);
        case 'downloadFile':
            return downloadFile(args[0]);

        // Drive File Management - Búsqueda y Listado
        case 'getFiles':
            return getFiles(args[0]);
        case 'searchFilesInFolder':
            return searchFilesInFolder(args[0], args[1]);
        case 'getFolderStructure':
            return getFolderStructure(args[0], args[1] || 2);
        case 'getRecentFiles':
            return getRecentFiles(args[0], args[1] || 10);

        // Drive File Management - Plantillas
        case 'getTemplates':
            return getTemplates();
        case 'copyTemplate':
            return copyTemplate(args[0], args[1], args[2]);

        // Drive File Management - Utilidades
        case 'getItemInfo':
            return getItemInfo(args[0]);
        case 'createDefaultSubfolders':
            return createDefaultSubfolders(args[0], args[1]);
        case 'getSystemRootFolderId':
            return getSystemRootFolderId();

        default:
            return { success: false, message: 'Función no encontrada: ' + action };
    }
}

// --- src/backend/Code.js ---

/**
 * Crea un nuevo registro de forma dinámica.
 * Mapea las claves del objeto JSON con los encabezados de la hoja.
 */
function createItem(type, data) {
    try {
        const ss = getDB();
        let sheetName = '';

        // Selector de hoja
        switch (type) {
            case 'estudiante': sheetName = SHEETS.ESTUDIANTES; break;
            case 'docente': sheetName = SHEETS.DOCENTES; break;
            case 'externo': sheetName = SHEETS.EXTERNOS; break;
            case 'evento': sheetName = SHEETS.EVENTOS; break;
            case 'tesis': sheetName = SHEETS.TESIS; break;
            default: return { success: false, message: 'Tipo de entidad no válido' };
        }

        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) return { success: false, message: `Hoja ${sheetName} no encontrada` };

        // 1. GENERACIÓN DE ID AUTOMÁTICO (Si no viene del frontend)
        let idField = "";
        let prefix = "";
        let counter = "";

        switch (type) {
            case 'estudiante': idField = 'ID_Estudiante'; prefix = 'EST'; counter = 'Siguiente_ID_Estudiante'; break;
            case 'docente': idField = 'ID_Docente'; prefix = 'DOC'; counter = 'Siguiente_ID_Docente'; break;
            case 'externo': idField = 'ID_Externo'; prefix = 'EXT'; counter = 'Siguiente_ID_Externo'; break;
            case 'evento': idField = 'ID_Evento'; prefix = 'EVT'; counter = 'Siguiente_ID_Evento'; break;
            case 'tesis': idField = 'ID_Tesis'; prefix = 'TES'; counter = 'Siguiente_ID_Tesis'; break;
        }

        if (idField && (!data[idField] || data[idField] === "")) {
            data[idField] = generateUniqueId(prefix, counter);
        }

        // 2. NORMALIZACIÓN DE DATOS (Nombres, correos, etc.)
        data = normalizeData(type, data);

        // 3. CREACIÓN DE CARPETA EN DRIVE
        const folderInfo = createEntityFolder(type, data);
        data.ID_Carpeta_Drive = folderInfo.id;
        data.URL_Carpeta_Drive = folderInfo.url;

        // 1. Obtener encabezados
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

        // 2. Preparar la fila ordenada
        // Recorremos cada columna del Excel y buscamos si existe ese dato en el objeto 'data'
        const newRow = headers.map(header => {
            // Verificamos si el dato existe en el objeto que llega del frontend
            if (data.hasOwnProperty(header)) {
                return data[header];
            }
            // Casos especiales para campos automáticos con formato elegante
            if (header === 'Fecha_Registro' || header === 'Ultima_Actualizacion') {
                return Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm:ss");
            }
            // --- NUEVO: INTEGRACIÓN DRIVE ---
            if (header === 'ID_Carpeta_Drive') return data.ID_Carpeta_Drive || "";
            if (header === 'URL_Carpeta_Drive') return data.URL_Carpeta_Drive || "";

            return ''; // Si no viene el dato, dejamos la celda vacía
        });

        // 3. Guardar
        sheet.appendRow(newRow);

        return {
            success: true,
            message: 'Creado correctamente con carpeta en Drive',
            id: data[idField] || 'ID-AUTO',
            folderUrl: data.URL_Carpeta_Drive
        };

    } catch (error) {
        Logger.log("Error en createItem: " + error.toString());
        return { success: false, message: "Error en servidor: " + error.toString() };
    }
}

/**
 * Obtiene todos los estudiantes y los convierte a objetos JSON.
 */
function getStudents() {
    try {
        const ss = getDB();
        const sheet = ss.getSheetByName(SHEETS.ESTUDIANTES); // Asegúrate que en Config.js SHEETS.ESTUDIANTES = "Estudiantes"

        if (!sheet) {
            return JSON.stringify([]); // Si no existe la hoja, devuelve array vacío
        }

        const data = sheet.getDataRange().getValues();

        // Si solo hay cabeceras o está vacía
        if (data.length <= 1) {
            return JSON.stringify([]);
        }

        const headers = data[0]; // La primera fila son las claves (Nombre1, Apellido1...)
        const rows = data.slice(1); // El resto son los datos

        // Mapeamos: Convertimos cada fila en un objeto
        const students = rows.map(row => {
            let studentObj = {};
            headers.forEach((header, index) => {
                // Asignamos clave: valor
                studentObj[header] = row[index];
            });
            return studentObj;
        });

        // Devolvemos como texto JSON
        return JSON.stringify(students);

    } catch (error) {
        Logger.log("Error en getStudents: " + error.toString());
        return JSON.stringify([]);
    }
}

/**
 * Obtiene todos los docentes y los convierte a objetos JSON.
 */
function getTeachers() {
    try {
        const ss = getDB();
        const sheet = ss.getSheetByName(SHEETS.DOCENTES);

        if (!sheet) {
            return JSON.stringify([]);
        }

        const data = sheet.getDataRange().getValues();

        if (data.length <= 1) {
            return JSON.stringify([]);
        }

        const headers = data[0];
        const rows = data.slice(1);

        const teachers = rows.map(row => {
            let teacherObj = {};
            headers.forEach((header, index) => {
                teacherObj[header] = row[index];
            });
            return teacherObj;
        });

        return JSON.stringify(teachers);
    } catch (error) {
        Logger.log("Error en getTeachers: " + error.toString());
        return JSON.stringify([]);
    }
}

/**
 * Obtiene todos los participantes externos.
 */
function getExterns() {
    try {
        const ss = getDB();
        const sheet = ss.getSheetByName(SHEETS.EXTERNOS);
        if (!sheet) return JSON.stringify([]);
        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) return JSON.stringify([]);

        const headers = data[0];
        const rows = data.slice(1);

        const externs = rows.map(row => {
            let obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });

        return JSON.stringify(externs);
    } catch (error) {
        Logger.log("Error en getExterns: " + error.toString());
        return JSON.stringify([]);
    }
}
/**
 * Actualiza un registro existente en la hoja de cálculo.
 * @param {string} type - Tipo de entidad ('estudiante', 'docente', etc.)
 * @param {string} id - ID del registro a actualizar
 * @param {Object} data - Objeto con los nuevos datos
 */
function updateItem(type, id, data) {
    const ss = getDB();
    let sheetName = '';

    // Selector de hoja según el tipo
    switch (type) {
        case 'estudiante': sheetName = SHEETS.ESTUDIANTES; break;
        case 'docente': sheetName = SHEETS.DOCENTES; break;
        case 'externo': sheetName = SHEETS.EXTERNOS; break;
        case 'evento': sheetName = SHEETS.EVENTOS; break;
        case 'tesis': sheetName = SHEETS.TESIS; break;
        default: return { success: false, message: 'Tipo de entidad no válido para actualizar' };
    }

    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, message: 'Hoja no encontrada' };

    const values = sheet.getDataRange().getValues();
    const headers = values[0]; // La primera fila son los encabezados

    // 1. Buscar el índice de la fila por ID (Asumiendo que el ID está en la primera columna, índice 0)
    let rowIndex = -1;
    // Empezamos en i=1 para saltar encabezados
    for (let i = 1; i < values.length; i++) {
        // Convertimos a String para asegurar comparación exacta
        if (String(values[i][0]) === String(id)) {
            rowIndex = i + 1; // +1 porque Sheet usa índices base-1 (Fila 1, Fila 2...)
            break;
        }
    }

    if (rowIndex === -1) {
        return { success: false, message: 'ID no encontrado en la base de datos' };
    }

    // 2. Actualizar solo las columnas que vienen en 'data'
    headers.forEach((header, colIndex) => {
        // Si el objeto data tiene una propiedad con el nombre del encabezado
        if (data.hasOwnProperty(header)) {
            let value = data[header];
            // Si es una fecha especial, la formateamos
            if (header === 'Ultima_Actualizacion') {
                value = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm:ss");
            }
            // rowIndex es la fila, colIndex + 1 es la columna (base-1)
            // rowIndex es la fila, colIndex + 1 es la columna (base-1)
            sheet.getRange(rowIndex, colIndex + 1).setValue(value);
        }
    });

    // --- NUEVO: Sincronización automática de Drive al actualizar (opcional o si falta) ---
    // Si el registro no tiene carpeta, intentamos crearla ahora que se está actualizando
    const folderIdCol = headers.indexOf('ID_Carpeta_Drive');
    const folderId = folderIdCol > -1 ? sheet.getRange(rowIndex, folderIdCol + 1).getValue() : null;

    if (!folderId || folderId === "") {
        try {
            const syncResult = syncEntityFolder(type, id);
            if (!syncResult.success) {
                Logger.log("Sincronización de Drive falló en updateItem: " + syncResult.message);
            }
        } catch (e) {
            Logger.log("Excepción en syncEntityFolder durante updateItem: " + e.toString());
        }
    }

    return { success: true, message: 'Registro actualizado correctamente' };
}

/**
 * Actualización Masiva (Bulk Update)
 * Permite cambiar un campo específico para múltiples registros a la vez.
 * @param {string} type - 'estudiante', 'docente', etc.
 * @param {Array} ids - Lista de IDs a modificar
 * @param {Object} updates - Objeto con los campos a cambiar (ej: { Estado: 'Egresado' })
 */
function bulkUpdateItems(type, ids, updates) {
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

    // 1. Crear un mapa de columnas a actualizar
    // Ejemplo: { 'Estado': 5, 'Cohorte': 8 } (Nombre Columna -> Número Columna)
    const colMap = {};
    headers.forEach((h, i) => {
        if (updates.hasOwnProperty(h)) {
            colMap[h] = i + 1; // Guardamos el índice base-1
        }
    });

    // 2. Recorrer y actualizar
    let count = 0;
    // Recorremos todas las filas de datos
    for (let i = 1; i < data.length; i++) {
        const currentId = String(data[i][0]);

        // Si el ID de esta fila está en la lista de IDs seleccionados
        if (ids.includes(currentId)) {
            // Actualizamos cada campo solicitado
            for (const [key, colIndex] of Object.entries(colMap)) {
                sheet.getRange(i + 1, colIndex).setValue(updates[key]);
            }
            count++;
        }
    }

    return { success: true, message: `Se actualizaron ${count} registros correctamente.` };
}

/**
 * Eliminación Masiva (Bulk Delete)
 */
function bulkDeleteItems(type, ids) {
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

    // Eliminar de abajo hacia arriba para no alterar los índices
    let count = 0;
    for (let i = data.length - 1; i >= 1; i--) {
        const currentId = String(data[i][0]);
        if (ids.includes(currentId)) {
            sheet.deleteRow(i + 1);
            count++;
        }
    }

    return { success: true, message: `Se eliminaron ${count} registros.` };
}
