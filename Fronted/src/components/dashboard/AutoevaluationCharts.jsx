import React, { useRef, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList, PieChart, Pie } from 'recharts';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';

export const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];
export const DARK_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#818cf8'];

export const ChartContainer = ({ title, children, downloadId }) => {
    const containerRef = useRef(null);

    const downloadChart = async () => {
        if (!containerRef.current) return;
        try {
            const canvas = await html2canvas(containerRef.current, { backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `${downloadId || 'chart'}.png`;
            link.click();
        } catch (e) {
            console.error("Error descargando gráfico", e);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full relative" ref={containerRef}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
                <button onClick={downloadChart} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-colors" title="Descargar como Imagen">
                    <Download size={18} />
                </button>
            </div>
            <div className="flex-grow min-h-[300px] flex items-center justify-center">
                {children}
            </div>
        </div>
    );
};

// 1. COHORTES: Evolución de Ingresos vs Graduados
export const CohortEvolutionChart = ({ data = [], darkMode }) => {
    // Procesar datos para agrupar por cohorte memorizado
    const chartData = useMemo(() => {
        const processed = data.reduce((acc, curr) => {
            const cohorte = curr.cohorte || 'Sin Cohorte';
            if (!acc[cohorte]) {
                acc[cohorte] = { name: cohorte, Ingresos: 0, Graduados: 0 };
            }
            acc[cohorte].Ingresos += 1;
            if (curr.estado === 'Graduado') acc[cohorte].Graduados += 1;
            return acc;
        }, {});

        return Object.values(processed).sort((a, b) => a.name.localeCompare(b.name));
    }, [data]);

    return (
        <ChartContainer title="Evolución por Cohortes" downloadId="cohortes_evolucion">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="name" tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
                    <YAxis tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Bar dataKey="Ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="Ingresos" position="top" fill={darkMode ? "#94a3b8" : "#475569"} fontSize={12} />
                    </Bar>
                    <Bar dataKey="Graduados" fill="#10b981" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="Graduados" position="top" fill={darkMode ? "#94a3b8" : "#475569"} fontSize={12} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

// 2. INVESTIGACIÓN: Líneas (Tesis + Docentes)
export const ResearchLinesChart = ({ tesis = [], docentes = [], darkMode }) => {
    // Unificar líneas de investigación memorizado
    const chartData = useMemo(() => {
        const lines = {};

        tesis.forEach(t => {
            const linea = t.linea || 'Sin definir';
            if (!lines[linea]) lines[linea] = { name: linea, Tesis: 0, Docentes: 0 };
            lines[linea].Tesis += 1;
        });

        docentes.forEach(d => {
            const linea = d.linea || 'Sin definir';
            if (!lines[linea]) lines[linea] = { name: linea, Tesis: 0, Docentes: 0 };
            lines[linea].Docentes += 1;
        });

        return Object.values(lines).filter(l => l.name !== 'Sin definir');
    }, [tesis, docentes]);

    return (
        <ChartContainer title="Líneas de Investigación" downloadId="lineas_investigacion">
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={darkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Bar dataKey="Tesis" fill="#8b5cf6" stackId="a" radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="Tesis" position="right" fill={darkMode ? "#a78bfa" : "#7c3aed"} fontSize={11} formatter={(val) => val > 0 ? val : ''} />
                    </Bar>
                    <Bar dataKey="Docentes" fill="#f59e0b" stackId="a" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

// 3. EMPLEABILIDAD: Situación Laboral
export const GraduateEmploymentChart = ({ data = [], darkMode }) => {
    const chartData = useMemo(() => {
        const processed = data.reduce((acc, curr) => {
            // Solo egresados y graduados
            if (curr.estado === 'Egresado' || curr.estado === 'Graduado') {
                const status = curr.situacion_laboral || 'No Registrado';
                if (!acc[status]) acc[status] = { name: status, value: 0 };
                acc[status].value += 1;
            }
            return acc;
        }, {});

        return Object.values(processed);
    }, [data]);

    return (
        <ChartContainer title="Situación Laboral (Egresados)" downloadId="empleabilidad">
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={darkMode ? DARK_COLORS[index % DARK_COLORS.length] : COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderRadius: '8px', border: 'none' }} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};
