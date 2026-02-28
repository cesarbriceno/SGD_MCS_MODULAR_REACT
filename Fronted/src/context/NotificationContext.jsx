import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications debe usarse dentro de un NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    // Cargar del localStorage al iniciar
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('nexodo_notifications');
        return saved ? JSON.parse(saved) : [
            { id: 'welcome', title: 'Bienvenido a NEXODO', desc: 'Sistema actualizado a v3.0', type: 'info', time: new Date().toISOString(), read: false }
        ];
    });

    // Guardar en localStorage cuando cambien
    useEffect(() => {
        localStorage.setItem('nexodo_notifications', JSON.stringify(notifications));
    }, [notifications]);

    const addNotification = (title, desc, type = 'info') => {
        const newNotif = {
            id: Date.now().toString(),
            title,
            desc,
            type,
            time: new Date().toISOString(),
            read: false
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 20)); // Limitar a 20 más recientes
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const deleteNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            markAsRead,
            deleteNotification,
            clearAll,
            unreadCount
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
