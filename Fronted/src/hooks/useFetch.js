import { useState, useEffect, useCallback } from 'react';

/**
 * Hook reutilizable para pedir datos
 * @param {Function} apiFunction - La función del api.js a ejecutar
 * @param {boolean} autoFetch - Si debe ejecutarse al iniciar (default: true)
 */
export const useFetch = (apiFunction, autoFetch = true) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiFunction();
            setData(result);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error al cargar datos');
        } finally {
            setLoading(false);
        }
    }, [apiFunction]);

    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }
    }, [fetchData, autoFetch]);

    // Retornamos todo lo necesario para la vista, incluyendo una función para recargar (refetch)
    return { data, loading, error, refetch: fetchData };
};