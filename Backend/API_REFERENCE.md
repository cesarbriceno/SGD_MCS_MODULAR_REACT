# 📘 Referencia de la API (Backend - Google Apps Script)

Esta documentación detalla las funciones disponibles en el Backend (servidor) que pueden ser invocadas desde el Frontend (React) utilizando `google.script.run`.

## 🚀 Cómo llamar a la API desde el Frontend

En el frontend, las llamadas se realizan de forma asíncrona:

```javascript
// Ejemplo de llamada desde React
google.script.run
  .withSuccessHandler((response) => {
    const data = JSON.parse(response);
    console.log("Datos recibidos:", data);
  })
  .withFailureHandler((error) => {
    console.error("Error en la llamada:", error);
  })
  .getStats(); // Nombre de la función en el backend
```

---

## 📊 Dashboard y Estadísticas

### `getStats()`
Obtiene un resumen consolidado de toda la base de datos para los indicadores del dashboard.
- **Retorna:** `string` (JSON)
- **Estructura del JSON:**
  ```json
  {
    "success": true,
    "stats": {
      "estudiantes": { "total": 0, "activos": 0, "egresados": 0, "graduados": 0 },
      "tesis": { "total": 0, "enCurso": 0, "sustentadas": 0 },
      "datasets": { "estudiantes": [], "tesis": [], "docentes": [], ... }
    },
    "lastUpdate": "4/3/2026, 11:35:00"
  }
  ```

---

## 📋 Listados de Base de Datos (CRUD Lectura)

Estas funciones devuelven el contenido completo de las hojas de cálculo correspondientes en formato JSON.

| Función | Descripción | Retorna |
| :--- | :--- | :--- |
| `getStudents()` | Lista completa de estudiantes. | `string` (JSON Array) |
| `getTeachers()` | Lista completa de docentes. | `string` (JSON Array) |
| `getExterns()` | Lista completa de personal externo. | `string` (JSON Array) |
| `getThesis()` | Lista completa de tesis. | `string` (JSON Array) |
| `getEvents()` | Lista completa de eventos. | `string` (JSON Array) |
| `getParticipations()` | Registro de participaciones en eventos. | `string` (JSON Array) |
| `getDocuments()` | Historial de auditoría y documentos. | `string` (JSON Array) |

---

## 📁 Gestión de Archivos y Carpetas (Google Drive)

### Gestión de Carpetas
- `getSystemRootFolderId()`: Obtiene el ID y URL de la carpeta raíz del sistema.
- `createSubfolder(parentId, name)`: Crea una carpeta dentro de otra.
- `renameFolder(id, newName)`: Cambia el nombre de una carpeta.
- `deleteFolder(id)`: Mueve una carpeta a la papelera.
- `getFolderStructure(id, depth)`: Retorna el árbol de carpetas (recursivo).
- `syncEntityFolder(type, id)`: Asegura que una entidad (ej. Estudiante) tenga su carpeta creada y vinculada en el Sheet.

### Gestión de Archivos
- `getFiles(folderId)`: Lista los archivos dentro de una carpeta.
- `uploadFile(folderId, fileData)`: Sube un archivo. `fileData` debe incluir `{name, content (base64), mimeType}`.
- `downloadFile(fileId)`: Obtiene el contenido de un archivo en base64 para descarga en cliente.
- `renameFile(id, newName)`: Cambia el nombre de un archivo.
- `deleteFile(id)`: Mueve un archivo a la papelera.

---

## 🔍 Búsqueda y Navegación

### `searchUniversal(query, context)`
Busca texto en las hojas de cálculo.
- **Parámetros:**
  - `query`: `string` - Texto a buscar.
  - `context`: `string` - 'estudiante', 'tesis', etc.
- **Retorna:** `string` (JSON Array de resultados).

### `searchUniversalRepository(query)`
Busca archivos o carpetas en todo el repositorio de Drive de forma recursiva.
- **Parámetros:**
  - `query`: `string` - Nombre del archivo o carpeta.
- **Retorna:** `Array<Object>` - Lista de coincidencias con ID, Nombre y URL.

---

## 🛠️ Notas Técnicas
- **Seguridad:** Todas las funciones están protegidas por los permisos de la cuenta de Google que ejecuta el script.
- **Límites:** Google Apps Script tiene límites de tiempo de ejecución (6-30 mins) y cuotas diarias de Drive/Sheets.
- **Formato:** La mayoría de las funciones de Sheets devuelven un `string` que debe ser procesado con `JSON.parse()` en el frontend.
