export const memorySymbols = [
  { symbol: '📚', label: 'Libros' }, { symbol: '💻', label: 'Tecnología' },
  { symbol: '🎓', label: 'Universidad' }, { symbol: '🎯', label: 'Metas' },
  { symbol: '🌱', label: 'Crecimiento' }, { symbol: '💙', label: 'Bienestar' }
];

export function createDeck(random = Math.random) {
  const cards = memorySymbols.flatMap((item, pair) => [0, 1].map((copy) => ({ ...item, pair, id: `${pair}-${copy}` })));
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [cards[index], cards[swap]] = [cards[swap], cards[index]];
  }
  return cards;
}

export const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
