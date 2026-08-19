import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate('/app/dashboard');
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
              placeholder="usuario@institucion.edu"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </label>
          <button type="submit" className="primary-button">Iniciar sesión</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
