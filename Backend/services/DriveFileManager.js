/**
 * ============================================================================
 * 📁 GESTOR AVANZADO DE ARCHIVOS DRIVE (DriveFileManager.js)
 * Sistema completo de CRUD para archivos y carpetas
 * ============================================================================
 */

// ==========================================
// CRUD DE CARPETAS
// ==========================================

/**
 * Crea una subcarpeta dentro de una carpeta padre
 * @param {string} parentFolderId - ID de la carpeta padre
 * @param {string} folderName - Nombre de la nueva carpeta
 * @returns {Object} {success, id, url, message}
 */
function createSubfolder(parentFolderId, folderName) {
    try {
        if (!parentFolderId || !folderName) {
            return { success: false, message: 'Parámetros inválidos' };
        }

        const parentFolder = DriveApp.getFolderById(parentFolderId);

        // Verificar si ya existe una carpeta con ese nombre
        const existingFolders = parentFolder.getFoldersByName(folderName);
        if (existingFolders.hasNext()) {
            const existing = existingFolders.next();
            return {
                success: true,
                id: existing.getId(),
                url: existing.getUrl(),
                message: 'La carpeta ya existe',
                alreadyExists: true
            };
        }

        const newFolder = parentFolder.createFolder(folderName);

        // Registro de auditoría
        logDocumentAction({
            action: 'CREATE_FOLDER',
            type: 'folder',
            id: newFolder.getId(),
            name: folderName,
            details: { parentId: parentFolderId }
        });

        return {
            success: true,
            id: newFolder.getId(),
            url: newFolder.getUrl(),
            message: 'Carpeta creada exitosamente'
        };
    } catch (e) {
        Logger.log('Error en createSubfolder: ' + e.toString());
        return { success: false, message: e.toString() };
    }
}

/**
 * Renombra una carpeta
 * @param {string} folderId - ID de la carpeta
 * @param {string} newName - Nuevo nombre
 * @returns {Object} {success, message}
 */
function renameFolder(folderId, newName) {
    try {
        const folder = DriveApp.getFolderById(folderId);
        const oldName = folder.getName();
        folder.setName(newName);

        // Registro de auditoría
        logDocumentAction({
            action: 'RENAME_FOLDER',
            type: 'folder',
            id: folderId,
            name: newName,
            details: { oldName: oldName }
        });

        return {
            success: true,
            message: 'Carpeta renombrada exitosamente',
            newName: newName
        };
    } catch (e) {
        Logger.log('Error en renameFolder: ' + e.toString());
        return { success: false, message: e.toString() };
    }
}

/**
 * Elimina una carpeta (mueve a papelera)
 * @param {string} folderId - ID de la carpeta
 * @returns {Object} {success, message}
 */
function deleteFolder(folderId) {
    try {
        const folder = DriveApp.getFolderById(folderId);
        const folderName = folder.getName();
        folder.setTrashed(true);

        // Registro de auditoría
        logDocumentAction({
            action: 'DELETE_FOLDER',
            type: 'folder',
            id: folderId,
            name: folderName,
            details: { trashed: true }
        });

        return {
            success: true,
            message: 'Carpeta eliminada exitosamente'
        };
    } catch (e) {
        Logger.log('Error en deleteFolder: ' + e.toString());
        return { success: false, message: e.toString() };
    }
}

/**
 * Mueve una carpeta a otra ubicación
 * @param {string} folderId - ID de la carpeta a mover
 * @param {string} newParentId - ID de la nueva carpeta padre
 * @returns {Object} {success, message}
 */
function moveFolder(folderId, newParentId) {
    try {
        const folder = DriveApp.getFolderById(folderId);
        const newParent = DriveApp.getFolderById(newParentId);

        // Remover de padres actuales
        const parents = folder.getParents();
        while (parents.hasNext()) {
            folder.removeFrom(parents.next());
        }

        // Agregar al nuevo padre
        newParent.addFolder(folder);

        return {
            success: true,
            message: 'Carpeta movida exitosamente'
        };
    } catch (e) {
        Logger.log('Error en moveFolder: ' + e.toString());
        return { success: false, message: e.toString() };
    }
}

