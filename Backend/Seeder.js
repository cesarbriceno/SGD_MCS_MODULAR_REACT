/**
 * ============================================================================
 * 🌱 SEEDER: GENERADOR DE DATOS DE PRUEBA (v3.0)
 * ============================================================================
 * Ejecuta la función 'poblarBaseDeDatos' para insertar registros conectados.
 */

function poblarBaseDeDatos() {
    const ss = getDB();

    // 1. ESTUDIANTES (5 casos variados)
    insertarDatos(ss, SHEETS.ESTUDIANTES, [
        ['EST0001', 'CC', '1010', 'Montería', 'Pérez', 'López', 'Juan', 'Carlos', 'M', 'juan@test.com', '3001234567', 'Calle 1', 'Montería', '', '2024-01-20', '2024-1', 'Matriculado', '', '', '', '', '', 'Estudiante', '', '', '', new Date(), new Date()],
        ['EST0002', 'CC', '2020', 'Cereté', 'Gómez', 'Ruiz', 'Maria', 'Fernanda', 'F', 'maria@test.com', '3002345678', 'Cra 2', 'Cereté', '', '2024-01-20', '2024-1', 'Matriculado', '', '', '', '', '', 'Docente', 'Colgesan', '', 'Educación', new Date(), new Date()],
        ['EST0003', 'CC', '3030', 'Lorica', 'Díaz', 'Moreno', 'Pedro', '', 'M', 'pedro@test.com', '3003456789', 'Av 3', 'Lorica', '', '2023-01-15', '2023-1', 'Egresado', '2024-12-10', '2023-1', '', '', '', 'Investigador', '', '', '', new Date(), new Date()],
        ['EST0004', 'CC', '4040', 'Sahagún', 'Martínez', 'Soto', 'Luisa', '', 'F', 'luisa@test.com', '3004567890', 'Diag 4', 'Sahagún', '', '2023-01-15', '2023-1', 'Graduado', '2024-12-10', '2023-1', '', '', '', '', '', '', '', new Date(), new Date()],
        ['EST0005', 'CE', 'E555', 'Extranjero', 'Smith', '', 'John', '', 'M', 'john@test.com', '3005678901', 'Hotel', 'Montería', 'Intercambio', '2024-01-20', '2024-1', 'Matriculado', '', '', '', '', '', '', '', '', '', new Date(), new Date()]
    ]);

    // 2. DOCENTES (3 perfiles)
    insertarDatos(ss, SHEETS.DOCENTES, [
        ['DOC0001', 'CC', '9090', 'Bogotá', 'Rodríguez', 'Peña', 'Carlos', 'Andrés', 'M', 'carlos@uni.edu.co', '3101112233', '', 'Planta', 'Sí', '2015-02-01', '', 'Doctorado', 'Sociología', 'Titular', 'http://cvlac...', 'Grupo A', 'Conflicto', new Date(), new Date()],
        ['DOC0002', 'CC', '8080', 'Medellín', 'Fernández', 'Lara', 'Ana', 'Lucía', 'F', 'ana@uni.edu.co', '3102223344', '', 'Planta', 'Sí', '2018-06-01', '', 'Maestría', 'Antropología', 'Asociado', 'http://cvlac...', 'Grupo B', 'Cultura', new Date(), new Date()],
        ['DOC0003', 'CE', 'E999', 'España', 'García', 'Lorca', 'Federico', '', 'M', 'fede@uni.edu.co', '3103334455', '', 'Ocasional', 'Sí', '2023-01-20', '', 'Doctorado', 'Literatura', 'Invitado', '', '', '', new Date(), new Date()]
    ]);

    // 3. TESIS (Conectadas con los anteriores)
    insertarDatos(ss, SHEETS.TESIS, [
        ['TES0001', 'Impacto Social de la IA en Córdoba', '2024', 'En Curso', '', 'Investigación', 'Tecnología', 'IA', 'Resumen...', 'EST0001', 'Juan Carlos Pérez', 'DOC0001', 'Carlos Rodríguez', '', '', '', '', '', '', '2024-02-01', '', '', '', new Date(), new Date()],
        ['TES0002', 'Tradiciones Orales del Sinú', '2024', 'En Curso', '', 'Investigación', 'Cultura', 'Oralidad', 'Resumen...', 'EST0002', 'Maria Fernanda Gómez', 'DOC0002', 'Ana Fernández', '', '', '', '', '', '', '2024-02-01', '', '', '', new Date(), new Date()],
        ['TES0003', 'Economía Informal en Lorica', '2023', 'Aprobada', '4.8', 'Profundización', 'Economía', 'Informalidad', 'Resumen...', 'EST0003', 'Pedro Díaz', 'DOC0001', 'Carlos Rodríguez', '', '', 'DOC0002', 'Ana Fernández', 'DOC0003', 'Federico García', '2023-02-01', '2024-11-20', 'ACT-001', '', new Date(), new Date()]
    ]);

    // 4. EVENTOS
    insertarDatos(ss, SHEETS.EVENTOS, [
        ['EVT0001', 'III CONGRESO INTERNACIONAL DE CIENCIAS SOCIALES', 'Congreso', 'Internacional', 'Presencial', 'Auditorio Central', '2024-05-20', '2024-05-22', '2024', '24 horas', '50M', 'Propia', 'Evento anual...', 'Alto', '', 'Facultad Ciencias Humanas', 'Gobernación de Córdoba', new Date(), new Date()],
        ['EVT0002', 'SEMINARIO DE INVESTIGACIÓN APLICADA', 'Seminario', 'Nacional', 'Híbrido', 'Sala Juntas', '2024-08-10', '2024-08-10', '2024', '8 horas', '2M', 'Propia', 'Seminario mensual...', 'Medio', '', 'Maestría CS', '', new Date(), new Date()]
    ]);

    // 5. PARTICIPACIONES (La tabla clave para certificados)
    insertarDatos(ss, SHEETS.PARTICIPACIONES, [
        // Juan fue Asistente al Congreso
        ['PAR0001', 'EVT0001', 'III CONGRESO INT...', 'EST0001', 'Juan Carlos Pérez', '1010', 'Estudiante', 'Asistente', '', 'TRUE', new Date()],
        // El Profe Federico fue Ponente
        ['PAR0002', 'EVT0001', 'III CONGRESO INT...', 'DOC0003', 'Federico García', 'E999', 'Docente', 'Ponente', 'Literatura y Sociedad', 'TRUE', new Date()],
        // Maria organizó el evento
        ['PAR0003', 'EVT0001', 'III CONGRESO INT...', 'EST0002', 'Maria Fernanda Gómez', '2020', 'Estudiante', 'Organizador', '', 'TRUE', new Date()],
        // Pedro asistió al Seminario
        ['PAR0004', 'EVT0002', 'SEMINARIO INVEST...', 'EST0003', 'Pedro Díaz', '3030', 'Estudiante', 'Asistente', '', 'TRUE', new Date()]
    ]);

    actualizarContadoresConfig(ss);
}

function insertarDatos(ss, sheetName, data) {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet && sheet.getLastRow() <= 1) { // Solo si está vacía (o solo cabecera)
        sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
    }
}

function actualizarContadoresConfig(ss) {
    const sheet = ss.getSheetByName(SHEETS.CONFIG);
    if (sheet) {
        // Forzamos los contadores a un número seguro (ej. 10) para no sobreescribir pruebas
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
            if (data[i][0].startsWith('Siguiente_ID')) {
                sheet.getRange(i + 1, 2).setValue(10);
            }
        }
    }
}