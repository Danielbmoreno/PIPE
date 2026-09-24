import test from 'node:test';
import assert from 'node:assert/strict';
import { localDay, previousDay, progressKey, readProgress, saveProgress, visitProgress } from '../src/lib/studentProgress.js';
import { createDeck, formatTime } from '../src/lib/memoryGame.js';
import { anotherIndex, dailyChallenges } from '../src/data/studentSpace.js';
import { searchBooks } from '../src/services/readingService.js';

const date = (day) => new Date(2026, 8, day, 12);
test('racha: visitas repetidas no suman; días consecutivos suman; interrupción reinicia', () => {
  const first = visitProgress({}, date(24), () => 2);
  assert.equal(first.streak, 1);
  assert.deepEqual(visitProgress(first, date(24)), first);
  assert.equal(visitProgress(first, date(25)).streak, 2);
  assert.equal(visitProgress(first, date(26)).streak, 1);
});

test('reto: conserva elección y cumplimiento durante el día; se renueva al día siguiente', () => {
  const completed = { ...visitProgress({}, date(24), () => 3), completed: true };
  assert.deepEqual(visitProgress(completed, date(24)), completed);
  const next = visitProgress(completed, date(25), () => 5);
  assert.equal(next.completed, false);
  assert.equal(next.challengeIndex, 5);
  assert.equal(next.challengeDay, '2026-09-25');
});

test('fechas locales: cambio de mes, año y día bisiesto', () => {
  assert.equal(localDay(new Date(2026, 0, 1, 0, 1)), '2026-01-01');
  assert.equal(previousDay(new Date(2026, 0, 1)), '2025-12-31');
  assert.equal(previousDay(new Date(2024, 2, 1)), '2024-02-29');
});

test('progreso: valida datos guardados y separa usuarios', () => {
  const corrupt = visitProgress({ streak: -4, lastVisit: '2026-09-24', challengeDay: '2026-09-24', challengeIndex: 900, completed: true }, date(24), () => 0);
  assert.equal(corrupt.streak, 1);
  assert.equal(corrupt.challengeIndex, 0);
  assert.equal(corrupt.completed, false);
  assert.notEqual(progressKey(1), progressKey(2));
  assert.ok(corrupt.challengeIndex < dailyChallenges.length);
});

test('almacenamiento bloqueado o JSON dañado no rompe la experiencia', (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  t.after(() => { if (original) Object.defineProperty(globalThis, 'localStorage', original); else delete globalThis.localStorage; });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => '{invalid', setItem: () => { throw new Error('blocked'); } } });
  assert.deepEqual(readProgress('test'), {});
  assert.equal(saveProgress('test', {}), false);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('denied'); } });
  assert.deepEqual(readProgress('test'), {});
});

test('memoria: doce tarjetas únicas con exactamente seis parejas', () => {
  for (let iteration = 0; iteration < 30; iteration += 1) {
    const deck = createDeck();
    assert.equal(deck.length, 12);
    assert.equal(new Set(deck.map((card) => card.id)).size, 12);
    for (let pair = 0; pair < 6; pair += 1) assert.equal(deck.filter((card) => card.pair === pair).length, 2);
  }
  assert.equal(formatTime(125), '02:05');
});

test('la siguiente frase no repite la actual', () => {
  for (let current = 0; current < 8; current += 1) {
    for (let attempt = 0; attempt < 20; attempt += 1) assert.notEqual(anotherIndex(current, 8), current);
  }
});

test('biblioteca: búsqueda codificada, campos limitados y sin credenciales', async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get('q'), 'ciencia & tecnología');
    assert.equal(parsed.searchParams.get('limit'), '6');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.signal, controller.signal);
    return { ok: true, json: async () => ({ docs: [{ key: '/works/OL123W', title: 'Lectura', author_name: ['Autor'], first_publish_year: 2020, cover_i: 123 }] }) };
  });
  const [book] = await searchBooks('ciencia & tecnología', controller.signal);
  assert.equal(book.url, 'https://openlibrary.org/works/OL123W');
  assert.equal(book.year, 2020);
  assert.match(book.cover, /^https:\/\/covers.openlibrary.org/);
});

test('biblioteca: no propaga enlaces arbitrarios ni campos no válidos', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ docs: [{ key: 'https://example.com', title: 'Libro', cover_i: 'bad' }, { title: null }] }) }));
  const books = await searchBooks('libro');
  assert.equal(books.length, 1);
  assert.match(books[0].url, /^https:\/\/openlibrary.org\/search/);
  assert.equal(books[0].cover, null);
});

test('biblioteca: comunica HTTP, respuesta inválida y cancelación al componente', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => ({ ok: false }));
  await assert.rejects(searchBooks('lectura'));
  fetchMock.mock.mockImplementation(async () => ({ ok: true, json: async () => ({}) }));
  await assert.rejects(searchBooks('lectura'));
  fetchMock.mock.mockImplementation(async () => { throw new DOMException('Aborted', 'AbortError'); });
  await assert.rejects(searchBooks('lectura'), { name: 'AbortError' });
});