// ==========================================
// CRUD DE ARCHIVOS
// ==========================================

/**
 * Sube un archivo a una carpeta
 * @param {string} folderId - ID de la carpeta destino
 * @param {Object} fileData - Datos del archivo {name, content, mimeType}
 * @returns {Object} {success, id, url, message}
 */
function uploadFile(folderId, fileData) {
    try {
        if (!folderId || !fileData || !fileData.name || !fileData.content) {
            return { success: false, message: 'Datos de archivo inválidos' };
        }

        const folder = DriveApp.getFolderById(folderId);

        // Decodificar contenido Base64
        const contentType = fileData.mimeType || 'application/octet-stream';
        const bytes = Utilities.base64Decode(fileData.content);
        const blob = Utilities.newBlob(bytes, contentType, fileData.name);

        // Crear archivo
        const file = folder.createFile(blob);

        // Registro de auditoría
        logDocumentAction({
            action: 'UPLOAD_FILE',
            type: 'file',
            id: file.getId(),
            name: file.getName(),
            entityId: fileData.entityId,
            entityName: fileData.entityName,
            entityType: fileData.entityType,
            details: { folderId: folderId, mimeType: contentType }
        });

        return {
            success: true,
            id: file.getId(),
            url: file.getUrl(),
            name: file.getName(),
            size: file.getSize(),
            message: 'Archivo subido exitosamente'
        };
    } catch (e) {
        Logger.log('Error en uploadFile: ' + e.toString());
        return { success: false, message: e.toString() };
    }
}

/**
 * Lista todos los archivos (no carpetas) dentro de una carpeta de Drive.
 * Llamado desde el frontend como: api.drive.getFiles(folderId)
 * @param {string} folderId - ID de la carpeta de Drive
 * @returns {string} JSON con array de archivos [{id, name, mimeType, url, size, lastUpdated}]
 */
function getFiles(folderId) {
    try {
        if (!folderId) return JSON.stringify([]);

        const folder = DriveApp.getFolderById(folderId);
        const filesIter = folder.getFiles();
        const result = [];

        while (filesIter.hasNext()) {
            const file = filesIter.next();
            result.push({
                id: file.getId(),
                name: file.getName(),
                mimeType: file.getMimeType(),
                url: file.getUrl(),
                size: file.getSize(),
                lastUpdated: file.getLastUpdated().toISOString()
            });
        }

        // Ordenar por fecha desc (más reciente primero)
        result.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

        return JSON.stringify(result);
    } catch (e) {
        Logger.log('Error en getFiles: ' + e.toString());
        return JSON.stringify([]);
    }
}

/**
 * Elimina un archivo (mueve a papelera)
 * @param {string} fileId - ID del archivo
 * @returns {Object} {success, message}
 */
function deleteFile(fileId) {
    try {
        const file = DriveApp.getFileById(fileId);
        const fileName = file.getName();
        file.setTrashed(true);

        // Registro de auditoría
        logDocumentAction({
            action: 'DELETE_FILE',
            type: 'file',
            id: fileId,
            name: fileName,
            details: { trashed: true }
        });

        return {
            success: true,
            message: 'Archivo eliminado exitosamente'
        };
    } catch (e) {
        Logger.log('Error en deleteFile: ' + e.toString());
        return { success: false, message: e.toString() };
    }
}

/**
 * Renombra un archivo
 * @param {string} fileId - ID del archivo
 * @param {string} newName - Nuevo nombre
 * @returns {Object} {success, message}
 */
function renameFile(fileId, newName) {
    try {
        const file = DriveApp.getFileById(fileId);
        const oldName = file.getName();
        file.setName(newName);

        // Registro de auditoría
        logDocumentAction({
            action: 'RENAME_FILE',
            type: 'file',
            id: fileId,
            name: newName,
            details: { oldName: oldName }
        });

        return {
            success: true,
            message: 'Archivo renombrado exitosamente',
            newName: newName
        };
    } catch (e) {
        Logger.log('Error en renameFile: ' + e.toString());
        return { success: false, message: e.toString() };
    }
}

