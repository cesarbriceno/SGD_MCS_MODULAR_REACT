import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- HELPER: Obtener Fecha y Hora Actual ---
const getDateTimeInfo = () => {
    const now = new Date();
    // Formato: 28 de dic. 2025
    const dateStr = now.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    // Formato: 7:05 PM
    const timeStr = now.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    // Nombre de archivo seguro: YYYY-MM-DD
    const fileSuffix = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate()}`;
    return { dateStr, timeStr, fileSuffix };
};

// --- 1. EXPORTAR A EXCEL (XLSX) ---
export const exportToExcel = (data, columns, reportName) => {
    const { dateStr, timeStr, fileSuffix } = getDateTimeInfo();

    // 1. Preparar el contenido
    const titleRow = ["PLATAFORMA NEXODO"];
    const subTitleRow = [`Reporte: ${reportName}`];
    const dateRow = [`Generado: ${dateStr} a las ${timeStr}`];
    const emptyRow = [""];

    const headers = columns.map(col => col.label);

    // Datos mapeados (Prioridad a .raw si existe)
    const body = data.map(item =>
        columns.map(col => {
            let val = item[col.key];
            // Si el valor no está en la raíz, buscar en 'raw' (datos crudos de BD)
            if (val === undefined && item.raw) {
                val = item.raw[col.key];
            }
            return val !== null && val !== undefined ? String(val) : '';
        })
    );

    const worksheetData = [titleRow, subTitleRow, dateRow, emptyRow, headers, ...body];

    // 2. Crear Hoja y Libro
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();

    // 3. Calcular anchos de columna (Dinámico)
    // 3. Calcular anchos de columna (Dinámico y Generoso)
    const colWidths = headers.map((h, i) => {
        // Encontrar la longitud máxima en esta columna (incluyendo saltos de línea)
        const getContentLen = (val) => {
            if (val === null || val === undefined) return 0;
            const lines = String(val).split('\n');
            return Math.max(...lines.map(l => l.length));
        };

        const headerLen = h.length;
        const maxContentLen = body.reduce((max, row) => {
            const len = getContentLen(row[i]);
            return len > max ? len : max;
        }, 0);

        // Ancho final = max entre cabecera y contenido + margen de seguridad (20% extra + padding)
        const finalWch = Math.max(headerLen, maxContentLen) * 1.1 + 5;

        return { wch: Math.min(Math.max(finalWch, 12), 70) }; // Limitar entre 12 y 70 caracteres
    });
    worksheet['!cols'] = colWidths;

    // 4. Estilo básico (Merge para el título)
    if (!worksheet['!merges']) worksheet['!merges'] = [];
    worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }); // Título
    worksheet['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }); // Subtítulo

    // 5. Descargar
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    XLSX.writeFile(workbook, `Nexodo_${reportName}_${fileSuffix}.xlsx`);
};

// --- 2. EXPORTAR A PDF (CON CONFIGURACIÓN) ---
export const exportToPDF = (data, columns, reportName, config = {}) => {
    const { dateStr, timeStr, fileSuffix } = getDateTimeInfo();

    // Desestructurar configuración con valores por defecto
    const {
        pageSize = 'letter',      // a4, letter, legal
        orientation = 'portrait', // portrait, landscape
        fontSize = 9
    } = config;

    // Inicializar jsPDF
    const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: pageSize
    });

    // Encabezado "NEXODO"
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("PLATAFORMA NEXODO", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Reporte: ${reportName}`, 14, 26);
    doc.text(`Generado: ${dateStr} - ${timeStr}`, 14, 31);

    // Preparar columnas y filas
    const tableColumn = columns.map(col => col.label);
    const tableRows = data.map(item =>
        columns.map(col => {
            let val = item[col.key];
            if (val === undefined && item.raw) {
                val = item.raw[col.key];
            }
            return val !== null && val !== undefined ? String(val) : '';
        })
    );

    // Si hay demasiadas columnas, forzar un tamaño de fuente menor para legibilidad
    const adjustedFontSize = tableColumn.length > 12 ? Math.min(fontSize, 7) : fontSize;

    // Generar Tabla usando autoTable
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 38,
        theme: 'grid',
        horizontalPageBreak: true, // Habilitar saltos de página horizontales
        horizontalPageBreakRepeat: 0, // Repetir columna índice? 0 para no repetir.
        headStyles: {
            fillColor: [15, 23, 42], // Slate 900
            textColor: [255, 255, 255],
            fontSize: adjustedFontSize,
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            fontSize: adjustedFontSize,
            textColor: [50, 50, 50],
            cellPadding: 1.5,
            minCellHeight: 6
        },
        styles: {
            overflow: 'linebreak',
            cellWidth: 'auto',
            minCellWidth: 15, // Ancho minímo por columna para prevenir el apilado vertical extremo
            valign: 'middle'
        },
        // Optimizar distribución de anchos
        columnStyles: {
            // Dar un poco más de peso a columnas que suelen ser largas (ej. Títulos)
            0: { cellWidth: 'wrap' }
        },
        margin: { horizontal: 7 }
    });

    // Descargar
    doc.save(`Nexodo_${reportName}_${fileSuffix}.pdf`);
};