import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Estudiantes from '../pages/Estudiantes.jsx';
import Alertas from '../pages/Alertas.jsx';
import Casos from '../pages/Casos.jsx';
import Intervenciones from '../pages/Intervenciones.jsx';
import Citas from '../pages/Citas.jsx';
import MainLayout from '../components/layout/MainLayout.jsx';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/app" element={<MainLayout />}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="estudiantes" element={<Estudiantes />} />
        <Route path="alertas" element={<Alertas />} />
        <Route path="casos" element={<Casos />} />
        <Route path="intervenciones" element={<Intervenciones />} />
        <Route path="citas" element={<Citas />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default AppRouter;
