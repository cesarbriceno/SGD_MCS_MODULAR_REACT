import React, { useState } from 'react';
import { X, Save, Layers, CheckCircle } from 'lucide-react';
import { toast } from '../../utils/swalUtils';
import Swal from '../../utils/swalUtils';
import { api } from '../../services/api';

const BulkEditModal = ({ isOpen, onClose, selectedIds, type = 'estudiante', onSuccess }) => {
    // Si no está abierto, no renderizamos nada
    if (!isOpen) return null;

    const [fieldToEdit, setFieldToEdit] = useState('');
    const [newValue, setNewValue] = useState('');
    const [additionalValues, setAdditionalValues] = useState({});
    const [loading, setLoading] = useState(false);

    // Configuración de campos permitidos para edición masiva según el módulo
    const fieldsConfig = {
        'estudiante': [
            { key: 'Estado', label: 'Estado Académico', type: 'select', options: ['Cursando', 'Egresado', 'Pausa', 'Desertor', 'Reingresado'] },
            { key: 'Cohorte_Ingreso', label: 'Cohorte de Ingreso', type: 'text' },
            { key: 'Cohorte_Egreso', label: 'Cohorte de Egreso', type: 'text' },
            { key: 'Tipo_Documento', label: 'Tipo de Documento', type: 'select', options: ['CC', 'TI', 'CE', 'PAS', 'PEP'] },

            // Laboral
            { key: 'Situacion_Laboral_Actual', label: 'Situación Laboral', type: 'select', options: ['Empleado', 'Independiente', 'Desempleado', 'Estudiante'] },
            { key: 'Empresa_Institucion', label: 'Empresa / Institución', type: 'text' },
            { key: 'Cargo_Actual', label: 'Cargo Actual', type: 'text' },
            { key: 'Sector_Desempeno', label: 'Sector de Desempeño', type: 'select', options: ['Público', 'Privado', 'Mixto'] },
            { key: 'Rango_Salarial', label: 'Rango Salarial', type: 'select', options: ['< 1 SMMLV', '1-2 SMMLV', '> 2 SMMLV'] },

            // Ubicación / Personal
            { key: 'Ciudad', label: 'Ciudad', type: 'text' },
            { key: 'Depto_Residencia', label: 'Depto. Residencia', type: 'text' },
            { key: 'Pais', label: 'País', type: 'text' },
            { key: 'Estrato', label: 'Estrato', type: 'select', options: ['1', '2', '3', '4', '5', '6'] },
            { key: 'Barrio', label: 'Barrio', type: 'text' },
            { key: 'Direccion', label: 'Dirección', type: 'text' },

            // Contacto
            { key: 'Email', label: 'Email', type: 'text' },
            { key: 'Telefono', label: 'Teléfono Fijo', type: 'text' },
            { key: 'Celular', label: 'Celular', type: 'text' }
        ],
        'docente': [
            { key: 'Tipo_Vinculacion', label: 'Tipo de Vinculación', type: 'select', options: ['Planta', 'Catedrático'] },
            { key: 'Activo', label: 'Estado (Activo)', type: 'select', options: ['Sí', 'No'] },
            { key: 'Nivel_Formacion', label: 'Nivel de Formación', type: 'select', options: ['Profesional', 'Especialización', 'Maestría', 'Doctorado'] },
            { key: 'Categoria', label: 'Categoría', type: 'select', options: ['Instructor', 'Asistente', 'Asociado', 'Titular'] }
        ]
    };

    // Campos adicionales obligatorios según el Estado seleccionado
    const statusFields = {
        'Egresado': [
            { key: 'Cohorte_Egreso', label: 'Cohorte Egreso', type: 'text', placeholder: 'Ej: 2024-2' },
            { key: 'Fecha_Egreso', label: 'Fecha de Grado', type: 'date' }
        ],
        'Desertor': [
            { key: 'Motivo_Estado', label: 'Motivo de Retiro', type: 'text', placeholder: 'Razón del retiro' }
        ],
        'Pausa': [
            { key: 'Motivo_Estado', label: 'Motivo de Pausa', type: 'text', placeholder: 'Razón de la pausa' }
        ],
        'Reingresado': [
            { key: 'Fecha_Reingreso', label: 'Fecha de Reingreso', type: 'date' },
            { key: 'Motivo_Estado', label: 'Respuesta/Resolución', type: 'text', placeholder: 'Nro de acta o resolución' }
        ]
    };

    const currentFields = fieldsConfig[type] || [];
    const selectedFieldConfig = currentFields.find(f => f.key === fieldToEdit);
    const extraFields = (fieldToEdit === 'Estado' && statusFields[newValue]) ? statusFields[newValue] : [];

    const handleSave = async () => {
        if (!fieldToEdit || !newValue) {
            return toast.warning('Datos incompletos', 'Debe seleccionar un campo y un nuevo valor.');
        }

        // VALIDAR CAMPOS EXTRA (Si aplican)
        if (extraFields.length > 0) {
            const missing = extraFields.filter(ef => !additionalValues[ef.key]);
            if (missing.length > 0) {
                return toast.warning('Información requerida', `Faltan campos para el estado "${newValue}": ${missing.map(m => m.label).join(', ')}`);
            }
        }

        const result = await toast.confirm(
            '¿Confirmar edición masiva?',
            `Se actualizarán los registros seleccionados. Esta acción no se puede deshacer fácilmente.`,
            'Sí, aplicar cambios'
        );

        if (result.isConfirmed) {
            setLoading(true);
            try {
                // Preparamos el objeto de actualización con el campo base + adicionales
                const updates = {
                    [fieldToEdit]: newValue,
                    ...additionalValues
                };

                const idsArray = Array.from(selectedIds);
                const apiService = type === 'estudiante' ? 'students' : 'teachers';
                const response = await api[apiService].bulkUpdate(idsArray, updates);

                if (response.success) {
                    toast.success('¡Actualizado!', response.message);
                    onSuccess();
                    onClose();
                } else {
                    toast.error('Error', response.message || 'No se pudo actualizar.');
                }
            } catch (error) {
                console.error(error);
                toast.error('Error', 'Fallo de conexión con el servidor.');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden transform transition-all scale-100">

                {/* Header del Modal */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white">
                        <Layers size={20} className="text-primary" />
                        <h3 className="font-bold text-lg">Edición Masiva</h3>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Indicador de Selección */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full text-blue-600 dark:text-blue-300">
                            <CheckCircle size={16} />
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Has seleccionado <span className="font-bold text-slate-900 dark:text-white">{selectedIds.size}</span> registros para editar.
                        </p>
                    </div>

                    {/* Paso 1: Elegir Campo */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">1. Selecciona el campo a modificar</label>
                        <select
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-white transition-all cursor-pointer"
                            value={fieldToEdit}
                            onChange={(e) => {
                                setFieldToEdit(e.target.value);
                                setNewValue('');
                                setAdditionalValues({});
                            }}
                        >
                            <option value="">-- Seleccionar Campo --</option>
                            {currentFields.map(field => (
                                <option key={field.key} value={field.key}>{field.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Paso 2: Valor Nuevo (Aparece dinámicamente) */}
                    {fieldToEdit && (
                        <div className="animate-in slide-in-from-top-2 fade-in duration-300 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">2. Nuevo Valor para {selectedFieldConfig.label}</label>

                                {selectedFieldConfig.type === 'select' ? (
                                    <select
                                        className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-white shadow-sm transition-all cursor-pointer"
                                        value={newValue}
                                        onChange={(e) => {
                                            setNewValue(e.target.value);
                                            setAdditionalValues({}); // Resetear campos extra al cambiar el estado
                                        }}
                                    >
                                        <option value="">-- Seleccionar Valor --</option>
                                        {selectedFieldConfig.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-white shadow-sm transition-all"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        placeholder={`Ingrese nuevo valor para ${selectedFieldConfig.label}`}
                                    />
                                )}
                            </div>

                            {/* Campos Adicionales Condicionales (Solo para Estado) */}
                            {extraFields.length > 0 && (
                                <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-2">Información Requerida para "{newValue}"</p>
                                    {extraFields.map(ef => (
                                        <div key={ef.key}>
                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 lowercase first-letter:uppercase">{ef.label}</label>
                                            {ef.type === 'date' ? (
                                                <input
                                                    type="date"
                                                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                                                    value={additionalValues[ef.key] || ''}
                                                    onChange={(e) => setAdditionalValues(prev => ({ ...prev, [ef.key]: e.target.value }))}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder={ef.placeholder}
                                                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                                                    value={additionalValues[ef.key] || ''}
                                                    onChange={(e) => setAdditionalValues(prev => ({ ...prev, [ef.key]: e.target.value }))}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer del Modal */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!fieldToEdit || !newValue || loading}
                        className="btn-primary flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Aplicando...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Aplicar Cambios
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkEditModal;