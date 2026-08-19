import { useEffect, useState } from 'react';
import dashboardService from '../services/dashboardService.js';
import Loader from '../components/ui/Loader.jsx';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEstudiantes: 0,
    alertasAbiertas: 0,
    casosAbiertos: 0,
    citasHoy: 0,
    estudiantesAltoRiesgo: 0,
    alertasCriticas: 0,
    citasPerdidas: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getMetrics();
        if (!response.success) {
          throw new Error(response.error || 'Error al cargar métricas');
        }
        setStats(response.data);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('No se pudieron cargar las métricas.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen rápido de estudiantes, alertas, casos y citas.</p>
        </div>
      </div>
      {error ? (
        <div className="alert-box">{error}</div>
      ) : (
        <div className="cards-grid">
          <div className="stat-card">
            <h3>{stats.totalEstudiantes}</h3>
            <p>Estudiantes registrados</p>
          </div>
          <div className="stat-card accent">
            <h3>{stats.alertasAbiertas}</h3>
            <p>Alertas activas</p>
          </div>
          <div className="stat-card">
            <h3>{stats.casosAbiertos}</h3>
            <p>Casos abiertos</p>
          </div>
          <div className="stat-card accent-soft">
            <h3>{stats.citasHoy}</h3>
            <p>Citas del día</p>
          </div>
          <div className="stat-card">
            <h3>{stats.estudiantesAltoRiesgo}</h3>
            <p>Estudiantes alto riesgo</p>
          </div>
          <div className="stat-card accent">
            <h3>{stats.alertasCriticas}</h3>
            <p>Alertas críticas</p>
          </div>
          <div className="stat-card accent-soft">
            <h3>{stats.citasPerdidas}</h3>
            <p>Citas perdidas</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
