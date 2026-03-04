import React, { useMemo, useRef, useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { createChart, LineSeries } from 'lightweight-charts';
import html2canvas from 'html2canvas';

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Users, GraduationCap, Briefcase, Clock, Maximize2, FileDown, ChevronDown, Download } from 'lucide-react';

// --- Hook para detectar Modo Oscuro ---
const useDarkMode = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const root = window.document.documentElement;
        const checkMode = () => setIsDark(root.classList.contains('dark'));

        checkMode(); // Inicial

        const observer = new MutationObserver(checkMode);
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    return isDark;
};

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

        Object.entries(data).forEach(([semestre, seriesData]) => {
            const lineSeries = chart.addSeries(LineSeries, {
                color: colors[colorIdx % colors.length],
                lineWidth: 2,
                title: `Semestre ${semestre}`,
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
    const [viewMode, setViewMode] = useState('semester'); // 'semester' o 'year'
    const isDark = useDarkMode(); // Observamos los cambios de tema
    const chartTextColor = isDark ? '#cbd5e1' : '#475569'; // Slate-300 vs Slate-600
    const gridColor = isDark ? '#334155' : '#e2e8f0';

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

            // Semestre o Año / Estado
            const fullCohorte = s.cohorte || 'Desconocida';
            const c = viewMode === 'year' ? (fullCohorte !== 'Desconocida' ? fullCohorte.substring(0, 4) : 'Desconocida') : fullCohorte;

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

        // Calcular Métricas Especiales por Semestre (Permanencia, Graduados, Deserción)
        const sortedCohortes = Object.keys(cohorteEstado)
            .filter(c => c !== 'Desconocida')
            .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

        const metricasCohortes = {
            categories: sortedCohortes, // Sin prefijo "SEM. ", solo el valor (ej. 2020-2)
            permanencia: [],
            graduados: [],
            desercion: [],
            total: []
        };

        sortedCohortes.forEach(c => {
            const activos = cohorteEstado[c].Activo;
            const graduados = cohorteEstado[c].Graduado;
            const retirados = cohorteEstado[c].Retirado;
            const total = activos + graduados + retirados;

            if (total > 0) {
                metricasCohortes.permanencia.push(Math.round(((activos + graduados) / total) * 100));
                metricasCohortes.graduados.push(Math.round((graduados / total) * 100));
                metricasCohortes.desercion.push(Math.round((retirados / total) * 100));
                metricasCohortes.total.push(total);
            } else {
                metricasCohortes.permanencia.push(0);
                metricasCohortes.graduados.push(0);
                metricasCohortes.desercion.push(0);
                metricasCohortes.total.push(0);
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
                metricasCohortes,
                boxplotData,
                ciudades,
                generos,
                situacionLab,
                sectorLab
            }
        };
    }, [students, viewMode]);

    // Función para descargar la tarjeta completa (Gráfico + Análisis)
    const downloadCard = async (id, title) => {
        const element = document.getElementById(id);
        if (!element) return;

        // Abrir detalles para que salgan en la foto
        const detailsObj = element.querySelector('details');
        const wasOpen = detailsObj ? detailsObj.open : false;
        if (detailsObj) detailsObj.open = true;

        // Pequeño delay para asegurar que el DOM se actualice antes del pantallazo
        await new Promise(resolve => setTimeout(resolve, 150));

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                scale: 2
            });
            const link = document.createElement('a');
            link.download = `${title}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error("Error descargando la imagen", error);
        } finally {
            if (detailsObj && !wasOpen) detailsObj.open = false; // Restaurar estado
        }
    };

    // --- 2. CONFIGURACIÓN DE GRÁFICOS APEXCHARTS ---
    const apiladasOptions = {
        chart: { type: 'bar', stacked: true, toolbar: { show: true, tools: { download: true, selection: false, zoom: false, pan: false } }, background: 'transparent', foreColor: chartTextColor, fontFamily: 'Inter, sans-serif' },
        plotOptions: { bar: { horizontal: false, columnWidth: '60%', borderRadius: 2 } },
        xaxis: { categories: Object.keys(metrics.charts.cohorteEstado), labels: { style: { colors: chartTextColor } } },
        yaxis: { labels: { style: { colors: chartTextColor } } },
        colors: ['#3b82f6', '#10b981', '#ef4444'], // Activo, Graduado, Retirado
        legend: { position: 'top', horizontalAlign: 'left', labels: { colors: chartTextColor } },
        grid: { borderColor: gridColor, strokeDashArray: 4 },
        tooltip: { theme: isDark ? 'dark' : 'light' }
    };
    const apiladasSeries = [
        { name: 'Activos', data: Object.values(metrics.charts.cohorteEstado).map(c => c.Activo) },
        { name: 'Graduados/Egresados', data: Object.values(metrics.charts.cohorteEstado).map(c => c.Graduado) },
        { name: 'Retirados', data: Object.values(metrics.charts.cohorteEstado).map(c => c.Retirado) },
    ];

    const boxplotOptions = {
        chart: { type: 'boxPlot', toolbar: { show: false }, foreColor: chartTextColor },
        plotOptions: { boxPlot: { colors: { upper: '#3b82f6', lower: '#93c5fd' } } },
        title: { text: 'Distribución de meses al grado', align: 'left', style: { color: chartTextColor, fontSize: '12px' } },
        xaxis: { labels: { style: { colors: chartTextColor } } },
        yaxis: { labels: { style: { colors: chartTextColor } } },
        grid: { borderColor: gridColor, strokeDashArray: 4 },
        tooltip: { theme: isDark ? 'dark' : 'light' }
    };

    // Configuraciones de Gráficos de Semestre
    const chartBaseOptions = {
        chart: { toolbar: { show: true, tools: { download: true, selection: false, zoom: false, pan: false } }, background: 'transparent', foreColor: chartTextColor, fontFamily: 'Inter, sans-serif' },
        xaxis: { categories: metrics.charts.metricasCohortes.categories, labels: { style: { colors: chartTextColor } } },
        yaxis: { min: 0, labels: { style: { colors: chartTextColor } } },
        dataLabels: { enabled: true, offsetY: -5, background: { enabled: false }, style: { colors: [isDark ? '#e2e8f0' : '#1e293b'], fontWeight: 'bold' } },
        tooltip: { theme: isDark ? 'dark' : 'light' },
        grid: { borderColor: gridColor, strokeDashArray: 4 }
    };

    const permanenciaOptions = {
        ...chartBaseOptions,
        chart: { ...chartBaseOptions.chart, type: 'area' },
        colors: ['#0f4c75'], // Azul oscuro (basado en la imagen)
        yaxis: { ...chartBaseOptions.yaxis, max: 110, labels: { formatter: (val) => val + '%' } },
        dataLabels: {
            enabled: true,
            offsetY: -5,
            formatter: (val) => val + '%',
            background: { enabled: true, foreColor: '#1e293b', dropShadow: { enabled: false }, padding: 4, borderRadius: 4, borderWidth: 0 },
            style: { colors: ['#ffffff'], fontWeight: 'bold' }
        },
        fill: { type: 'solid', opacity: 0.9 },
        stroke: { curve: 'straight', width: 2 }
    };

    const graduadosOptions = {
        ...chartBaseOptions,
        chart: { ...chartBaseOptions.chart, type: 'line' },
        colors: ['#0f4c75'],
        yaxis: { ...chartBaseOptions.yaxis, max: 110, tickAmount: 5, labels: { formatter: (val) => val + '%' } },
        dataLabels: {
            enabled: true,
            offsetY: -5,
            formatter: (val) => val + '%',
            background: { enabled: true, foreColor: '#1e293b', dropShadow: { enabled: false }, padding: 4, borderRadius: 4, borderWidth: 0 },
            style: { colors: ['#ffffff'], fontWeight: 'bold' }
        },
        stroke: { curve: 'straight', width: 4 },
        markers: { size: 5, colors: ['#0f4c75'], strokeColors: '#fff', strokeWidth: 2 }
    };

    const desercionOptions = {
        ...chartBaseOptions,
        chart: { ...chartBaseOptions.chart, type: 'line' },
        colors: ['#0f4c75'],
        yaxis: { ...chartBaseOptions.yaxis, max: 110, tickAmount: 5, labels: { formatter: (val) => val + '%' } },
        dataLabels: { enabled: false },
        stroke: { curve: 'straight', width: 3 },
        markers: { size: 0 }
    };

    const numEstudiantesOptions = {
        ...chartBaseOptions,
        chart: { ...chartBaseOptions.chart, type: 'bar' },
        colors: ['#3b82f6'],
        plotOptions: { bar: { columnWidth: '40%', borderRadius: 2 } },
        yaxis: { ...chartBaseOptions.yaxis, max: Math.max(...(metrics.charts.metricasCohortes.total.length ? metrics.charts.metricasCohortes.total : [10])) * 1.15, labels: { style: { colors: chartTextColor }, formatter: (v) => Math.round(v) } },
        dataLabels: {
            enabled: true,
            position: 'top',
            offsetY: -15,
            background: { enabled: true, foreColor: '#3b82f6', dropShadow: { enabled: false }, padding: 4, borderRadius: 4, borderWidth: 0 },
            style: { colors: ['#ffffff'], fontWeight: 'bold' }
        }
    };

    const donutOptions = {
        chart: { type: 'donut', fontFamily: 'Inter, sans-serif', foreColor: chartTextColor },
        labels: Object.keys(metrics.charts.situacionLab),
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
        legend: { position: 'bottom', labels: { colors: chartTextColor } },
        dataLabels: { enabled: false },
        tooltip: { theme: isDark ? 'dark' : 'light' }
    };
    const donutSeries = Object.values(metrics.charts.situacionLab);

    const barchartOptions = {
        chart: { type: 'bar', toolbar: { show: false }, foreColor: chartTextColor },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'top' } } },
        xaxis: { categories: Object.keys(metrics.charts.sectorLab), labels: { style: { colors: chartTextColor } } },
        yaxis: { labels: { style: { colors: chartTextColor } } },
        colors: ['#6366f1'],
        legend: { labels: { colors: chartTextColor } },
        grid: { borderColor: gridColor, strokeDashArray: 4 },
        tooltip: { theme: isDark ? 'dark' : 'light' }
    };
    const barchartSeries = [{ name: 'Egresados', data: Object.values(metrics.charts.sectorLab) }];

    const generoOptions = {
        chart: { type: 'bar', toolbar: { show: false }, foreColor: chartTextColor },
        plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
        xaxis: { categories: Object.keys(metrics.charts.generos), labels: { style: { colors: chartTextColor } } },
        yaxis: { labels: { style: { colors: chartTextColor } } },
        colors: ['#8b5cf6'],
        legend: { labels: { colors: chartTextColor } },
        grid: { borderColor: gridColor, strokeDashArray: 4 },
        tooltip: { theme: isDark ? 'dark' : 'light' }
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

    // --- GENERACIÓN DE CONCLUSIONES DINÁMICAS ---
    const getDynamicConclusions = () => {
        const categories = metrics.charts.metricasCohortes.categories;
        const perms = metrics.charts.metricasCohortes.permanencia;
        const grads = metrics.charts.metricasCohortes.graduados;
        const totals = metrics.charts.metricasCohortes.total;
        const desercs = metrics.charts.metricasCohortes.desercion;
        const unit = viewMode === 'year' ? 'año' : 'semestre';

        if (!categories || categories.length === 0) return {};

        // Permanencia
        const lastPerm = perms[perms.length - 1];
        const prevPerm = perms.length > 1 ? perms[perms.length - 2] : null;
        let permText = `El ${unit} más reciente (${categories[categories.length - 1]}) presenta una permanencia del ${lastPerm}%. `;
        if (prevPerm !== null) {
            permText += lastPerm > prevPerm ? `Se observa una mejora respecto al ${unit} anterior (${prevPerm}%).` : (lastPerm < prevPerm ? `Se observa una disminución respecto al ${unit} anterior (${prevPerm}%).` : `Se mantiene estable comparado con el ${unit} anterior.`);
        }

        // Graduados
        const maxGradIdx = grads.indexOf(Math.max(...grads));
        const maxGradVal = grads[maxGradIdx];
        const gradText = maxGradVal > 0 ? `El ${unit} ${categories[maxGradIdx]} destaca con la mayor tasa de graduados (${maxGradVal}%). Los períodos recientes muestran porcentajes bajos o nulos debido a que aún se encuentran en curso.` : `Aún no se registran graduados significativos en las cohortes listadas.`;

        // Estudiantes (Matrícula)
        const maxTotalIdx = totals.indexOf(Math.max(...totals));
        const avgTotal = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
        const totalText = `El volumen promedio de ingresos ha sido de ${avgTotal} estudiantes por ${unit}. El pico de admisión histórico fue en ${categories[maxTotalIdx]} con ${totals[maxTotalIdx]} estudiantes inscritos.`;

        // Deserción
        const maxDesIdx = desercs.indexOf(Math.max(...desercs));
        const minDesIdx = desercs.indexOf(Math.min(...desercs));
        const desText = Math.max(...desercs) > 0 ? `La deserción más crítica se registró en el ${unit} ${categories[maxDesIdx]} con un ${desercs[maxDesIdx]}%. En contraste, el ${unit} ${categories[minDesIdx]} presentó la tasa más baja (${desercs[minDesIdx]}%), lo que sugiere un mejor desempeño retentivo en este último.` : `No se registran tasas notables de deserción en los períodos evaluados.`;

        // Evolucion Ingresos (Apiladas)
        const categoriasEstado = metrics.charts.cohorteEstado;
        let activosTotal = 0, graduadosTotal = 0, retiradosTotal = 0;
        Object.values(categoriasEstado).forEach(v => {
            activosTotal += v.Activo || 0;
            graduadosTotal += v.Graduado || 0;
            retiradosTotal += v.Retirado || 0;
        });
        const estadoMayor = Math.max(activosTotal, graduadosTotal, retiradosTotal);
        const tipoMayor = estadoMayor === activosTotal ? 'Activos' : (estadoMayor === graduadosTotal ? 'Graduados' : 'Retirados');
        const evoText = `Históricamente, la mayor proporción de estudiantes se encuentra en estado '${tipoMayor}' con un total de ${estadoMayor} estudiantes sumando todos los períodos analizados.`;

        // Tiempos Grado
        const tgData = metrics.charts.boxplotData[0]?.y;
        const tgText = tgData ? `El 50% de los estudiantes se gradúan en menos de ${tgData[2]} meses (Mediana). El tiempo mínimo registrado es de ${tgData[0]} meses y el máximo de ${tgData[4]} meses.` : "No hay suficientes datos puntuales para establecer una distribución de tiempos.";

        // Distribucion Sexo
        const genEntries = Object.entries(metrics.charts.generos).sort((a, b) => b[1] - a[1]);
        const genMayor = genEntries.length > 0 ? genEntries[0] : null;
        const sexoText = genMayor ? `La población estudiantil está liderada por el género '${genMayor[0]}' con ${genMayor[1]} representantes.` : "No hay datos de género disponibles.";

        // Ubicacion
        const ubiEntries = Object.entries(metrics.charts.ciudades).sort((a, b) => b[1] - a[1]);
        const ubiMayor = ubiEntries.length > 0 ? ubiEntries[0] : null;
        const ubiText = ubiMayor ? `El mayor foco demográfico de estudiantes matriculados proviene de la ciudad de ${ubiMayor[0]}, abarcando ${ubiMayor[1]} registros inscritos.` : "No hay registros de ubicaciones válidas.";

        // Situacion Laboral
        const labEntries = Object.entries(metrics.charts.situacionLab).sort((a, b) => b[1] - a[1]);
        const labMayor = labEntries.length > 0 ? labEntries[0] : null;
        const labText = labMayor ? `La situación predominante entre los egresados encuestados es '${labMayor[0]}'.` : "No hay suficientes egresados encuestados para establecer una situación laboral.";

        // Sector Inserccion
        const secEntries = Object.entries(metrics.charts.sectorLab).sort((a, b) => b[1] - a[1]);
        const secMayor = secEntries.length > 0 ? secEntries[0] : null;
        const secText = secMayor ? `El principal motor de empleo estructurado de los egresados es el sector '${secMayor[0]}'.` : "No hay suficientes egresados con sector registrado para establecer tendencia.";

        return { permText, gradText, totalText, desText, evoText, tgText, sexoText, ubiText, labText, secText };
    };

    const dynamicConcl = getDynamicConclusions();

    return (
        <div className="space-y-6 animate-fadeIn" id="students-dashboard-report">

            {/* INYECCIÓN DE CSS PARA MENÚ DE APEXCHARTS Y MODO IMPRESIÓN */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .apexcharts-menu { color: #1e293b !important; background: #ffffff !important; border: 1px solid #e2e8f0 !important; }
                .apexcharts-theme-dark .apexcharts-menu { color: #f8fafc !important; background: #1e293b !important; border-color: #334155 !important; }
                .apexcharts-menu.apexcharts-menu-open { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important; }
                
                @media print {
                    /* Forzar color oscuro en textos de gráficas para que no se pierdan sobre el papel blanco */
                    .apexcharts-xaxis-label tspan, 
                    .apexcharts-yaxis-label tspan, 
                    .apexcharts-legend-text,
                    .apexcharts-title-text,
                    .apexcharts-data-labels .apexcharts-text tspan {
                        fill: #1e293b !important;
                        color: #1e293b !important;
                    }
                    /* Excepción para donde agregamos cajas de colores (100% o valores): mantener su texto blanco */
                    .apexcharts-datalabel tspan,
                    .apexcharts-datalabel-value {
                        fill: #ffffff !important;
                    }
                    /* Forzar líneas de grilla a un gris visible */
                    .apexcharts-gridline, .apexcharts-xcrosshairs {
                        stroke: #e2e8f0 !important;
                    }
                    /* Forzar que el texto general de Tailwind sea oscuro al imprimir */
                    #students-dashboard-report h2,
                    #students-dashboard-report h3,
                    #students-dashboard-report p,
                    #students-dashboard-report span,
                    #students-dashboard-report td,
                    #students-dashboard-report th,
                    #students-dashboard-report summary {
                        color: #1e293b !important;
                    }
                    /* Remover fondos invertidos oscuros de tailwind */
                    #students-dashboard-report .dark\\:bg-slate-800 {
                        background-color: #ffffff !important;
                    }
                    #students-dashboard-report .dark\\:bg-slate-700\\/50,
                    #students-dashboard-report .dark\\:bg-slate-700\\/80,
                    #students-dashboard-report .dark\\:bg-slate-700\\/30 {
                        background-color: #f8fafc !important;
                    }
                    /* Restaurar bordes visibles en lugar de bordes oscuros */
                    #students-dashboard-report .dark\\:border-slate-700,
                    #students-dashboard-report .dark\\:border-slate-600 {
                        border-color: #e2e8f0 !important;
                    }
                }
            `}} />

            {/* Cabecera del Módulo con Botón de Exportación y Conmutador de Vista */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Panel de Estudiantes y Egresados</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Análisis detallado de retención, inserción y graduación</p>
                </div>
                <div className="flex items-center gap-3 print:hidden w-full md:w-auto">
                    {/* Toggle Semestre/Año */}
                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600 grow md:grow-0">
                        <button
                            onClick={() => setViewMode('semester')}
                            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'semester'
                                ? 'bg-white dark:bg-slate-600 text-primary dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            Por Semestre
                        </button>
                        <button
                            onClick={() => setViewMode('year')}
                            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'year'
                                ? 'bg-white dark:bg-slate-600 text-primary dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            Por Año
                        </button>
                    </div>

                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-sm transition-colors text-sm font-medium"
                    >
                        <FileDown className="w-4 h-4" />
                        Exportar Reporte
                    </button>
                </div>
            </div>

            {/* 1. KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Matrícula Total" value={metrics.kpis.total} subtext="Estudiantes registrados" icon={Users} colorClass="bg-blue-500 text-blue-500" />
                <KpiCard title="Tasa de Retención" value={`${metrics.kpis.retencion}%`} subtext="Activos + Graduados" icon={GraduationCap} colorClass="bg-emerald-500 text-emerald-500" />
                <KpiCard title="Tiempo a Grado" value={`${metrics.kpis.tiempoMedio} m.`} subtext="Meses promedio" icon={Clock} colorClass="bg-amber-500 text-amber-500" />
                <KpiCard title="Inserción Laboral" value={`${metrics.kpis.insercion}%`} subtext="Egresados empleados" icon={Briefcase} colorClass="bg-purple-500 text-purple-500" />
            </div>

            {/* 2. Análisis por Semestres */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* PERMANENCIA */}
                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col" id="card-permanencia">
                    <button onClick={() => downloadCard('card-permanencia', `Permanencia_${viewMode === 'year' ? 'Anual' : 'Semestral'}`)} className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors print:hidden" title="Descargar Gráfico y Análisis">
                        <Download className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 uppercase text-center">% DE PERMANENCIA POR {viewMode === 'year' ? 'AÑO' : 'SEMESTRE'}</h3>
                    <Chart options={permanenciaOptions} series={[{ name: 'Permanencia', data: metrics.charts.metricasCohortes.permanencia }]} type="area" height={300} />
                    <details className="mt-4 group border border-slate-200 dark:border-slate-600 rounded-lg open:bg-slate-50 dark:open:bg-slate-700/30 transition-all">
                        <summary className="cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-300 p-3 flex justify-between items-center select-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg group-open:rounded-b-none">
                            Ver Análisis
                            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
                        </summary>
                        <div className="p-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600">
                            <p className="mb-2">La curva de <b>permanencia</b> refleja la proporción de estudiantes que continúan activos más los que ya se han graduado, frente al total de ingresados de un semestre. Una tendencia a la baja prolongada puede indicar factores de deserción crecientes, mientras que picos altos (cercanos al 100%) en semestres recientes reflejan una alta tasa de fidelización.</p>
                            <p className="p-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg text-slate-700 dark:text-slate-300 border-l-4 border-blue-500">
                                <b>Conclusión actual:</b> {dynamicConcl.permText}
                            </p>
                        </div>
                    </details>
                </div>

                {/* GRADUADOS */}
                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col" id="card-graduados">
                    <button onClick={() => downloadCard('card-graduados', 'Graduados_Semestral')} className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors print:hidden" title="Descargar Gráfico y Análisis">
                        <Download className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 uppercase text-center">% DE GRADUADOS POR {viewMode === 'year' ? 'AÑO' : 'SEMESTRE'}</h3>
                    <Chart options={graduadosOptions} series={[{ name: 'Graduados', data: metrics.charts.metricasCohortes.graduados }]} type="line" height={300} />
                    <details className="mt-4 group border border-slate-200 dark:border-slate-600 rounded-lg open:bg-slate-50 dark:open:bg-slate-700/30 transition-all">
                        <summary className="cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-300 p-3 flex justify-between items-center select-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg group-open:rounded-b-none">
                            Ver Análisis
                            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
                        </summary>
                        <div className="p-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600">
                            <p className="mb-2">Esta gráfica destaca la tasa de éxito de cada semestre (cantidad de <b>graduados</b> sobre el número total ingresado). Es normal observar valores de 0% o muy bajos en los semestres más recientes donde los estudiantes aún no alcanzan la fase de grado (semestres activos). Los picos altos en años anteriores evidencian la efectividad terminal de esos períodos.</p>
                            <p className="p-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg text-slate-700 dark:text-slate-300 border-l-4 border-blue-500">
                                <b>Conclusión actual:</b> {dynamicConcl.gradText}
                            </p>
                        </div>
                    </details>
                </div>

                {/* Nº ESTUDIANTES */}
                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col" id="card-estudiantes">
                    <button onClick={() => downloadCard('card-estudiantes', 'Estudiantes_Semestral')} className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors print:hidden" title="Descargar Gráfico y Análisis">
                        <Download className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 uppercase text-center">Nº ESTUDIANTES POR {viewMode === 'year' ? 'AÑO' : 'SEMESTRE'}</h3>
                    <Chart options={numEstudiantesOptions} series={[{ name: 'Estudiantes', data: metrics.charts.metricasCohortes.total }]} type="bar" height={300} />
                    <details className="mt-4 group border border-slate-200 dark:border-slate-600 rounded-lg open:bg-slate-50 dark:open:bg-slate-700/30 transition-all">
                        <summary className="cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-300 p-3 flex justify-between items-center select-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg group-open:rounded-b-none">
                            Ver Análisis
                            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
                        </summary>
                        <div className="p-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600">
                            <p className="mb-2">Aquí se observa la <b>población bruta</b> recibida en cada semestre analizado. Los altibajos en estas barras ayudan a entender la estacionalidad de la demanda de inscripciones (a menudo, un semestre determinado como el primer semestre del año suele tener más volumen que el segundo, o viceversa debido a factores externos).</p>
                            <p className="p-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg text-slate-700 dark:text-slate-300 border-l-4 border-blue-500">
                                <b>Conclusión actual:</b> {dynamicConcl.totalText}
                            </p>
                        </div>
                    </details>
                </div>

                {/* DESERCION */}
                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col" id="card-desercion">
                    <button onClick={() => downloadCard('card-desercion', 'Desercion_Semestral')} className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors print:hidden" title="Descargar Gráfico y Análisis">
                        <Download className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 uppercase text-center">% DE DESERCIÓN POR {viewMode === 'year' ? 'AÑO' : 'SEMESTRE'}</h3>
                    <Chart options={desercionOptions} series={[{ name: 'Deserción', data: metrics.charts.metricasCohortes.desercion }]} type="line" height={300} />
                    <details className="mt-4 group border border-slate-200 dark:border-slate-600 rounded-lg open:bg-slate-50 dark:open:bg-slate-700/30 transition-all">
                        <summary className="cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-300 p-3 flex justify-between items-center select-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg group-open:rounded-b-none">
                            Ver Análisis
                            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
                        </summary>
                        <div className="p-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600">
                            <p className="mb-2">La gráfica de <b>deserción</b> detalla el porcentaje de estudiantes retirados (ausencia sostenida o retiro oficial) respecto al total ingresado en ese semestre. Esta es la métrica más crítica para la gestión: los picos identifican los períodos más afectados por factores socioeconómicos, académicos o de salud, proporcionando información clave para planes correctivos.</p>
                            <p className="p-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg text-slate-700 dark:text-slate-300 border-l-4 border-rose-500">
                                <b>Conclusión actual:</b> {dynamicConcl.desText}
                            </p>
                        </div>
                    </details>
                </div>

            </div>

            {/* TABLA DE DATOS DE SEMESTRES */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Datos Consolidados por Semestre (Reporte Tabular)</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600">
                            <tr>
                                <th className="p-3 font-semibold text-center whitespace-nowrap">{viewMode === 'year' ? 'Año' : 'Semestre'}</th>
                                <th className="p-3 font-semibold text-center whitespace-nowrap">Admitidos (Nº)</th>
                                <th className="p-3 font-semibold text-center whitespace-nowrap">% Permanencia</th>
                                <th className="p-3 font-semibold text-center whitespace-nowrap">% Graduados</th>
                                <th className="p-3 font-semibold text-center whitespace-nowrap">% Deserción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {metrics.charts.metricasCohortes.categories.length > 0 ? (
                                metrics.charts.metricasCohortes.categories.map((cat, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-3 text-slate-800 dark:text-slate-200 font-medium text-center">{cat}</td>
                                        <td className="p-3 text-slate-600 dark:text-slate-400 text-center">{metrics.charts.metricasCohortes.total[idx]}</td>
                                        <td className="p-3 text-center">
                                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-1 rounded font-semibold text-xs">
                                                {metrics.charts.metricasCohortes.permanencia[idx]}%
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-1 rounded font-semibold text-xs">
                                                {metrics.charts.metricasCohortes.graduados[idx]}%
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 px-2 py-1 rounded font-semibold text-xs">
                                                {metrics.charts.metricasCohortes.desercion[idx]}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-6 text-center text-slate-500">No hay información de semestres registrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. Evolución detallada de Semestres (Ingreso) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col" id="card-evolucion">
                    <button onClick={() => downloadCard('card-evolucion', `Evolucion_Ingresos_${viewMode === 'year' ? 'Anual' : 'Semestral'}`)} className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors print:hidden" title="Descargar Gráfico y Análisis">
                        <Download className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 uppercase text-center">Evolución de {viewMode === 'year' ? 'Años' : 'Semestres'} (Ingreso)</h3>
                    <Chart options={apiladasOptions} series={apiladasSeries} type="bar" height={300} />
                    <details className="mt-4 group border border-slate-200 dark:border-slate-600 rounded-lg open:bg-slate-50 dark:open:bg-slate-700/30 transition-all">
                        <summary className="cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-300 p-3 flex justify-between items-center select-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg group-open:rounded-b-none">
                            Ver Análisis
                            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
                        </summary>
                        <div className="p-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600">
                            <p className="mb-2">El gráfico apilado ayuda a visibilizar la composición final de cada cohorte según su estado operativo (Activos, Graduados, Retirados).</p>
                            <p className="p-3 mt-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg text-slate-700 dark:text-slate-300 border-l-4 border-blue-500">
                                <b>Conclusión actual:</b> {dynamicConcl.evoText}
                            </p>
                        </div>
                    </details>
                </div>
                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col" id="card-retencion">
                    <button onClick={() => downloadCard('card-retencion', 'Curvas_Retencion')} className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors print:hidden" title="Descargar Gráfico y Análisis">
                        <Download className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Curvas de Retención Múltiple</h3>
                    <p className="text-xs text-slate-400 mb-2">Eje X: Semestres (1-10) | Eje Y: % Retenido</p>
                    <RetentionChart data={metrics.charts.cohorteRetencion} />
                    <details className="mt-4 group border border-slate-200 dark:border-slate-600 rounded-lg open:bg-slate-50 dark:open:bg-slate-700/30 transition-all">
                        <summary className="cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-300 p-3 flex justify-between items-center select-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg group-open:rounded-b-none">
                            Ver Análisis
                            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
                        </summary>
                        <div className="p-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600">
                            <p className="mb-2">Las curvas de retención múltiple comparan el ritmo de deserción de diferentes cohortes simultáneamente. Las líneas superiores reflejan grupos resilientes que completan sus estudios con pocas bajas.</p>
                        </div>
                    </details>
                </div>
            </div>

            {/* 3. Segunda Fila: Tiempos y Mapas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col" id="card-tiempos">
                        <button onClick={() => downloadCard('card-tiempos', 'Tiempos_Grado')} className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors print:hidden" title="Descargar Gráfico y Análisis">
                            <Download className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Tiempos de Grado</h3>
                        {metrics.charts.boxplotData.length > 0 ? (
                            <Chart options={boxplotOptions} series={[{ type: 'boxPlot', data: metrics.charts.boxplotData }]} type="boxPlot" height={220} />
                        ) : (
                            <p className="text-slate-400 text-sm">Datos insuficientes para distribución.</p>
                        )}
                        <details className="mt-4 group border border-slate-200 dark:border-slate-600 rounded-lg open:bg-slate-50 dark:open:bg-slate-700/30 transition-all">
                            <summary className="cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-300 p-3 flex justify-between items-center select-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg group-open:rounded-b-none">
                                Ver Análisis
                                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
                            </summary>
                            <div className="p-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600">
                                <p className="mb-2">El diagrama de caja (boxplot) visualiza la dispersión en los tiempos de tránsito de los estudiantes desde su ingreso hasta la obtención del grado, destacando medianas y valores atípicos.</p>
                                <p className="p-3 mt-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg text-slate-700 dark:text-slate-300 border-l-4 border-blue-500">
                                    <b>Conclusión actual:</b> {dynamicConcl.tgText}
                                </p>
                            </div>
                        </details>
                    </div>

                    <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col" id="card-genero">
                        <button onClick={() => downloadCard('card-genero', 'Distribucion_Sexo')} className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors print:hidden" title="Descargar Gráfico y Análisis">
                            <Download className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Distribución por Sexo</h3>
                        <Chart options={generoOptions} series={generoSeries} type="bar" height={150} />
                        <details className="mt-4 group border border-slate-200 dark:border-slate-600 rounded-lg open:bg-slate-50 dark:open:bg-slate-700/30 transition-all">
                            <summary className="cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-300 p-3 flex justify-between items-center select-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg group-open:rounded-b-none">
                                Ver Análisis
                                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
                            </summary>
                            <div className="p-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600">
                                <p className="mb-2">Muestra la proporción de estudiantes inscritos segregados por género en la totalidad de la muestra, útil para el análisis de equidad e inclusión.</p>
                                <p className="p-3 mt-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg text-slate-700 dark:text-slate-300 border-l-4 border-blue-500">
                                    <b>Conclusión actual:</b> {dynamicConcl.sexoText}
                                </p>
                            </div>
                        </details>
                    </div>
                </div>

                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-2 flex flex-col" id="card-ubicacion">
                    <button onClick={() => downloadCard('card-ubicacion', 'Cobertura_Geografica')} className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors print:hidden" title="Descargar Mapa y Análisis">
                        <Download className="w-5 h-5" />
                    </button>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Cobertura Geográfica</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-full mr-8">
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Zoom con mouse</span>
                        </div>
                    </div>
                    <div className="h-[400px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 z-0 relative shadow-inner">
                        <MapContainer center={colCenter} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%', backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }}>
                            <TileLayer
                                url={isDark
                                    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                }
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                            {geoLocations.map((loc, i) => (
                                <CircleMarker key={i} center={loc.pos} radius={Math.min(25, Math.max(5, loc.count * 3))} pathOptions={{ color: isDark ? '#60a5fa' : '#2563eb', fillColor: isDark ? '#60a5fa' : '#2563eb', fillOpacity: 0.7, weight: 2 }}>
                                    <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                                        <div className="font-semibold text-slate-800">{loc.name}</div>
                                        <div className="text-slate-600">{loc.count} estudiantes</div>
                                    </Tooltip>
                                </CircleMarker>
                            ))}
                        </MapContainer>
                    </div>
                    <details className="mt-4 group border border-slate-200 dark:border-slate-600 rounded-lg open:bg-slate-50 dark:open:bg-slate-700/30 transition-all z-10">
                        <summary className="cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-300 p-3 flex justify-between items-center select-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg group-open:rounded-b-none">
                            Ver Análisis
                            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
                        </summary>
                        <div className="p-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600">
                            <p className="mb-2">El mapa de calor geográfico expone de dónde provienen los matriculados, permitiendo dirigir esfuerzos logísticos a las regiones críticas.</p>
                            <p className="p-3 mt-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg text-slate-700 dark:text-slate-300 border-l-4 border-blue-500">
                                <b>Conclusión actual:</b> {dynamicConcl.ubiText}
                            </p>
                        </div>
                    </details>
                </div>
            </div>

            {/* 4. Tercera Fila: Inserción Laboral */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col" id="card-situacion">
                    <button onClick={() => downloadCard('card-situacion', 'Situacion_Laboral')} className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors print:hidden" title="Descargar Gráfico y Análisis">
                        <Download className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Situación Actual Egresados</h3>
                    {donutSeries.length > 0 ? (
                        <Chart options={donutOptions} series={donutSeries} type="donut" height={320} />
                    ) : (
                        <div className="flex items-center justify-center h-[320px] text-slate-400">
                            No hay datos de situación actual de egresados estructurados.
                        </div>
                    )}
                    <details className="mt-4 group border border-slate-200 dark:border-slate-600 rounded-lg open:bg-slate-50 dark:open:bg-slate-700/30 transition-all">
                        <summary className="cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-300 p-3 flex justify-between items-center select-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg group-open:rounded-b-none">
                            Ver Análisis
                            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
                        </summary>
                        <div className="p-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600">
                            <p className="mb-2">Desglosa el porcentaje de egresados y graduados clasificados según su ocupación principal tras salir de la institución.</p>
                            <p className="p-3 mt-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg text-slate-700 dark:text-slate-300 border-l-4 border-blue-500">
                                <b>Conclusión actual:</b> {dynamicConcl.labText}
                            </p>
                        </div>
                    </details>
                </div>
                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col" id="card-sectores">
                    <button onClick={() => downloadCard('card-sectores', 'Sector_Laboral')} className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors print:hidden" title="Descargar Gráfico y Análisis">
                        <Download className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Sectores de Inserción</h3>
                    {barchartSeries[0].data.length > 0 ? (
                        <Chart options={barchartOptions} series={barchartSeries} type="bar" height={320} />
                    ) : (
                        <div className="flex items-center justify-center h-[320px] text-slate-400">
                            No hay suficientes egresados empleados con sector laboral registrado.
                        </div>
                    )}
                    <details className="mt-4 group border border-slate-200 dark:border-slate-600 rounded-lg open:bg-slate-50 dark:open:bg-slate-700/30 transition-all">
                        <summary className="cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-300 p-3 flex justify-between items-center select-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg group-open:rounded-b-none">
                            Ver Análisis
                            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
                        </summary>
                        <div className="p-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600">
                            <p className="mb-2">Para aquellos egresados que declararon figurar empleados, detalla en qué sectores industriales están prestando servicio o emprendiendo.</p>
                            <p className="p-3 mt-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg text-slate-700 dark:text-slate-300 border-l-4 border-blue-500">
                                <b>Conclusión actual:</b> {dynamicConcl.secText}
                            </p>
                        </div>
                    </details>
                </div>
            </div>

        </div>
    );
};
