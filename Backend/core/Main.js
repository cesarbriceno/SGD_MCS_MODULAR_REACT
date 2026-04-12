/**
 * core/Main.js
 * Puntos de entrada del Servidor Web (doGet) y de la API (google.script.run)
 */

/**
 * Punto de entrada para la aplicación web.
 * Sirve el archivo index.html de la carpeta web.
 * @returns {HtmlOutput}
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

/**
 * Obtiene las estadísticas consolidadas para el dashboard.
 * @returns {string} JSON con objeto de estadísticas.
 */
function getStats() { return getDashboardStats(); }

/**
 * Obtiene el listado completo de estudiantes.
 * @returns {string} JSON con array de estudiantes.
 */
function getStudents() { return listStudents(); }

/**
 * Obtiene el listado completo de docentes.
 * @returns {string} JSON con array de docentes.
 */
function getTeachers() { return listTeachers(); }

/**
 * Obtiene el listado completo de personal externo.
 * @returns {string} JSON con array de externos.
 */
function getExterns() { return listExterns(); }

/**
 * Obtiene el listado completo de tesis.
 * @returns {string} JSON con array de tesis.
 */
function getThesis() { return listThesis(); }

/**
 * Obtiene el listado completo de eventos.
 * @returns {string} JSON con array de eventos.
 */
function getEvents() { return listEvents(); }

/**
 * Obtiene el listado completo de participaciones en eventos.
 * @returns {string} JSON con array de participaciones.
 */
function getParticipations() { return listParticipations(); }

/**
 * Genera certificados para los participantes de un evento.
 */
function emitCertificates(eventId) { return emitEventCertificates(eventId); }

/**
 * Obtiene el listado completo de documentos (auditoría/archivo).
 * @returns {string} JSON con array de documentos.
 */
function getDocuments() { return listDocuments(); }

/**
 * Realiza una búsqueda universal en la base de datos (Sheets).
 * @param {string} query - Texto a buscar.
 * @param {string} context - Contexto ('estudiante', 'tesis', etc).
 * @returns {string} JSON con array de resultados.
 */
function searchUniversal(query, context) { return executeSearch(query, context); }

/**
 * Obtiene el listado de plantillas disponibles en la carpeta _Plantillas de Drive.
 * @returns {Array<Object>} Lista de plantillas.
 */
function getTemplatesList() { return getTemplates(); }

/**
 * Realiza una búsqueda recursiva de archivos y carpetas en Drive.
 * @param {string} query - Texto a buscar.
 * @returns {Array<Object>} Lista de archivos y carpetas encontrados.
 */
function searchUniversalRepository(query) { return searchUniversalRepository(query); }

/**
 * Genera un documento individual desde el Asistente.
 */
function generateIndividualDocument(templateId, data, fileName, folderId) {
    return generateSingleDocument(templateId, data, fileName, folderId);
}

/**
 * Envía certificados masivos por correo (PDFs pre-renderizados desde el frontend).
 * @param {string} eventId - ID del evento.
 * @param {Array<Object>} certificates - Array de {email, name, role, pdfBase64, fileName}.
 */
function sendBulkCertificates(eventId, certificates) {
    return sendBulkCertificateEmails(eventId, certificates);
}

/**
 * Envía un certificado individual por correo (PDF pre-renderizado desde el frontend).
 * @param {Object} emailData - {email, name, eventName, role, pdfBase64, fileName, folderId}
 */
function sendIndividualCertificate(emailData) {
    return sendSingleCertificateEmail(emailData);
}

/**
 * Nota: Las funciones de Drive (CRUD de archivos/carpetas) 
 * están disponibles globalmente en DriveFileManager.js y DriveManager.js
 * y son llamadas directamente por sus nombres desde el cliente.
 */
