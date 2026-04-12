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
            case 'participacion': sheetName = SHEETS.PARTICIPACIONES; break;
            case 'documento': sheetName = SHEETS.HISTORIAL; break;
            default: return { success: false, message: 'Tipo no válido' };
        }

        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) return { success: false, message: `Hoja ${sheetName} no encontrada` };

        // IDs Automáticos
        let prefix = type.substring(0, 3).toUpperCase();
        let counter = `Siguiente_ID_${type.charAt(0).toUpperCase()}${type.slice(1)}`;
        if (type === 'externo') counter = 'Siguiente_ID_Externo';
        if (type === 'participacion') counter = 'Siguiente_ID_Participacion';
        if (type === 'documento') counter = 'Siguiente_ID_Documento';

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
            case 'participacion': sheetName = SHEETS.PARTICIPACIONES; break;
            case 'documento': sheetName = SHEETS.HISTORIAL; break;
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
            if (header === 'Ultima_Actualizacion') {
                const val = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm:ss");
                sheet.getRange(rowIndex, colIndex + 1).setValue(val);
            } else if (header === 'Ultimo_Usuario') {
                const val = Session.getActiveUser().getEmail() || 'Sistema';
                sheet.getRange(rowIndex, colIndex + 1).setValue(val);
            } else if (data.hasOwnProperty(header)) {
                sheet.getRange(rowIndex, colIndex + 1).setValue(data[header]);
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
            case 'participacion': sheetName = SHEETS.PARTICIPACIONES; break;
            case 'documento': sheetName = SHEETS.HISTORIAL; break;
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

/**
 * Genera el texto descriptivo del rol para el certificado.
 * @param {string} role - Rol del participante (Asistente, Ponente, etc.)
 * @param {string} ponencia - Título de la ponencia si aplica.
 * @returns {string} Texto formateado.
 */
function getDescriptiveRoleText(role, ponencia) {
    const r = (role || '').trim().toLowerCase();
    if (r === 'ponente' || r === 'tallerista') {
        const action = r === 'ponente' ? 'dictando la ponencia' : 'impartiendo el taller';
        return `en calidad de ${r.toUpperCase()} ${action}: "${ponencia || 'Sin título'}"`;
    } else if (r === 'organizador' || r === 'coordinador') {
        return `en calidad de ${r.toUpperCase()} colaborando activamente en la logística y desarrollo del evento.`;
    } else {
        return `en calidad de ASISTENTE completando satisfactoriamente la jornada académica establecida.`;
    }
}

/**
 * Helper universal para reemplazar placeholders en Google Docs o Google Slides.
 * Soporta variaciones de caso: {{NOMBRE}}, {{nombre}}, {{Nombre}}.
 */
function replacePlaceholdersInFile(fileId, data) {
    const file = DriveApp.getFileById(fileId);
    const mimeType = file.getMimeType();
    const keys = Object.keys(data);

    if (mimeType === MimeType.GOOGLE_DOCS) {
        const doc = DocumentApp.openById(fileId);
        const body = doc.getBody();
        keys.forEach(key => {
            const val = String(data[key] || '');
            body.replaceText(`{{${key.toUpperCase()}}}`, val);
            body.replaceText(`{{${key.toLowerCase()}}}`, val);
            const capitalized = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
            body.replaceText(`{{${capitalized}}}`, val);
        });
        doc.saveAndClose();
    } else if (mimeType === MimeType.GOOGLE_SLIDES) {
        const pres = SlidesApp.openById(fileId);
        keys.forEach(key => {
            const val = String(data[key] || '');
            pres.replaceAllText(`{{${key.toUpperCase()}}}`, val);
            pres.replaceAllText(`{{${key.toLowerCase()}}}`, val);
            const capitalized = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
            pres.replaceAllText(`{{${capitalized}}}`, val);
        });
        pres.saveAndClose();
    }
}

/**
 * Genera y envía certificados para todos los participantes que asistieron a un evento.
 */
function emitEventCertificates(eventId) {
    try {
        const ss = getDB();

        // 1. Obtener datos del Evento
        const eventsSheet = ss.getSheetByName(SHEETS.EVENTOS);
        const eventsData = getSimpleData(eventsSheet);
        const event = eventsData.find(e => String(e.ID_Evento) === String(eventId) || String(e.id) === String(eventId));

        if (!event) return { success: false, message: 'Evento no encontrado' };

        const eventName = event.Nombre_Evento || event.nombre || 'Sin Nombre';
        const eventDate = event.Fecha_Inicio || event.fechaInicio || '';
        const eventHours = event.Intensidad_Horaria || event.intensidad || '0';
        const eventFolderId = event.ID_Carpeta_Drive || event.id_carpeta_drive;

        // 2. Obtener la carpeta "Certificados" del evento
        let certificatesFolder;
        if (eventFolderId) {
            const parentFolder = DriveApp.getFolderById(eventFolderId);
            certificatesFolder = getOrCreateFolder(parentFolder, 'Certificados');
        } else {
            certificatesFolder = getTemplatesFolder();
        }

        // 3. Obtener participantes que asistieron
        const partSheet = ss.getSheetByName(SHEETS.PARTICIPACIONES);
        const participations = getSimpleData(partSheet).filter(p =>
            String(p.ID_Evento) === String(eventId) &&
            (p.Asistio === 'Sí' || p.asistio === 'Sí')
        );

        if (participations.length === 0) {
            return { success: false, message: 'No hay participantes con asistencia marcada.' };
        }

        // 4. Buscar Plantilla
        const templatesFolder = getTemplatesFolder();
        const templates = templatesFolder.searchFiles('title contains "Certificado_Evento" and trashed = false');

        if (!templates.hasNext()) {
            return {
                success: false,
                message: `No se encontró la plantilla "Certificado_Evento".`
            };
        }
        const templateFile = templates.next();

        let count = 0;
        const errors = [];

        // 5. Generar certificados
        participations.forEach(p => {
            try {
                const participantName = p.Nombre_Persona || p.nombre_persona || 'Participante';
                const participantId = p.Cedula_Persona || p.cedula_persona || '';
                const participantEmail = p.Email_Persona || p.email_persona || '';
                const role = p.Rol || p.rol || 'Asistente';
                const ponencia = p.Ponencia || p.ponencia || '';

                // Copiar plantilla
                const newFileName = `Certificado_${participantName.replace(/\s+/g, '_')}_${eventId}`;
                const copy = templateFile.makeCopy(newFileName, certificatesFolder);
                const copyId = copy.getId();

                // Preparar Texto de Rol dinámico
                const descriptiveRole = getDescriptiveRoleText(role, ponencia);

                // Reemplazar placeholders
                replacePlaceholdersInFile(copyId, {
                    NOMBRE: participantName,
                    CEDULA: participantId,
                    EVENTO: eventName,
                    FECHA: eventDate,
                    HORAS: eventHours,
                    ROL: role,
                    TEXTO_ROL: descriptiveRole
                });

                // Convertir a PDF
                const pdfFile = DriveApp.getFileById(copyId).getAs('application/pdf');
                const pdf = certificatesFolder.createFile(pdfFile);

                // Enviar por correo
                if (participantEmail && participantEmail.includes('@')) {
                    GmailApp.sendEmail(participantEmail,
                        `Certificado: ${eventName}`,
                        `Hola ${participantName},\n\nAdjuntamos tu certificado oficial del evento "${eventName}".\n\nSaludos,\nMaestría en Ciencias Sociales`,
                        { attachments: [pdfFile] }
                    );
                }

                // Registrar en Historial
                logDocumentAction({
                    action: 'CERTIFICATE_GENERATE',
                    type: 'document',
                    id: pdf.getId(),
                    name: pdf.getName(),
                    entityId: eventId,
                    entityType: 'evento',
                    details: { participant: participantName, emailSent: !!participantEmail }
                });

                count++;
            } catch (err) {
                errors.push(`${p.Nombre_Persona || 'Desconocido'}: ${err.toString()}`);
            }
        });

        return {
            success: true,
            message: `Proceso completado. ${count} certificados generados (en PDF).`,
            count: count,
            errors: errors.length > 0 ? errors : null
        };

    } catch (e) {
        return { success: false, message: e.toString() };
    }
}

/**
 * Genera un documento individual reemplazando placeholders y convirtiendo a PDF.
 */
function generateSingleDocument(templateId, data, fileName, folderId) {
    try {
        const templateFile = DriveApp.getFileById(templateId);
        let destFolder = folderId ? DriveApp.getFolderById(folderId) : getTemplatesFolder();

        // 1. Crear copia editable temporal
        const copy = templateFile.makeCopy(`TEMP_${new Date().getTime()}`, destFolder);
        const copyId = copy.getId();

        // 2. Preparar Texto de Rol si falta
        if (data.ROL && !data.TEXTO_ROL) {
            data.TEXTO_ROL = getDescriptiveRoleText(data.ROL, data.PONENCIA);
        }

        // 3. Reemplazar placeholders
        replacePlaceholdersInFile(copyId, data);

        // 4. Generar PDF final
        const pdfFile = DriveApp.getFileById(copyId).getAs('application/pdf');
        const pdf = destFolder.createFile(pdfFile);
        pdf.setName(fileName || `Certificado_${new Date().getTime()}.pdf`);

        // 5. Eliminar temporal
        try { copy.setTrashed(true); } catch (e) { }

        // Registrar acción
        logDocumentAction({
            action: 'CERTIFICATE_GENERATE',
            type: 'document',
            id: pdf.getId(),
            name: pdf.getName(),
            entityType: 'individual',
            details: { format: 'PDF', source: 'Wizard' }
        });

        return {
            success: true,
            id: pdf.getId(),
            url: pdf.getUrl(),
            name: pdf.getName(),
            message: 'Certificado PDF generado exitosamente'
        };
    } catch (e) {
        return { success: false, message: 'Error en generación: ' + e.toString() };
    }
}
