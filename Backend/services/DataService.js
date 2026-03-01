/**
 * services/DataService.js
 * Servicio para obtención masiva de listados de entidades
 */

function listStudents() {
    return JSON.stringify(getSimpleData(getDB().getSheetByName(SHEETS.ESTUDIANTES)));
}

function listTeachers() {
    return JSON.stringify(getSimpleData(getDB().getSheetByName(SHEETS.DOCENTES)));
}

function listExterns() {
    return JSON.stringify(getSimpleData(getDB().getSheetByName(SHEETS.EXTERNOS)));
}

function listThesis() {
    return JSON.stringify(getSimpleData(getDB().getSheetByName(SHEETS.TESIS)));
}

function listEvents() {
    return JSON.stringify(getSimpleData(getDB().getSheetByName(SHEETS.EVENTOS)));
}

function listParticipations() {
    return JSON.stringify(getSimpleData(getDB().getSheetByName(SHEETS.PARTICIPACIONES)));
}

function listDocuments() {
    return JSON.stringify(getSimpleData(getDB().getSheetByName(SHEETS.HISTORIAL)));
}
