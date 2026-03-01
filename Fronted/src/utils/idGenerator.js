/**
 * generateId - Generador estandarizado de identificadores secuenciales.
 * Formato: PREFIX-AAAA-MM-XXXX
 * 
 * @param {string} prefix - Prefijo del módulo (EST, DOC, TES, EXT)
 * @param {Object} options - Opciones de generación
 * @returns {string} ID generado
 */
export const generateId = (prefix, options = {}) => {
    const now = new Date();
    const {
        year = now.getFullYear(),
        month = now.getMonth() + 1,
        sequence = 1
    } = options;

    const AAAA = String(year).padStart(4, '0');
    const MM = String(month).padStart(2, '0');
    const XXXX = String(sequence).padStart(4, '0');

    return `${prefix}-${AAAA}-${MM}-${XXXX}`;
};

/**
 * findNextSequence - Calcula el siguiente número de secuencia basado en IDs existentes.
 * 
 * @param {string} prefix - Prefijo del módulo
 * @param {Array} existingIds - Lista de IDs actuales (strings)
 * @param {number} year - Año de referencia
 * @param {number} month - Mes de referencia
 * @returns {number} Siguiente número en la secuencia
 */
export const findNextSequence = (prefix, existingIds = [], year = new Date().getFullYear(), month = new Date().getMonth() + 1) => {
    if (!Array.isArray(existingIds)) return 1;

    const AAAA = String(year).padStart(4, '0');
    const MM = String(month).padStart(2, '0');
    const searchPattern = `${prefix}-${AAAA}-${MM}-`;

    const sequences = existingIds
        .filter(id => id && typeof id === 'string' && id.startsWith(searchPattern))
        .map(id => {
            const parts = id.split('-');
            const seqStr = parts[parts.length - 1];
            return parseInt(seqStr, 10);
        })
        .filter(seq => !isNaN(seq));

    return sequences.length > 0 ? Math.max(...sequences) + 1 : 1;
};
