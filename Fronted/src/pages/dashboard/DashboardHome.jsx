import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useDashboardAnalytics } from '../../hooks/useDashboardAnalytics';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, Tooltip } from 'recharts';
import { Activity, TrendingUp, Users, Award } from 'lucide-react';
import { ChartContainer } from '../../components/dashboard/AutoevaluationCharts';

// --- MÓDULOS ESPECÍFICOS ---
import FactorStudents from '../../components/dashboard/FactorStudents';
import FactorImpact from '../../components/dashboard/FactorImpact';
// Reutilizamos los que ya teníamos para Docentes y Entorno, o los movemos a Factor...
import { EducationPyramid, ResearchWordCloud } from '../../components/dashboard/FacultyCharts';
import { EventsEvolution, PartnersRadar } from '../../components/dashboard/EnvironmentCharts';
import GeoMap from '../../components/dashboard/GeoMap';

// --- SUB-COMPONENTES DE TILES (VISTAS) ---

const KPIStat = ({ title, value, subtext, icon: Icon, trend }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-slate-700/50 rounded-xl text-primary">
                <Icon size={24} />
            </div>
            {trend && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {trend === 'up' ? '▲ Alta' : '▼ Baja'}
                </span>
            )}
        </div>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{value}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <p className="text-xs text-slate-400 mt-2">{subtext}</p>
    </div>
);

const GlobalView = ({ kpis, analytics, darkMode }) => (
    <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPIStat title="Total Estudiantes" value={kpis?.totalStudents || 0} icon={Users} subtext="En ventana seleccionada" />
            <KPIStat title="Tasa Retención" value={`${kpis?.retencionAvg || 0}%`} icon={Activity} subtext="Promedio global" trend={kpis?.retencionAvg > 80 ? 'up' : 'down'} />
            <KPIStat title="Graduados" value={kpis?.graduados || 0} icon={Award} subtext="Total acumulado" />
            <KPIStat title="Relación Doc/Est" value={kpis?.ratio || 0} icon={TrendingUp} subtext="Calidad académica" />
        </div>

        <ChartContainer title="Tendencia de Matrícula" downloadId="global_trend">
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.charts.survival.length > 0 ? analytics.charts.survival : []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    {/* Usando datos de supervivencia provisionalmente como visualización de tendencia */}
                    <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={darkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis hide />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: 'none' }} />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTrend)" />
                </AreaChart>
            </ResponsiveContainer>
        </ChartContainer>
    </div>
);


// --- MAIN DASHBOARD COMPONENT ---

const Dashboard = () => {
    // Estado
    const [rawDB, setRawDB] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeModule, setActiveModule] = useState('global');
    const [yearRange, setYearRange] = useState([2019, 2025]);
    const [darkMode, setDarkMode] = useState(false); // Podría venir de un Contexto global

    // Cargar datos
    useEffect(() => {
        const load = async () => {
            try {
                const response = await api.getStats();
                const data = typeof response === 'string' ? JSON.parse(response) : response;
                if (data.success) {
                    setRawDB(data.stats.datasets);
                }
            } catch (e) { console.error("Error loading dashboard data", e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    // Hook de Lógica
    // Nota: El hook ahora devuelve estructuras complejas para los nuevos gráficos
    const { analytics } = useDashboardAnalytics(rawDB, yearRange);

    if (loading || !analytics) {
        return <div className="h-full flex items-center justify-center text-slate-400">Cargando motor de análisis (Client-Side)...</div>;
    }

    return (
        <DashboardLayout
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            yearRange={yearRange}
            setYearRange={setYearRange}
        >
            {/* SUB-MÓDULOS (Renderizado condicional tipo Tabs) */}

            {activeModule === 'global' && (
                <GlobalView kpis={analytics.kpis} analytics={analytics} darkMode={darkMode} />
            )}

            {activeModule === 'students' && (
                <FactorStudents analytics={analytics} darkMode={darkMode} />
            )}

            {activeModule === 'impact' && ( // Nuevo módulo específico Impacto
                <FactorImpact analytics={analytics} darkMode={darkMode} />
            )}

            {activeModule === 'faculty' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <EducationPyramid data={analytics.charts.teacherFormation} darkMode={darkMode} />
                        <ResearchWordCloud theses={analytics.filteredData?.theses} />
                    </div>
                </div>
            )}

            {activeModule === 'geo' && (
                <div className="space-y-4 animate-fade-in">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Distribución Geográfica</h2>
                    <GeoMap data={analytics.charts.geo} darkMode={darkMode} />
                </div>
            )}

            {activeModule === 'environment' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <EventsEvolution data={analytics.charts.events} darkMode={darkMode} />
                        <PartnersRadar partners={analytics.filteredData?.partners || []} darkMode={darkMode} />
                    </div>
                </div>
            )}

        </DashboardLayout>
    );
};

export default Dashboard;
