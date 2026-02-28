import { MOCK_DASHBOARD, MOCK_STUDENTS, MOCK_TEACHERS, MOCK_THESIS, MOCK_EXTERNALS, MOCK_EVENTS, MOCK_PARTICIPATIONS, MOCK_DOCUMENTS } from './mockData';

// Detectamos si estamos en desarrollo (localhost)
const IS_DEV = import.meta.env.DEV;

/**
 * Helper para ejecutar funciones del Backend (Google Apps Script).
 */
const runGoogleFunction = (functionName, args = []) => {
    return new Promise((resolve, reject) => {
        // --- MODO DESARROLLO (SIMULACIÓN) ---
        if (IS_DEV) {
            console.log(`📡 [DEV] Llamando a GAS: ${functionName}`, args);

            setTimeout(() => {
                switch (functionName) {
                    case 'getStats':
                        resolve(MOCK_DASHBOARD);
                        break;
                    case 'getStudents':
                        resolve(MOCK_STUDENTS);
                        break;
                    case 'getTeachers':
                        resolve(MOCK_TEACHERS);
                        break;
                    case 'getThesis':
                        resolve(MOCK_THESIS);
                        break;
                    case 'getExterns':
                        resolve(MOCK_EXTERNALS);
                        break;
                    case 'getEvents':
                        resolve(MOCK_EVENTS);
                        break;
                    case 'getParticipations':
                        resolve(MOCK_PARTICIPATIONS);
                        break;
                    case 'getDocuments':
                        resolve(MOCK_DOCUMENTS);
                        break;
                    case 'searchUniversal':
                        resolve(MOCK_STUDENTS);
                        break;
                    case 'createItem':
                        resolve({
                            success: true,
                            id: 'NEW-DEV-ID',
                            message: 'Creado en modo DEV con carpeta simulada',
                            folderUrl: 'https://drive.google.com/drive/folders/1mock-folder-id'
                        });
                        break;
                    case 'updateItem':
                        resolve({
                            success: true,
                            message: args[2] && args[2]._syncDrive ? 'Carpeta sincronizada en modo DEV' : 'Actualizado en modo DEV',
                            folderUrl: 'https://drive.google.com/drive/folders/1mock-folder-id'
                        });
                        break;
                    case 'bulkUpdateItems':
                        resolve({ success: true, message: 'Bulk update exitoso en DEV' });
                        break;
                    case 'deleteItem':
                        resolve({ success: true, message: 'Eliminado en modo DEV' });
                        break;
                    case 'getEntityFiles':
                        resolve([
                            { id: '1', name: 'Documento_Prueba.pdf', mimeType: 'application/pdf', url: '#', size: 1024, lastUpdated: new Date().toISOString() },
                            { id: '2', name: 'Foto_Evento.jpg', mimeType: 'image/jpeg', url: '#', size: 2048, lastUpdated: new Date().toISOString() }
                        ]);
                        break;

                    // Drive File Management Mocks
                    case 'uploadFile':
                        resolve({ success: true, id: 'file-mock-id', url: '#', name: args[1]?.name || 'archivo.pdf', size: 1024, message: 'Archivo subido (DEV)' });
                        break;
                    case 'deleteFile':
                    case 'deleteFolder':
                        resolve({ success: true, message: 'Eliminado (DEV)' });
                        break;
                    case 'renameFile':
                    case 'renameFolder':
                        resolve({ success: true, message: 'Renombrado (DEV)', newName: args[1] });
                        break;
                    case 'moveFile':
                    case 'moveFolder':
                        resolve({ success: true, message: 'Movido (DEV)' });
                        break;
                    case 'createSubfolder':
                        resolve({ success: true, id: 'folder-mock-id', url: '#', message: 'Carpeta creada (DEV)' });
                        break;
                    case 'downloadFile':
                        resolve({ success: true, content: 'base64mock', mimeType: 'application/pdf', name: 'archivo.pdf', size: 1024, message: 'Descargado (DEV)' });
                        break;
                    case 'searchFilesInFolder':
                        resolve([{ id: '1', name: 'Resultado_' + args[1] + '.pdf', mimeType: 'application/pdf', url: '#', size: 512, lastUpdated: new Date().toISOString() }]);
                        break;
                    case 'getFolderStructure':
                        resolve({ id: args[0], name: 'Carpeta Raiz', url: '#', type: 'folder', children: [{ id: 'sub1', name: 'Subcarpeta 1', url: '#', type: 'folder', children: [] }] });
                        break;
                    case 'getRecentFiles':
                        resolve([{ id: '1', name: 'Reciente.pdf', mimeType: 'application/pdf', url: '#', size: 2048, lastUpdated: new Date().toISOString() }]);
                        break;
                    case 'getTemplates':
                        resolve([{ id: 'tpl1', name: 'Certificado_Evento.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', url: '#', size: 15360, description: 'Plantilla para certificados' }]);
                        break;
                    case 'copyTemplate':
                        resolve({ success: true, id: 'copy-mock-id', url: '#', name: args[2], message: 'Plantilla copiada (DEV)' });
                        break;
                    case 'getItemInfo':
                        resolve({ success: true, type: 'file', id: args[0], name: 'Item Mock', mimeType: 'application/pdf', url: '#', size: 1024, created: new Date().toISOString(), lastUpdated: new Date().toISOString(), owner: 'dev@example.com' });
                        break;
                    case 'createDefaultSubfolders':
                        resolve({ success: true, folders: [{ name: 'Documentos', id: 'f1', url: '#' }, { name: 'Academico', id: 'f2', url: '#' }], message: '2 subcarpetas creadas (DEV)' });
                        break;
                    case 'getSystemRootFolderId':
                        resolve({ success: true, id: 'mock-root-folder-id', name: 'SGD_DATABASE_ROOT', url: '#' });
                        break;
                    default:
                        resolve([]);
                }
            }, 800);
            return;
        }

        // --- MODO PRODUCCIÓN (REAL) ---
        if (!window.google || !window.google.script) {
            reject('Google Script Environment not found');
            return;
        }

        window.google.script.run
            .withSuccessHandler((response) => {
                try {
                    const data = typeof response === 'string' ? JSON.parse(response) : response;
                    resolve(data);
                } catch (error) {
                    resolve(response);
                }
            })
            .withFailureHandler((error) => {
                console.error(`❌ Error en Backend [${functionName}]:`, error);
                reject(error);
            })
        [functionName](...args);
    });
};