/**
 * Mueve un archivo a otra carpeta
 * @param {string} fileId - ID del archivo
 * @param {string} newFolderId - ID de la nueva carpeta
 * @returns {Object} {success, message}
 */
function moveFile(fileId, newFolderId) {
    try {
        const file = DriveApp.getFileById(fileId);
        const newFolder = DriveApp.getFolderById(newFolderId);

        // Remover de carpetas actuales
        const parents = file.getParents();
        while (parents.hasNext()) {
            file.removeFrom(parents.next());
        }

        // Agregar a nueva carpeta
        newFolder.addFile(file);

        return {
            success: true,
            message: 'Archivo movido exitosamente'
        };
    } catch (e) {
        Logger.log('Error en moveFile: ' + e.toString());
        return { success: false, message: e.toString() };
    }
}

/**
 * Descarga un archivo (devuelve contenido en Base64)
 * @param {string} fileId - ID del archivo
 * @returns {Object} {success, content, mimeType, name, message}
 */
function downloadFile(fileId) {
    try {
        const file = DriveApp.getFileById(fileId);
        const blob = file.getBlob();
        const content = Utilities.base64Encode(blob.getBytes());

        return {
            success: true,
            content: content,
            mimeType: file.getMimeType(),
            name: file.getName(),
            size: file.getSize(),
            message: 'Archivo descargado exitosamente'
        };
    } catch (e) {
        Logger.log('Error en downloadFile: ' + e.toString());
        return { success: false, message: e.toString() };
    }
}

/**
 * Obtiene todos los archivos de una carpeta
 * @param {string} folderId - ID de la carpeta
 * @returns {Array} Lista de archivos
 */
function getFiles(folderId) {
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

        Logger.log(`getFiles: Encontrados ${results.length} archivos en carpeta ${folderId}`);
        return results;
    } catch (e) {
        Logger.log('Error en getFiles: ' + e.toString());
        return [];
    }
}

/**
 * Busca archivos en una carpeta por nombre
 * @param {string} folderId - ID de la carpeta
 * @param {string} query - Texto a buscar
 * @returns {Array} Lista de archivos encontrados
 */
function searchFilesInFolder(folderId, query) {
    try {
        if (!folderId || !query) return [];

        const folder = DriveApp.getFolderById(folderId);
        const results = [];

        // 1. Buscar Archivos
        const files = folder.searchFiles(`title contains "${query}"`);
        while (files.hasNext()) {
            const file = files.next();
            results.push({
                id: file.getId(),
                name: file.getName(),
                mimeType: file.getMimeType(),
                url: file.getUrl(),
                size: file.getSize(),
                lastUpdated: file.getLastUpdated().toISOString(),
                type: 'file'
            });
        }

        // 2. Buscar Carpetas
        // En GAS para carpetas usamos DriveApp con query de parent
        const folderQuery = `'${folderId}' in parents and title contains '${query}' and mimeType = 'application/vnd.google-apps.folder'`;
        const folderIter = DriveApp.searchFolders(folderQuery);
        while (folderIter.hasNext()) {
            const folderMatch = folderIter.next();
            results.push({
                id: folderMatch.getId(),
                name: folderMatch.getName(),
                mimeType: 'application/vnd.google-apps.folder',
                url: folderMatch.getUrl(),
                size: 0,
                lastUpdated: folderMatch.getLastUpdated().toISOString(),
                type: 'folder'
            });
        }

        return results;
    } catch (e) {
        Logger.log('Error en searchFilesInFolder: ' + e.toString());
        return [];
    }
}

/**
 * Obtiene la estructura completa de carpetas (árbol)
 * @param {string} folderId - ID de la carpeta raíz
 * @param {number} depth - Profundidad máxima (default: 2)
 * @returns {Object} Estructura de carpetas
 */
