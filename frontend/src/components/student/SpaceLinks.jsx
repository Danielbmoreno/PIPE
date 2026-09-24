import { useNavigate } from 'react-router-dom';

export default function SpaceLinks() {
  const navigate = useNavigate();
  return <nav className="pipe-space-links" aria-label="Tu espacio de acompañamiento">
    <button onClick={() => navigate('/app/mi-espacio')}><span aria-hidden="true">✦</span><strong>Mi espacio PIPE</strong><small>Un momento para ti</small></button>
    <button onClick={() => navigate('/app/mi-espacio?seccion=pausa')}><span aria-hidden="true">◒</span><strong>Tomarme una pausa</strong><small>Descansa y vuelve a empezar</small></button>
    <button onClick={() => navigate('/app/mi-espacio?seccion=recursos')}><span aria-hidden="true">▤</span><strong>Recursos</strong><small>Algo nuevo por descubrir</small></button>
  </nav>;
}
