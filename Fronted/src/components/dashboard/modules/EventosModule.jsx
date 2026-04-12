import React, { useMemo, useRef, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { createChart, AreaSeries } from 'lightweight-charts';
import { Presentation, Target, Activity, Calendar as CalendarIcon } from 'lucide-react';

// --- Componente LWC AreaChart ---
const EventHistoryChart = ({ data }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        if (!data || data.length === 0) return;

        const chart = createChart(chartContainerRef.current, {
            height: 300,
            layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#64748b' },
            grid: { vertLines: { visible: false }, horzLines: { color: '#e2e8f0' } },
            timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true }
        });

        const areaSeries = chart.addSeries(AreaSeries, {
            topColor: 'rgba(59, 130, 246, 0.4)',
            bottomColor: 'rgba(59, 130, 246, 0.05)',
            lineColor: '#3b82f6',
            lineWidth: 2,
        });

        // Data is assumed to be sorted array of {time: 'YYYY-MM-DD', value: number}
        areaSeries.setData(data);

        chart.timeScale().fitContent();

        const handleResize = () => {
            if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data]);

    return <div ref={chartContainerRef} className="w-full" />;
};

const KpiCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{value}</h3>
            {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
    </div>
);




export const EventosModule = ({ data }) => {
    const rawEvents = data?.events;
    const events = Array.isArray(rawEvents) ? rawEvents.filter(Boolean) : [];

    const metrics = useMemo(() => {
        let total = events.length;
        let cAsistio = 0;
        let sumImpacto = 0;
        let sumHoras = 0;

        const roles = {};
        const eventImpacts = [];
        const timeHist = {};

        events.forEach(e => {
            // Asistencia
            const ast = String(e.asistio).toLowerCase();
            if (ast === 'true' || ast === 'si' || ast === '1') cAsistio++;

            // Roles
            const rol = e.rol || e.Tipo_Persona || 'Asistente';
            roles[rol] = (roles[rol] || 0) + 1;

            // Histograma
            if (e.fecha_inicio) {
                const d = new Date(e.fecha_inicio);
                if (!isNaN(d.getTime())) {
                    // Format to first day of month
                    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
                    timeHist[mKey] = (timeHist[mKey] || 0) + 1;
                }
            }

            // Impacto
            const imp = parseInt(e.impacto || e.Relevancia) || 1;
            const hr = parseInt(e.horas || e.Intensidad_Horaria) || 0;
            sumImpacto += imp;
            sumHoras += hr;

            eventImpacts.push({
                name: e.nombre || e.evento || 'Evento anónimo',
                score: imp * (hr || 1) // Proxy de impacto general
            });
        });

        // Parse Time series
        const lwcData = Object.keys(timeHist).sort().map(k => ({ time: k, value: timeHist[k] }));

        // Pareto
        eventImpacts.sort((a, b) => b.score - a.score);
        const top5 = eventImpacts.slice(0, 5);

        let cumulative = 0;
        const totalScore = eventImpacts.reduce((a, b) => a + b.score, 0) || 1;
        const paretoData = top5.map(e => {
            cumulative += e.score;
            return { name: e.name.substring(0, 25) + '...', score: e.score, acum: Math.round((cumulative / totalScore) * 100) };
        });

        return {
            kpis: {
                total,
                asisRate: total ? Math.round((cAsistio / total) * 100) : 0,
                avgHoras: total ? Math.round(sumHoras / total) : 0,
                avgImpacto: total ? (sumImpacto / total).toFixed(1) : 0
            },
            charts: {
                roles,
                lwcData,
                paretoData
            }
        };
    }, [events]);

    const rolesOptions = {
        chart: { type: 'donut', fontFamily: 'Inter, sans-serif', foreColor: '#94a3b8' },
        labels: Object.keys(metrics.charts.roles),
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
        legend: { position: 'bottom', labels: { colors: '#94a3b8' } },
        dataLabels: { enabled: false },
        tooltip: { theme: 'dark' }
    };
    const rolesSeries = Object.values(metrics.charts.roles);

    const paretoOptions = {
        chart: { type: 'line', toolbar: { show: false }, foreColor: '#94a3b8' },
        stroke: { width: [0, 4] },
        title: { text: 'Top 5 Eventos (Impacto * Horas)', style: { color: '#64748b', fontSize: '12px', fontWeight: 'normal' } },
        dataLabels: { enabled: false, enabledOnSeries: [1] },
        labels: metrics.charts.paretoData.map(d => d.name),
        yaxis: [
            { title: { text: 'Puntaje', style: { color: '#94a3b8' } }, labels: { style: { colors: '#94a3b8' } } },
            { opposite: true, title: { text: '% Acumulado', style: { color: '#94a3b8' } }, labels: { style: { colors: '#94a3b8' } }, max: 100 }
        ],
        xaxis: { labels: { style: { colors: '#94a3b8' } } },
        colors: ['#8b5cf6', '#ef4444'],
        legend: { labels: { colors: '#94a3b8' } },
        tooltip: { theme: 'dark' }
    };
    const paretoSeries = [
        { name: 'Puntaje', type: 'column', data: metrics.charts.paretoData.map(d => d.score) },
        { name: '% Acum. (sobre total)', type: 'line', data: metrics.charts.paretoData.map(d => d.acum) }
    ];

    if (!events || events.length === 0) {
        return <div className="p-8 text-center text-slate-500">No hay datos de Eventos.</div>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total Participaciones" value={metrics.kpis.total} subtext="Eventos registrados" icon={Presentation} colorClass="bg-blue-500 text-blue-500" />
                <KpiCard title="Tasa Asistencia" value={`${metrics.kpis.asisRate}%`} subtext="Registros efectivos" icon={Activity} colorClass="bg-emerald-500 text-emerald-500" />
                <KpiCard title="Horas Promedio" value={`${metrics.kpis.avgHoras} h`} subtext="Intensidad por evento" icon={CalendarIcon} colorClass="bg-amber-500 text-amber-500" />
                <KpiCard title="Impacto Promedio" value={metrics.kpis.avgImpacto} subtext="Escala interna (1-5)" icon={Target} colorClass="bg-purple-500 text-purple-500" />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Evolución en la Agenda (Mes a Mes)</h3>
                <p className="text-xs text-slate-400 mb-2">Eje temporal LWC para eventos continuos, apilados por mes de inicio.</p>
                {metrics.charts.lwcData.length > 0 ? (
                    <EventHistoryChart data={metrics.charts.lwcData} />
                ) : <p className="text-slate-500 text-sm">Inspeccionando sin fechas válidas.</p>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Roles de Asistencia</h3>
                    {rolesSeries.length > 0 ? (
                        <Chart options={rolesOptions} series={rolesSeries} type="donut" height={320} />
                    ) : <p className="text-slate-500 text-sm">Sin datos para mostrar.</p>}
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Impacto Pareto</h3>
                    {metrics.charts.paretoData.length > 0 ? (
                        <Chart options={paretoOptions} series={paretoSeries} type="line" height={320} />
                    ) : <p className="text-slate-500 text-sm">Sin suficientes datos de impacto.</p>}
                </div>
            </div>
        </div>
    );
};
