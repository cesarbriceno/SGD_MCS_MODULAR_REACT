import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, LineChart, Line } from 'recharts';
import { ChartContainer, COLORS, DARK_COLORS } from './AutoevaluationCharts';

// --- GRÁFICAS ---

export const RetentionChart = ({ data, darkMode }) => {
    const chartData = useMemo(() => {
        const cohortes = {};
        data.forEach(s => {
            const cohorte = s.cohorte || 'Sin Cohorte';
            if (!cohortes[cohorte]) cohortes[cohorte] = { name: cohorte, Activos: 0, Graduados: 0, Retirados: 0 };

            if (s.estado === 'Matriculado' || s.estado === 'En Curso') cohortes[cohorte].Activos += 1;
            else if (s.estado === 'Graduado') cohortes[cohorte].Graduados += 1;
            else if (s.estado === 'Retirado' || s.estado === 'Desercion') cohortes[cohorte].Retirados += 1;
        });
        return Object.values(cohortes).sort((a, b) => a.name.localeCompare(b.name));
    }, [data]);

    return (
        <ChartContainer title="Estado por Cohorte (Retención)" downloadId="retencion_cohorte">
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="name" tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
                    <YAxis tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: 'none' }} />
                    <Legend />
                    <Bar dataKey="Activos" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="Graduados" stackId="a" fill="#10b981" />
                    <Bar dataKey="Retirados" stackId="a" fill="#ef4444">
                        <LabelList dataKey="Retirados" position="top" fill={darkMode ? "#94a3b8" : "#475569"} formatter={(v) => v > 0 ? v : ''} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

export const DropoutReasonsChart = ({ data, darkMode }) => {
    const chartData = useMemo(() => {
        const counts = {};
        // Filtrar solo retirados
        data.filter(s => s.estado === 'Retirado' || s.estado === 'Desercion').forEach(s => {
            const reason = s.motivo_retiro || 'No Especificado';
            counts[reason] = (counts[reason] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Pareto (Mayor a menor)
    }, [data]);

    return (
        <ChartContainer title="Principales Motivos de Deserción" downloadId="motivos_desercion">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: 'none' }} />
                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="value" position="right" fill={darkMode ? "#94a3b8" : "#475569"} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

export const GraduationEfficiencyChart = ({ data, darkMode }) => {
    const chartData = useMemo(() => {
        // Agrupar por cohorte y calcular promedio de días
        const stats = {};
        data.filter(s => s.estado === 'Graduado' && s.fingreso && s.fegreso).forEach(s => {
            const cohorte = s.cohorte || 'Sin Cohorte';
            const dias = (new Date(s.fegreso) - new Date(s.fingreso)) / (1000 * 60 * 60 * 24);

            if (!stats[cohorte]) stats[cohorte] = { sum: 0, count: 0 };
            stats[cohorte].sum += dias;
            stats[cohorte].count += 1;
        });

        return Object.entries(stats)
            .map(([cohorte, val]) => ({
                cohorte,
                meses: Math.round((val.sum / val.count) / 30) // Promedio en meses
            }))
            .sort((a, b) => a.cohorte.localeCompare(b.cohorte));
    }, [data]);

    return (
        <ChartContainer title="Tiempo Promedio de Grado (Meses)" downloadId="eficiencia_terminal">
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="cohorte" tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
                    <YAxis tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: 'none' }} />
                    <Line type="monotone" dataKey="meses" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }}>
                        <LabelList dataKey="meses" position="top" fill={darkMode ? "#94a3b8" : "#475569"} />
                    </Line>
                </LineChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};
