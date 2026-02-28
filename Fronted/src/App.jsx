import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- LAYOUTS ---
import MainLayout from './components/layout/MainLayout';

// --- PÁGINAS ---
import DashboardHome from './pages/dashboard/DashboardHome';

// Estudiantes
import StudentList from './pages/students/StudentList';
import StudentImport from './pages/students/StudentImport';
import StudentForm from './pages/students/StudentForm';

// Docentes
import TeacherList from './pages/teachers/TeacherList';
import TeacherForm from './pages/teachers/TeacherForm';
import TeacherImport from './pages/teachers/TeacherImport';

// Tesis
import ThesisList from './pages/thesis/ThesisList';
import ThesisForm from './pages/thesis/ThesisForm';
import ThesisImport from './pages/thesis/ThesisImport';

// Externos
import ExternList from './pages/externals/ExternList';
import ExternForm from './pages/externals/ExternForm';
import ExternImport from './pages/externals/ExternImport';

// Eventos
import EventList from './pages/events/EventList';
import EventForm from './pages/events/EventForm';

// Documentos
import DocumentHub from './pages/documents/DocumentHub';

// Repositorio
import RepositoryHome from './pages/repository/RepositoryHome';

function App() {
  // Estado para el Modo Oscuro
  const [darkMode, setDarkMode] = useState(false);

  // Efecto: Cuando cambia 'darkMode', actualiza la clase en el <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Routes>
        {/* RUTA DE LOGIN (Pública) */}
        <Route path="/login" element={<div className="h-screen flex items-center justify-center bg-slate-100">Login Page</div>} />

        {/* RUTAS DEL SISTEMA (Protegidas por Layout) */}
        <Route path="/" element={<MainLayout darkMode={darkMode} setDarkMode={setDarkMode} />}>

          {/* Redirección automática */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard" element={<DashboardHome />} />

          {/* --- MÓDULO ESTUDIANTES --- */}
          <Route path="students" element={<StudentList />} />
          <Route path="students/import" element={<StudentImport />} />

          {/* 2. AGREGAMOS LAS RUTAS DEL FORMULARIO AQUÍ: */}
          <Route path="students/new" element={<StudentForm />} />
          <Route path="students/edit/:id" element={<StudentForm />} />
          <Route path="students/view/:id" element={<StudentForm />} />

          {/* --- MÓDULO DOCENTES --- */}
          <Route path="teachers" element={<TeacherList />} />
          <Route path="teachers/new" element={<TeacherForm />} />
          <Route path="teachers/edit/:id" element={<TeacherForm />} />
          <Route path="teachers/view/:id" element={<TeacherForm />} />
          <Route path="teachers/import" element={<TeacherImport />} />

          {/* --- MÓDULO DOCUMENTOS --- */}
          <Route path="documents" element={<DocumentHub />} />

          {/* --- MÓDULO TESIS --- */}
          <Route path="thesis" element={<ThesisList />} />
          <Route path="thesis/new" element={<ThesisForm />} />
          <Route path="thesis/edit/:id" element={<ThesisForm />} />
          <Route path="thesis/view/:id" element={<ThesisForm />} />
          <Route path="thesis/import" element={<ThesisImport />} />

          {/* --- MÓDULO EXTERNOS --- */}
          <Route path="externals" element={<ExternList />} />
          <Route path="externals/new" element={<ExternForm />} />
          <Route path="externals/edit/:id" element={<ExternForm />} />
          <Route path="externals/view/:id" element={<ExternForm />} />
          <Route path="externals/import" element={<ExternImport />} />

          {/* --- MÓDULO EVENTOS --- */}
          <Route path="events" element={<EventList />} />
          <Route path="events/new" element={<EventForm />} />
          <Route path="events/edit/:id" element={<EventForm />} />
          <Route path="events/view/:id" element={<EventForm />} />

          {/* --- MÓDULO REPOSITORIO --- */}
          <Route path="repository" element={<RepositoryHome />} />

          {/* Ruta 404 */}
          <Route path="*" element={<div className="p-10 text-center text-red-500">Página no encontrada</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;