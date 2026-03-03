import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import GlobalBackground from '../common/GlobalBackground';

const MainLayout = ({ darkMode, setDarkMode }) => {
    // CAMBIO: Por defecto inicia en false para que no esté expandido al cargar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className={`min-h-screen w-full font-sans transition-colors duration-500 ${darkMode ? 'dark' : ''}`}>

            <GlobalBackground />

            {/* SIDEBAR FLOTANTE (Z-50) */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* CONTENEDOR PRINCIPAL */}
            {/* Eliminamos cualquier overflow-hidden aquí para permitir el sticky del Navbar */}
            <div className="relative min-h-screen flex flex-col">

                {/* NAVBAR: Recibe el estado para abrir/cerrar el Sidebar */}
                <Navbar
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />

                {/* ÁREA DE CONTENIDO: z-0 para no tapar el dropdown del Nav ni el Sidebar */}
                <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 pb-10 relative">
                    <Outlet />
                </main>

            </div>
        </div>
    );
};

export default MainLayout;