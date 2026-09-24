// Public, user-initiated search. No Supabase client or private credentials.
export async function searchBooks(query, signal) {
  const params = new URLSearchParams({ q: query, limit: '6', lang: 'es', fields: 'key,title,author_name,first_publish_year,cover_i' });
  const response = await fetch(`https://openlibrary.org/search.json?${params}`, { signal, credentials: 'omit' });
  if (!response.ok) throw new Error('No se pudo consultar la biblioteca.');
  const result = await response.json();
  if (!Array.isArray(result.docs)) throw new Error('La biblioteca devolvió una respuesta inesperada.');
  return result.docs.filter((book) => typeof book.title === 'string').slice(0, 6).map((book, index) => {
    const workId = typeof book.key === 'string' ? book.key.replace(/^\/works\//, '') : '';
    return {
      id: `${workId}-${index}`, title: book.title,
      author: Array.isArray(book.author_name) ? book.author_name.filter((name) => typeof name === 'string').join(', ') : 'Autor no disponible',
      year: Number.isInteger(book.first_publish_year) ? book.first_publish_year : null,
      category: 'Open Library',
      description: 'Explora la ficha del libro y sus ediciones disponibles.',
      cover: Number.isSafeInteger(book.cover_i) && book.cover_i > 0 ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg?default=false` : null,
      url: /^OL\d+W$/.test(workId) ? `https://openlibrary.org/works/${workId}` : `https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`
    };
  });
}
