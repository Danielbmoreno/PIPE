import { useEffect, useRef, useState } from 'react';
import { minuMessages, randomIndex } from '../../data/studentSpace.js';

const assets = import.meta.glob('../../assets/minu.{png,svg}', { eager: true, query: '?url', import: 'default' });
const minuAsset = assets['../../assets/minu.png'] || assets['../../assets/minu.svg'];

export default function FloatingMinu({ celebration }) {
  const [hidden, setHidden] = useState(false);
  const [broken, setBroken] = useState(false);
  const [message, setMessage] = useState('');
  const dock = useRef(null);
  const motion = useRef(null);
  const messageTimer = useRef(null);

  useEffect(() => {
    if (hidden) return undefined;
    const show = () => {
      if (document.hidden) return;
      setMessage(minuMessages[randomIndex(minuMessages.length)]);
      window.clearTimeout(messageTimer.current);
      messageTimer.current = window.setTimeout(() => setMessage(''), 6000);
    };
    const welcome = window.setTimeout(show, 1800);
    const occasional = window.setInterval(show, 60000);
    return () => { window.clearTimeout(welcome); window.clearInterval(occasional); window.clearTimeout(messageTimer.current); };
  }, [hidden]);

  useEffect(() => {
    if (!celebration || hidden) return;
    setMessage(celebration.message);
    window.clearTimeout(messageTimer.current);
    messageTimer.current = window.setTimeout(() => setMessage(''), 6000);
    return () => window.clearTimeout(messageTimer.current);
  }, [celebration, hidden]);

  useEffect(() => {
    if (hidden) return undefined;
    const media = window.matchMedia('(min-width: 1100px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let frame = 0;
    let x = 0; let y = 0; let targetX = 0; let targetY = 0;
    const animate = () => {
      x += (targetX - x) * 0.08; y += (targetY - y) * 0.08;
      if (motion.current) motion.current.style.transform = `translate(${x}px, ${y}px)`;
      frame = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.1 ? window.requestAnimationFrame(animate) : 0;
    };
    const move = (event) => {
      if (!media.matches || !dock.current) return;
      const important = event.target instanceof Element && event.target.closest('input, textarea, select, button, a, table, [role="dialog"], .modal-backdrop, nav');
      // Only a small displacement inside a reserved side lane, never at the pointer.
      targetX = important ? 0 : Math.max(-10, Math.min(10, (event.clientX / window.innerWidth - 0.5) * 20));
      targetY = important ? 0 : Math.max(-12, Math.min(12, (event.clientY / window.innerHeight - 0.5) * 24));
      if (!frame) frame = window.requestAnimationFrame(animate);
    };
    const reset = () => {
      window.cancelAnimationFrame(frame); frame = 0; x = 0; y = 0;
      if (motion.current) motion.current.style.transform = '';
    };
    const configure = () => {
      window.removeEventListener('pointermove', move);
      reset();
      if (media.matches) window.addEventListener('pointermove', move, { passive: true });
    };
    configure(); media.addEventListener('change', configure);
    window.addEventListener('blur', reset);
    return () => { reset(); window.removeEventListener('pointermove', move); media.removeEventListener('change', configure); window.removeEventListener('blur', reset); };
  }, [hidden]);

  return <aside className={`pipe-minu-dock ${hidden ? 'is-hidden' : ''}`} ref={dock} aria-label="Acompañante Minu">
    <button className="pipe-minu-toggle" onClick={() => { setHidden((value) => !value); setMessage(''); }} aria-expanded={!hidden}>{hidden ? 'Mostrar Minu' : 'Ocultar Minu'}</button>
    {!hidden && <div className="pipe-minu-motion" ref={motion}>
      <div className="pipe-minu-bubble" aria-live="polite" aria-atomic="true">{message && <p key={message}>{message}</p>}</div>
      <div className="pipe-minu-figure">{minuAsset && !broken ? <img src={minuAsset} onError={() => setBroken(true)} alt="Minu, acompañante de PIPE" /> : <div className="pipe-minu-fallback" aria-hidden="true"><span>✦</span><strong>PIPE</strong></div>}</div>
      <small>{minuAsset && !broken ? 'Minu te acompaña' : 'Minu · imagen pendiente'}</small>
    </div>}
  </aside>;
}
