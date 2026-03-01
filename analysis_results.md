# Análisis del Sistema de Gestión Documental (SGD_MCS_v3)

A continuación se realiza un análisis de brechas entre el estado actual de tu aplicación y los estándares de un Sistema de Gestión Documental (SGD) profesional, enfocado en el proceso de Autoevaluación de la Maestría.

| Categoría | Estado Actual | Cumplimiento | Brecha / Oportunidad |
| :--- | :--- | :---: | :--- |
| **1. Captura e Ingreso** | Carga de archivos manual a carpetas específicas de entidades (Estudiantes, Docentes, etc.). | 🟡 Parcial | Identificación automática de duplicados y metadatos obligatorios por tipo de archivo. |
| **2. Metadatos y Clasificación** | Clasificación por Entidad (Sheets) y Carpeta (Drive). Metadatos básicos en Sheets. | 🟡 Parcial | Implementar taxonomías controladas y metadatos específicos para autoevaluación (ej: Estandar CONEAU, Código de Indicador). |
| **3. Organización y Archivo** | Estructura jerárquica: Entidad -> Año/Cohorte -> Expediente. | ✅ Alto | Drive ya gestiona el almacenamiento seguro. La agrupación por expedientes ya está operativa. |
| **4. Control de Versiones** | Delegado a Google Drive (historial nativo). | ❌ Bajo | No es visible desde nuestra interfaz de usuario (UI). Ver versiones previas sin salir de la app. |
| **5. Búsqueda y Recuperación** | Búsqueda universal por nombre (recursiva) y filtros por módulos (Sheets). | ✅ Alto | Implementar **Full-text search** (buscar dentro del contenido de los PDFs) y filtros por año/indicador. |
| **6. Gestión de Flujos (Workflows)** | CRUD directo. No hay estados de aprobación. | ❌ Bajo | **Crítico para Autoevaluación:** Flujo de "Documento Cargado -> Revisado por Comité -> Aprobado para Informe Final". |
| **7. Seguridad y Acceso** | Basado en login de Google y permisos de la carpeta raíz. | ✅ Alto | Roles específicos dentro de la app (ej: "Solo Lectura" para auditores externos). |
| **8. Trazabilidad y Auditoría** | Registro básico en Logs de GAS. | ❌ Bajo | Módulo de "Historial de Acciones" para ver quién borró o movió qué documento clave de autoevaluación. |
| **9. Preservación a Largo Plazo** | Almacenamiento en Drive. | ✅ Alto | Formatos estándar (PDF/A). |
| **10. Cumplimiento Normativo** | Estructura adaptada a la Maestría. | 🟡 Parcial | Vincular expedientes directamente con los lineamientos de autoevaluación (Indicadores de Calidad). |
| **11. Disposición Final** | Borrado manual a papelera. | 🟡 Parcial | Tablas de retención (cuánto tiempo debe guardarse una tesis o un acta de comité). |
| **12. Integración** | Integrado con Drive y Sheets. | 🟡 Parcial | Integración con correos (notificar cuando se carga un documento vital para el proceso). |
| **13. Reportes y Analítica** | Dashboards de autoevaluación (`AutoevaluationCharts`). | ✅ Alto | Reportes de "Vacíos Documentales" (¿qué indicadores no tienen evidencias cargadas?). |

---

## 🎯 Recomendaciones para las Próximas Fases

Para que el sistema sea un verdadero **SGD de Autoevaluación**, sugiero enfocarnos en:

1.  **Viculación con Indicadores**: Que cada documento pueda "etiquetarse" con el indicador de autoevaluación que respalda.
2.  **Workflows de Revisión**: Un botón de "Aprobar Evidencia" para que el director sepa qué documentos ya están listos para el informe.
3.  **Auditoría Interna**: Un pequeño log que guarde "Usuario X subió Evidencia Y el día Z".
4.  **Búsqueda Full-Text**: Aprovechar la API de Google para buscar palabras dentro de los informes y tesis.

¿En cuál de estos puntos te gustaría profundizar primero?
