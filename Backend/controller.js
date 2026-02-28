/**
 * 📊 API DE ESTADÍSTICAS (DASHBOARD)
 * Devuelve un resumen en tiempo real de la base de datos.
 */
/**
 * 📊 API DE ESTADÍSTICAS (DASHBOARD)
 * Devuelve un resumen en tiempo real de la base de datos.
 */
function getDashboardStats() {
    const ss = getDB();

    // --- HELPER: Obtener datos limpios ---
    const getData = (sheetName) => {
        const sheet = ss.getSheetByName(sheetName);
        return sheet ? getSimpleData(sheet) : [];
    };

    // 1. DATASETS COMPLETOS (Optimizados para el Frontend)
    const rawEstudiantes = getData(SHEETS.ESTUDIANTES);
    const rawTesis = getData(SHEETS.TESIS);
    const rawDocentes = getData(SHEETS.DOCENTES);
    const rawEventos = getData(SHEETS.EVENTOS);

    // 2. PROCESAMIENTO MÍNIMO (El resto lo hace React)
    const stats = {
        // Métricas Generales (Cards)
        estudiantes: {
            total: rawEstudiantes.length,
            activos: rawEstudiantes.filter(e => e['Estado'] === 'Matriculado').length,
            egresados: rawEstudiantes.filter(e => e['Estado'] === 'Egresado').length,
            graduados: rawEstudiantes.filter(e => e['Estado'] === 'Graduado').length
        },
        tesis: {
            total: rawTesis.length,
            enCurso: rawTesis.filter(t => t['Estado_Tesis'] === 'En Curso').length,
            sustentadas: rawTesis.filter(t => t['Estado_Tesis'] === 'Sustentada' || t['Estado_Tesis'] === 'Aprobada').length
        },
        eventos: {
            total: rawEventos.length
        },

        // Datasets para Gráficas Avanzadas (Autoevaluación)
        datasets: {
            estudiantes: rawEstudiantes.map(e => ({
                id: e['ID_Estudiante'], // Para conteos únicos si es necesario
                cohorte: e['Cohorte_Ingreso'],
                fingreso: e['Fecha_Ingreso'], // Para series de tiempo anuales
                fegreso: e['Fecha_Egreso'],   // Para eficiencia terminal
                fnacim: e['Fecha_Nacimiento'], // Para cálculo de edad
                estado: e['Estado'],
                motivo_retiro: e['Motivo_Estado'], // Para pareto de deserción
                sexo: e['Sexo'],
                estrato: e['Estrato'],
                ciudad: e['Ciudad'],
                depto: e['Depto_Residencia'],
                lugar_nacim: e['Lugar_Nacimiento'], // Para movilidad
                sit_lab: e['Situacion_Laboral_Actual'],
                sector: e['Sector_Desempeno'],
                salario: e['Rango_Salarial']
            })),
            tesis: rawTesis.map(t => ({
                estado: t['Estado_Tesis'],
                linea: t['Linea_Investigacion_Tesis'],
                calificacion: t['Calificacion'],
                ano: t['Año']
            })),
            docentes: rawDocentes.map(d => ({
                formacion: d['Nivel_Formacion'],
                vinculacion: d['Tipo_Vinculacion'],
                linea: d['Linea_Investigacion_Principal'],
                sexo: d['Sexo']
            })),
            eventos: rawEventos.map(ev => ({
                tipo: ev['Tipo_Evento'],
                impacto: ev['Impacto_Academico'],
                ano: ev['Año']
            }))
        }
    };

    return JSON.stringify({
        success: true,
        stats: stats,
        lastUpdate: new Date().toLocaleString()
    });
}