import React, { useState } from 'react';
import { FileBadge, FileText, ShieldCheck, Printer, Download, Clock, ExternalLink, FileCode } from 'lucide-react';
import GeneratorWizard from './GeneratorWizard';
import DocumentArchive from './DocumentArchive';

const DocumentHub = () => {
    const [activeTab, setActiveTab] = useState('generator');
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // --- CATÁLOGO DE DOCUMENTOS CORREGIDO ---
    const templates = [
        // 1. EVENTOS (Unificado)
        {
            id: 1,
            title: 'Certificado de Evento',
            category: 'Eventos',
            icon: FileBadge,
            color: 'text-purple-600',
            bg: 'bg-purple-100 dark:bg-purple-900/20',
            desc: 'Para Asistentes, Ponentes u Organizadores.'
        },
        // 2. ACADÉMICO
        {
            id: 2,
            title: 'Constancia de Estudios',
            category: 'Académico',
            icon: FileText,
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/20',
            desc: 'Para estudiantes activos (Matriculados).'
        },
        {
            id: 6,
            title: 'Carta de Admisión',
            category: 'Académico',
            icon: FileText,
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/20',
            desc: 'Bienvenida a nuevos estudiantes.'
        },
        // 3. TESIS
        {
            id: 3,
            title: 'Acta de Sustentación',
            category: 'Tesis',
            icon: ShieldCheck,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100 dark:bg-emerald-900/20',
            desc: 'Aprobación de grado.'
        },
        // 4. ADMINISTRATIVO
        {
            id: 4,
            title: 'Carta de Invitación',
            category: 'Administrativo',
            icon: Printer,
            color: 'text-amber-600',
            bg: 'bg-amber-100 dark:bg-amber-900/20',
            desc: 'Para invitados externos (Ponentes/Docentes).'
        }
    ];

    if (selectedTemplate) {
        return <GeneratorWizard template={selectedTemplate} onBack={() => setSelectedTemplate(null)} />;
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* HEADER + TABS */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestión Documental</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Emisión de certificados y actas oficiales.</p>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex overflow-x-auto">
                    {['generator', 'archive', 'validator', 'templates'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap ${activeTab === tab
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {tab === 'generator' ? 'Generar' : tab === 'archive' ? 'Repositorio' : tab === 'validator' ? 'Validar' : 'Plantillas'}
                        </button>
                    ))}
                </div>
            </div>

            {/* VISTA 1: GENERADOR (Tarjetas) */}
            {activeTab === 'generator' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((tpl) => (
                        <button
                            key={tpl.id}
                            onClick={() => setSelectedTemplate(tpl)}
                            className="card-premium group text-left hover:border-primary/50 dark:hover:border-primary/50 transition-all active:scale-[0.98]"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${tpl.bg} ${tpl.color} group-hover:scale-110 transition-transform`}>
                                    <tpl.icon size={28} />
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md">
                                    {tpl.category}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{tpl.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                {tpl.desc}
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                <Printer size={16} className="mr-2" />
                                Iniciar
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* VISTA: REPOSITORIO */}
            {activeTab === 'archive' && (
                <DocumentArchive />
            )}

            {/* VISTA 2: VALIDADOR */}
            {activeTab === 'validator' && (
                <div className="max-w-xl mx-auto mt-10 text-center">
                    <div className="card-premium p-10">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Verificador de Autenticidad</h2>
                        <p className="text-slate-500 mb-8">
                            Ingresa el código único (CSV) que aparece en la parte inferior del documento.
                        </p>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Ej: MCS-2025-X7B9"
                                className="w-full text-center text-xl tracking-widest uppercase font-mono py-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white dark:bg-slate-800 dark:text-white"
                            />
                            <button className="btn-primary w-full mt-4 py-3 text-lg shadow-blue-500/20">
                                Verificar Documento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VISTA 3: GESTIÓN DE PLANTILLAS (NUEVA) */}
            {activeTab === 'templates' && (
                <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                        <FileCode className="text-blue-600 shrink-0 mt-1" size={20} />
                        <div>
                            <h4 className="font-bold text-blue-700 dark:text-blue-300">¿Cómo funcionan las plantillas?</h4>
                            <p className="text-sm text-blue-600/80 dark:text-blue-400">
                                Estos archivos están alojados en Google Drive. Puedes editarlos directamente y el sistema usará la versión más reciente.
                                Usa las variables <code>{'{{NOMBRE}}'}</code>, <code>{'{{CEDULA}}'}</code>, <code>{'{{FECHA}}'}</code> en tus diseños.
                            </p>
                        </div>
                    </div>

                    <div className="card-premium overflow-hidden p-0">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Nombre Archivo</th>
                                    <th className="px-6 py-4">Categoría</th>
                                    <th className="px-6 py-4">Última Edición</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {templates.map((tpl) => (
                                    <tr key={tpl.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                        <td className="px-6 py-4 font-medium flex items-center gap-3 text-slate-700 dark:text-slate-200">
                                            <div className={`p-1.5 rounded-lg ${tpl.bg} ${tpl.color}`}>
                                                <tpl.icon size={16} />
                                            </div>
                                            {tpl.title}.pptx
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            <span className="px-2 py-1 rounded text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                {tpl.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">Hace 2 días</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-primary hover:text-primary-hover font-medium flex items-center justify-end gap-1 ml-auto group">
                                                <ExternalLink size={14} className="group-hover:scale-110 transition-transform" />
                                                <span className="ml-1">Editar en Drive</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DocumentHub;