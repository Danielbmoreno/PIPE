import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Loader from '../components/ui/Loader.jsx';
import Login from '../pages/Login.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Estudiantes from '../pages/Estudiantes.jsx';
import Alertas from '../pages/Alertas.jsx';
import Casos from '../pages/Casos.jsx';
import Intervenciones from '../pages/Intervenciones.jsx';
import Citas from '../pages/Citas.jsx';
import Profile from '../pages/Profile.jsx';
import MisCitas from '../pages/MisCitas.jsx';
import Unauthorized from '../pages/Unauthorized.jsx';
import MainLayout from '../components/layout/MainLayout.jsx';
import StudentSpace from '../pages/StudentSpace.jsx';
import ComingSoon from '../pages/ComingSoon.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? children : <Navigate to="/login" replace />;
};

const RoleRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return allowedRoles.includes(user.rol_id) ? children : <Unauthorized />;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="estudiantes" element={<RoleRoute allowedRoles={['admin', 'docente', 'consejero']}><Estudiantes /></RoleRoute>} />
        <Route path="alertas" element={<RoleRoute allowedRoles={['admin', 'docente', 'consejero']}><Alertas /></RoleRoute>} />
        <Route path="casos" element={<RoleRoute allowedRoles={['admin', 'consejero']}><Casos /></RoleRoute>} />
        <Route path="intervenciones" element={<RoleRoute allowedRoles={['admin']}><Intervenciones /></RoleRoute>} />
        <Route path="citas" element={<RoleRoute allowedRoles={['admin', 'consejero']}><Citas /></RoleRoute>} />
        <Route path="profile" element={<RoleRoute allowedRoles={['estudiante']}><Profile /></RoleRoute>} />
        <Route path="mis-citas" element={<RoleRoute allowedRoles={['estudiante']}><MisCitas /></RoleRoute>} />
        <Route path="mi-espacio" element={<RoleRoute allowedRoles={['estudiante']}><StudentSpace /></RoleRoute>} />
        <Route path="proximamente" element={<RoleRoute allowedRoles={['estudiante']}><ComingSoon /></RoleRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default AppRouter;
