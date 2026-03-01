import { useMemo } from 'react';

/**
 * Hook centralizado para procesar los datos enteros del Dashboard V2.
 * @param {Object} database - JSON completo con { students, theses, eventos, docentes, convenios, etc }
 * @param {Array} timeRange - [startYear, endYear] para el filtro global
 */
export const useDashboardAnalytics = (database, timeRange) => {
    // 1. Normalización inicial (Parsing de fechas, etc.) - Ocurre solo si cambia la DB
    const normalizedDB = useMemo(() => {
        if (!database) return null;

        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            const res = new Date(dateStr);
            return isNaN(res.getTime()) ? null : res;
        };

        return {
            students: (Array.isArray(database.students) ? database.students : []).map(s => ({
                ...s,
                fingreso: s['Fecha_Ingreso'],
                fegreso: s['Fecha_Egreso'],
                anio_ingreso: parseDate(s['Fecha_Ingreso'])?.getFullYear(),
                estado: s['Estado'],
                sit_lab: s['Situacion_Laboral_Actual'],
                cohorte: s['Cohorte_Ingreso'],
                ciudad: s['Ciudad'],
                sexo: s['Sexo'],
                sector: s['Sector_Desempeno']
            })),
            theses: (Array.isArray(database.theses) ? database.theses : []).map(t => ({
                ...t,
                calificacion: t['Calificacion'],
                fecha_inicio: parseDate(t['Fecha_Inicio']),
                fecha_sustentacion: parseDate(t['Fecha_Defensa']) || parseDate(t['Año']),
                ano: t['Año'],
                estado_tesis: t['Estado_Tesis'],
                asesor: t['Nombre_Asesor'],
                codirector: t['Nombre_Codirector'],
                jurado_1: t['Nombre_Jurado_1'],
                jurado_2: t['Nombre_Jurado_2']
            })),
            events: (Array.isArray(database.eventos) ? database.eventos : []).map(e => ({
                ...e,
                fecha_inicio: parseDate(e['Año']) || parseDate(e['Fecha_Inicio']),
                impacto: e['Impacto_Academico'],
                horas: e['Intensidad_Horaria'],
                nombre: e['Nombre_Evento']
            })),
            teachers: (Array.isArray(database.docentes) ? database.docentes : []).map(t => ({
                ...t,
                fecha_vinculacion: t['Fecha_Vinculacion'] ? parseDate(t['Fecha_Vinculacion']) : null,
                fecha_desvinculacion: t['Fecha_Desvinculacion'] ? parseDate(t['Fecha_Desvinculacion']) : null,
                activo: t['Activo'],
                formacion: t['Nivel_Formacion'],
                vinculacion: t['Tipo_Vinculacion']
            })),
            partners: (Array.isArray(database.convenios) ? database.convenios : []).map(p => ({
                ...p,
                vigente: p['Vigente'] || p['Activa'],
                tipo_convenio: p['Tipo_Convenio'],
                pais: p['Pais'],
                ciudad: p['Ciudad'],
                fecha_firma: p['Fecha_Firma_Convenio']
            })),
            externs: Array.isArray(database.externos) ? database.externos : []
        };
    }, [database]);

    // 2. Filtrado Global por Rango de Tiempo
    const filteredData = useMemo(() => {
        if (!normalizedDB || !timeRange) return null;
        const [startYear, endYear] = timeRange;

        // Por defecto filtramos por el año de ingreso/inicio/vinculacion pero
        // dependiendo del gráfico, el módulo específico podría usar el dataset completo.
        // Mantenemos esto aquí por conveniencia.
        return {
            students: normalizedDB.students.filter(s => {
                const year = s.anio_ingreso;
                return year >= startYear && year <= endYear;
            }),
            theses: normalizedDB.theses.filter(t => {
                const year = t.fecha_sustentacion?.getFullYear();
                return year >= startYear && year <= endYear;
            }),
            events: normalizedDB.events.filter(e => {
                const year = e.fecha_inicio?.getFullYear();
                return year >= startYear && year <= endYear;
            }),
            teachers: normalizedDB.teachers, // Los docentes suelen verse históricos
            partners: normalizedDB.partners,
            externs: normalizedDB.externs
        };
    }, [normalizedDB, timeRange]);

    return { normalizedDB, filteredData };
};
