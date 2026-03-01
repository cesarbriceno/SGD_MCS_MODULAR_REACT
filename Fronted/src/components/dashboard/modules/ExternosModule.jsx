import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { Users, Globe2, Building2, Briefcase } from 'lucide-react';

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

export const ExternosModule = ({ data }) => {
    const { externs = [] } = data || {};

    const metrics = useMemo(() => {
        let total = externs.length;
        const paisesSet = new Set();
        const organizacionesSet = new Set();

        const origenHist = {};
        const sexoHist = {};
        const paisHist = {};

        externs.forEach(ex => {
            const pais = ex['Pais'] || 'Colombia';
            paisesSet.add(pais);
            paisHist[pais] = (paisHist[pais] || 0) + 1;

            const org = ex['Organizacion'] || 'Independiente';
            organizacionesSet.add(org);

            const origen = ex['Tipo_Origen'] || 'Otro';
            origenHist[origen] = (origenHist[origen] || 0) + 1;

            const sexo = ex['Sexo'] || 'No Responde';
            sexoHist[sexo] = (sexoHist[sexo] || 0) + 1;
        });

        // Ordenar paises para el gráfico Pareto o Barras
        const paisData = Object.entries(paisHist).sort((a, b) => b[1] - a[1]).slice(0, 5);

        return {
            kpis: {
                total,
                paisesCount: paisesSet.size,
                orgCount: organizacionesSet.size
            },
            charts: {
                origen: origenHist,
                sexo: sexoHist,
                paises: paisData
            }
        };
    }, [externs]);

    // Opciones de los Gráficos ApexCharts con Tema Oscuro adaptado
    const donutOptions = (labels) => ({
        chart: { type: 'donut', fontFamily: 'Inter, sans-serif', foreColor: '#94a3b8' },
        labels: labels,
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
        legend: { position: 'bottom', labels: { colors: '#94a3b8' } },
        dataLabels: { enabled: false },
        tooltip: { theme: 'dark' }
    });

    const barOptions = {
        chart: { type: 'bar', toolbar: { show: false }, foreColor: '#94a3b8' },
        plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
        xaxis: { categories: metrics.charts.paises.map(p => p[0]), labels: { style: { colors: '#94a3b8' } } },
        yaxis: { labels: { style: { colors: '#94a3b8' } } },
        colors: ['#8b5cf6'],
        dataLabels: { enabled: false },
        tooltip: { theme: 'dark' }
    };

    if (!externs || externs.length === 0) {
        return <div className="p-8 text-center text-slate-500">No hay datos de Participantes Externos.</div>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Total Participantes" value={metrics.kpis.total} subtext="Expertos e invitados" icon={Users} colorClass="bg-blue-500 text-blue-500" />
                <KpiCard title="Países de Origen" value={metrics.kpis.paisesCount} subtext="Naciones distintas presentes" icon={Globe2} colorClass="bg-emerald-500 text-emerald-500" />
                <KpiCard title="Empresas / Instituciones" value={metrics.kpis.orgCount} subtext="Entidades con participación" icon={Building2} colorClass="bg-amber-500 text-amber-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Rol / Tipo de Origen</h3>
                    <Chart options={donutOptions(Object.keys(metrics.charts.origen))} series={Object.values(metrics.charts.origen)} type="donut" height={300} />
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Composición por Género</h3>
                    <Chart options={donutOptions(Object.keys(metrics.charts.sexo))} series={Object.values(metrics.charts.sexo)} type="donut" height={300} />
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Top 5 Países Presentes</h3>
                    <Chart options={barOptions} series={[{ name: 'Participantes', data: metrics.charts.paises.map(p => p[1]) }]} type="bar" height={300} />
                </div>
            </div>
        </div>
    );
};
