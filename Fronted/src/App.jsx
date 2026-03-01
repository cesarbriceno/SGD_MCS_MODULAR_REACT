import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// --- PÁGINAS (Imports Estáticos para compatibilidad con SingleFile) ---
import DashboardHome from './pages/dashboard/DashboardHome';

// Estudiantes
import StudentList from './pages/students/StudentList';
import StudentForm from './pages/students/StudentForm';
import StudentImport from './pages/students/StudentImport';

// Docentes
import TeacherList from './pages/teachers/TeacherList';
import TeacherForm from './pages/teachers/TeacherForm';
import TeacherImport from './pages/teachers/TeacherImport';

// Tesis e Investigadores
import ThesisList from './pages/thesis/ThesisList';
import ThesisForm from './pages/thesis/ThesisForm';
import ThesisImport from './pages/thesis/ThesisImport';

// Externos
import ExternList from './pages/externals/ExternList';
import ExternForm from './pages/externals/ExternForm';
import ExternImport from './pages/externals/ExternImport';

// Eventos e Impacto
import EventList from './pages/events/EventList';
import EventForm from './pages/events/EventForm';

// Documentos
import DocumentHub from './pages/documents/DocumentHub';

// Repositorio
import RepositoryHome from './pages/repository/RepositoryHome';

// Pantalla de carga simple
const LoadingScreen = () => (
  <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium animate-pulse">Cargando aplicación...</p>
    </div>
  </div>
);

// Alternativa para Login si no existe el archivo
const LoginPagePlaceholder = () => (
  <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold italic">
    Login Page (Próximamente)
  </div>
);

function App() {
  const [darkMode, setDarkMode] = React.useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <NotificationProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<LoginPagePlaceholder />} />

            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout darkMode={darkMode} setDarkMode={setDarkMode} />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardHome />} />

              {/* Estudiantes */}
              <Route path="students" element={<StudentList />} />
              <Route path="students/import" element={<StudentImport />} />
              <Route path="students/new" element={<StudentForm />} />
              <Route path="students/edit/:id" element={<StudentForm />} />
              <Route path="students/view/:id" element={<StudentForm />} />

              {/* Docentes */}
              <Route path="teachers" element={<TeacherList />} />
              <Route path="teachers/import" element={<TeacherImport />} />
              <Route path="teachers/new" element={<TeacherForm />} />
              <Route path="teachers/edit/:id" element={<TeacherForm />} />
              <Route path="teachers/view/:id" element={<TeacherForm />} />

              {/* Documentos */}
              <Route path="documents" element={<DocumentHub />} />

              {/* Tesis */}
              <Route path="thesis" element={<ThesisList />} />
              <Route path="thesis/import" element={<ThesisImport />} />
              <Route path="thesis/new" element={<ThesisForm />} />
              <Route path="thesis/edit/:id" element={<ThesisForm />} />
              <Route path="thesis/view/:id" element={<ThesisForm />} />

              {/* Externos */}
              <Route path="externals" element={<ExternList />} />
              <Route path="externals/import" element={<ExternImport />} />
              <Route path="externals/new" element={<ExternForm />} />
              <Route path="externals/edit/:id" element={<ExternForm />} />
              <Route path="externals/view/:id" element={<ExternForm />} />

              {/* Eventos */}
              <Route path="events" element={<EventList />} />
              <Route path="events/new" element={<EventForm />} />
              <Route path="events/edit/:id" element={<EventForm />} />
              <Route path="events/view/:id" element={<EventForm />} />

              {/* Repositorio */}
              <Route path="repository" element={<RepositoryHome />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;