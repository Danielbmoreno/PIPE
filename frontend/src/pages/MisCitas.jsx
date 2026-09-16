import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import citasService from '../services/citasService.js';
import Loader from '../components/ui/Loader.jsx';

const MisCitas = () => {
  const { user } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await citasService.getForStudent(user?.id);
        if (!response.success) {
          throw new Error(response.error || 'Error al cargar las citas');
        }
        setCitas(response.data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar tus citas.');
      } finally {
        setLoading(false);
      }
    };

    if (user) load();
  }, [user]);

  if (loading) return <Loader />;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Mis citas</h1>
          <p>Consulta tus citas agendadas y su estado.</p>
        </div>
      </div>

      {error && <div className="alert-box">{error}</div>}

      {citas.length === 0 ? (
        <div className="empty-state">
          No tienes citas registradas. Si necesitas agendar, contacta a tu consejero.
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((item) => (
                <tr key={item.id}>
                  <td>{item.fecha}</td>
                  <td>{item.hora}</td>
                  <td>{item.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MisCitas;
