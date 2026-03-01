import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute - Componente para proteger rutas privadas.
 * Por ahora actúa como un pasarela simple, pero permite integrar
 * lógica de autenticación (JWT, Firebase, GAS Auth) en el futuro.
 */
const ProtectedRoute = ({ children }) => {
    // Aquí se incorporaría la lógica de autenticación real.
    // Ejemplo: const { isAuthenticated } = useAuth();
    const isAuthenticated = true; // Por ahora, permitimos el acceso total para no bloquear el dev.

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
