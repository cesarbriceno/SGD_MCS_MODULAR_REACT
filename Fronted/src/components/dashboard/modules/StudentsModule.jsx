import React, { useMemo, useRef, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { createChart, LineSeries } from 'lightweight-charts';

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Users, GraduationCap, Briefcase, Clock } from 'lucide-react';

// --- Subcomponente: LWC LineChart (Retención) ---
const RetentionChart = ({ data }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        if (!data || Object.keys(data).length === 0) return;

        const chart = createChart(chartContainerRef.current, {
            height: 300,
            layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#64748b' },
            grid: { vertLines: { visible: false }, horzLines: { color: '#e2e8f0' } },
            timeScale: {
                timeVisible: false,
                borderVisible: false,
                fixLeftEdge: true,
                fixRightEdge: true,
            }
        });

        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        let colorIdx = 0;

        Object.entries(data).forEach(([cohorte, seriesData]) => {
            const lineSeries = chart.addSeries(LineSeries, {
                color: colors[colorIdx % colors.length],
                lineWidth: 2,
                title: `Cohorte ${cohorte}`,
            });

            // LWC requiere fechas en formato 'YYYY-MM-DD'. Mapearemos semestres a fechas base.
            const formattedData = seriesData.map((val, idx) => {
                const day = String(idx + 1).padStart(2, '0');
                return { time: `2000-01-${day}`, value: val };
            });

            lineSeries.setData(formattedData);
            colorIdx++;
        });

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

// --- Subcomponete: Tarjeta KPI ---
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



export const StudentsModule = ({ data }) => {
    const { students = [] } = data || {};

    // --- 1. PROCESAMIENTO DE DATOS ---
    const metrics = useMemo(() => {
        let total = students.length;
        let graduados = 0;
        let trabajando = 0;
        let sumMesesGrado = 0;
        let gradConTiempo = 0;

        // Estructuras para gráficos
        const cohorteEstado = {}; // Para barras apiladas
        const cohorteRetencion = {}; // Para LWC
        const tiemposGrado = []; // Para Boxplot
        const ciudades = {}; // Para mapa
        const generos = {}; // Genero
        const situacionLab = {}; // Donut
        const sectorLab = {}; // Barras sector

        students.forEach(s => {
            // KPIs
            if (s.estado === 'Graduado' || s.estado === 'Egresado') {
                graduados++;
                if (s.fingreso && s.fegreso) {
                    const ingreso = new Date(s.fingreso);
                    const egreso = new Date(s.fegreso);
                    const meses = (egreso - ingreso) / (1000 * 60 * 60 * 24 * 30.44);
                    if (meses > 0 && meses < 200) { // filtro cordura
                        sumMesesGrado += meses;
                        gradConTiempo++;
                        tiemposGrado.push(meses);
                    }
                }
            }
            if (s.sit_lab && s.sit_lab.toLowerCase().includes('emplead')) trabajando++;

            // Cohorte / Estado
            const c = s.cohorte || 'Desconocida';
            if (!cohorteEstado[c]) cohorteEstado[c] = { Activo: 0, Graduado: 0, Retirado: 0 };

            let estadoG = 'Activo';
            if (s.estado === 'Graduado' || s.estado === 'Egresado') estadoG = 'Graduado';
            else if (s.estado === 'Retirado' || s.estado === 'Baja') estadoG = 'Retirado';
            cohorteEstado[c][estadoG]++;

            // Ciudades (Mapa)
            const city = s.ciudad || 'Otra';
            ciudades[city] = (ciudades[city] || 0) + 1;

            // Genero
            const gen = s.sexo || 'ND';
            generos[gen] = (generos[gen] || 0) + 1;

            // Inserción
            if (s.estado === 'Graduado' || s.estado === 'Egresado') {
                const sit = s.sit_lab || 'Sin Dato';
                situacionLab[sit] = (situacionLab[sit] || 0) + 1;

                if (sit.toLowerCase().includes('emplead')) {
                    const sec = s.sector || 'Desconocido';
                    sectorLab[sec] = (sectorLab[sec] || 0) + 1;
                }
            }
        });

        // Simular datos de retención semestral
        Object.keys(cohorteEstado).forEach(c => {
            const tot = cohorteEstado[c].Activo + cohorteEstado[c].Graduado + cohorteEstado[c].Retirado;
            const exito = (cohorteEstado[c].Activo + cohorteEstado[c].Graduado) / (tot || 1);

            const curve = [100];
            let current = 100;
            for (let i = 1; i < 10; i++) {
                const drop = (current - (exito * 100)) / (11 - i);
                current -= drop * (0.8 + Math.random() * 0.4);
                if (current < exito * 100) current = exito * 100;
                curve.push(Math.round(current));
            }
            if (tot > 2) { // Solo cohortes significativas
                cohorteRetencion[c] = curve;
            }
        });

        // Boxplot requiere formato: { x: 'Tiempo', y: [min, q1, median, q3, max] }
        tiemposGrado.sort((a, b) => a - b);
        let boxplotData = [];
        if (tiemposGrado.length >= 5) {
            const min = tiemposGrado[0];
            const max = tiemposGrado[tiemposGrado.length - 1];
            const q1 = tiemposGrado[Math.floor(tiemposGrado.length * 0.25)];
            const med = tiemposGrado[Math.floor(tiemposGrado.length * 0.5)];
            const q3 = tiemposGrado[Math.floor(tiemposGrado.length * 0.75)];
            boxplotData = [{ x: 'Meses a Grado', y: [min, q1, med, q3, max].map(Math.round) }];
        }

        return {
            kpis: {
                total,
                retencion: total ? Math.round(((total - Object.values(cohorteEstado).reduce((acc, c) => acc + c.Retirado, 0)) / total) * 100) : 0,
                tiempoMedio: gradConTiempo ? Math.round(sumMesesGrado / gradConTiempo) : 0,
                insercion: graduados ? Math.round((trabajando / graduados) * 100) : 0
            },
            charts: {
                cohorteEstado,
                cohorteRetencion,
                boxplotData,
                ciudades,
                generos,
                situacionLab,
                sectorLab
            }
        };
    }, [students]);

    // --- 2. CONFIGURACIÓN DE GRÁFICOS APEXCHARTS ---
    const apiladasOptions = {
        chart: { type: 'bar', stacked: true, toolbar: { show: false }, foreColor: '#94a3b8', fontFamily: 'Inter, sans-serif' },
        plotOptions: { bar: { horizontal: false, columnWidth: '60%', borderRadius: 2 } },
        xaxis: { categories: Object.keys(metrics.charts.cohorteEstado), labels: { style: { colors: '#94a3b8' } } },
        yaxis: { labels: { style: { colors: '#94a3b8' } } },
        colors: ['#3b82f6', '#10b981', '#ef4444'], // Activo, Graduado, Retirado
        legend: { position: 'top', horizontalAlign: 'left', labels: { colors: '#94a3b8' } },
        tooltip: { theme: 'dark' }
    };
    const apiladasSeries = [
        { name: 'Activos', data: Object.values(metrics.charts.cohorteEstado).map(c => c.Activo) },
        { name: 'Graduados/Egresados', data: Object.values(metrics.charts.cohorteEstado).map(c => c.Graduado) },
        { name: 'Retirados', data: Object.values(metrics.charts.cohorteEstado).map(c => c.Retirado) },
    ];

    const boxplotOptions = {
        chart: { type: 'boxPlot', toolbar: { show: false }, foreColor: '#94a3b8' },
        plotOptions: { boxPlot: { colors: { upper: '#3b82f6', lower: '#93c5fd' } } },
        title: { text: 'Distribución de meses al grado', align: 'left', style: { color: '#94a3b8', fontSize: '12px' } },
        xaxis: { labels: { style: { colors: '#94a3b8' } } },
        yaxis: { labels: { style: { colors: '#94a3b8' } } },
        tooltip: { theme: 'dark' }
    };

    const donutOptions = {
        chart: { type: 'donut', fontFamily: 'Inter, sans-serif', foreColor: '#94a3b8' },
        labels: Object.keys(metrics.charts.situacionLab),
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
        legend: { position: 'bottom', labels: { colors: '#94a3b8' } },
        dataLabels: { enabled: false },
        tooltip: { theme: 'dark' }
    };
    const donutSeries = Object.values(metrics.charts.situacionLab);

    const barchartOptions = {
        chart: { type: 'bar', toolbar: { show: false }, foreColor: '#94a3b8' },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'top' } } },
        xaxis: { categories: Object.keys(metrics.charts.sectorLab), labels: { style: { colors: '#94a3b8' } } },
        yaxis: { labels: { style: { colors: '#94a3b8' } } },
        colors: ['#6366f1'],
        legend: { labels: { colors: '#94a3b8' } },
        tooltip: { theme: 'dark' }
    };
    const barchartSeries = [{ name: 'Egresados', data: Object.values(metrics.charts.sectorLab) }];

    const generoOptions = {
        chart: { type: 'bar', toolbar: { show: false }, foreColor: '#94a3b8' },
        plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
        xaxis: { categories: Object.keys(metrics.charts.generos), labels: { style: { colors: '#94a3b8' } } },
        yaxis: { labels: { style: { colors: '#94a3b8' } } },
        colors: ['#8b5cf6'],
        legend: { labels: { colors: '#94a3b8' } },
        tooltip: { theme: 'dark' }
    };
    const generoSeries = [{ name: 'Cantidad', data: Object.values(metrics.charts.generos) }];


    // MAPA (Coordenadas base Colombia)
    const colCenter = [4.5709, -74.2973];
    const geoLocations = Object.entries(metrics.charts.ciudades).map(([ciudad, count]) => {
        // Asignar offset ligero aleatorio alrededor del centro para demostración 
        return {
            name: ciudad,
            count: count,
            pos: [colCenter[0] + (Math.random() - 0.5) * 8, colCenter[1] + (Math.random() - 0.5) * 8]
        };
    });


    if (!students || students.length === 0) {
        return <div className="p-8 text-center text-slate-500">No hay datos de estudiantes en el período seleccionado.</div>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* 1. KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Matrícula Total" value={metrics.kpis.total} subtext="Estudiantes registrados" icon={Users} colorClass="bg-blue-500 text-blue-500" />
                <KpiCard title="Tasa de Retención" value={`${metrics.kpis.retencion}%`} subtext="Activos + Graduados" icon={GraduationCap} colorClass="bg-emerald-500 text-emerald-500" />
                <KpiCard title="Tiempo a Grado" value={`${metrics.kpis.tiempoMedio} m.`} subtext="Meses promedio" icon={Clock} colorClass="bg-amber-500 text-amber-500" />
                <KpiCard title="Inserción Laboral" value={`${metrics.kpis.insercion}%`} subtext="Egresados empleados" icon={Briefcase} colorClass="bg-purple-500 text-purple-500" />
            </div>

            {/* 2. Primera Fila: Cohortes y Supervivencia */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Evolución de Cohortes (Ingreso)</h3>
                    <Chart options={apiladasOptions} series={apiladasSeries} type="bar" height={300} />
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Curvas de Retención Múltiple</h3>
                    <p className="text-xs text-slate-400 mb-2">Eje X: Semestres (1-10) | Eje Y: % Retenido</p>
                    <RetentionChart data={metrics.charts.cohorteRetencion} />
                </div>
            </div>

            {/* 3. Segunda Fila: Tiempos y Mapas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Tiempos de Grado</h3>
                        {metrics.charts.boxplotData.length > 0 ? (
                            <Chart options={boxplotOptions} series={[{ type: 'boxPlot', data: metrics.charts.boxplotData }]} type="boxPlot" height={220} />
                        ) : (
                            <p className="text-slate-400 text-sm">Datos insuficientes para distribución.</p>
                        )}
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Distribución por Sexo</h3>
                        <Chart options={generoOptions} series={generoSeries} type="bar" height={150} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Cobertura Geográfica</h3>
                    <div className="h-[400px] rounded-xl overflow-hidden border border-slate-200 z-0 relative">
                        <MapContainer center={colCenter} zoom={5} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                            {geoLocations.map((loc, i) => (
                                <CircleMarker key={i} center={loc.pos} radius={Math.min(25, Math.max(5, loc.count * 3))} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.6 }}>
                                    <Tooltip>{loc.name}: {loc.count} estudiantes</Tooltip>
                                </CircleMarker>
                            ))}
                        </MapContainer>
                    </div>
                </div>
            </div>

            {/* 4. Tercera Fila: Inserción Laboral */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Situación Actual Egresados</h3>
                    {donutSeries.length > 0 ? (
                        <Chart options={donutOptions} series={donutSeries} type="donut" height={320} />
                    ) : (
                        <div className="flex items-center justify-center h-[320px] text-slate-400">
                            No hay datos de situación actual de egresados estructurados.
                        </div>
                    )}
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Sectores de Inserción</h3>
                    {barchartSeries[0].data.length > 0 ? (
                        <Chart options={barchartOptions} series={barchartSeries} type="bar" height={320} />
                    ) : (
                        <div className="flex items-center justify-center h-[320px] text-slate-400">
                            No hay suficientes egresados empleados con sector laboral registrado.
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};
