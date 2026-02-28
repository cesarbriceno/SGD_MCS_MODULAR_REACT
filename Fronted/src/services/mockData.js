// src/services/mockData.js

export const MOCK_DASHBOARD = {
    success: true,
    stats: {
        estudiantes: { total: 5, activos: 3, egresados: 1, graduados: 1 },
        tesis: { total: 3, enCurso: 2, sustentadas: 1 },
        eventos: { total: 2 }
    },
    lastUpdate: new Date().toLocaleString()
};

// NOTA: Usamos las mismas claves (Mayúsculas) que en Google Sheets
export const MOCK_STUDENTS = [
    {
        ID_Estudiante: 'EST-001',
        Nombre1: 'Juan', Nombre2: 'Carlos', Apellido1: 'Pérez', Apellido2: 'López',
        Email: 'juan@test.com', Tipo_Documento: 'CC', Cedula: '101010',
        Cohorte_Ingreso: '2024-1', Estado: 'Cursando',
        Comentarios: 'Estudiante pendiente de entregar documentos de grado.',
        ID_Carpeta_Drive: 'folder-id-1', URL_Carpeta_Drive: 'https://drive.google.com/folder-1'
    },
    {
        ID_Estudiante: 'EST-002',
        Nombre1: 'Maria', Nombre2: '', Apellido1: 'Gómez', Apellido2: 'Ruiz',
        Email: 'maria@test.com', Tipo_Documento: 'CC', Cedula: '202020',
        Cohorte_Ingreso: '2023-2', Estado: 'Cursando',
        Comentarios: '' // Sin comentario
    },
    {
        ID_Estudiante: 'EST-003',
        Nombre1: 'Pedro', Nombre2: 'Pablo', Apellido1: 'Díaz', Apellido2: '',
        Email: 'pedro@test.com', Tipo_Documento: 'CE', Cedula: 'E-999',
        Cohorte_Ingreso: '2022-1', Cohorte_Egreso: '2023-2', Estado: 'Egresado',
        Comentarios: 'Revisar paz y salvo de biblioteca.'
    },
    {
        ID_Estudiante: 'EST-004',
        Nombre1: 'Ana', Nombre2: '', Apellido1: 'Martínez', Apellido2: '',
        Email: 'ana@test.com', Tipo_Documento: 'TI', Cedula: '303030',
        Cohorte_Ingreso: '2024-1', Estado: 'Retirado',
        Comentarios: 'Retiro voluntario por cambio de ciudad.'
    }
];

export const MOCK_THESIS = [
    {
        ID_Tesis: 'TES-001',
        Titulo_Investigacion: 'Optimización de Procesos de Datos en la Nube',
        Año: '2024',
        Estado_Tesis: 'En Desarrollo',
        Calificacion: '',
        Modalidad: 'Investigación',
        Linea_Investigacion_Tesis: 'Ciencia de Datos',
        Palabras_Clave: 'Nube, Datos, Optimización',
        Resumen: 'Resumen descriptivo de la tesis...',
        ID_Estudiante: 'EST-001',
        Nombre_Estudiante: 'Juan Carlos Pérez López',
        ID_Asesor: 'DOC-001',
        Nombre_Asesor: 'Ricardo Antonio Martínez Sánchez',
        Codirector: '',
        Nombre_Codirector: '',
        Jurado_1: 'DOC-002',
        Nombre_Jurado_1: 'Elena María López Ruiz',
        Jurado_2: '',
        Nombre_Jurado_2: '',
        Fecha_Inicio: '2024-01-15',
        Fecha_Defensa: '',
        Numero_Acta_Sustentacion: '',
        URL_Documento: '',
        Fecha_Registro: '2024-01-15 10:00:00',
        Ultima_Actualizacion: '2024-01-15 10:00:00',
        ID_Carpeta_Drive: 'folder-id-thesis-1', URL_Carpeta_Drive: 'https://drive.google.com/folder-thesis-1'
    },
    {
        ID_Tesis: 'TES-002',
        Titulo_Investigacion: 'Implementación de Algoritmos de IA en Educación',
        Año: '2023',
        Estado_Tesis: 'Sustentada',
        Calificacion: '4.8',
        Modalidad: 'Investigación',
        Linea_Investigacion_Tesis: 'Inteligencia Artificial',
        Palabras_Clave: 'IA, Educación, Algoritmos',
        Resumen: 'Estudio sobre el impacto de la IA...',
        ID_Estudiante: 'EST-002',
        Nombre_Estudiante: 'Maria Gómez Ruiz',
        ID_Asesor: 'DOC-001',
        Nombre_Asesor: 'Ricardo Antonio Martínez Sánchez',
        Codirector: '',
        Nombre_Codirector: '',
        Jurado_1: 'DOC-002',
        Nombre_Jurado_1: 'Elena María López Ruiz',
        Jurado_2: '',
        Nombre_Jurado_2: '',
        Fecha_Inicio: '2023-06-01',
        Fecha_Defensa: '2023-11-30',
        Numero_Acta_Sustentacion: 'ACT-2023-089',
        URL_Documento: 'https://repositorio.example.com/tesis/002',
        Fecha_Registro: '2023-06-01 09:00:00',
        Ultima_Actualizacion: '2023-11-30 18:00:00'
    }
];

