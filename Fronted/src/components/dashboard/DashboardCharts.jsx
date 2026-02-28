import React, { useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import { Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

// --- COLORES CONFIGURABLES ---
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const DARK_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];

// --- SUBCOMPONENTES DE GRÁFICOS ---

export const StudentStatusChart = ({ data, darkMode }) => {
    const chartRef = useRef(null);

    const chartData = [
        { name: 'Activos', value: data.activos || 0 },
        { name: 'Egresados', value: data.egresados || 0 },
        { name: 'Graduados', value: data.graduados || 0 },
    ].filter(item => item.value > 0);

    const downloadChart = async () => {
        if (!chartRef.current) return;
        const canvas = await html2canvas(chartRef.current);
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'distribucion_estudiantes.png';
        link.click();
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full relative group">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Estado de Estudiantes</h3>
                <button onClick={downloadChart} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-colors" title="Descargar Gráfico">
                    <Download size={18} />
                </button>
            </div>

            <div className="flex-grow flex items-center justify-center min-h-[300px]" ref={chartRef}>
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
                            label={({ value }) => value} // Muestra el valor fuera del segmento
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={darkMode ? DARK_COLORS[index % DARK_COLORS.length] : COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: darkMode ? '#fff' : '#1e293b' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">Distribución actual de la población estudiantil</p>
        </div>
    );
};

export const ThesisStatusChart = ({ data, darkMode }) => {
    const chartRef = useRef(null);

    const chartData = [
        { name: 'En Curso', value: data.enCurso || 0 },
        { name: 'Sustentadas', value: data.sustentadas || 0 },
    ].filter(item => item.value > 0);

    const downloadChart = async () => {
        if (!chartRef.current) return;
        const canvas = await html2canvas(chartRef.current);
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'estado_tesis.png';
        link.click();
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full relative group">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Estado de Tesis</h3>
                <button onClick={downloadChart} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-colors" title="Descargar Gráfico">
                    <Download size={18} />
                </button>
            </div>

            <div className="flex-grow flex items-center justify-center min-h-[300px]" ref={chartRef}>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#e2e8f0"} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#94a3b8' : '#64748b' }} />
                        <Tooltip
                            cursor={{ fill: darkMode ? '#334155' : '#f1f5f9' }}
                            contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: darkMode ? '#fff' : '#1e293b' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? (darkMode ? '#fbbf24' : '#f59e0b') : (darkMode ? '#34d399' : '#10b981')} />
                            ))}
                            <LabelList dataKey="value" position="top" fill={darkMode ? "#94a3b8" : "#475569"} fontSize={12} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">Progreso de trabajos de grado registrados</p>
        </div>
    );
};
