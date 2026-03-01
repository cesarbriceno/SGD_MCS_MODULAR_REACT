import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useDashboardAnalytics } from '../../hooks/useDashboardAnalytics';
import { StudentsModule } from '../../components/dashboard/modules/StudentsModule';
import { DocentesModule } from '../../components/dashboard/modules/DocentesModule';
import { TesisModule } from '../../components/dashboard/modules/TesisModule';
import { EventosModule } from '../../components/dashboard/modules/EventosModule';
import { EntornoModule } from '../../components/dashboard/modules/EntornoModule';
import { ExternosModule } from '../../components/dashboard/modules/ExternosModule';
import { Calendar, Users, Briefcase, BookOpen, Presentation, Building2, Globe2 } from 'lucide-react';

const TABS = [
    { id: 'estudiantes', label: 'Estudiantes & Egresados', icon: Users },
    { id: 'docentes', label: 'Cuerpo Académico', icon: Briefcase },
    { id: 'tesis', label: 'Tesis de Grado', icon: BookOpen },
    { id: 'eventos', label: 'Eventos', icon: Presentation },
    { id: 'entorno', label: 'Instituciones', icon: Building2 },
    { id: 'externos', label: 'Participantes Externos', icon: Globe2 },
];

const DashboardHome = () => {
    const [loading, setLoading] = useState(true);
    const [rawDatabase, setRawDatabase] = useState(null);
    const [activeTab, setActiveTab] = useState('estudiantes');
    const [timeRange, setTimeRange] = useState([2015, new Date().getFullYear()]);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await api.getStats();
                const data = typeof response === 'string' ? JSON.parse(response) : response;
                if (data.success) {
                    setRawDatabase({
                        students: data.stats.datasets?.estudiantes || [],
                        theses: data.stats.datasets?.tesis || [],
                        eventos: data.stats.datasets?.eventos || [],
                        docentes: data.stats.datasets?.docentes || [],
                        convenios: data.stats.datasets?.convenios || [],
                        externos: data.stats.datasets?.externos || []
                    });
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    // Hook centralizado que provee la data filtrada y normalizada
    const { filteredData, normalizedDB } = useDashboardAnalytics(rawDatabase, timeRange);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full p-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!rawDatabase) {
        return <div className="p-6 text-red-500">Error: No se pudo cargar la base de datos para el dashboard.</div>;
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
            {/* Cabecera / Controles Globales */}
            <div className="bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Análisis y Calidad</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Panel interactivo de trayectoria académica</p>
                </div>

                {/* Control de Tiempo Global */}
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-xl">
                    <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Período de Análisis</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                className="w-20 bg-transparent text-sm font-semibold border-b border-transparent focus:border-primary outline-none"
                                value={timeRange[0]}
                                onChange={(e) => setTimeRange([parseInt(e.target.value), timeRange[1]])}
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="number"
                                className="w-20 bg-transparent text-sm font-semibold border-b border-transparent focus:border-primary outline-none"
                                value={timeRange[1]}
                                onChange={(e) => setTimeRange([timeRange[0], parseInt(e.target.value)])}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Navegación por Pestañas */}
            <div className="px-6 border-b border-slate-200 dark:border-slate-700 flex space-x-6 overflow-x-auto custom-scrollbar">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                                ${isActive
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Contenido principal de las pestañas */}
            <div className="flex-1 overflow-auto p-6 scroll-smooth">
                {activeTab === 'estudiantes' && <StudentsModule data={filteredData} />}
                {activeTab === 'docentes' && <DocentesModule data={filteredData} />}
                {activeTab === 'tesis' && <TesisModule data={filteredData} />}
                {activeTab === 'eventos' && <EventosModule data={filteredData} />}
                {activeTab === 'entorno' && <EntornoModule data={filteredData} />}
                {activeTab === 'externos' && <ExternosModule data={filteredData} />}
            </div>
        </div>
    );
};

export default DashboardHome;