// --- CACHÉ SIMPLE PARA DRIVE ---
const driveCache = new Map();

// Función wrapper con caché
const cachedDriveCall = async (key, fetcher, ttl = 60000) => {
    const cached = driveCache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp < ttl)) {
        console.log(`[Cache] Hit for ${key}`);
        return cached.data;
    }

    console.log(`[Cache] Miss for ${key}`);
    const data = await fetcher();

    // Solo cachear si es un resultado válido (array o objeto con id)
    if (data && (Array.isArray(data) || data.id)) {
        driveCache.set(key, { timestamp: now, data });
    }

    return data;
};

// Limpiar caché cuando hay cambios
const invalidateDriveCache = () => {
    console.log('[Cache] Invalidating Drive Cache');
    driveCache.clear();
};


export const api = {
    // Dashboard
    getStats: () => runGoogleFunction('getStats'),

    // Buscador
    documents: {
        search: (query, context) => runGoogleFunction('searchUniversal', [query, context]),
    },

    // Gestión de Estudiantes
    students: {
        list: () => runGoogleFunction('getStudents'),
        create: (data) => runGoogleFunction('createItem', ['estudiante', data]),
        update: (id, data) => runGoogleFunction('updateItem', ['estudiante', id, data]),
        bulkUpdate: (ids, updates) => runGoogleFunction('bulkUpdateItems', ['estudiante', ids, updates]),
        bulkDelete: (ids) => runGoogleFunction('bulkDeleteItems', ['estudiante', ids]),
        delete: (id) => runGoogleFunction('deleteItem', ['estudiante', id]),
    },

    // Gestión de Docentes
    teachers: {
        list: () => runGoogleFunction('getTeachers'),
        create: (data) => runGoogleFunction('createItem', ['docente', data]),
        update: (id, data) => runGoogleFunction('updateItem', ['docente', id, data]),
        bulkUpdate: (ids, updates) => runGoogleFunction('bulkUpdateItems', ['docente', ids, updates]),
        bulkDelete: (ids) => runGoogleFunction('bulkDeleteItems', ['docente', ids]),
        delete: (id) => runGoogleFunction('deleteItem', ['docente', id]),
    },

    // Gestión de Tesis
    thesis: {
        list: () => runGoogleFunction('getThesis'),
        create: (data) => runGoogleFunction('createItem', ['tesis', data]),
        update: (id, data) => runGoogleFunction('updateItem', ['tesis', id, data]),
        bulkUpdate: (ids, updates) => runGoogleFunction('bulkUpdateItems', ['tesis', ids, updates]),
        bulkDelete: (ids) => runGoogleFunction('bulkDeleteItems', ['tesis', ids]),
        delete: (id) => runGoogleFunction('deleteItem', ['tesis', id]),
    },

    // Gestión de Eventos
    events: {
        create: (data) => runGoogleFunction('createItem', ['evento', data]),
    },

    // Gestión de Externos
    externals: {
        list: () => runGoogleFunction('getExterns'),
        create: (data) => runGoogleFunction('createItem', ['externo', data]),
        update: (id, data) => runGoogleFunction('updateItem', ['externo', id, data]),
        bulkUpdate: (ids, updates) => runGoogleFunction('bulkUpdateItems', ['externo', ids, updates]),
        bulkDelete: (ids) => runGoogleFunction('bulkDeleteItems', ['externo', ids]),
        delete: (id) => runGoogleFunction('deleteItem', ['externo', id]),
    },

    // Gestión de Eventos y Participaciones
    events: {
        list: () => runGoogleFunction('getEvents'),
        create: (data) => runGoogleFunction('createItem', ['evento', data]),
        update: (id, data) => runGoogleFunction('updateItem', ['evento', id, data]),
        delete: (id) => runGoogleFunction('deleteItem', ['evento', id]),
    },
    // Gestión de Drive - Sistema Completo de Archivos
    drive: {
        // Archivos - CRUD (Invalidan caché)
        uploadFile: async (folderId, fileData) => {
            const res = await runGoogleFunction('uploadFile', [folderId, fileData]);
            if (res.success) invalidateDriveCache();
            return res;
        },
        deleteFile: async (fileId) => {
            const res = await runGoogleFunction('deleteFile', [fileId]);
            if (res.success) invalidateDriveCache();
            return res;
        },
        renameFile: async (fileId, newName) => {
            const res = await runGoogleFunction('renameFile', [fileId, newName]);
            if (res.success) invalidateDriveCache();
            return res;
        },
        moveFile: async (fileId, newFolderId) => {
            const res = await runGoogleFunction('moveFile', [fileId, newFolderId]);
            if (res.success) invalidateDriveCache();
            return res;
        },
        downloadFile: (fileId) => runGoogleFunction('downloadFile', [fileId]),

        // Carpetas - CRUD (Invalidan caché)
        createFolder: async (parentId, name) => {
            const res = await runGoogleFunction('createSubfolder', [parentId, name]);
            if (res.success) invalidateDriveCache();
            return res;
        },
        deleteFolder: async (folderId) => {
            const res = await runGoogleFunction('deleteFolder', [folderId]);
            if (res.success) invalidateDriveCache();
            return res;
        },
        renameFolder: async (folderId, newName) => {
            const res = await runGoogleFunction('renameFolder', [folderId, newName]);
            if (res.success) invalidateDriveCache();
            return res;
        },
        moveFolder: async (folderId, newParentId) => {
            const res = await runGoogleFunction('moveFolder', [folderId, newParentId]);
            if (res.success) invalidateDriveCache();
            return res;
        },

        // Listado y Búsqueda (Con Caché)
        getFiles: (folderId) => cachedDriveCall(`files_${folderId}`, () => runGoogleFunction('getFiles', [folderId])),
        getFolderTree: (folderId, depth = 2) => cachedDriveCall(`tree_${folderId}_${depth}`, () => runGoogleFunction('getFolderStructure', [folderId, depth]), 120000), // 2 min para el árbol

        searchFiles: (folderId, query) => runGoogleFunction('searchFilesInFolder', [folderId, query]),
        getRecentFiles: (entityType, limit = 10) => runGoogleFunction('getRecentFiles', [entityType, limit]),

        // Plantillas
        getTemplates: () => cachedDriveCall('templates', () => runGoogleFunction('getTemplates')),
        useTemplate: async (templateId, destId, name) => {
            const res = await runGoogleFunction('copyTemplate', [templateId, destId, name]);
            if (res.success) invalidateDriveCache();
            return res;
        },

        // Utilidades
        getItemInfo: (itemId) => runGoogleFunction('getItemInfo', [itemId]),
        createDefaultSubfolders: (parentId, entityType) => runGoogleFunction('createDefaultSubfolders', [parentId, entityType]),
        getRootFolder: () => cachedDriveCall('root_folder', () => runGoogleFunction('getSystemRootFolderId')),

        // Sincronización (existente)
        sync: (type, id) => runGoogleFunction('syncEntityFolder', [type, id])
    },
    participations: {
        list: () => runGoogleFunction('getParticipations'),
        create: (data) => runGoogleFunction('createItem', ['participacion', data]),
        update: (id, data) => runGoogleFunction('updateItem', ['participacion', id, data]),
        delete: (id) => runGoogleFunction('deleteItem', ['participacion', id]),
    },

    // Gestión Documental
    history: {
        list: () => runGoogleFunction('getDocuments'),
        create: (data) => runGoogleFunction('createItem', ['documento', data]),
        update: (id, data) => runGoogleFunction('updateItem', ['documento', id, data]),
        delete: (id) => runGoogleFunction('deleteItem', ['documento', id]),
    }
};