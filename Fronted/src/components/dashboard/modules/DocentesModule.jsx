import React, { useMemo, useRef, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { createChart, HistogramSeries } from 'lightweight-charts';
import { Briefcase, Activity, Award, Users } from 'lucide-react';

// --- Componente LWC LineChart (Retención / Altas y Bajas) ---
const DynamicsChart = ({ altas, bajas }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        if (!altas || !bajas) return;

        const chart = createChart(chartContainerRef.current, {
            height: 300,
            layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#64748b' },
            grid: { vertLines: { visible: false }, horzLines: { color: '#e2e8f0' } },
            timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true }
        });

        // Altas (positivo, azul)
        const altasSeries = chart.addSeries(HistogramSeries, {
            color: '#3b82f6',
            title: 'Altas (Ingresos)',
        });

        // Bajas (negativo, rojo oscuro pero lo mostramos con valor absoluto para la barra y un color distinto)
        const bajasSeries = chart.addSeries(HistogramSeries, {
            color: '#ef4444',
            title: 'Bajas (Egresos)',
        });

        // Necesitamos asegurar que ambos tengan los mismos tiempos para que se vean apilados/balanceados
        const allYears = Array.from(new Set([...Object.keys(altas), ...Object.keys(bajas)])).sort();

        const finalAltas = allYears.map(y => ({ time: `${y}-01-01`, value: altas[y] || 0 }));
        const finalBajas = allYears.map(y => ({ time: `${y}-01-01`, value: -(bajas[y] || 0) }));

        altasSeries.setData(finalAltas);
        bajasSeries.setData(finalBajas);

        const handleResize = () => {
            if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [altas, bajas]);

    return <div ref={chartContainerRef} className="w-full" />;
};

// --- Tarjeta KPI ---
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




export const DocentesModule = ({ data }) => {
    const { teachers = [], students = [] } = data || {};

    const metrics = useMemo(() => {
        let activos = 0;
        let sumAntiguedad = 0;
        let c_antiguedad = 0;
        let phdCount = 0;

        const formacion = {};
        const vinculacion = {};
        const altas = {};
        const bajas = {};
        const tiemposRetencion = [];

        teachers.forEach(t => {
            if (t.activo !== false && t.estado !== 'Inactivo') {
                activos++;

                // Formación
                const form = t.formacion || t.Nivel_Formacion || 'Sin Dato';
                formacion[form] = (formacion[form] || 0) + 1;
                if (form.toLowerCase().includes('doctor')) phdCount++;

                // Vinculación
                const vinc = t.vinculacion || t.Tipo_Vinculacion || 'Sin Dato';
                vinculacion[vinc] = (vinculacion[vinc] || 0) + 1;
            }

            // Para dinámicas (altas/bajas)
            if (t.fecha_vinculacion) {
                const fVin = new Date(t.fecha_vinculacion);
                if (!isNaN(fVin.getTime())) {
                    const yearV = fVin.getFullYear();
                    altas[yearV] = (altas[yearV] || 0) + 1;

                    if (t.fecha_desvinculacion) {
                        const fDes = new Date(t.fecha_desvinculacion);
                        if (!isNaN(fDes.getTime())) {
                            const yearD = fDes.getFullYear();
                            bajas[yearD] = (bajas[yearD] || 0) + 1;

                            const añosObj = (fDes - fVin) / (1000 * 60 * 60 * 24 * 365);
                            if (añosObj > 0) tiemposRetencion.push(añosObj);
                        }
                    } else {
                        // Sigue activo
                        const añosObj = (new Date() - fVin) / (1000 * 60 * 60 * 24 * 365);
                        sumAntiguedad += añosObj;
                        c_antiguedad++;
                    }
                }
            }
        });

        const numEstudiantes = students.filter(s => s.estado === 'Activo' || s.estado === 'Matriculado' || s.estado === 'En Curso').length;
        const ratio = activos > 0 ? (numEstudiantes / activos).toFixed(1) : 0;
        const promAntiguedad = c_antiguedad > 0 ? (sumAntiguedad / c_antiguedad).toFixed(1) : 0;

        return {
            kpis: {
                activos,
                ratio,
                promAntiguedad,
                phdPerc: activos ? Math.round((phdCount / activos) * 100) : 0
            },
            charts: {
                formacion,
                vinculacion,
                altas,
                bajas
            }
        };
    }, [teachers, students]);

    const formacionOptions = {
        chart: { type: 'bar', toolbar: { show: false }, foreColor: '#94a3b8' },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'top' } } },
        xaxis: { categories: Object.keys(metrics.charts.formacion), labels: { style: { colors: '#94a3b8' } } },
        yaxis: { labels: { style: { colors: '#94a3b8' } } },
        colors: ['#8b5cf6'],
        tooltip: { theme: 'dark' }
    };
    const formacionSeries = [{ name: 'Docentes', data: Object.values(metrics.charts.formacion) }];

    const vinculacionOptions = {
        chart: { type: 'donut', fontFamily: 'Inter, sans-serif', foreColor: '#94a3b8' },
        labels: Object.keys(metrics.charts.vinculacion),
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
        legend: { position: 'bottom', labels: { colors: '#94a3b8' } },
        dataLabels: { enabled: false },
        tooltip: { theme: 'dark' }
    };
    const vinculacionSeries = Object.values(metrics.charts.vinculacion);

    if (!teachers || teachers.length === 0) {
        return <div className="p-8 text-center text-slate-500">No hay datos de docentes.</div>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Docentes Activos" value={metrics.kpis.activos} subtext="Plantilla actual" icon={Briefcase} colorClass="bg-blue-500 text-blue-500" />
                <KpiCard title="Relación Estudiantil" value={metrics.kpis.ratio} subtext="Estudiantes por Docente" icon={Users} colorClass="bg-purple-500 text-purple-500" />
                <KpiCard title="Antigüedad Promedio" value={`${metrics.kpis.promAntiguedad} a.`} subtext="Estabilidad laboral" icon={Activity} colorClass="bg-emerald-500 text-emerald-500" />
                <KpiCard title="Docentes con PhD" value={`${metrics.kpis.phdPerc}%`} subtext="Nivel formativo alto" icon={Award} colorClass="bg-amber-500 text-amber-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Nivel de Formación Actual</h3>
                    <Chart options={formacionOptions} series={formacionSeries} type="bar" height={300} />
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Tipo de Vinculación</h3>
                    <Chart options={vinculacionOptions} series={vinculacionSeries} type="donut" height={300} />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Dinámica de Ingresos y Egresos Docentes</h3>
                <p className="text-xs text-slate-400 mb-2">Eje X: Tiempo (Años) | Arriba: Altas (Nuevos), Abajo: Bajas (Retiros)</p>
                <DynamicsChart altas={metrics.charts.altas} bajas={metrics.charts.bajas} />
            </div>

        </div>
    );
};