function getFolderStructure(folderId, depth = 2) {
    try {
        if (depth < 0) return null;

        const folder = DriveApp.getFolderById(folderId);
        const structure = {
            id: folder.getId(),
            name: folder.getName(),
            url: folder.getUrl(),
            type: 'folder',
            children: []
        };

        if (depth > 0) {
            const subfolders = folder.getFolders();
            while (subfolders.hasNext()) {
                const subfolder = subfolders.next();
                const child = getFolderStructure(subfolder.getId(), depth - 1);
                if (child) structure.children.push(child);
            }
        }

        return structure;
    } catch (e) {
        Logger.log('Error en getFolderStructure: ' + e.toString());
        return null;
    }
}

/**
 * Obtiene archivos recientes de un tipo de entidad
 * @param {string} entityType - Tipo de entidad
 * @param {number} limit - Número máximo de archivos
 * @returns {Array} Lista de archivos recientes
 */
function getRecentFiles(entityType, limit = 10) {
    try {
        const rootFolder = getSystemRootFolder();
        const typeFolderName = getSubfolderNameByType(entityType);
        const typeFolder = getOrCreateFolder(rootFolder, typeFolderName);

        const files = typeFolder.searchFiles('');
        const results = [];
        let count = 0;

        while (files.hasNext() && count < limit) {
            const file = files.next();
            results.push({
                id: file.getId(),
                name: file.getName(),
                mimeType: file.getMimeType(),
                url: file.getUrl(),
                size: file.getSize(),
                lastUpdated: file.getLastUpdated().toISOString()
            });
            count++;
        }

        // Ordenar por fecha (más recientes primero)
        results.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

        return results;
    } catch (e) {
        Logger.log('Error en getRecentFiles: ' + e.toString());
        return [];
    }
}

// ==========================================
// SISTEMA DE PLANTILLAS
// ==========================================

/**
 * Obtiene la carpeta de plantillas (la crea si no existe)
 * @returns {Folder} Carpeta de plantillas
 */
function getTemplatesFolder() {
    const rootFolder = getSystemRootFolder();
    return getOrCreateFolder(rootFolder, '_Plantillas');
}

/**
 * Lista todas las plantillas disponibles
 * @returns {Array} Lista de plantillas
 */
function getTemplates() {
    try {
        const templatesFolder = getTemplatesFolder();
        const files = templatesFolder.getFiles();
        const templates = [];

        while (files.hasNext()) {
            const file = files.next();
            templates.push({
                id: file.getId(),
                name: file.getName(),
                mimeType: file.getMimeType(),
                url: file.getUrl(),
                size: file.getSize(),
                description: file.getDescription() || 'Sin descripción'
            });
        }

        return templates;
    } catch (e) {
        Logger.log('Error en getTemplates: ' + e.toString());
        return [];
    }
}

/**
 * Copia una plantilla a una carpeta destino
 * @param {string} templateId - ID de la plantilla
 * @param {string} destinationFolderId - ID de la carpeta destino
 * @param {string} newName - Nombre del nuevo archivo
 * @returns {Object} {success, id, url, message}
 */
function copyTemplate(templateId, destinationFolderId, newName) {
    try {
        const template = DriveApp.getFileById(templateId);
        const destinationFolder = DriveApp.getFolderById(destinationFolderId);

        const copy = template.makeCopy(newName, destinationFolder);

        return {
            success: true,
            id: copy.getId(),
            url: copy.getUrl(),
            name: copy.getName(),
            message: 'Plantilla copiada exitosamente'
        };
    } catch (e) {
        Logger.log('Error en copyTemplate: ' + e.toString());
        return { success: false, message: e.toString() };
    }
}

// ==========================================
// UTILIDADES
// ==========================================

/**
 * Obtiene información detallada de un archivo o carpeta
 * @param {string} itemId - ID del archivo o carpeta
 * @returns {Object} Información del item
 */
