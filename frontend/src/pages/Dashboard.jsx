import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboardService.js';
import alertasService from '../services/alertasService.js';
import estudiantesService from '../services/estudiantesService.js';
import citasService from '../services/citasService.js';
import catalogService from '../services/catalogService.js';
import Loader from '../components/ui/Loader.jsx';
import RiskScore from '../components/ui/RiskScore.jsx';
import Badge from '../components/ui/Badge.jsx';
import StudentTimeline from '../components/ui/StudentTimeline.jsx';

const Dashboard = () => {
  const navigate = useNavigate();
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
  const [alertasRecientes, setAlertasRecientes] = useState([]);
  const [proximasCitas, setProximasCitas] = useState([]);
  const [estudiantesRiesgo, setEstudiantesRiesgo] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsResp, alertasResp, estudiantesResp, citasResp, programasResp] = await Promise.all([
          dashboardService.getMetrics(),
          alertasService.getAll(),
          estudiantesService.getAll(),
          citasService.getAll(),
          catalogService.getPrograms()
        ]);

        if (!metricsResp.success) throw new Error(metricsResp.error || 'Error en métricas');
        if (!alertasResp.success || !estudiantesResp.success || !citasResp.success || !programasResp.success) {
          throw new Error('Error al cargar datos secundarios');
        }

        setStats(metricsResp.data);
        setProgramas(programasResp.data || []);
        setAlertasRecientes(alertasResp.data.slice(0, 6));
        setEstudiantesRiesgo(
          estudiantesResp.data.filter((item) => ['alto', 'critico', 'critico'].includes(String(item.nivel_riesgo || '').toLowerCase())).slice(0, 5)
        );

        const today = new Date().toISOString().slice(0, 10);
        setProximasCitas(
          citasResp.data
            .filter((item) => item.fecha >= today)
            .sort((a, b) => a.fecha.localeCompare(b.fecha))
            .slice(0, 3)
        );
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('No se pudieron cargar los datos del dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Panel central con indicadores clave y métricas de seguimiento.</p>
        </div>
      </div>

      {error && <div className="alert-box">{error}</div>}

      <div className="dashboard-grid">
        <div className="overview-panel">
          <div className="cards-grid">
            <div className="stat-card accent-soft" role="button" onClick={() => navigate('/app/estudiantes')}>
              <h3>{stats.totalEstudiantes}</h3>
              <p>Estudiantes registrados</p>
            </div>
            <div className="stat-card accent" role="button" onClick={() => navigate('/app/alertas')}>
              <h3>{stats.alertasAbiertas}</h3>
              <p>Alertas activas</p>
            </div>
            <div className="stat-card" role="button" onClick={() => navigate('/app/casos')}>
              <h3>{stats.casosAbiertos}</h3>
              <p>Casos abiertos</p>
            </div>
            <div className="stat-card accent-soft" role="button" onClick={() => navigate('/app/citas')}>
              <h3>{stats.citasHoy}</h3>
              <p>Citas del día</p>
            </div>
          </div>

          <section className="section-card">
            <div className="section-head">
              <h2>Actividad reciente</h2>
              <span>{alertasRecientes.length} alertas nuevas</span>
            </div>
            {alertasRecientes.length === 0 ? (
              <div className="empty-state">No hay alertas recientes.</div>
            ) : (
              <div className="activity-list">
                {alertasRecientes.map((alerta) => (
                  <div key={alerta.id} className="activity-item">
                    <div>
                      <strong>Alerta #{alerta.id}</strong>
                      <p>{alerta.descripcion}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Badge level={alerta.nivel_riesgo} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="section-card">
            <div className="section-head">
              <h2>Riesgo general</h2>
              <span>Score</span>
            </div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <RiskScore score={Math.min(100, Math.round((stats.estudiantesAltoRiesgo / Math.max(1, stats.totalEstudiantes)) * 100))} />
                <div>
                  <strong>{stats.estudiantesAltoRiesgo}</strong>
                  <div style={{ color: 'var(--text-muted)' }}>Estudiantes en alto riesgo</div>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ height: 72 }}>
                  {/* small sparkline-like bar visualization */}
                  <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                    {alertasRecientes.slice(0, 10).map((a, i) => (
                      <rect key={a.id} x={i * 9} y={10} width={6} height={(Math.min(20, (a.id % 5) * 4) + 6)} fill="#2f6cdf" opacity={0.85} />
                    ))}
                  </svg>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="sidebar-panel">
          <section className="section-card">
            <div className="section-head">
              <h2>Estudiantes en riesgo</h2>
              <span>{estudiantesRiesgo.length}</span>
            </div>
            {estudiantesRiesgo.length === 0 ? (
              <div className="empty-state">No hay estudiantes en riesgo crítico por ahora.</div>
            ) : (
              <ul className="mini-list">
                {estudiantesRiesgo.map((item) => (
                  <li key={item.id} style={{ display: 'grid' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong>{item.nombre}</strong>
                      <Badge level={item.nivel_riesgo} />
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{programas.find((programa) => String(programa.id) === String(item.programa_id))?.nombre || 'Programa no definido'}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="section-card">
            <div className="section-head">
              <h2>Próximas citas</h2>
            </div>
            {proximasCitas.length === 0 ? (
              <div className="empty-state">No hay citas programadas próximamente.</div>
            ) : (
              <ul className="mini-list">
                {proximasCitas.map((item) => (
                  <li key={item.id}>
                    <strong>{item.fecha} · {item.hora}</strong>
                    <span>{item.estado || 'Sin estado'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="section-card">
            <div className="section-head">
              <h2>Últimas acciones</h2>
            </div>
            <StudentTimeline events={alertasRecientes.map((a) => ({ id: a.id, date: a.created_at || '—', title: `Alerta #${a.id}`, text: a.descripcion }))} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
