/**
 * services/DataService.js
 * Servicio para obtención masiva de listados de entidades
 */

/**
 * Retorna el listado completo de estudiantes.
 * @returns {string} JSON array de objetos Estudiante.
 */
function listStudents() {
    return JSON.stringify(getSimpleData(getDB().getSheetByName(SHEETS.ESTUDIANTES)));
}

/**
 * Retorna el listado completo de docentes.
 * @returns {string} JSON array de objetos Docente.
 */
function listTeachers() {
    return JSON.stringify(getSimpleData(getDB().getSheetByName(SHEETS.DOCENTES)));
}

/**
 * Retorna el listado completo de personal externo.
 * @returns {string} JSON array de objetos Externo.
 */
function listExterns() {
    return JSON.stringify(getSimpleData(getDB().getSheetByName(SHEETS.EXTERNOS)));
}

/**
 * Retorna el listado completo de tesis sustentadas o en curso.
 * @returns {string} JSON array de objetos Tesis.
 */
function listThesis() {
    return JSON.stringify(getSimpleData(getDB().getSheetByName(SHEETS.TESIS)));
}

/**
 * Retorna el listado completo de eventos registrados.
 * @returns {string} JSON array de objetos Evento.
 */
function listEvents() {
    return JSON.stringify(getSimpleData(getDB().getSheetByName(SHEETS.EVENTOS)));
}

/**
 * Retorna el listado completo de participaciones en eventos.
 * @returns {string} JSON array de objetos Participacion.
 */
function listParticipations() {
    return JSON.stringify(getSimpleData(getDB().getSheetByName(SHEETS.PARTICIPACIONES)));
}

/**
 * Retorna el historial de acciones y documentos (Auditoría).
 * @returns {string} JSON array de objetos Log.
 */
function listDocuments() {
    return JSON.stringify(getSimpleData(getDB().getSheetByName(SHEETS.HISTORIAL)));
}
