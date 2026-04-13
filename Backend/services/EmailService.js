/**
 * ============================================================================
 * 📧 SERVICIO DE CORREO ELECTRÓNICO (EmailService.js)
 * Envío de certificados por Gmail con plantilla HTML institucional.
 * ============================================================================
 */

/**
 * Genera el HTML del correo institucional para enviar certificados.
 * @param {string} recipientName - Nombre del destinatario.
 * @param {string} eventName - Nombre del evento/documento.
 * @param {string} role - Rol del participante (Asistente, Ponente, etc.)
 * @param {string} [certificateCode] - Código único del certificado.
 * @returns {string} HTML formateado del email.
 */
function buildCertificateEmailHtml(recipientName, eventName, role, certificateCode) {
  const year = new Date().getFullYear();
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #0056b3 0%, #003d82 100%);padding:32px 40px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
                  Universidad de Córdoba
                </h1>
                <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;">
                  Maestría en Ciencias Sociales
                </p>
              </td>
            </tr>

            <!-- Accent Line -->
            <tr><td style="background:#22c55e;height:4px;"></td></tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px;">
                <h2 style="color:#1a202c;font-size:22px;margin:0 0 8px;font-weight:700;">
                  ¡Hola, ${recipientName}! &#128075;
                </h2>
                <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
                  Nos complace informarte que tu certificado oficial ha sido generado exitosamente.
                </p>

                <!-- Info Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:24px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:800;margin:0 0 8px;">
                        Evento / Documento
                      </p>
                      <p style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 12px;">
                        ${eventName}
                      </p>
                      <p style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:800;margin:0 0 4px;">
                        Participación como
                      </p>
                      <span style="display:inline-block;background:#0056b3;color:#fff;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
                        ${role || 'Participante'}
                      </span>
                      ${certificateCode ? `
                      <p style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:800;margin:12px 0 4px;">
                        Código de Certificado
                      </p>
                      <p style="color:#0056b3;font-size:14px;font-weight:700;margin:0;font-family:monospace;">
                        ${certificateCode}
                      </p>
                      ` : ''}
                    </td>
                  </tr>
                </table>

                <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px;">
                  &#128206; <strong>Tu certificado se encuentra adjunto a este correo</strong> en formato PDF de alta calidad.
                </p>
                <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0;">
                  Este documento tiene validez institucional. Si tienes alguna duda, puedes comunicarte con la coordinación del evento.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
                <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;line-height:1.5;">
                  © ${year} Universidad de Córdoba — Maestría en Ciencias Sociales<br>
                  Este es un correo generado automáticamente por el sistema SGD-MCS.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
}

/**
 * Envía un certificado individual por correo electrónico.
 * Recibe el PDF ya renderizado como Base64 desde el frontend.
 *
 * @param {Object} emailData - Datos del certificado.
 * @param {string} emailData.email - Email del destinatario.
 * @param {string} emailData.name - Nombre del destinatario.
 * @param {string} emailData.eventName - Nombre del evento/documento.
 * @param {string} emailData.role - Rol (Asistente, Ponente, etc.)
 * @param {string} emailData.pdfBase64 - PDF codificado en Base64.
 * @param {string} emailData.fileName - Nombre del archivo PDF.
 * @param {string} [emailData.folderId] - ID de carpeta Drive donde guardar copia.
 * @returns {Object} {success, message}
 */
function sendSingleCertificateEmail(emailData) {
  try {
    if (!emailData || !emailData.email || !emailData.pdfBase64) {
      return { success: false, message: 'Faltan datos requeridos (email o PDF).' };
    }

    const recipientEmail = emailData.email;
    const recipientName = emailData.name || 'Participante';
    const eventName = emailData.eventName || 'Documento Oficial';
    const role = emailData.role || 'Participante';
    const fileName = emailData.fileName || 'Certificado.pdf';

    // 1. Decodificar PDF
    var pdfBytes = Utilities.base64Decode(emailData.pdfBase64);
    var pdfBlob = Utilities.newBlob(pdfBytes, 'application/pdf', fileName);

    // 2. Guardar copia en Drive (si se proporcionó carpeta)
    var savedFileId = null;
    if (emailData.folderId) {
      try {
        var folder = DriveApp.getFolderById(emailData.folderId);
        var savedFile = folder.createFile(pdfBlob);
        savedFileId = savedFile.getId();
      } catch (driveErr) {
        Logger.log('Advertencia: No se pudo guardar en Drive: ' + driveErr.toString());
      }
    }

    // 3. Construir email HTML
    var htmlBody = buildCertificateEmailHtml(
      recipientName,
      eventName,
      role,
      emailData.certificateCode || null
    );

    // 4. Enviar email
    GmailApp.sendEmail(recipientEmail,
      eventName,
      'Estimado(a) ' + recipientName + ', adjuntamos su certificado del evento "' + eventName + '". Si no puede ver este correo, abra el archivo adjunto.',
      {
        htmlBody: htmlBody,
        attachments: [pdfBlob],
        name: 'Maestría en Ciencias Sociales — Universidad de Córdoba'
      }
    );

    // 5. Registrar auditoría
    logDocumentAction({
      action: 'CERTIFICATE_EMAIL_SENT',
      type: 'document',
      id: savedFileId || 'email-only',
      name: fileName,
      entityId: emailData.eventId || 'individual',
      entityType: 'certificado',
      details: {
        recipient: recipientEmail,
        recipientName: recipientName,
        role: role,
        savedToDrive: !!savedFileId,
        source: 'GeneratorWizard'
      }
    });

    return {
      success: true,
      message: 'Certificado enviado a ' + recipientEmail,
      fileId: savedFileId
    };

  } catch (e) {
    Logger.log('Error en sendSingleCertificateEmail: ' + e.toString());
    return { success: false, message: 'Error al enviar: ' + e.toString() };
  }
}

