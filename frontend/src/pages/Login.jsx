import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../components/ui/ToastContext.jsx';

const Login = () => {
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      const message = err?.message || err?.error || 'No se pudo iniciar sesión';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">PIPE</div>
        <p className="login-copy">Plataforma Inteligente de Permanencia Estudiantil</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Correo institucional
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@universidad.edu"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </label>

          {error && <div className="error-text">{error}</div>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Validando...' : 'Iniciar sesión'}
          </button>
          <p className="login-hint">Debes usar un correo institucional que termine en <strong>.edu</strong>.</p>
        </form>
      </div>
    </div>
  );
};

export default Login;
