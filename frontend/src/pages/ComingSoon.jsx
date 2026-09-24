import { Link } from 'react-router-dom';
import FloatingMinu from '../components/student/FloatingMinu.jsx';

export default function ComingSoon() {
  return <div className="page-shell student-page pipe-with-minu"><section className="student-card pipe-coming-soon"><span className="eyebrow">PRÓXIMAMENTE</span><div className="pipe-construction-icon" aria-hidden="true">✦</div><h1>Módulo en construcción</h1><h2>PIPE continúa creciendo contigo.</h2><p>Estamos preparando nuevas herramientas para acompañar tu proceso universitario.</p><p className="pipe-note">Mientras tanto, puedes explorar tu espacio, consultar tus citas o continuar con tu seguimiento.</p><div className="hero-actions"><Link className="primary-button" to="/app/dashboard">Regresar al Dashboard</Link><Link className="secondary-button" to="/app/mi-espacio">Explorar mi espacio</Link></div></section><FloatingMinu /></div>;
}
