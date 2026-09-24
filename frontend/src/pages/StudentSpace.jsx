import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import MotivationalQuote from '../components/student/MotivationalQuote.jsx';
import DailyProgress from '../components/student/DailyProgress.jsx';
import MemoryGame from '../components/student/MemoryGame.jsx';
import ReadingSpace from '../components/student/ReadingSpace.jsx';
import FloatingMinu from '../components/student/FloatingMinu.jsx';

export default function StudentSpace() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [celebration, setCelebration] = useState(null);
  const celebrate = (message) => setCelebration({ message, at: Date.now() });
  const section = params.get('seccion');
  useEffect(() => {
    if (['pausa', 'recursos'].includes(section)) {
      const target = document.getElementById(section);
      target?.scrollIntoView({ block: 'start', behavior: 'instant' });
      target?.querySelector('h2')?.focus({ preventScroll: true });
    }
  }, [section]);

  return <div className="page-shell student-page pipe-space pipe-with-minu">
    <section className="student-hero pipe-space-hero"><div className="hero-copy"><span className="eyebrow">UN MOMENTO PARA TI</span><h1>Mi espacio PIPE</h1><p>Tu vida universitaria también necesita curiosidad, pequeñas pausas y compañía. Este espacio es tuyo.</p><div className="hero-actions"><Link className="primary-button" to="/app/mi-espacio?seccion=pausa">Tomarme una pausa</Link><Link className="ghost-button" to="/app/dashboard">Mi proceso <span aria-hidden="true">↗</span></Link></div></div><div className="pipe-space-mark" aria-hidden="true">✦</div></section>
    <section className="student-card pipe-quote-card"><span className="eyebrow">UNA IDEA PARA LLEVAR CONTIGO</span><h2>Frase del día</h2><MotivationalQuote interactive /></section>
    <DailyProgress key={user.id} userId={user.id} onCelebrate={celebrate} />
    <MemoryGame onCelebrate={celebrate} />
    <ReadingSpace />
    <section className="pipe-space-footer"><span aria-hidden="true">💙</span><p>No tienes que recorrer todo el camino hoy. Tu equipo de acompañamiento también está para ti.</p><Link to="/app/mis-citas" className="text-link">Revisar mis citas →</Link></section>
    <FloatingMinu celebration={celebration} />
  </div>;
}