function getItemInfo(itemId) {
    try {
        // Intentar como archivo primero
        try {
            const file = DriveApp.getFileById(itemId);
            return {
                success: true,
                type: 'file',
                id: file.getId(),
                name: file.getName(),
                mimeType: file.getMimeType(),
                url: file.getUrl(),
                size: file.getSize(),
                created: file.getDateCreated().toISOString(),
                lastUpdated: file.getLastUpdated().toISOString(),
                owner: file.getOwner().getEmail()
            };
        } catch (e) {
            // Si falla, intentar como carpeta
            const folder = DriveApp.getFolderById(itemId);
            return {
                success: true,
                type: 'folder',
                id: folder.getId(),
                name: folder.getName(),
                url: folder.getUrl(),
                created: folder.getDateCreated().toISOString(),
                lastUpdated: folder.getLastUpdated().toISOString(),
                owner: folder.getOwner().getEmail()
            };
        }
    } catch (e) {
        Logger.log('Error en getItemInfo: ' + e.toString());
        return { success: false, message: e.toString() };
    }
}

/**
 * Crea subcarpetas predefinidas para una entidad
 * @param {string} parentFolderId - ID de la carpeta padre
 * @param {string} entityType - Tipo de entidad
 * @returns {Object} {success, folders, message}
 */
function createDefaultSubfolders(parentFolderId, entityType) {
    try {
        const subfolderTemplates = {
            'estudiante': ['Documentos_Personales', 'Academico', 'Tesis'],
            'docente': ['CV_Documentos', 'Publicaciones', 'Proyectos'],
            'tesis': ['Propuesta', 'Avances', 'Final', 'Anexos'],
            'evento': ['Convocatoria', 'Evidencias', 'Certificados'],
            'externo': ['Documentos']
        };

        const templates = subfolderTemplates[entityType] || [];
        const createdFolders = [];

        for (const folderName of templates) {
            const result = createSubfolder(parentFolderId, folderName);
            if (result.success) {
                createdFolders.push({
                    name: folderName,
                    id: result.id,
                    url: result.url
                });
            }
        }

        return {
            success: true,
            folders: createdFolders,
            message: `${createdFolders.length} subcarpetas creadas`
        };
    } catch (e) {
        Logger.log('Error en createDefaultSubfolders: ' + e.toString());
        return { success: false, message: e.toString() };
    }
}

/**
 * Realiza una búsqueda recursiva en todo el repositorio desde la raíz del sistema.
 * @param {string} query - Texto a buscar.
 * @returns {Array} Resultados combinados de archivos y carpetas.
 */
function searchUniversalRepository(query) {
    try {
        if (!query) return [];
        const rootFolder = getSystemRootFolder();
        const results = [];
        const limit = 50; // Límite de seguridad

        searchRecursiveHelper(rootFolder, query, results, limit, 0);

        return results;
    } catch (e) {
        Logger.log('Error en searchUniversalRepository: ' + e.toString());
        return [];
    }
}

/**
 * Helper recursivo para búsqueda profunda en Drive.
 */
function searchRecursiveHelper(folder, query, results, limit, depth) {
    if (results.length >= limit || depth > 4) return; // Límites de seguridad

    // 1. Buscar Archivos en esta carpeta
    const files = folder.searchFiles(`title contains "${query}"`);
    while (files.hasNext() && results.length < limit) {
        const file = files.next();
        results.push({
            id: file.getId(),
            name: file.getName(),
            mimeType: file.getMimeType(),
            url: file.getUrl(),
            size: file.getSize(),
            lastUpdated: file.getLastUpdated().toISOString(),
            type: 'file'
        });
    }

    // 2. Buscar Subcarpetas y recurrir
    const subfolders = folder.getFolders();
    while (subfolders.hasNext() && results.length < limit) {
        const subfolder = subfolders.next();

        // Si el nombre de la carpeta coincide, agregarla a resultados
        if (subfolder.getName().toLowerCase().includes(query.toLowerCase())) {
            results.push({
                id: subfolder.getId(),
                name: subfolder.getName(),
                mimeType: 'application/vnd.google-apps.folder',
                url: subfolder.getUrl(),
                size: 0,
                lastUpdated: subfolder.getLastUpdated().toISOString(),
                type: 'folder'
            });
        }

        // Continuar buscando en hijos
        searchRecursiveHelper(subfolder, query, results, limit, depth + 1);
    }
}
