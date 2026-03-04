/**
 * 📊 API DE ESTADÍSTICAS (DASHBOARD)
 * Procesa y devuelve un resumen consolidado de todas las entidades para el dashboard de React.
 * Incluye KPIs y datasets completos para filtrado en frontend.
 * @returns {string} JSON con {success, stats: {estudiantes, tesis, eventos, datasets}, lastUpdate}
 */
function getDashboardStats() {
    try {
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
        const rawInstituciones = getData(SHEETS.INSTITUCIONES);
        const rawExternos = getData(SHEETS.EXTERNOS);

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

            datasets: {
                estudiantes: rawEstudiantes,
                tesis: rawTesis,
                docentes: rawDocentes,
                eventos: rawEventos,
                convenios: rawInstituciones,
                externos: rawExternos
            }
        };

        return JSON.stringify({
            success: true,
            stats: stats,
            lastUpdate: new Date().toLocaleString()
        });
    } catch (error) {
        console.error("error in getDashboardStats: ", error);
        return JSON.stringify({
            success: false,
            error: error.toString(),
            message: "Error al cargar las estadísticas del dashboard"
        });
    }
}