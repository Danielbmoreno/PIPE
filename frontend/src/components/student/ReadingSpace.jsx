import { useEffect, useRef, useState } from 'react';
import { localReadings } from '../../data/studentSpace.js';
import { searchBooks } from '../../services/readingService.js';

function BookCard({ book, index }) {
  const [brokenCover, setBrokenCover] = useState(false);
  return <article className="pipe-book-card">
    <div className={`pipe-book-cover tone-${index % 4}`}>
      {book.cover && !brokenCover ? <img src={book.cover} alt={`Portada de ${book.title}`} loading="lazy" referrerPolicy="no-referrer" onError={() => setBrokenCover(true)} /> : <div className="pipe-book-placeholder" aria-hidden="true"><span>LECTURAS PIPE</span><strong>{book.title}</strong><span>✦</span></div>}
    </div>
    <div className="pipe-book-details"><span className="eyebrow">{book.category}</span><h3>{book.title}</h3><p className="pipe-book-author">{book.author || 'Autor no disponible'}{book.year ? ` · ${book.year}` : ''}</p><p>{book.description}</p><a href={book.url} target="_blank" rel="noopener noreferrer" className="text-link" aria-label={`Explorar ${book.title} en Open Library (nueva pestaña)`}>Explorar <span aria-hidden="true">↗</span></a></div>
  </article>;
}

export default function ReadingSpace() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState(localReadings);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Algunas lecturas para despertar tu curiosidad.');
  const request = useRef(null);
  const lastSearch = useRef(0);
  useEffect(() => () => {
    request.current?.controller.abort();
    window.clearTimeout(request.current?.timer);
    request.current = null;
  }, []);

  const search = async (event) => {
    event.preventDefault();
    if (loading || !query.trim()) return;
    if (Date.now() - lastSearch.current < 1500) { setMessage('Espera un momento antes de otra búsqueda.'); return; }
    lastSearch.current = Date.now();
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    request.current = { controller, timer };
    setLoading(true); setMessage('Buscando lecturas en Open Library…');
    try {
      const results = await searchBooks(query.trim(), controller.signal);
      if (request.current?.controller !== controller) return;
      setBooks(results.length ? results : localReadings);
      setMessage(results.length ? `${results.length} lecturas encontradas en Open Library.` : 'No encontramos resultados. Aquí tienes algunas lecturas para explorar.');
    } catch {
      if (request.current?.controller !== controller) return;
      setBooks(localReadings);
      setMessage('La biblioteca externa no está disponible ahora. Puedes seguir explorando nuestras recomendaciones.');
    } finally {
      window.clearTimeout(timer);
      if (request.current?.controller === controller) { request.current = null; setLoading(false); }
    }
  };
  const reset = () => {
    request.current?.controller.abort(); window.clearTimeout(request.current?.timer); request.current = null;
    setLoading(false); setQuery(''); setBooks(localReadings); setMessage('Algunas lecturas para despertar tu curiosidad.');
  };

  return <section className="student-card pipe-reading" id="recursos" aria-labelledby="reading-title">
    <span className="eyebrow">BIBLIOTECA PIPE</span><h2 id="reading-title" tabIndex={-1}>Algo para leer 📚</h2><p>Aprendizaje, ciencia, programación y nuevas perspectivas. Encuentra tu próxima lectura.</p>
    <form className="pipe-book-search" onSubmit={search}><label htmlFor="pipe-book-query">Título, autor o tema<input id="pipe-book-query" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Por ejemplo: aprender a programar" maxLength={120} required /></label><button className="primary-button" disabled={loading || !query.trim()}>{loading ? 'Buscando…' : 'Buscar libros'}</button><button type="button" className="secondary-button" onClick={reset}>Recomendaciones</button></form>
    <p className="pipe-note" role="status">{message}</p>
    <div className="pipe-books-grid" aria-busy={loading}>{books.map((book, index) => <BookCard key={`${book.id}-${book.cover || 'local'}`} book={book} index={index} />)}</div>
    <p className="pipe-note">Búsqueda y fichas de <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer">Open Library</a>. Explorar abre otra pestaña; la disponibilidad de lectura depende de cada edición.</p>
  </section>;
}
