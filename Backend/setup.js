const DB_SCHEMA = {
    [SHEETS.ESTUDIANTES]: [
        // --- IDENTIFICACIÓN ---
        'ID_Estudiante',
        'Tipo_Documento',
        'Cedula',
        'Fecha_Expedicion', // NUEVO
        'Lugar_Expedicion',
        'Apellido1',
        'Apellido2',
        'Nombre1',
        'Nombre2',
        'Sexo',
        'Estado_Civil',     // NUEVO
        'Fecha_Nacimiento', // NUEVO
        'Lugar_Nacimiento', // NUEVO

        // --- CONTACTO Y UBICACIÓN ---
        'Email',
        'Email_Personal',   // NUEVO
        'Telefono',
        'Celular',          // NUEVO (Vital)
        'Direccion',
        'Barrio',           // NUEVO
        'Ciudad',
        'Depto_Residencia', // NUEVO
        'Estrato',          // NUEVO

        // --- ACADÉMICO ---
        'Fecha_Ingreso',
        'Cohorte_Ingreso',
        'Estado',
        'Comentarios',

        // --- HISTORIAL DE ESTADOS ---
        'Fecha_Egreso',     // (Fecha Grado)
        'Cohorte_Egreso',
        'Fecha_Retiro',
        'Fecha_Reingreso',
        'Fecha_Pausa',      // NUEVO
        'Motivo_Estado',    // NUEVO (Resoluciones o motivos)

        // --- LABORAL / EGRESADOS ---
        'Situacion_Laboral_Actual',
        'Empresa_Institucion',
        'Cargo_Actual',
        'Sector_Desempeno',
        'Rango_Salarial',   // NUEVO
        'Telefono_Empresa', // NUEVO

        // --- CONTROL ---
        'Fecha_Registro',
        'Ultima_Actualizacion',
        'ID_Carpeta_Drive',
        'URL_Carpeta_Drive'
    ],
    // ... (El resto de tablas DOCENTES, EXTERNOS, etc. déjalas como las tenías arriba, están bien)
    [SHEETS.DOCENTES]: [
        'ID_Docente', 'Tipo_Documento', 'Cedula', 'Lugar_Expedicion',
        'Apellido1', 'Apellido2', 'Nombre1', 'Nombre2', 'Sexo',
        'Email', 'Telefono', 'Comentarios',
        'Tipo_Vinculacion', 'Activo', 'Fecha_Vinculacion', 'Fecha_Desvinculacion',
        'Nivel_Formacion', 'Especialidad', 'Categoria', 'Link_CvLAC',
        'Grupo_Investigacion', 'Linea_Investigacion_Principal',
        'Fecha_Registro', 'Ultima_Actualizacion',
        'ID_Carpeta_Drive', 'URL_Carpeta_Drive'
    ],
    [SHEETS.EXTERNOS]: [
        'ID_Externo', 'Tipo_Documento', 'Numero_Documento', 'Lugar_Expedicion',
        'Apellido1', 'Apellido2', 'Nombre1', 'Nombre2', 'Sexo',
        'Email', 'Telefono', 'Pais', 'Ciudad',
        'Tipo_Origen', 'Organizacion', 'Cargo_Perfil',
        'Fecha_Registro', 'Ultima_Actualizacion',
        'ID_Carpeta_Drive', 'URL_Carpeta_Drive'
    ],
    [SHEETS.INSTITUCIONES]: [
        'ID_Institucion', 'Nombre_Institucion', 'Sigla', 'Tipo',
        'Pais', 'Ciudad', 'Contacto_Principal', 'Tipo_Convenio',
        'Fecha_Firma_Convenio', 'Vigente', 'URL_Web', 'Activa',
        'Fecha_Registro'
    ],
    [SHEETS.TESIS]: [
        'ID_Tesis', 'Titulo_Investigacion', 'Año', 'Estado_Tesis', 'Calificacion',
        'Modalidad', 'Linea_Investigacion_Tesis', 'Palabras_Clave', 'Resumen',
        'ID_Estudiante', 'Nombre_Estudiante',
        'ID_Asesor', 'Nombre_Asesor',
        'Codirector', 'Nombre_Codirector',
        'Jurado_1', 'Nombre_Jurado_1',
        'Jurado_2', 'Nombre_Jurado_2',
        'Fecha_Inicio', 'Fecha_Defensa', 'Numero_Acta_Sustentacion', 'URL_Documento',
        'Fecha_Registro', 'Ultima_Actualizacion',
        'ID_Carpeta_Drive', 'URL_Carpeta_Drive'
    ],
    [SHEETS.EVENTOS]: [
        'ID_Evento', 'Nombre_Evento', 'Tipo_Evento',
        'Alcance', 'Modalidad', 'Lugar',
        'Fecha_Inicio', 'Fecha_Fin', 'Año',
        'Intensidad_Horaria',
        'Presupuesto', 'Fuente_Financiacion',
        'Descripcion', 'Impacto_Academico', 'URL_Evidencias',
        'Organizado_Por', 'Apoyado_Por',
        'Fecha_Registro', 'Ultima_Actualizacion',
        'ID_Carpeta_Drive', 'URL_Carpeta_Drive'
    ],
    [SHEETS.PARTICIPACIONES]: [
        'ID_Participacion', 'ID_Evento', 'Nombre_Evento',
        'ID_Persona', 'Nombre_Persona', 'Cedula_Persona',
        'Tipo_Persona', 'Rol', 'Titulo_Ponencia', 'Asistio',
        'Fecha_Registro'
    ],
    [SHEETS.HISTORIAL]: [
        'UUID', 'Tipo_Documento',
        'ID_Beneficiario', 'Nombre_Beneficiario',
        'Detalle_Origen', 'Detalles_JSON',
        'Fecha_Emision', 'Usuario_Emisor'
    ],
    [SHEETS.CONFIG]: [
        'Parametro', 'Valor', 'Descripcion', 'Ultima_Actualizacion'
    ]
};

