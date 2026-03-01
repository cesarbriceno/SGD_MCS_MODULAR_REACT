import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import ForceGraph2D from 'react-force-graph-2d';
import { BookOpen, Award, Clock, Users } from 'lucide-react';

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

export const TesisModule = ({ data }) => {
    const { theses = [] } = data || {};

    const metrics = useMemo(() => {
        let total = theses.length;
        let sumCalificacion = 0;
        let cCalificacion = 0;
        let sumMeses = 0;
        let cMeses = 0;

        const estadoAno = {};
        const tiemposDefensa = [];
        const calificacionHist = {};

        // Para la red
        const nodesData = new Map();
        const linksData = [];

        theses.forEach(t => {
            // Calificación
            const calif = parseFloat(t.calificacion) || parseFloat(t.nota) || null;
            if (calif) {
                sumCalificacion += calif;
                cCalificacion++;
                const rangos = ['Deficiente', 'Aceptable', 'Bueno', 'Excelente'];
                let r = 'Bueno';
                if (calif >= 4.5) r = 'Excelente';
                else if (calif >= 4.0) r = 'Bueno';
                else if (calif >= 3.0) r = 'Aceptable';
                else r = 'Deficiente';
                calificacionHist[r] = (calificacionHist[r] || 0) + 1;
            }

            // Tiempos
            if (t.fecha_inicio && t.fecha_sustentacion) {
                const meses = (new Date(t.fecha_sustentacion) - new Date(t.fecha_inicio)) / (1000 * 60 * 60 * 24 * 30.4);
                if (meses > 0 && meses < 120) {
                    sumMeses += meses;
                    cMeses++;
                    tiemposDefensa.push(meses);
                }
            }

            // Estado vs Año
            const year = t.fecha_sustentacion ? new Date(t.fecha_sustentacion).getFullYear() : (t.ano || 'ND');
            if (year !== 'ND') {
                if (!estadoAno[year]) estadoAno[year] = { Completada: 0, 'En Curso': 0, 'Cancelada': 0 };
                const est = t.estado || t.estado_tesis || 'Completada';
                estadoAno[year][est] = (estadoAno[year][est] || 0) + 1;
            }

            // Red de colaboración (Personas involucradas en esta tesis)
            const addNode = (name, type) => {
                if (!name || name.trim() === '') return null;
                const id = name.trim();
                if (!nodesData.has(id)) nodesData.set(id, { id, group: type, val: 1 });
                else nodesData.get(id).val++;
                return id;
            };

            const p1 = addNode(t.asesor || t.director, 1);
            const p2 = addNode(t.codirector, 1);
            const j1 = addNode(t.jurado_1, 2);
            const j2 = addNode(t.jurado_2, 2);

            const persons = [p1, p2, j1, j2].filter(Boolean);
            for (let i = 0; i < persons.length; i++) {
                for (let j = i + 1; j < persons.length; j++) {
                    linksData.push({ source: persons[i], target: persons[j] });
                }
            }
        });

        tiemposDefensa.sort((a, b) => a - b);
        let boxplot = [];
        if (tiemposDefensa.length >= 5) {
            boxplot = [{
                x: 'Meses Inicio a Defensa',
                y: [
                    tiemposDefensa[0],
                    tiemposDefensa[Math.floor(cMeses * 0.25)],
                    tiemposDefensa[Math.floor(cMeses * 0.5)],
                    tiemposDefensa[Math.floor(cMeses * 0.75)],
                    tiemposDefensa[cMeses - 1]
                ].map(Math.round)
            }];
        }

        return {
            kpis: {
                total,
                promData: cCalificacion ? (sumCalificacion / cCalificacion).toFixed(1) : 0,
                tiempoMed: cMeses ? (sumMeses / cMeses).toFixed(1) : 0,
                nodosRed: nodesData.size
            },
            charts: {
                estadoAno,
                calificacionHist,
                boxplot,
                graph: {
                    nodes: Array.from(nodesData.values()),
                    links: linksData
                }
            }
        };
    }, [theses]);


    // -- Options --
    const estadoYearOptions = {
        chart: { type: 'bar', stacked: true, toolbar: { show: false }, foreColor: '#94a3b8', fontFamily: 'Inter, sans-serif' },
        xaxis: { categories: Object.keys(metrics.charts.estadoAno), labels: { style: { colors: '#94a3b8' } } },
        yaxis: { labels: { style: { colors: '#94a3b8' } } },
        colors: ['#10b981', '#3b82f6', '#ef4444'],
        legend: { labels: { colors: '#94a3b8' } },
        tooltip: { theme: 'dark' }
    };
    const estadosToMap = ['Completada', 'En Curso', 'Cancelada'];
    const estadoYearSeries = estadosToMap.map(estado => ({
        name: estado,
        data: Object.values(metrics.charts.estadoAno).map(yData => yData[estado] || 0)
    }));

    const califOptions = {
        chart: { type: 'bar', toolbar: { show: false }, foreColor: '#94a3b8' },
        xaxis: { categories: Object.keys(metrics.charts.calificacionHist), labels: { style: { colors: '#94a3b8' } } },
        yaxis: { labels: { style: { colors: '#94a3b8' } } },
        colors: ['#8b5cf6'],
        plotOptions: { bar: { borderRadius: 4 } },
        tooltip: { theme: 'dark' }
    };
    const califSeries = [{ name: 'Tesis', data: Object.values(metrics.charts.calificacionHist) }];

    const boxplotOptions = {
        chart: { type: 'boxPlot', toolbar: { show: false }, foreColor: '#94a3b8' },
        plotOptions: { boxPlot: { colors: { upper: '#3b82f6', lower: '#93c5fd' } } },
        xaxis: { labels: { style: { colors: '#94a3b8' } } },
        yaxis: { labels: { style: { colors: '#94a3b8' } } },
        tooltip: { theme: 'dark' }
    };

    if (!theses || theses.length === 0) {
        return <div className="p-8 text-center text-slate-500">No hay datos de Tesis.</div>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Tesis Activas/Historicas" value={metrics.kpis.total} subtext="Total en base" icon={BookOpen} colorClass="bg-blue-500 text-blue-500" />
                <KpiCard title="Calificación Media" value={metrics.kpis.promData} subtext="Notas promedio" icon={Award} colorClass="bg-emerald-500 text-emerald-500" />
                <KpiCard title="Tiempo Promedio" value={`${metrics.kpis.tiempoMed} m.`} subtext="De inicio a defensa" icon={Clock} colorClass="bg-amber-500 text-amber-500" />
                <KpiCard title="Actores de Red" value={metrics.kpis.nodosRed} subtext="Directores/Jurados" icon={Users} colorClass="bg-purple-500 text-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Estados de Tesis por Año</h3>
                    <Chart options={estadoYearOptions} series={estadoYearSeries} type="bar" height={300} />
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Tiempos de Defensa</h3>
                    {metrics.charts.boxplot.length > 0 ? (
                        <Chart options={boxplotOptions} series={[{ type: 'boxPlot', data: metrics.charts.boxplot }]} type="boxPlot" height={300} />
                    ) : <p className="text-slate-500">Insuficientes datos de tiempos</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Distribución Calidad</h3>
                    <Chart options={califOptions} series={califSeries} type="bar" height={300} />
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-2 relative h-[400px] overflow-hidden">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 px-2">Red de Colaboración (Asesores y Jurados)</h3>
                    {metrics.charts.graph.nodes.length > 0 ? (
                        <div className="absolute top-16 left-0 right-0 bottom-0 pointer-events-auto cursor-move" style={{ zIndex: 10 }}>
                            <ForceGraph2D
                                graphData={metrics.charts.graph}
                                width={800}
                                height={350}
                                defaultZoom={1.5}
                                nodeLabel="id"
                                nodeColor={n => n.group === 1 ? '#3b82f6' : '#f59e0b'}
                                nodeRelSize={5}
                                linkWidth={1}
                                linkColor={() => '#e2e8f0'}
                                backgroundColor="transparent"
                            />
                        </div>
                    ) : <p className="text-slate-500 px-2">No hay cruces de jurados en este período.</p>}
                </div>
            </div>
        </div>
    );
};
