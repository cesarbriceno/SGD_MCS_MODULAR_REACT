/**
 * utils/DataUtils.js
 * Utilidades de bajo nivel para interactuar con filas y columnas de Sheets
 */

/**
 * Convierte un rango de hoja de cálculo en un array de objetos JSON usando las cabeceras
 */
function getSimpleData(sheet) {
    if (!sheet) return [];
    const data = sheet.getDataRange().getDisplayValues();
    if (data.length < 2) return [];

    const headers = data.shift().map(h =>
        h.toString().trim().replace(/\s+/g, '_')
    );

    return data.map(row => {
        let obj = {};
        headers.forEach((h, i) => {
            if (h) obj[h] = row[i];
        });
        return obj;
    });
}