// ... Resto de tus funciones setupDatabase, createOrUpdateSheet, etc. igual que antes ...

function setupDatabase() {
    const ss = getDB();

    for (const [sheetName, columns] of Object.entries(DB_SCHEMA)) {
        // Lógica de color robusta
        let color = '#424242';
        if (sheetName === SHEETS.ESTUDIANTES) color = COLORS.ESTUDIANTES;
        else if (sheetName === SHEETS.DOCENTES) color = COLORS.DOCENTES;
        else if (sheetName === SHEETS.EXTERNOS) color = COLORS.EXTERNOS;
        else if (sheetName === SHEETS.INSTITUCIONES) color = COLORS.INSTITUCIONES;
        else if (sheetName === SHEETS.TESIS) color = COLORS.TESIS;
        else if (sheetName === SHEETS.EVENTOS) color = COLORS.EVENTOS;
        else if (sheetName === SHEETS.PARTICIPACIONES) color = COLORS.PARTICIPACIONES;
        else if (sheetName === SHEETS.HISTORIAL) color = COLORS.HISTORIAL;
        else if (sheetName === SHEETS.CONFIG) color = COLORS.CONFIG;

        createOrUpdateSheet(ss, sheetName, columns, color);
    }

    initConfiguration(ss);
}

function createOrUpdateSheet(ss, sheetName, columns, headerColor) {
    let sheet = ss.getSheetByName(sheetName);

    // 1. SI NO EXISTE, LA CREAMOS
    if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        Logger.log(`[CREADA] Hoja: ${sheetName}`);
    }

    // 2. DETECCIÓN INTELIGENTE DE COLUMNAS FALTANTES
    const currentLastCol = sheet.getLastColumn();
    let currentHeaders = [];

    if (currentLastCol > 0) {
        // Obtenemos cabeceras y limpiamos espacios para comparar bien
        currentHeaders = sheet.getRange(1, 1, 1, currentLastCol).getValues()[0]
            .map(h => h.toString().trim());
    }

    // Filtramos solo las que DE VERDAD no existen (comparación estricta sin espacios)
    const missingCols = columns.filter(col => !currentHeaders.includes(col.trim()));

    if (missingCols.length > 0) {
        const startCol = currentLastCol + 1;
        sheet.getRange(1, startCol, 1, missingCols.length).setValues([missingCols]);
        Logger.log(`[ACTUALIZADA] Hoja: ${sheetName} (+${missingCols.length} cols)`);
    }

    // 3. FORZAR FORMATO (Siempre se ve bonita)
    const totalCols = sheet.getLastColumn();
    if (totalCols > 0) {
        const headerRange = sheet.getRange(1, 1, 1, totalCols);

        headerRange.setBackground(headerColor);
        headerRange.setFontColor('#FFFFFF');
        headerRange.setFontWeight('bold');
        headerRange.setHorizontalAlignment('center');
        headerRange.setVerticalAlignment('middle');

        sheet.setRowHeight(1, 35);
        sheet.setFrozenRows(1);

        SpreadsheetApp.flush();
        sheet.autoResizeColumns(1, totalCols);
    }
}

function initConfiguration(ss) {
    const sheet = ss.getSheetByName(SHEETS.CONFIG);

    if (sheet) {
        const headerRange = sheet.getRange(1, 1, 1, 4);
        headerRange.setBackground(COLORS.CONFIG).setFontColor('white').setFontWeight('bold');
        sheet.autoResizeColumns(1, 4);
    }

    if (sheet.getLastRow() <= 1) {
        const initialData = [
            ['Siguiente_ID_Estudiante', '1', 'Auto', new Date()],
            ['Siguiente_ID_Docente', '1', 'Auto', new Date()],
            ['Siguiente_ID_Externo', '1', 'Auto', new Date()],
            ['Siguiente_ID_Institucion', '1', 'Auto', new Date()],
            ['Siguiente_ID_Tesis', '1', 'Auto', new Date()],
            ['Siguiente_ID_Evento', '1', 'Auto', new Date()],
            ['Siguiente_ID_Participacion', '1', 'Auto', new Date()]
        ];
        sheet.getRange(2, 1, initialData.length, 4).setValues(initialData);
    }
}