/**
 * Envía certificados masivos para un evento.
 * Los PDFs vienen pre-renderizados desde el frontend como Base64.
 *
 * @param {string} eventId - ID del evento.
 * @param {Array<Object>} certificates - Array de {email, name, role, pdfBase64, fileName}
 * @returns {Object} {success, message, sent, failed, errors}
 */
function sendBulkCertificateEmails(eventId, certificates) {
  try {
    if (!certificates || !Array.isArray(certificates) || certificates.length === 0) {
      return { success: false, message: 'No se recibieron certificados para enviar.' };
    }

    // 1. Datos básicos
    var eventName = certificates[0].eventName || 'Evento Académico';

    // (Opcional) Intentar obtener la carpeta del evento si el eventId existe
    var certificatesFolder = null;
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet(); // getDB falla si está en otro contexto
      var eventsSheet = ss.getSheetByName('Eventos');
      if (eventsSheet && eventId) {
        var data = eventsSheet.getDataRange().getValues();
        var headers = data[0];
        var idIndex = headers.indexOf('ID_Evento');
        var folderIndex = headers.indexOf('ID_Carpeta_Drive');

        if (idIndex > -1 && folderIndex > -1) {
          for (var r = 1; r < data.length; r++) {
            if (String(data[r][idIndex]) === String(eventId)) {
              var fId = data[r][folderIndex];
              if (fId) certificatesFolder = getOrCreateFolder(DriveApp.getFolderById(fId), 'Certificados');
              break;
            }
          }
        }
      }
    } catch (e) {
      Logger.log('Ignorando error al buscar carpeta de evento: ' + e);
    }

    var sent = 0;
    var failed = 0;
    var errors = [];

    // 3. Procesar cada certificado
    for (var i = 0; i < certificates.length; i++) {
      var cert = certificates[i];
      try {
        if (!cert.email || !cert.email.includes('@')) {
          errors.push((cert.name || 'Desconocido') + ': Email inválido o no proporcionado');
          failed++;
          continue;
        }

        // Decodificar PDF
        var pdfBytes = Utilities.base64Decode(cert.pdfBase64);
        var pdfBlob = Utilities.newBlob(pdfBytes, 'application/pdf', cert.fileName || 'Certificado.pdf');

        // Guardar en Drive
        if (certificatesFolder) {
          try {
            certificatesFolder.createFile(pdfBlob);
          } catch (saveErr) {
            Logger.log('No se pudo guardar PDF en Drive para ' + cert.name + ': ' + saveErr.toString());
          }
        }

        // Enviar email
        var currentEventName = cert.eventName || eventName;
        var htmlBody = buildCertificateEmailHtml(
          cert.name || 'Participante',
          currentEventName,
          cert.role || 'Asistente',
          cert.certificateCode || null
        );

        GmailApp.sendEmail(cert.email,
          currentEventName,
          'Estimado(a) ' + (cert.name || 'Participante') + ', adjuntamos su certificado del evento "' + currentEventName + '".',
          {
            htmlBody: htmlBody,
            attachments: [pdfBlob],
            name: 'Maestría en Ciencias Sociales — Universidad de Córdoba'
          }
        );

        sent++;

      } catch (certErr) {
        errors.push((cert.name || 'Desconocido') + ': ' + certErr.toString());
        failed++;
      }
    }

    // 4. Registrar auditoría global
    logDocumentAction({
      action: 'BULK_CERTIFICATE_EMAIL',
      type: 'document',
      id: eventId,
      name: eventName,
      entityId: eventId,
      entityType: 'evento',
      details: {
        totalSent: sent,
        totalFailed: failed,
        totalRequested: certificates.length,
        errors: errors.length > 0 ? errors : null,
        source: 'ParticipationManager'
      }
    });

    return {
      success: true,
      message: 'Proceso completado. ' + sent + ' certificados enviados' + (failed > 0 ? ', ' + failed + ' fallidos.' : '.'),
      sent: sent,
      failed: failed,
      errors: errors.length > 0 ? errors : null
    };

  } catch (e) {
    Logger.log('Error en sendBulkCertificateEmails: ' + e.toString());
    return { success: false, message: 'Error global: ' + e.toString() };
  }
}

/**
 * Función vacía para forzar la autorización de Gmail en el editor de Apps Script.
 * Ejecutar esta función manualmente activará el popup de permisos.
 */
function FORZAR_PERMISOS() {
  GmailApp.getAliases();
}
