/**
 * services/SearchService.js
 * Servicio de búsqueda universal en la base de datos
 */

function executeSearch(query, context) {
    if (!query) return "[]";
    query = query.toString().toLowerCase();
    const ss = getDB();
    let results = [];

    if (context === 'estudiante') {
        const data = getSimpleData(ss.getSheetByName(SHEETS.ESTUDIANTES));
        results = data.filter(r =>
            (r['Nombre1'] && r['Nombre1'].toLowerCase().includes(query)) ||
            (r['Apellido1'] && r['Apellido1'].toLowerCase().includes(query)) ||
            (r['Cedula'] && r['Cedula'].toString().includes(query))
        ).map(r => ({
            id: r['ID_Estudiante'],
            nombre: `${r['Nombre1']} ${r['Nombre2'] || ''} ${r['Apellido1']} ${r['Apellido2'] || ''}`.trim(),
            cedula: r['Cedula'],
            programa: r['Cohorte_Ingreso'] ? `Cohorte ${r['Cohorte_Ingreso']}` : 'Sin Cohorte',
            email: r['Email'],
            estado: r['Estado']
        }));
    } else if (context === 'tesis') {
        const data = getSimpleData(ss.getSheetByName(SHEETS.TESIS));
        results = data.filter(t =>
            (t['Titulo_Investigacion'] && t['Titulo_Investigacion'].toLowerCase().includes(query))
        ).map(t => ({
            id: t['ID_Tesis'],
            titulo: t['Titulo_Investigacion'],
            nota: t['Calificacion'],
            estudiante: t['Nombre_Estudiante'] || 'Estudiante no registrado'
        }));
    }

    return JSON.stringify(results);
}
