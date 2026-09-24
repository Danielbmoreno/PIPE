import { useEffect, useRef, useState } from 'react';
import { createDeck, formatTime } from '../../lib/memoryGame.js';

export default function MemoryGame({ onCelebrate }) {
  const [cards, setCards] = useState(createDeck);
  const [opened, setOpened] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [announcement, setAnnouncement] = useState('Encuentra las seis parejas. El tiempo comienza con tu primera tarjeta.');
  const turnLocked = useRef(false);
  const firstCard = useRef(null);
  const won = matched.length === cards.length;

  useEffect(() => {
    if (startedAt === null || won) return undefined;
    const update = () => setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt, won]);

  useEffect(() => {
    if (opened.length !== 2) return undefined;
    const timer = window.setTimeout(() => {
      setOpened([]);
      turnLocked.current = false;
    }, cards[opened[0]].pair === cards[opened[1]].pair ? 250 : 950);
    return () => window.clearTimeout(timer);
  }, [opened, cards]);

  const flip = (index) => {
    if (turnLocked.current || won || matched.includes(index) || opened.includes(index)) return;
    if (startedAt === null) setStartedAt(Date.now());
    const next = [...opened, index];
    setOpened(next);
    if (next.length !== 2) return;
    turnLocked.current = true;
    setMoves((count) => count + 1);
    if (cards[next[0]].pair === cards[index].pair) {
      const pairs = [...matched, ...next];
      setMatched(pairs);
      if (pairs.length === cards.length) {
        setSeconds(Math.floor((Date.now() - (startedAt ?? Date.now())) / 1000));
        setAnnouncement('¡Lo lograste! Encontraste todas las parejas.');
        onCelebrate('¡Muy bien! Una pausa para volver con energía. 💙');
      } else setAnnouncement(`¡Pareja de ${cards[index].label}! Llevas ${pairs.length / 2} de 6.`);
    } else setAnnouncement('No son pareja. Prueba de nuevo, sin prisa.');
  };

  const restart = () => {
    turnLocked.current = false;
    setCards(createDeck()); setOpened([]); setMatched([]); setMoves(0); setStartedAt(null); setSeconds(0);
    setAnnouncement('Nuevo juego. Encuentra las seis parejas a tu ritmo.');
    firstCard.current?.focus();
  };

  return <section className="student-card pipe-memory" id="pausa" aria-labelledby="memory-title">
    <div className="section-head"><div><span className="eyebrow">DESCONECTA UN MOMENTO</span><h2 id="memory-title" tabIndex={-1}>Pausa PIPE 🎮</h2></div><span className="pipe-pill">Memoria · 6 parejas</span></div>
    <p>Una pequeña pausa también hace parte de aprender. Gira dos tarjetas y encuentra sus parejas.</p>
    <div className="pipe-game-stats"><span>Tiempo <strong aria-label={`${seconds} segundos`}>{formatTime(seconds)}</strong></span><span>Movimientos <strong>{moves}</strong></span><span>Parejas <strong>{matched.length / 2}/6</strong></span></div>
    <div className="pipe-memory-grid" aria-label="Tarjetas de memoria">
      {cards.map((card, index) => {
        const found = matched.includes(index);
        const visible = found || opened.includes(index);
        return <button key={card.id} ref={index === 0 ? firstCard : undefined} className={`pipe-memory-card ${visible ? 'is-flipped' : ''} ${found ? 'is-matched' : ''}`} aria-label={`Tarjeta ${index + 1}: ${visible ? card.label : 'oculta'}${found ? ', pareja encontrada' : ''}`} aria-pressed={visible} aria-disabled={found || (turnLocked.current && !visible)} onClick={() => flip(index)}>
          <span className="pipe-card-inner" aria-hidden="true"><span className="pipe-card-back">✦<small>PIPE</small></span><span className="pipe-card-front">{card.symbol}<small>{card.label}</small></span></span>
        </button>;
      })}
    </div>
    <p className={won ? 'pipe-game-message is-victory' : 'pipe-game-message'} role="status">{announcement}</p>
    {won && <p>Completaste la pausa en {moves} movimientos y {formatTime(seconds)}. ¡Buen trabajo!</p>}
    <button className="secondary-button" onClick={restart}>Jugar otra vez</button>
  </section>;
}
