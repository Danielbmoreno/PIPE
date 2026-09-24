import { useEffect, useState } from 'react';
import { dailyChallenges } from '../../data/studentSpace.js';
import { progressKey, readProgress, saveProgress, visitProgress } from '../../lib/studentProgress.js';

export default function DailyProgress({ userId, onCelebrate }) {
  const key = progressKey(userId);
  const [progress, setProgress] = useState(() => visitProgress(readProgress(key)));
  const [persistent, setPersistent] = useState(true);

  useEffect(() => {
    let midnightTimer;
    const refresh = () => {
      setProgress((current) => {
        const stored = readProgress(key);
        const next = visitProgress(stored.lastVisit ? stored : current);
        return JSON.stringify(next) === JSON.stringify(current) ? current : next;
      });
      window.clearTimeout(midnightTimer);
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      midnightTimer = window.setTimeout(refresh, midnight.getTime() - now.getTime() + 100);
    };
    const onStorage = (event) => { if (event.key === key) refresh(); };
    const onVisible = () => { if (!document.hidden) refresh(); };
    refresh();
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(midnightTimer);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [key]);

  useEffect(() => { setPersistent(saveProgress(key, progress)); }, [key, progress]);

  const complete = () => {
    const latest = visitProgress(readProgress(key));
    // A click across midnight must not complete yesterday's challenge.
    if (latest.challengeDay !== progress.challengeDay) { setProgress(latest); return; }
    setProgress({ ...progress, completed: true });
    onCelebrate('¡Buen trabajo! Cada pequeño paso cuenta. 🌱');
  };

  return <div className="pipe-progress-grid">
    <section className="student-card pipe-challenge" aria-labelledby="challenge-title">
      <span className="eyebrow">UN PASO POSIBLE</span><h2 id="challenge-title">Reto del día 🎯</h2>
      <p>{dailyChallenges[progress.challengeIndex]}</p>
      <button className={progress.completed ? 'secondary-button' : 'primary-button'} disabled={progress.completed} onClick={complete}>{progress.completed ? 'Reto completado ✓' : 'Marcar como completado'}</button>
      <span className="pipe-note" role="status">{progress.completed ? 'Hoy ya diste un paso. Puedes sentirte bien por ello.' : 'Una invitación, no una obligación. Mañana habrá un nuevo reto.'}</span>
    </section>
    <section className="student-card pipe-streak" aria-labelledby="streak-title">
      <span className="eyebrow">A TU RITMO</span><h2 id="streak-title">Racha PIPE</h2>
      <p className="pipe-streak-count" key={progress.streak}><span aria-hidden="true">🔥</span> {progress.streak}</p>
      <p>{progress.streak === 1 ? '1 día acompañando tu proceso' : `${progress.streak} días ${progress.streak >= 7 ? 'avanzando con PIPE' : 'acompañando tu proceso'}`}</p>
      <small>Se suma un día al visitar este espacio. Si haces una pausa, siempre puedes volver a empezar.</small>
    </section>
    <p className="pipe-storage-note" role="status">{persistent ? 'Tu reto y tu racha se guardan para tu cuenta en este navegador.' : 'Este navegador no permite guardar tu progreso. Puedes seguir usando el espacio durante esta visita.'}</p>
  </div>;
}
