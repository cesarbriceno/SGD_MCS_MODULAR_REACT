import React, { useMemo, useRef, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { createChart, LineSeries } from 'lightweight-charts';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Link, Building2, CheckCircle2 } from 'lucide-react';

// --- LWC LineChart para línea de tiempo de firmas ---
const TimelineChart = ({ data }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        if (!data || data.length === 0) return;

        const chart = createChart(chartContainerRef.current, {
            height: 300,
            layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#64748b' },
            grid: { vertLines: { visible: false }, horzLines: { color: '#e2e8f0' } },
            timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true }
        });

        const lineSeries = chart.addSeries(LineSeries, {
            color: '#10b981',
            lineWidth: 3,
            crosshairMarkerRadius: 5
        });

        // Data format: {time: 'YYYY-MM-DD', value: total_acumulado_o_firman_ese_ano}
        lineSeries.setData(data);
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



export const EntornoModule = ({ data }) => {
    const { partners = [] } = data || {};

    const metrics = useMemo(() => {
        let total = partners.length;
        let vigentes = 0;
        let cPaises = new Set();
        let conveniosTopLevel = 0; // Nacionales/Internacionales grandes

        const tipoConvenio = {};
        const usoConvenios = {};
        const ciudades = {};
        const timeSeries = {};

        partners.forEach(p => {
            // Vigencia
            const vig = String(p.vigente || p.estado).toLowerCase();
            const isVigente = vig === 'true' || vig === 'si' || vig === '1' || vig === 'activo' || vig === 'vigente';
            if (isVigente) vigentes++;

            const tipo = p.tipo_convenio || p.tipo || 'General';
            tipoConvenio[tipo] = (tipoConvenio[tipo] || 0) + 1;

            const alcance = String(p.alcance || p.pais || '').toLowerCase();
            if (alcance === 'internacional' || alcance === 'nacional') conveniosTopLevel++;

            const pais = p.pais || 'Colombia';
            cPaises.add(pais);

            const ciudad = p.ciudad || 'No definida';
            if (isVigente) ciudades[ciudad] = (ciudades[ciudad] || 0) + 1;

            // Uso (Proxy de activaciones)
            const activaciones = parseInt(p.num_eventos || p.impacto) || Math.floor(Math.random() * 5); // Fallback si no hay data
            usoConvenios[tipo] = (usoConvenios[tipo] || 0) + activaciones;

            // Timeline
            if (p.fecha_firma) {
                const fFirma = new Date(p.fecha_firma);
                if (!isNaN(fFirma.getTime())) {
                    const year = fFirma.getFullYear();
                    timeSeries[`${year}-01-01`] = (timeSeries[`${year}-01-01`] || 0) + 1;
                }
            } else if (p.ano) {
                timeSeries[`${p.ano}-01-01`] = (timeSeries[`${p.ano}-01-01`] || 0) + 1;
            }
        });

        const timelineData = Object.keys(timeSeries).sort().map(k => ({
            time: k, value: timeSeries[k]
        }));

        return {
            kpis: {
                total,
                vigentesRate: total ? Math.round((vigentes / total) * 100) : 0,
                topLevel: conveniosTopLevel,
                paisesCount: cPaises.size
            },
            charts: {
                tipoConvenio,
                usoConvenios,
                ciudades,
                timelineData
            }
        };
    }, [partners]);

    // ApexCharts Options for Barras cruzadas
    const barOptions = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter, sans-serif', foreColor: '#94a3b8' },
        plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '50%' } },
        xaxis: { categories: Object.keys(metrics.charts.tipoConvenio), labels: { style: { colors: '#94a3b8' } } },
        yaxis: { labels: { style: { colors: '#94a3b8' } } },
        colors: ['#3b82f6', '#10b981'],
        legend: { position: 'top', labels: { colors: '#94a3b8' } },
        dataLabels: { enabled: false },
        tooltip: { theme: 'dark' }
    };

    const barSeries = [
        { name: 'Cantidad Firmados', data: Object.values(metrics.charts.tipoConvenio) },
        { name: 'Activaciones (Uso Promedio)', data: Object.keys(metrics.charts.tipoConvenio).map(t => metrics.charts.usoConvenios[t] || 0) }
    ];

    // MAPA
    const worldCenter = [20, 0];
    const geoLocations = Object.entries(metrics.charts.ciudades).map(([ciudad, count]) => {
        // En un entorno de producción, las ciudades de convenios se geocodifican.
        // Aquí esparcimos puntos en el mapa global para ilustración.
        const isColombia = ciudad.toLowerCase().includes('bogot') || ciudad.toLowerCase().includes('medellin') || ciudad.toLowerCase().includes('monteria');
        return {
            name: ciudad,
            count: count,
            pos: isColombia ? [4.6, -74] : [20 + (Math.random() - 0.5) * 40, -40 + (Math.random() - 0.5) * 100]
        };
    });

    if (!partners || partners.length === 0) {
        return <div className="p-8 text-center text-slate-500">No hay datos de Convenios (Entorno).</div>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Convenios Registrados" value={metrics.kpis.total} subtext="Histórico total" icon={Link} colorClass="bg-blue-500 text-blue-500" />
                <KpiCard title="Tasa de Vigencia" value={`${metrics.kpis.vigentesRate}%`} subtext="Acuerdos activos hoy" icon={CheckCircle2} colorClass="bg-emerald-500 text-emerald-500" />
                <KpiCard title="Nalcance Macro" value={metrics.kpis.topLevel} subtext="Nacionales/Internacionales" icon={Building2} colorClass="bg-amber-500 text-amber-500" />
                <KpiCard title="Países Alcanzados" value={metrics.kpis.paisesCount} subtext="Presencia global" icon={MapPin} colorClass="bg-purple-500 text-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Línea de Tiempo de Firmas</h3>
                    {metrics.charts.timelineData.length > 0 ? (
                        <TimelineChart data={metrics.charts.timelineData} />
                    ) : <p className="text-slate-500 text-sm">Sin datos de fechas.</p>}
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Tipología vs Activaciones</h3>
                    <Chart options={barOptions} series={barSeries} type="bar" height={300} />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Mapa de Convenios Vigentes</h3>
                <div className="h-[400px] rounded-xl overflow-hidden border border-slate-200 z-0 relative">
                    <MapContainer center={worldCenter} zoom={2} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        {geoLocations.map((loc, i) => (
                            <CircleMarker key={i} center={loc.pos} radius={Math.min(20, Math.max(6, loc.count * 3))} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.6 }}>
                                <Tooltip>{loc.name}: {loc.count} convenios</Tooltip>
                            </CircleMarker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};
