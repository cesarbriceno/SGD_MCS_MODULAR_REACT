/**
 * ============================================================================
 * 🔍 SCRIPT DE DIAGNÓSTICO - Sistema de Drive
 * Ejecuta este script desde Apps Script para verificar el estado del sistema
 * ============================================================================
 */

function diagnosticarSistemaDrive() {
    const resultados = {
        timestamp: new Date().toISOString(),
        tests: []
    };

    // TEST 1: Verificar configuración
    resultados.tests.push({
        nombre: "Configuración ROOT_FOLDER_ID",
        estado: ROOT_FOLDER_ID ? "✅ CONFIGURADO" : "⚠️ VACÍO",
        valor: ROOT_FOLDER_ID || "(vacío - usará carpeta por defecto)",
        detalles: ROOT_FOLDER_ID ? "ID configurado correctamente" : "Se creará carpeta SGD_DATABASE_ROOT automáticamente"
    });

    // TEST 2: Verificar acceso a la carpeta raíz
    try {
        const rootFolder = getSystemRootFolder();
        resultados.tests.push({
            nombre: "Acceso a Carpeta Raíz",
            estado: "✅ OK",
            valor: rootFolder.getName(),
            detalles: `ID: ${rootFolder.getId()}, URL: ${rootFolder.getUrl()}`
        });
    } catch (e) {
        resultados.tests.push({
            nombre: "Acceso a Carpeta Raíz",
            estado: "❌ ERROR",
            error: e.toString(),
            solucion: "Verifica que el ROOT_FOLDER_ID sea correcto y tengas permisos de edición"
        });
    }

    // TEST 3: Verificar columnas en hojas
    const hojas = [SHEETS.ESTUDIANTES, SHEETS.DOCENTES, SHEETS.TESIS, SHEETS.EVENTOS, SHEETS.EXTERNOS];
    const ss = getDB();

    hojas.forEach(nombreHoja => {
        try {
            const sheet = ss.getSheetByName(nombreHoja);
            if (!sheet) {
                resultados.tests.push({
                    nombre: `Hoja: ${nombreHoja}`,
                    estado: "❌ NO EXISTE",
                    solucion: "Crea la hoja manualmente o ejecuta setupDatabase()"
                });
                return;
            }

            const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
            const tieneIDCarpeta = headers.includes('ID_Carpeta_Drive');
            const tieneURLCarpeta = headers.includes('URL_Carpeta_Drive');

            if (tieneIDCarpeta && tieneURLCarpeta) {
                resultados.tests.push({
                    nombre: `Columnas Drive en ${nombreHoja}`,
                    estado: "✅ OK",
                    detalles: "ID_Carpeta_Drive y URL_Carpeta_Drive presentes"
                });
            } else {
                resultados.tests.push({
                    nombre: `Columnas Drive en ${nombreHoja}`,
                    estado: "❌ FALTAN COLUMNAS",
                    faltantes: [
                        !tieneIDCarpeta ? "ID_Carpeta_Drive" : null,
                        !tieneURLCarpeta ? "URL_Carpeta_Drive" : null
                    ].filter(x => x),
                    solucion: "Ejecuta setupDatabase() para agregar las columnas"
                });
            }
        } catch (e) {
            resultados.tests.push({
                nombre: `Hoja: ${nombreHoja}`,
                estado: "❌ ERROR",
                error: e.toString()
            });
        }
    });

    // TEST 4: Probar creación de carpeta de prueba
    try {
        const testData = {
            ID_Estudiante: 'TEST-DIAG-001',
            Nombre1: 'Prueba',
            Apellido1: 'Diagnóstico',
            Cohorte_Ingreso: '2026-1'
        };

        const folderInfo = createEntityFolder('estudiante', testData);

        resultados.tests.push({
            nombre: "Creación de Carpeta de Prueba",
            estado: "✅ OK",
            detalles: `Carpeta creada: ${folderInfo.name}`,
            id: folderInfo.id,
            url: folderInfo.url,
            nota: "Esta es una carpeta de prueba, puedes eliminarla manualmente"
        });
    } catch (e) {
        resultados.tests.push({
            nombre: "Creación de Carpeta de Prueba",
            estado: "❌ ERROR",
            error: e.toString(),
            stack: e.stack
        });
    }

    // TEST 5: Verificar funciones de DriveFileManager
    const funcionesDrive = [
        'createSubfolder',
        'uploadFile',
        'deleteFile',
        'renameFile',
        'moveFile',
        'downloadFile',
        'searchFilesInFolder',
        'getFolderStructure'
    ];

    const funcionesDisponibles = funcionesDrive.filter(fn => typeof this[fn] === 'function');

    resultados.tests.push({
        nombre: "Funciones DriveFileManager",
        estado: funcionesDisponibles.length === funcionesDrive.length ? "✅ OK" : "⚠️ PARCIAL",
        disponibles: funcionesDisponibles.length,
        total: funcionesDrive.length,
        faltantes: funcionesDrive.filter(fn => typeof this[fn] !== 'function')
    });

    // Generar reporte
    Logger.log("=".repeat(80));
    Logger.log("📊 REPORTE DE DIAGNÓSTICO DEL SISTEMA DE DRIVE");
    Logger.log("=".repeat(80));
    Logger.log(`Fecha: ${resultados.timestamp}`);
    Logger.log("");

    resultados.tests.forEach((test, index) => {
        Logger.log(`${index + 1}. ${test.nombre}: ${test.estado}`);
        if (test.valor) Logger.log(`   Valor: ${test.valor}`);
        if (test.detalles) Logger.log(`   Detalles: ${test.detalles}`);
        if (test.error) Logger.log(`   ❌ Error: ${test.error}`);
        if (test.solucion) Logger.log(`   💡 Solución: ${test.solucion}`);
        if (test.faltantes && test.faltantes.length > 0) {
            Logger.log(`   Faltantes: ${test.faltantes.join(', ')}`);
        }
        Logger.log("");
    });

    Logger.log("=".repeat(80));

    // Contar errores
    const errores = resultados.tests.filter(t => t.estado.includes("❌")).length;
    const advertencias = resultados.tests.filter(t => t.estado.includes("⚠️")).length;
    const exitosos = resultados.tests.filter(t => t.estado.includes("✅")).length;

    Logger.log(`RESUMEN: ${exitosos} exitosos, ${advertencias} advertencias, ${errores} errores`);
    Logger.log("=".repeat(80));

    if (errores > 0) {
        Logger.log("⚠️ HAY PROBLEMAS QUE REQUIEREN ATENCIÓN");
        Logger.log("Revisa los errores arriba y aplica las soluciones sugeridas.");
    } else if (advertencias > 0) {
        Logger.log("⚠️ El sistema funciona pero hay advertencias");
    } else {
        Logger.log("✅ SISTEMA FUNCIONANDO CORRECTAMENTE");
        Logger.log("Si aún tienes problemas, verifica que estés usando la URL de producción (no localhost)");
    }

    return resultados;
}

/**
 * Prueba rápida de creación de estudiante con carpeta
 */
function pruebaCrearEstudianteConCarpeta() {
    Logger.log("🧪 Iniciando prueba de creación de estudiante...");

    const datosEstudiante = {
        Nombre1: 'Juan',
        Nombre2: 'Carlos',
        Apellido1: 'Pérez',
        Apellido2: 'López',
        Tipo_Documento: 'CC',
        Cedula: '1234567890',
        Email: 'juan.perez@test.com',
        Cohorte_Ingreso: '2026-1',
        Estado: 'Cursando'
    };

    try {
        const resultado = createItem('estudiante', datosEstudiante);
        Logger.log("✅ Estudiante creado exitosamente:");
        Logger.log(JSON.stringify(resultado, null, 2));

        if (resultado.folderUrl) {
            Logger.log(`📁 Carpeta creada: ${resultado.folderUrl}`);
        } else {
            Logger.log("⚠️ No se generó URL de carpeta");
        }

        return resultado;
    } catch (e) {
        Logger.log("❌ Error al crear estudiante:");
        Logger.log(e.toString());
        Logger.log(e.stack);
        return { success: false, error: e.toString() };
    }
}