export const MOCK_TEACHERS = [
    {
        ID_Docente: 'DOC-001',
        Tipo_Documento: 'CC',
        Cedula: '111222',
        Lugar_Expedicion: 'Montería',
        Apellido1: 'Martínez',
        Apellido2: 'Sánchez',
        Nombre1: 'Ricardo',
        Nombre2: 'Antonio',
        Sexo: 'Masculino',
        Email: 'ricardo@test.com',
        Telefono: '321000',
        Comentarios: 'Docente de planta con perfil investigador.',
        Tipo_Vinculacion: 'Planta',
        Activo: 'Sí',
        Fecha_Vinculacion: '2020-02-15',
        Nivel_Formacion: 'Doctorado',
        Especialidad: 'Inteligencia Artificial',
        Categoria: 'Asociado',
        Link_CvLAC: 'https://cvlac.example.com/123',
        Grupo_Investigacion: 'GINTAL',
        Linea_Investigacion_Principal: 'Machine Learning',
        Fecha_Registro: '2020-02-15 10:00:00',
        Ultima_Actualizacion: '2023-12-01 15:30:00'
    },
    {
        ID_Docente: 'DOC-002',
        Tipo_Documento: 'CC',
        Cedula: '333444',
        Lugar_Expedicion: 'Cereté',
        Apellido1: 'López',
        Apellido2: 'Ruiz',
        Nombre1: 'Elena',
        Nombre2: 'María',
        Sexo: 'Femenino',
        Email: 'elena@test.com',
        Telefono: '300111',
        Comentarios: 'Catedrática experta en algoritmos.',
        Tipo_Vinculacion: 'Catedrático',
        Activo: 'Sí',
        Fecha_Vinculacion: '2022-08-01',
        Nivel_Formacion: 'Maestría',
        Especialidad: 'Ciencia de Datos',
        Categoria: 'Asistente',
        Link_CvLAC: 'https://cvlac.example.com/456',
        Grupo_Investigacion: 'DATA_SCI',
        Linea_Investigacion_Principal: 'Big Data',
        Fecha_Registro: '2022-08-01 09:00:00',
        Ultima_Actualizacion: '2023-11-20 08:00:00'
    }
];

export const MOCK_EXTERNALS = [
    {
        ID_Externo: 'EXT-001',
        Tipo_Documento: 'CC',
        Numero_Documento: '555666',
        Lugar_Expedicion: 'Sincelejo',
        Apellido1: 'Estrada',
        Apellido2: 'Moreno',
        Nombre1: 'Claudia',
        Nombre2: 'Patricia',
        Sexo: 'Femenino',
        Email: 'claudia.ext@test.com',
        Telefono: '300777',
        Pais: 'Colombia',
        Ciudad: 'Sincelejo',
        Tipo_Origen: 'Nacional',
        Organizacion: 'Universidad de Sucre',
        Cargo_Perfil: 'Par Académico',
        Fecha_Registro: '2024-02-10 09:00:00',
        Ultima_Actualizacion: '2024-02-10 09:00:00'
    },
    {
        ID_Externo: 'EXT-002',
        Tipo_Documento: 'PAS',
        Numero_Documento: 'P778899',
        Lugar_Expedicion: 'Madrid',
        Apellido1: 'Sanz',
        Apellido2: '',
        Nombre1: 'Javier',
        Nombre2: '',
        Sexo: 'Masculino',
        Email: 'javier.sanz@uam.es',
        Telefono: '+34 912...',
        Pais: 'España',
        Ciudad: 'Madrid',
        Tipo_Origen: 'Internacional',
        Organizacion: 'UAM',
        Cargo_Perfil: 'Ponente Internacional',
        Fecha_Registro: '2024-03-01 15:00:00',
        Ultima_Actualizacion: '2024-03-01 15:00:00'
    }
];

export const MOCK_EVENTS = [
    {
        ID_Evento: 'EV-001',
        Nombre_Evento: 'I Simposio Internacional de IA',
        Tipo_Evento: 'Simposio',
        Alcance: 'Internacional',
        Modalidad: 'Híbrida',
        Lugar: 'Auditorio Central',
        Fecha_Inicio: '2025-05-15',
        Fecha_Fin: '2025-05-17',
        Intensidad_Horaria: '24',
        Impacto_Academico: 'Fortalecimiento de la red de investigación en IA.',
        Presupuesto: '5000000',
        Fuente_Financiacion: 'Recursos Propios',
        URL_Evidencias: 'https://drive.google.com/event-001'
    }
];

export const MOCK_PARTICIPATIONS = [
    {
        ID_Participacion: 'PART-001',
        ID_Evento: 'EV-001',
        Nombre_Evento: 'I Simposio Internacional de IA',
        ID_Persona: 'EST-001',
        Nombre_Persona: 'Juan Carlos Pérez López',
        Cedula_Persona: '101010',
        Tipo_Persona: 'Estudiante',
        Rol: 'Ponente',
        Titulo_Ponencia: 'Impacto de la IA en la educación',
        Asistio: 'Sí',
        Fecha_Registro: '2025-05-10 10:00:00'
    }
];

export const MOCK_DOCUMENTS = [
    {
        ID_Documento: 'DOC-UUID-1',
        ID_Beneficiario: 'EST-001',
        Nombre_Beneficiario: 'Juan Carlos Pérez López',
        Tipo_Documento: 'Cédula',
        Usuario_Emisor: 'Admin',
        Detalle_Origen: 'Carga Manual Perfil',
        Detalles_JSON: JSON.stringify({
            url: "https://storage.nexodo.com/2025/cedulas/uuid-1.pdf",
            peso: "1.2 MB",
            tipo_mime: "application/pdf",
            nombre_original: "Cedula_Juan_Perez.pdf",
            extension: "pdf"
        }),
        Fecha_Registro: '2024-01-10 08:00:00'
    }
];
