import { useState } from 'react';
import { anotherIndex, motivationalQuotes, randomIndex } from '../../data/studentSpace.js';

export default function MotivationalQuote({ interactive = false }) {
  const [index, setIndex] = useState(() => randomIndex(motivationalQuotes.length));
  return <div className="pipe-quote">
    <p className="pipe-quote-text" key={index} aria-live="polite">“{motivationalQuotes[index]}”</p>
    {interactive && <button className="secondary-button" onClick={() => setIndex((current) => anotherIndex(current, motivationalQuotes.length))}>Dame otra frase <span aria-hidden="true">↗</span></button>}
  </div>;
}
