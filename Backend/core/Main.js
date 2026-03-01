/**
 * core/Main.js
 * Puntos de entrada del Servidor Web (doGet) y de la API (google.script.run)
 */

function doGet() {
    return HtmlService.createHtmlOutputFromFile('web/index')
        .setTitle('SGD-MCS v3.0')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * ==========================================
 * PROXIES GLOBALES PARA google.script.run
 * Apps Script requiere que las funciones llamadas desde el cliente 
 * estén declaradas en el scope global.
 * ==========================================
 */

// Dashboard
function getStats() { return getDashboardStats(); }

// Listados
function getStudents() { return listStudents(); }
function getTeachers() { return listTeachers(); }
function getExterns() { return listExterns(); }
function getThesis() { return listThesis(); }
function getEvents() { return listEvents(); }
function getParticipations() { return listParticipations(); }
function getDocuments() { return listDocuments(); }

// Buscador
function searchUniversal(query, context) { return executeSearch(query, context); }

// Drive - Carpetas y Archivos (Pasan directo ya que sus nombres coinciden)
// createItem, updateItem, deleteItem, bulkUpdateItems, bulkDeleteItems
// uploadFile, deleteFile, renameFile, moveFile, downloadFile
// createSubfolder, renameFolder, deleteFolder, moveFolder
// getFiles, searchFilesInFolder, getFolderStructure, getRecentFiles
// getTemplates, copyTemplate, getItemInfo, createDefaultSubfolders, getSystemRootFolderId, syncEntityFolder
